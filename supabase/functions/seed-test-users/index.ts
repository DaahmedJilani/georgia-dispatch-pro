import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
  isNewCompany?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    // Create admin client for verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is a master admin
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_master_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_master_admin) {
      throw new Error('Only master admins can seed test users');
    }

    console.log('Starting test user creation by master admin:', user.email);

    // Define test users
    const testUsers: TestUser[] = [
      // Test Logistics LLC
      {
        email: 'admin@testlogistics.com',
        password: 'TestPass123!',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'admin',
        companyName: 'Test Logistics LLC',
        isNewCompany: true,
      },
      {
        email: 'sales@testlogistics.com',
        password: 'TestPass123!',
        firstName: 'Sales',
        lastName: 'Agent',
        role: 'sales',
        companyName: 'Test Logistics LLC',
      },
      {
        email: 'dispatch@testlogistics.com',
        password: 'TestPass123!',
        firstName: 'Dispatch',
        lastName: 'Manager',
        role: 'dispatcher',
        companyName: 'Test Logistics LLC',
      },
      {
        email: 'treasury@testlogistics.com',
        password: 'TestPass123!',
        firstName: 'Treasury',
        lastName: 'Officer',
        role: 'treasury',
        companyName: 'Test Logistics LLC',
      },
      {
        email: 'driver@testlogistics.com',
        password: 'TestPass123!',
        firstName: 'John',
        lastName: 'Driver',
        role: 'driver',
        companyName: 'Test Logistics LLC',
      },
      // Demo Freight Corp
      {
        email: 'admin@demofreight.com',
        password: 'TestPass123!',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'admin',
        companyName: 'Demo Freight Corp',
        isNewCompany: true,
      },
      {
        email: 'sales@demofreight.com',
        password: 'TestPass123!',
        firstName: 'Demo',
        lastName: 'Sales',
        role: 'sales',
        companyName: 'Demo Freight Corp',
      },
      {
        email: 'dispatch@demofreight.com',
        password: 'TestPass123!',
        firstName: 'Demo',
        lastName: 'Dispatch',
        role: 'dispatcher',
        companyName: 'Demo Freight Corp',
      },
    ];

    const results = [];
    const companyCache: Record<string, string> = {};

    for (const testUser of testUsers) {
      try {
        console.log(`Creating user: ${testUser.email}`);

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            first_name: testUser.firstName,
            last_name: testUser.lastName,
          },
        });

        if (authError) {
          console.error(`Error creating auth user ${testUser.email}:`, authError);
          results.push({ email: testUser.email, success: false, error: authError.message });
          continue;
        }

        const userId = authData.user.id;

        // Create or get company
        let companyId: string;
        
        if (testUser.isNewCompany) {
          const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .insert({ name: testUser.companyName! })
            .select()
            .single();

          if (companyError) {
            console.error(`Error creating company ${testUser.companyName}:`, companyError);
            results.push({ email: testUser.email, success: false, error: companyError.message });
            continue;
          }

          companyId = company.id;
          companyCache[testUser.companyName!] = companyId;
          console.log(`Created company: ${testUser.companyName} (${companyId})`);
        } else {
          companyId = companyCache[testUser.companyName!];
        }

        // Update profile with company_id
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ company_id: companyId })
          .eq('user_id', userId);

        if (profileError) {
          console.error(`Error updating profile for ${testUser.email}:`, profileError);
          results.push({ email: testUser.email, success: false, error: profileError.message });
          continue;
        }

        // Create user role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            company_id: companyId,
            role: testUser.role,
          });

        if (roleError) {
          console.error(`Error creating role for ${testUser.email}:`, roleError);
          results.push({ email: testUser.email, success: false, error: roleError.message });
          continue;
        }

        console.log(`✓ Successfully created: ${testUser.email} (${testUser.role})`);
        results.push({
          email: testUser.email,
          success: true,
          role: testUser.role,
          company: testUser.companyName,
        });
      } catch (error) {
        console.error(`Unexpected error for ${testUser.email}:`, error);
        results.push({
          email: testUser.email,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${testUsers.length} users created successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${successCount}/${testUsers.length} test users`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in seed-test-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
