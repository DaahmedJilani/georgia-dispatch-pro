import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { OpenSignClient } from "../_shared/opensign-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendContractRequest {
  carrier_id: string;
  signer_email: string;
  signer_name: string;
  load_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const body: SendContractRequest = await req.json();
    const { carrier_id, signer_email, signer_name, load_id } = body;

    console.log('📝 Sending contract to carrier:', carrier_id);

    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrier_id)
      .single();

    if (carrierError || !carrier) {
      throw new Error('Carrier not found');
    }

    const { data: existingEnvelope } = await supabase
      .from('envelopes')
      .select('status')
      .eq('carrier_id', carrier_id)
      .in('status', ['sent', 'signed'])
      .maybeSingle();

    if (existingEnvelope) {
      throw new Error('Contract already sent or signed');
    }

    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('company_id', carrier.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (templateError || !template) {
      throw new Error('No active contract template found. Please upload a template first.');
    }

    console.log('📄 Using contract template:', template.name, 'v' + template.version);

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('contract-templates')
      .download(template.file_name);

    if (downloadError || !fileData) {
      throw new Error('Failed to download contract template');
    }

    const unsignedFileName = `unsigned/${carrier.company_id}/${Date.now()}-${template.file_name}`;
    const { error: uploadError } = await supabase
      .storage
      .from('contract-templates')
      .upload(unsignedFileName, fileData, { 
        contentType: 'application/pdf',
        upsert: false 
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase
      .storage
      .from('contract-templates')
      .getPublicUrl(unsignedFileName);

    const openSignClient = new OpenSignClient({
      baseUrl: Deno.env.get('OPENSIGN_BASE_URL') || 'https://sign.georgiaindustrials.com',
      apiKey: Deno.env.get('OPENSIGN_API_KEY')!,
    });

    const webhookUrl = `${supabaseUrl}/functions/v1/opensign-webhook`;
    console.log('🚀 Creating OpenSign envelope...');
    
    const openSignResponse = await openSignClient.createEnvelope({
      documentUrl: publicUrl,
      documentName: `${carrier.name} - ${template.name}`,
      signers: [{
        name: signer_name,
        email: signer_email,
        order: 1,
      }],
      subject: `Contract for Signature - ${carrier.name}`,
      message: `Dear ${signer_name},\n\nPlease review and sign the attached contract for ${carrier.name}.\n\nIf you have any questions, please contact our team at contracts@georgiaindustrials.com\n\nThank you,\nGeorgia Dispatch Pro Team`,
      expiresInDays: 30,
      webhookUrl,
    });

    console.log('✅ OpenSign envelope created:', openSignResponse.id);

    const { data: envelope, error: envelopeError } = await supabase
      .from('envelopes')
      .insert({
        company_id: carrier.company_id,
        carrier_id: carrier.id,
        load_id: load_id || null,
        sales_agent_id: carrier.sales_agent_id,
        created_by: user.id,
        opensign_envelope_id: openSignResponse.id,
        template_id: template.id,
        signer_name,
        signer_email,
        status: 'sent',
        unsigned_document_url: publicUrl,
        signing_url: openSignResponse.signing_url,
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (envelopeError) throw envelopeError;

    await supabase
      .from('carriers')
      .update({ 
        envelope_id: envelope.id,
        contract_status: 'sent',
      })
      .eq('id', carrier_id);

    const { data: notificationUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('company_id', carrier.company_id)
      .in('role', ['admin', 'sales']);

    if (notificationUsers && notificationUsers.length > 0) {
      await supabase.from('notifications').insert(
        notificationUsers.map(ur => ({
          company_id: carrier.company_id,
          user_id: ur.user_id,
          type: 'contract_sent',
          title: '📧 Contract Sent',
          message: `Contract sent to ${carrier.name} (${signer_email}) for signature.`,
          link: `/carriers`,
        }))
      );
    }

    console.log('✅ Contract sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        envelope_id: envelope.id,
        signing_url: openSignResponse.signing_url,
        expires_at: envelope.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Send contract error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
