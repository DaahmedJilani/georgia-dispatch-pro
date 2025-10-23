import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationUpdate {
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  load_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: LocationUpdate = await req.json();
    const { driver_id, latitude, longitude, accuracy, heading, speed, load_id } = body;

    console.log('Processing location update for driver:', driver_id);

    // Verify driver belongs to user
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, company_id, user_id')
      .eq('id', driver_id)
      .eq('user_id', user.id)
      .single();

    if (driverError || !driver) {
      throw new Error('Driver not found or unauthorized');
    }

    // Update driver's current location
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        current_location_lat: latitude,
        current_location_lng: longitude,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', driver_id);

    if (updateError) {
      console.error('Error updating driver location:', updateError);
      throw updateError;
    }

    // Insert into locations history
    const { error: insertError } = await supabase
      .from('locations')
      .insert({
        company_id: driver.company_id,
        driver_id: driver_id,
        load_id: load_id || null,
        latitude,
        longitude,
        accuracy,
        heading,
        speed,
        timestamp: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting location history:', insertError);
      throw insertError;
    }

    console.log('Location updated successfully for driver:', driver_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        timestamp: new Date().toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Location update error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});