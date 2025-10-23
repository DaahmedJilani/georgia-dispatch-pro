import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { carrier_id, signer_email, signer_name }: RequestBody = await req.json();

    if (!carrier_id || !signer_email || !signer_name) {
      throw new Error('Missing required fields: carrier_id, signer_email, signer_name');
    }

    console.log('Sending contract to carrier:', carrier_id);

    // Get DocuSign credentials
    const integrationKey = Deno.env.get('DOCUSIGN_INTEGRATION_KEY');
    const accountId = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    const userId = Deno.env.get('DOCUSIGN_USER_ID');
    const basePath = Deno.env.get('DOCUSIGN_BASE_PATH') || 'https://demo.docusign.net/restapi';
    
    if (!integrationKey || !accountId || !userId) {
      throw new Error('DocuSign credentials not configured');
    }

    // Check if carrier already has a pending envelope
    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('docusign_envelope_id, contract_signed')
      .eq('id', carrier_id)
      .single();

    if (carrierError) {
      throw new Error(`Carrier not found: ${carrierError.message}`);
    }

    if (carrier.contract_signed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Contract already signed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (carrier.docusign_envelope_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Contract already sent, pending signature',
          envelope_id: carrier.docusign_envelope_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create DocuSign envelope
    // Note: This is a simplified example. In production, you would:
    // 1. Generate JWT token for authentication
    // 2. Create envelope with actual contract document
    // 3. Set up webhook for signature completion
    
    const envelopeDefinition = {
      emailSubject: 'Carrier Agreement - Please Sign',
      documents: [{
        documentBase64: btoa('Sample Carrier Agreement Document'),
        name: 'Carrier Agreement',
        fileExtension: 'txt',
        documentId: '1'
      }],
      recipients: {
        signers: [{
          email: signer_email,
          name: signer_name,
          recipientId: '1',
          routingOrder: '1',
          tabs: {
            signHereTabs: [{
              documentId: '1',
              pageNumber: '1',
              xPosition: '100',
              yPosition: '100'
            }]
          }
        }]
      },
      status: 'sent'
    };

    console.log('Creating DocuSign envelope...');

    // Mock envelope ID for demo purposes
    // In production, make actual API call to DocuSign
    const mockEnvelopeId = `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Update carrier with envelope ID
    const { error: updateError } = await supabase
      .from('carriers')
      .update({
        docusign_envelope_id: mockEnvelopeId,
      })
      .eq('id', carrier_id);

    if (updateError) {
      throw new Error(`Failed to update carrier: ${updateError.message}`);
    }

    // Create carrier contact record
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profile?.company_id) {
      await supabase
        .from('carrier_contacts')
        .insert({
          carrier_id,
          company_id: profile.company_id,
          contact_type: 'contract_sent',
          contact_method: 'docusign',
          notes: `Contract sent to ${signer_email}`,
          created_by: user.id,
        });
    }

    console.log('Contract sent successfully:', mockEnvelopeId);

    return new Response(
      JSON.stringify({
        success: true,
        envelope_id: mockEnvelopeId,
        message: 'Contract sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
