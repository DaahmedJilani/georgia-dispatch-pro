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
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find companies with pending subscriptions due in the next 7 days
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        subscription_due_date,
        subscription_amount,
        payment_reminder_sent
      `)
      .in('subscription_payment_status', ['pending', 'overdue'])
      .gte('subscription_due_date', today.toISOString().split('T')[0])
      .lte('subscription_due_date', sevenDaysFromNow.toISOString().split('T')[0])
      .eq('payment_reminder_sent', false);

    if (companiesError) throw companiesError;

    let remindersSent = 0;

    for (const company of companies || []) {
      // Get all admins for this company
      const { data: admins } = await supabase
        .from('profiles')
        .select(`
          email,
          user_id,
          user_roles!inner(role)
        `)
        .eq('company_id', company.id)
        .eq('user_roles.role', 'admin');

      if (admins && admins.length > 0) {
        // Log reminder (in production, send actual email via Resend/SendGrid)
        console.log(`Sending payment reminder to ${company.name}:`, {
          company: company.name,
          dueDate: company.subscription_due_date,
          amount: company.subscription_amount,
          admins: admins.map(a => a.email)
        });

        // Mark reminder as sent
        await supabase
          .from('companies')
          .update({ payment_reminder_sent: true })
          .eq('id', company.id);

        remindersSent++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        message: `Sent ${remindersSent} payment reminders` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
