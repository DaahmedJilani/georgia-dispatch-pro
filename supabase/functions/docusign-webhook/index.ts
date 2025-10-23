import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookData = await req.json();
    console.log('DocuSign webhook received:', JSON.stringify(webhookData));

    const { event, data } = webhookData;
    const envelopeId = data?.envelopeId || data?.envelope_id;
    const status = data?.status;

    if (!envelopeId) {
      throw new Error('Missing envelope ID in webhook');
    }

    console.log('Processing DocuSign event:', event, 'for envelope:', envelopeId);

    // Find carrier by envelope ID
    const { data: carrier, error: findError } = await supabase
      .from('carriers')
      .select('id, company_id, name')
      .eq('docusign_envelope_id', envelopeId)
      .single();

    if (findError || !carrier) {
      console.error('Carrier not found for envelope:', envelopeId);
      throw new Error('Carrier not found');
    }

    // Handle envelope completed event
    if (event === 'envelope-completed' || status === 'completed') {
      console.log('Contract completed for carrier:', carrier.id);

      // Update carrier status
      const { error: updateError } = await supabase
        .from('carriers')
        .update({
          contract_signed: true,
          contract_signed_at: new Date().toISOString(),
          docusign_status: 'completed',
        })
        .eq('id', carrier.id);

      if (updateError) {
        console.error('Error updating carrier:', updateError);
        throw updateError;
      }

      // Update dependent loads to active status
      const { error: loadsError } = await supabase
        .from('loads')
        .update({
          contract_signed: true,
          sale_status: 'active',
        })
        .eq('carrier_id', carrier.id)
        .eq('sale_status', 'pending_activation');

      if (loadsError) {
        console.error('Error updating loads:', loadsError);
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
          type: 'contract_signed',
          title: 'Contract Signed',
          message: `${carrier.name} has signed the contract. Associated loads are now active.`,
          link: `/carriers`,
        }));

        await supabase.from('notifications').insert(notifications);
      }

      console.log('Contract processing completed');
    }

    // Handle envelope declined/voided events
    if (event === 'envelope-declined' || event === 'envelope-voided' || status === 'declined') {
      console.log('Contract declined/voided for carrier:', carrier.id);

      await supabase
        .from('carriers')
        .update({
          docusign_status: status || 'declined',
        })
        .eq('id', carrier.id);
    }

    return new Response(
      JSON.stringify({ received: true, carrier_id: carrier.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('DocuSign webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});