import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteDriverRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  carrier_id?: string;
  license_number?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User profile not found');
    }

    // Verify user is admin or dispatcher
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id);

    const canInvite = roles?.some(r => ['admin', 'dispatcher', 'sales'].includes(r.role));
    if (!canInvite) {
      throw new Error('Only admins, dispatchers, and sales can invite drivers');
    }

    const body: InviteDriverRequest = await req.json();
    const { email, first_name, last_name, phone, carrier_id, license_number } = body;

    console.log('Inviting driver:', email);

    // Create auth user with magic link
    const { data: authData, error: createError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name,
          last_name,
        },
        redirectTo: `${supabaseUrl}/driver-portal`,
      }
    );

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw createError;
    }

    const newUserId = authData.user.id;
    console.log('Auth user created for driver:', newUserId);

    // Update profile with company_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        company_id: profile.company_id,
        phone: phone || null,
      })
      .eq('user_id', newUserId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Create driver record
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .insert({
        user_id: newUserId,
        company_id: profile.company_id,
        first_name,
        last_name,
        email,
        phone: phone || null,
        carrier_id: carrier_id || null,
        license_number: license_number || null,
        status: 'available',
      })
      .select()
      .single();

    if (driverError) {
      console.error('Error creating driver:', driverError);
      throw driverError;
    }

    console.log('Driver record created:', driverData.id);

    // Create user_roles entry with driver role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUserId,
        company_id: profile.company_id,
        role: 'driver',
      });

    if (roleError) {
      console.error('Error creating driver role:', roleError);
      throw roleError;
    }

    // Send SMS notification if phone provided
    if (phone) {
      try {
        await supabase.functions.invoke('send-sms-notification', {
          body: {
            to: phone,
            message: `Welcome to the team! Check your email (${email}) for your driver portal access link.`,
          }
        });
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    console.log('Driver invited successfully:', driverData.id);

    return new Response(
      JSON.stringify({
        success: true,
        driver_id: driverData.id,
        user_id: newUserId,
        invite_sent: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Invite driver error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});