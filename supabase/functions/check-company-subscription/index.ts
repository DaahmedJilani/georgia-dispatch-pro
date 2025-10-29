import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, is_master_admin')
      .eq('user_id', user.id)
      .single();

    // Master admin can always login
    if (profile?.is_master_admin) {
      return new Response(
        JSON.stringify({ allowed: true, isMasterAdmin: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ allowed: false, reason: 'NO_COMPANY', message: 'No company associated with your account.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check company subscription status
    const { data: company } = await supabase
      .from('companies')
      .select('subscription_payment_status, subscription_due_date, name')
      .eq('id', profile.company_id)
      .single();

    if (company?.subscription_payment_status === 'suspended') {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'SUBSCRIPTION_SUSPENDED',
          message: `Your company's subscription has been suspended. Please contact your administrator to renew the subscription.`,
          companyName: company.name,
          dueDate: company.subscription_due_date
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
