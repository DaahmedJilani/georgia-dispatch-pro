import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AIAssistRequest {
  type: "load_summary" | "draft_email" | "smart_reminder";
  data: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: AIAssistRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("Lovable AI not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "load_summary":
        systemPrompt = "You are a logistics AI assistant. Generate clear, concise pickup and delivery instructions for truck drivers. Focus on safety, efficiency, and clarity.";
        userPrompt = `Generate pickup and delivery instructions for this load:
- Pickup: ${data.pickup_location}, ${data.pickup_city}, ${data.pickup_state}
- Delivery: ${data.delivery_location}, ${data.delivery_city}, ${data.delivery_state}
- Commodity: ${data.commodity || 'General freight'}
- Weight: ${data.weight || 'Not specified'}
- Pickup Date: ${data.pickup_date}
- Delivery Date: ${data.delivery_date}
${data.pickup_notes ? `- Pickup Notes: ${data.pickup_notes}` : ''}
${data.delivery_notes ? `- Delivery Notes: ${data.delivery_notes}` : ''}

Provide:
1. Clear pickup instructions
2. Safety considerations
3. Delivery instructions
4. Any special handling notes`;
        break;

      case "draft_email":
        systemPrompt = "You are a professional logistics coordinator. Draft clear, professional emails to brokers or drivers.";
        userPrompt = `Draft a professional email for the following:
Recipient: ${data.recipient_type} (${data.recipient_name})
Subject: ${data.subject}
Context: ${data.context}

Keep it professional, clear, and action-oriented.`;
        break;

      case "smart_reminder":
        systemPrompt = "You are a logistics AI assistant. Generate smart, contextual reminders for drivers and dispatchers.";
        userPrompt = `Generate a reminder message for:
Load: ${data.load_number}
Driver: ${data.driver_name}
Pickup: ${data.pickup_city}, ${data.pickup_state}
Pickup Time: ${data.pickup_date}
Current Status: ${data.status}

Create a helpful reminder that includes key details and next steps.`;
        break;

      default:
        throw new Error("Invalid AI assist type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log(`AI Assist ${type} completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        content,
        type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("AI Assist error:", error);
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