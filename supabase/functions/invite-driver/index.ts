import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteDriverRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  carrierId: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  companyId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const {
      email,
      firstName,
      lastName,
      phone,
      carrierId,
      licenseNumber,
      licenseExpiry,
      companyId
    }: InviteDriverRequest = await req.json();

    console.log('Inviting driver:', email);

    // Get current user (sales agent)
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('User created:', authData.user.id);

    // Create driver profile
    const { error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        user_id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        carrier_id: carrierId,
        license_number: licenseNumber || null,
        license_expiry: licenseExpiry || null,
        company_id: companyId,
        sales_agent_id: user.id,
        status: 'available',
      });

    if (driverError) {
      console.error('Driver creation error:', driverError);
      throw driverError;
    }

    // Assign driver role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'driver',
        company_id: companyId,
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      throw roleError;
    }

    // Send invitation email (using Supabase's built-in email)
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      console.warn('Invite email error:', inviteError);
      // Don't throw - user is already created
    }

    return new Response(
      JSON.stringify({
        success: true,
        userId: authData.user.id,
        message: 'Driver invited successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
