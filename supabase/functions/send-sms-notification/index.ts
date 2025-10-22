import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  to: string;
  message: string;
  notificationType?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, notificationType } = await req.json() as SMSRequest;

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured");
    }

    // Format phone number (remove spaces, dashes)
    const formattedPhone = to.replace(/[\s\-\(\)]/g, '');
    
    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error("Invalid phone number");
    }

    // Ensure phone number starts with + for international format
    const phoneNumber = formattedPhone.startsWith('+') ? formattedPhone : `+1${formattedPhone}`;

    // Create Twilio API URL
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;

    // Create basic auth header
    const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    // Send SMS via Twilio
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twilio SMS failed:", errorText);
      throw new Error(`Failed to send SMS: ${errorText}`);
    }

    const responseData = await response.json();
    
    console.log(`SMS sent successfully to ${phoneNumber}`, {
      notificationType,
      sid: responseData.sid,
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageSid: responseData.sid,
        status: responseData.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending SMS:", error);
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