import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      companyName,
      adminEmail,
      adminFirstName,
      adminLastName,
      adminPassword,
      subscriptionTier = 'basic',
      phone,
      address,
    } = await req.json();

    // Validate inputs
    if (!companyName || !adminEmail || !adminFirstName || !adminLastName || !adminPassword) {
      throw new Error('Missing required fields');
    }

    if (adminPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // 1. Create company
    const subscriptionAmount = subscriptionTier === 'pro' ? 50.0 : 20.0;
    const subscriptionFeatures =
      subscriptionTier === 'pro'
        ? {
            driver_portal: true,
            messages: true,
            fleet_map: true,
            invoices: true,
          }
        : {
            driver_portal: false,
            messages: false,
            fleet_map: false,
            invoices: false,
          };

    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        subscription_tier: subscriptionTier,
        subscription_amount: subscriptionAmount,
        subscription_features: subscriptionFeatures,
        subscription_status: 'active',
        phone: phone || null,
        address: address || null,
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // 2. Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: adminFirstName,
        last_name: adminLastName,
      },
    });

    if (authError) {
      // Rollback company creation
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      throw authError;
    }

    // 3. Update profile with company_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ company_id: company.id })
      .eq('user_id', authData.user.id);

    if (profileError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      throw profileError;
    }

    // 4. Create admin role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: authData.user.id,
      company_id: company.id,
      role: 'admin',
    });

    if (roleError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      throw roleError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        company_id: company.id,
        user_id: authData.user.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating company and admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
