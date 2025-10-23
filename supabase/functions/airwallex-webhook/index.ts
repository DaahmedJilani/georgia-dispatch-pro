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
    console.log('Airwallex webhook received:', JSON.stringify(webhookData));

    const { event_type, data } = webhookData;

    // Handle payment succeeded event
    if (event_type === 'payment_intent.succeeded' || event_type === 'payment.succeeded') {
      const paymentId = data?.id || data?.payment_intent_id;
      
      if (!paymentId) {
        throw new Error('Missing payment ID in webhook');
      }

      console.log('Processing payment success for:', paymentId);

      // Find invoice by payment_link_id or airwallex_payment_id
      const { data: invoice, error: findError } = await supabase
        .from('invoices')
        .select('id, company_id, amount')
        .or(`payment_link_id.eq.${paymentId},airwallex_payment_id.eq.${paymentId}`)
        .single();

      if (findError || !invoice) {
        console.error('Invoice not found for payment:', paymentId);
        throw new Error('Invoice not found');
      }

      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          payment_status: 'paid',
          status: 'paid',
          payment_date: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('Error updating invoice:', updateError);
        throw updateError;
      }

      console.log('Invoice updated to paid:', invoice.id);

      // Create notification for treasury/admin users
      const { data: treasuryUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('company_id', invoice.company_id)
        .in('role', ['admin', 'treasury']);

      if (treasuryUsers && treasuryUsers.length > 0) {
        const notifications = treasuryUsers.map(ur => ({
          company_id: invoice.company_id,
          user_id: ur.user_id,
          type: 'payment_received',
          title: 'Payment Received',
          message: `Invoice payment of $${invoice.amount} has been received via Airwallex.`,
          link: `/invoices`,
        }));

        await supabase.from('notifications').insert(notifications);
        console.log('Notifications created for treasury users');
      }

      return new Response(
        JSON.stringify({ success: true, invoice_id: invoice.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle payment failed event
    if (event_type === 'payment_intent.failed' || event_type === 'payment.failed') {
      const paymentId = data?.id || data?.payment_intent_id;
      console.log('Processing payment failure for:', paymentId);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          payment_status: 'failed',
        })
        .or(`payment_link_id.eq.${paymentId},airwallex_payment_id.eq.${paymentId}`);

      if (updateError) {
        console.error('Error updating invoice:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});