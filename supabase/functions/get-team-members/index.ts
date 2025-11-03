import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Step 1: Get all profiles in company
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, username, created_at')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Step 2: Get user_ids from profiles
    const userIds = profiles?.map(p => p.user_id) || [];

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ team_members: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Fetch roles for these users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds)
      .eq('company_id', profile.company_id);

    if (rolesError) throw rolesError;

    // Step 4: Create a role lookup map
    const roleMap = new Map();
    roles?.forEach(r => roleMap.set(r.user_id, r.role));

    // Step 5: Fetch emails and combine data
    const teamMembers = await Promise.all(
      (profiles || []).map(async (member: any) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          first_name: member.first_name || 'N/A',
          last_name: member.last_name || 'N/A',
          username: member.username,
          email: authUser?.user?.email || 'N/A',
          role: roleMap.get(member.user_id) || 'N/A',
          created_at: member.created_at
        };
      })
    );

    return new Response(
      JSON.stringify({ team_members: teamMembers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Get team members error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
