import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, documentId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Extracting data from POD image:', imageUrl);

    // Use Lovable AI vision to extract data from POD
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a document data extraction specialist. Extract structured data from Proof of Delivery (POD) documents. Return a JSON object with the following fields:
- delivery_date: ISO date string or null
- delivery_time: time string (HH:MM) or null
- recipient_name: string or null
- recipient_signature: boolean (true if signature present)
- location: string or null
- notes: string or null
- condition: "good" | "damaged" | "other" or null

If you cannot extract a field, set it to null. Be as accurate as possible.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all delivery information from this Proof of Delivery document.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI extraction error:', errorText);
      throw new Error('Failed to extract data from document');
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);
    
    console.log('Extracted POD data:', extractedData);

    // Update document with extracted data
    if (documentId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Store extracted data in the document metadata
      const { error: updateError } = await supabaseClient
        .from('documents')
        .update({
          // Store in a metadata JSONB column if it exists, or you can create separate columns
          // For now we'll return the data to the client
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in extract-pod-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
