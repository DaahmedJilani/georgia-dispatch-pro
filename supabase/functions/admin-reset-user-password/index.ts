import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_master_admin')
        .eq('user_id', user.id)
        .single();

      if (!profile?.is_master_admin) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { targetUserId, newPassword, sendEmail } = await req.json();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Target user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resetting password for user:', targetUserId);

    if (sendEmail) {
      // Send password reset email
      const { data: targetUser } = await supabase.auth.admin.getUserById(targetUserId);
      
      if (!targetUser?.user?.email) {
        return new Response(
          JSON.stringify({ error: 'User email not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        targetUser.user.email,
        { redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify` }
      );

      if (resetError) {
        console.error('Reset email error:', resetError);
        return new Response(
          JSON.stringify({ error: 'Failed to send reset email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password reset email sent to:', targetUser.user.email);

      return new Response(
        JSON.stringify({ success: true, message: 'Password reset email sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (newPassword) {
      // Set new password directly
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Password update error:', updateError);
        
        // Handle weak password error specifically
        if (updateError.message?.includes('weak') || updateError.message?.includes('pwned')) {
          return new Response(
            JSON.stringify({ 
              error: 'Password is too weak or commonly used. Please choose a stronger, unique password with at least 8 characters including uppercase, lowercase, numbers, and special characters.' 
            }),
            { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: updateError.message || 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password updated successfully for user:', targetUserId);

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Either newPassword or sendEmail must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});