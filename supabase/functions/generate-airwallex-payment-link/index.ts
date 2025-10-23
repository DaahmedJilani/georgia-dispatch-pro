import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentLinkRequest {
  invoice_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoice_id } = await req.json() as PaymentLinkRequest;
    
    console.log('Generating payment link for invoice:', invoice_id);

    // Fetch invoice details with company info
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, company:companies(*)')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Check if invoice is already paid
    if (invoice.payment_status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    // Check for existing payment link (idempotency)
    if (invoice.payment_link_id && invoice.airwallex_payment_link) {
      // Check if link is still valid (not expired)
      const expiresAt = invoice.payment_link_expires_at ? new Date(invoice.payment_link_expires_at) : null;
      const now = new Date();
      
      if (!expiresAt || expiresAt > now) {
        console.log('Returning existing payment link (idempotency):', invoice.payment_link_id);
        return new Response(
          JSON.stringify({
            success: true,
            paymentLink: invoice.airwallex_payment_link,
            paymentId: invoice.payment_link_id,
            expiresAt: invoice.payment_link_expires_at,
            isExisting: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } else {
        console.log('Existing payment link expired, creating new one');
      }
    }

    // Use company-specific Airwallex credentials if available, otherwise fallback to global
    const airwallexApiKey = invoice.company?.airwallex_api_key || Deno.env.get('AIRWALLEX_API_KEY');
    const airwallexAccountId = invoice.company?.airwallex_account_id || Deno.env.get('AIRWALLEX_ACCOUNT_ID');

    if (!airwallexApiKey || !airwallexAccountId) {
      throw new Error('Airwallex credentials not configured');
    }

    const usingCompanyCredentials = !!invoice.company?.airwallex_api_key;
    console.log('Using', usingCompanyCredentials ? 'company-specific' : 'global', 'Airwallex credentials');

    // Authenticate with Airwallex
    const authResponse = await fetch("https://api.airwallex.com/api/v1/authentication/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": airwallexApiKey,
      },
      body: JSON.stringify({
        account_id: airwallexAccountId,
      }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("Airwallex auth failed:", errorText);
      throw new Error(`Airwallex authentication failed: ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.token;

    console.log('Airwallex authentication successful');

    // Create payment link
    const paymentLinkResponse = await fetch("https://api.airwallex.com/api/v1/pa/payment_links/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: invoice.amount,
        currency: "USD",
        merchant_order_id: invoice.invoice_number,
        description: `Invoice ${invoice.invoice_number}`,
        return_url: `${supabaseUrl.replace('https://', 'https://app.')}/invoices`,
      }),
    });

    if (!paymentLinkResponse.ok) {
      const errorText = await paymentLinkResponse.text();
      console.error("Payment link creation failed:", errorText);
      throw new Error(`Failed to create payment link: ${errorText}`);
    }

    const paymentLinkData = await paymentLinkResponse.json();
    const paymentLink = paymentLinkData.url;
    const paymentId = paymentLinkData.id;

    console.log('Payment link created:', paymentId);

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update invoice with payment link and idempotency key
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        airwallex_payment_link: paymentLink,
        airwallex_payment_id: paymentId,
        payment_link_id: paymentId,
        link_created_at: new Date().toISOString(),
        payment_link_expires_at: expiresAt.toISOString(),
      })
      .eq('id', invoice_id);

    if (updateError) {
      console.error('Failed to update invoice with payment link:', updateError);
      throw new Error('Failed to update invoice with payment link');
    }

    console.log('Invoice updated with payment link successfully');

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink,
        paymentId,
        expiresAt: expiresAt.toISOString(),
        isExisting: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating payment link:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});