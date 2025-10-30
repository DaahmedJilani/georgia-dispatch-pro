import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  role: 'admin' | 'dispatcher' | 'sales' | 'treasury';
  first_name?: string;
  last_name?: string;
  phone?: string;
  username?: string;
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

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User profile not found');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', profile.company_id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can invite team members');
    }

    const body: InviteRequest = await req.json();
    const { email, role, first_name, last_name, phone, username } = body;

    console.log('Inviting team member:', email, 'with role:', role, 'username:', username);

    // Generate temporary password
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!${Date.now().toString().slice(-4)}`;

    // Create auth user with temporary password (no auto-confirmation)
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email so user can login immediately
      user_metadata: {
        first_name: first_name || '',
        last_name: last_name || '',
      }
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw createError;
    }

    const newUserId = authData.user.id;
    console.log('Auth user created:', newUserId);

    // Update profile with company_id and username
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        company_id: profile.company_id,
        phone: phone || null,
        username: username ? username.toLowerCase() : null,
      })
      .eq('user_id', newUserId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Create user_roles entry
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUserId,
        company_id: profile.company_id,
        role: role,
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      throw roleError;
    }

    console.log('Team member invited successfully:', newUserId);

    // Log credentials for admin to share (email sending optional)
    console.log('=== NEW USER CREDENTIALS ===');
    console.log('Email:', email);
    console.log('Username:', username || email);
    console.log('Temporary Password:', tempPassword);
    console.log('Login URL:', `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth`);
    console.log('===========================');

    // Send SMS notification if phone provided and Twilio configured
    if (phone) {
      try {
        await supabase.functions.invoke('send-sms-notification', {
          body: {
            to: phone,
            message: `You've been invited to join the team! Username: ${username || email}. Check your email for password.`,
          }
        });
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        invite_sent: true,
        credentials: {
          username: username || email,
          temp_password: tempPassword,
          email: email
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Invite team member error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});