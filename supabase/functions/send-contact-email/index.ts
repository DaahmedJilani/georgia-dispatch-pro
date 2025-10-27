import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, subject, message }: ContactEmailRequest = await req.json();

    console.log("Processing contact form submission from:", email);

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate field lengths
    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Field length exceeded" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send notification email to company
    const companyEmailResponse = await resend.emails.send({
      from: "Fleet Contact Form <onboarding@resend.dev>",
      to: ["cs@georgiaindustrials.com"],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    console.log("Company notification sent:", companyEmailResponse);

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Fleet by Georgia Industrials <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message regarding: <strong>${subject}</strong></p>
        <p>Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.</p>
        <hr />
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
        <hr />
        <p>If you have any urgent concerns, please contact us directly at:</p>
        <p>Email: cs@georgiaindustrials.com<br />Phone: 818 471 4874</p>
        <p>Best regards,<br />The Georgia Industrials Team</p>
      `,
    });

    console.log("Customer confirmation sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        companyEmailId: companyEmailResponse.data?.id,
        customerEmailId: customerEmailResponse.data?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
