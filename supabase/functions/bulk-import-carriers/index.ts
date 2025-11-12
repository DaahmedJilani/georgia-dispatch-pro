import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CarrierRow {
  name: string;
  mc_number?: string;
  dot_number?: string;
  address?: string;
  contact_name?: string;
  contact_email?: string;
  phone?: string;
  insurance_expiry?: string;
  preferred_routes?: string;
  notes?: string;
}

interface ImportResult {
  row: number;
  status: 'success' | 'error';
  data?: any;
  error?: string;
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

    // Get current user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's company
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    const { carriers }: { carriers: CarrierRow[] } = await req.json();

    if (!Array.isArray(carriers) || carriers.length === 0) {
      throw new Error('Invalid carriers data');
    }

    if (carriers.length > 1000) {
      throw new Error('Maximum 1000 carriers per import');
    }

    const results: ImportResult[] = [];

    // Process each carrier
    for (let i = 0; i < carriers.length; i++) {
      const carrier = carriers[i];
      
      try {
        // Validate required fields
        if (!carrier.name || carrier.name.trim() === '') {
          results.push({
            row: i + 2, // +2 because row 1 is header and array is 0-indexed
            status: 'error',
            error: 'Carrier name is required'
          });
          continue;
        }

        // Check for duplicate MC number if provided
        if (carrier.mc_number) {
          const { data: existing } = await supabaseAdmin
            .from('carriers')
            .select('id')
            .eq('company_id', profile.company_id)
            .eq('mc_number', carrier.mc_number)
            .maybeSingle();

          if (existing) {
            results.push({
              row: i + 2,
              status: 'error',
              error: `Duplicate MC number: ${carrier.mc_number}`
            });
            continue;
          }
        }

        // Parse insurance expiry date if provided
        let insuranceExpiry = null;
        if (carrier.insurance_expiry) {
          const date = new Date(carrier.insurance_expiry);
          if (!isNaN(date.getTime())) {
            insuranceExpiry = date.toISOString().split('T')[0];
          }
        }

        // Insert carrier
        const { data: newCarrier, error: insertError } = await supabaseAdmin
          .from('carriers')
          .insert({
            company_id: profile.company_id,
            name: carrier.name.trim(),
            mc_number: carrier.mc_number?.trim() || null,
            dot_number: carrier.dot_number?.trim() || null,
            address: carrier.address?.trim() || null,
            contact_name: carrier.contact_name?.trim() || null,
            email: carrier.contact_email?.trim() || null,
            phone: carrier.phone?.trim() || null,
            insurance_expiry: insuranceExpiry,
            preferred_routes: carrier.preferred_routes?.trim() || null,
            notes: carrier.notes?.trim() || null,
            sales_agent_id: user.id,
            sale_stage: 'follow_up',
            contract_status: 'draft'
          })
          .select()
          .single();

        if (insertError) {
          results.push({
            row: i + 2,
            status: 'error',
            error: insertError.message
          });
        } else {
          results.push({
            row: i + 2,
            status: 'success',
            data: newCarrier
          });
        }
      } catch (error: any) {
        results.push({
          row: i + 2,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: carriers.length,
          successful: successCount,
          failed: errorCount
        },
        results
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
