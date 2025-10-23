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
    const { email, role, first_name, last_name, phone } = body;

    console.log('Inviting team member:', email, 'with role:', role);

    // Create auth user with magic link
    const { data: authData, error: createError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name: first_name || '',
          last_name: last_name || '',
        },
        redirectTo: `${supabaseUrl}/auth/callback`,
      }
    );

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw createError;
    }

    const newUserId = authData.user.id;
    console.log('Auth user created:', newUserId);

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

    // Send SMS notification if phone provided and Twilio configured
    if (phone) {
      try {
        await supabase.functions.invoke('send-sms-notification', {
          body: {
            to: phone,
            message: `You've been invited to join the team! Check your email (${email}) for the invitation link.`,
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