import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentLinkRequest {
  invoiceId: string;
  amount: number;
  invoiceNumber: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId, amount, invoiceNumber, description } = await req.json() as PaymentLinkRequest;

    const airwallexApiKey = Deno.env.get("AIRWALLEX_API_KEY");
    const airwallexAccountId = Deno.env.get("AIRWALLEX_ACCOUNT_ID");

    if (!airwallexApiKey || !airwallexAccountId) {
      throw new Error("Airwallex credentials not configured");
    }

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

    // Create payment link
    const paymentLinkResponse = await fetch("https://api.airwallex.com/api/v1/pa/payment_links/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: "USD",
        merchant_order_id: invoiceNumber,
        description: description || `Invoice ${invoiceNumber}`,
        return_url: `${req.headers.get("origin")}/invoices`,
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

    // Update invoice with payment link
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        airwallex_payment_link: paymentLink,
        airwallex_payment_id: paymentId,
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Failed to update invoice:", updateError);
      throw updateError;
    }

    console.log("Payment link generated successfully:", paymentLink);

    return new Response(
      JSON.stringify({
        success: true,
        paymentLink,
        paymentId,
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