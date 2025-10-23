import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocuSignRequest {
  carrier_id: string;
  signer_email: string;
  signer_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: DocuSignRequest = await req.json();
    const { carrier_id, signer_email, signer_name } = body;

    console.log('Sending DocuSign contract to carrier:', carrier_id);

    // Get carrier and company info
    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('*, company:companies(*)')
      .eq('id', carrier_id)
      .single();

    if (carrierError || !carrier) {
      throw new Error('Carrier not found');
    }

    // Check if contract already sent
    if (carrier.docusign_status === 'sent' || carrier.docusign_status === 'completed') {
      throw new Error('Contract already sent or completed');
    }

    // Get DocuSign credentials (company-specific or global)
    const docusignApiKey = carrier.company.docusign_api_key || Deno.env.get('DOCUSIGN_API_KEY');
    
    if (!docusignApiKey) {
      throw new Error('DocuSign API key not configured');
    }

    console.log('Using DocuSign credentials for company:', carrier.company.name);

    // NOTE: This is a simplified mock implementation
    // In production, you would integrate with actual DocuSign API
    // to create and send the envelope
    
    const mockEnvelopeId = `ENV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, you would:
    // 1. Authenticate with DocuSign API
    // 2. Create envelope with contract template
    // 3. Add signer information
    // 4. Send envelope
    // 5. Get envelope ID and signing URL

    console.log('Mock envelope created:', mockEnvelopeId);

    // Update carrier with envelope ID and status
    const { error: updateError } = await supabase
      .from('carriers')
      .update({
        docusign_envelope_id: mockEnvelopeId,
        docusign_status: 'sent',
      })
      .eq('id', carrier_id);

    if (updateError) {
      console.error('Error updating carrier:', updateError);
      throw updateError;
    }

    // Create notification for admin
    const { data: adminUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('company_id', carrier.company_id)
      .eq('role', 'admin');

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map(ur => ({
        company_id: carrier.company_id,
        user_id: ur.user_id,
        type: 'contract_sent',
        title: 'Contract Sent',
        message: `Contract sent to ${carrier.name} for signature.`,
        link: `/carriers`,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    console.log('DocuSign contract sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        envelope_id: mockEnvelopeId,
        signing_url: `https://demo.docusign.net/Signing/${mockEnvelopeId}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Send DocuSign contract error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});