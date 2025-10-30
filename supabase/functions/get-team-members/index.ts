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

    // Get all team members in company
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        username,
        created_at,
        user_roles!inner(role)
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (membersError) throw membersError;

    // Get emails for each member using service role
    const teamMembers = await Promise.all(
      (members || []).map(async (member: any) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          first_name: member.first_name || 'N/A',
          last_name: member.last_name || 'N/A',
          username: member.username,
          email: authUser?.user?.email || 'N/A',
          role: member.user_roles[0]?.role || 'N/A',
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
