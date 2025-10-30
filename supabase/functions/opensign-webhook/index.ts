import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { OpenSignClient } from "../_shared/opensign-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-opensign-signature',
};

async function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('OPENSIGN_WEBHOOK_SECRET');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('x-opensign-signature');

    if (webhookSecret) {
      const isValid = await verifyWebhookSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const webhookData = JSON.parse(body);
    console.log('🔔 OpenSign webhook received:', webhookData.event);

    const { data: loggedEvent } = await supabase
      .from('webhook_events')
      .insert({
        event_type: webhookData.event,
        payload: webhookData,
      })
      .select()
      .single();

    const { event, data: eventData } = webhookData;
    const openSignEnvelopeId = eventData?.envelope_id;

    if (!openSignEnvelopeId) {
      throw new Error('Missing envelope ID in webhook');
    }

    const { data: envelope, error: findError } = await supabase
      .from('envelopes')
      .select('*, carriers(name, company_id)')
      .eq('opensign_envelope_id', openSignEnvelopeId)
      .single();

    if (findError || !envelope) {
      throw new Error('Envelope not found');
    }

    let updatedStatus = envelope.status;
    let updateData: any = { 
      updated_at: new Date().toISOString() 
    };

    switch (event) {
      case 'envelope.sent':
        updatedStatus = 'sent';
        updateData.sent_at = new Date().toISOString();
        console.log('📨 Envelope sent');
        break;

      case 'envelope.viewed':
        updatedStatus = 'viewed';
        updateData.viewed_at = new Date().toISOString();
        console.log('👁️ Envelope viewed');
        break;

      case 'envelope.signed':
      case 'envelope.completed':
        updatedStatus = 'signed';
        updateData.signed_at = new Date().toISOString();
        updateData.ip_address = eventData?.ip_address;
        updateData.user_agent = eventData?.user_agent;

        console.log('✍️ Envelope signed - downloading PDF...');

        const openSignClient = new OpenSignClient({
          baseUrl: Deno.env.get('OPENSIGN_BASE_URL') || 'https://sign.georgiaindustrials.com',
          apiKey: Deno.env.get('OPENSIGN_API_KEY')!,
        });

        try {
          const signedPdf = await openSignClient.downloadSignedDocument(openSignEnvelopeId);
          
          const fileName = `${envelope.carriers.company_id}/${envelope.id}-signed-${Date.now()}.pdf`;
          const { error: uploadError } = await supabase
            .storage
            .from('signed-contracts')
            .upload(fileName, signedPdf, {
              contentType: 'application/pdf',
              upsert: false,
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase
              .storage
              .from('signed-contracts')
              .getPublicUrl(fileName);
            
            updateData.signed_document_url = publicUrl;
            console.log('✅ Signed PDF stored in Supabase');
          } else {
            console.error('❌ Failed to upload signed PDF:', uploadError);
          }
        } catch (pdfError) {
          console.error('❌ Failed to download signed PDF:', pdfError);
        }

        if (envelope.carrier_id) {
          await supabase
            .from('carriers')
            .update({
              contract_signed: true,
              contract_signed_at: new Date().toISOString(),
              contract_status: 'signed',
              sale_stage: 'activated',
            })
            .eq('id', envelope.carrier_id);

          await supabase
            .from('loads')
            .update({
              contract_signed: true,
              sale_status: 'active',
            })
            .eq('carrier_id', envelope.carrier_id)
            .eq('sale_status', 'pending_activation');

          console.log('✅ Carrier activated and loads updated');
        }

        const { data: notificationUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('company_id', envelope.carriers.company_id)
          .in('role', ['admin', 'sales', 'dispatcher']);

        if (notificationUsers && notificationUsers.length > 0) {
          await supabase.from('notifications').insert(
            notificationUsers.map(ur => ({
              company_id: envelope.carriers.company_id,
              user_id: ur.user_id,
              type: 'contract_signed',
              title: '✅ Contract Signed!',
              message: `${envelope.carriers.name} has signed the contract and is now activated.`,
              link: `/carriers`,
            }))
          );
        }
        break;

      case 'envelope.declined':
        updatedStatus = 'declined';
        updateData.declined_at = new Date().toISOString();
        
        const { data: declineNotifyUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('company_id', envelope.carriers.company_id)
          .in('role', ['admin', 'sales']);

        if (declineNotifyUsers && declineNotifyUsers.length > 0) {
          await supabase.from('notifications').insert(
            declineNotifyUsers.map(ur => ({
              company_id: envelope.carriers.company_id,
              user_id: ur.user_id,
              type: 'contract_declined',
              title: '❌ Contract Declined',
              message: `${envelope.carriers.name} declined to sign the contract.`,
              link: `/carriers`,
            }))
          );
        }
        
        console.log('❌ Envelope declined');
        break;

      case 'envelope.expired':
        updatedStatus = 'expired';
        console.log('⏰ Envelope expired');
        break;

      default:
        console.log('ℹ️ Unhandled event type:', event);
    }

    updateData.status = updatedStatus;
    await supabase
      .from('envelopes')
      .update(updateData)
      .eq('id', envelope.id);

    if (loggedEvent) {
      await supabase
        .from('webhook_events')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
        })
        .eq('id', loggedEvent.id);
    }

    console.log('✅ Webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        received: true, 
        envelope_id: envelope.id,
        status: updatedStatus,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ OpenSign webhook error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
