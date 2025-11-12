import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Driver {
  id?: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiration: string;
  cdl_class: string;
  experience_years: number;
  license_file_url?: string;
  medical_card_url?: string;
  signed_agreement_url?: string;
}

interface Attachment {
  attachment_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
}

interface OnboardingData {
  carrier: {
    id?: string;
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
    company_id: string;
    sales_agent_id?: string;
  };
  drivers: Driver[];
  attachments: Attachment[];
  isDraft?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { carrier, drivers, attachments, isDraft }: OnboardingData = await req.json();

    console.log('Saving carrier onboarding:', { carrierId: carrier.id, driversCount: drivers.length, attachmentsCount: attachments.length });

    // Step 1: Insert or update carrier
    let carrierId = carrier.id;
    if (carrierId) {
      // Update existing carrier
      const { error: updateError } = await supabase
        .from('carriers')
        .update({
          name: carrier.name,
          mc_number: carrier.mc_number,
          dot_number: carrier.dot_number,
          address: carrier.address,
          contact_name: carrier.contact_name,
          email: carrier.contact_email,
          phone: carrier.phone,
          insurance_expiry: carrier.insurance_expiry,
          preferred_routes: carrier.preferred_routes,
          notes: carrier.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', carrierId);

      if (updateError) throw updateError;
    } else {
      // Insert new carrier
      const { data: newCarrier, error: insertError } = await supabase
        .from('carriers')
        .insert({
          name: carrier.name,
          mc_number: carrier.mc_number,
          dot_number: carrier.dot_number,
          address: carrier.address,
          contact_name: carrier.contact_name,
          email: carrier.contact_email,
          phone: carrier.phone,
          insurance_expiry: carrier.insurance_expiry,
          preferred_routes: carrier.preferred_routes,
          notes: carrier.notes,
          company_id: carrier.company_id,
          sales_agent_id: carrier.sales_agent_id || user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      carrierId = newCarrier.id;
    }

    // Step 2: Insert or update drivers
    const driverIds: string[] = [];
    for (const driver of drivers) {
      if (driver.id) {
        // Update existing driver
        const { error: updateError } = await supabase
          .from('drivers')
          .update({
            first_name: driver.name.split(' ')[0],
            last_name: driver.name.split(' ').slice(1).join(' ') || driver.name.split(' ')[0],
            phone: driver.phone,
            license_number: driver.license_number,
            license_expiry: driver.license_expiration,
            cdl_class: driver.cdl_class,
            experience_years: driver.experience_years,
            license_file_url: driver.license_file_url,
            medical_card_url: driver.medical_card_url,
            signed_agreement_url: driver.signed_agreement_url,
          })
          .eq('id', driver.id);

        if (updateError) throw updateError;
        driverIds.push(driver.id);
      } else {
        // Insert new driver
        const { data: newDriver, error: insertError } = await supabase
          .from('drivers')
          .insert({
            first_name: driver.name.split(' ')[0],
            last_name: driver.name.split(' ').slice(1).join(' ') || driver.name.split(' ')[0],
            phone: driver.phone,
            license_number: driver.license_number,
            license_expiry: driver.license_expiration,
            cdl_class: driver.cdl_class,
            experience_years: driver.experience_years,
            license_file_url: driver.license_file_url,
            medical_card_url: driver.medical_card_url,
            signed_agreement_url: driver.signed_agreement_url,
            carrier_id: carrierId,
            company_id: carrier.company_id,
            sales_agent_id: carrier.sales_agent_id || user.id,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        driverIds.push(newDriver.id);
      }
    }

    // Step 3: Insert attachments
    if (attachments.length > 0) {
      const attachmentRecords = attachments.map(att => ({
        carrier_id: carrierId,
        attachment_type: att.attachment_type,
        file_name: att.file_name,
        file_url: att.file_url,
        file_size: att.file_size,
        uploaded_by: user.id,
        company_id: carrier.company_id,
      }));

      const { error: attachmentError } = await supabase
        .from('carrier_attachments')
        .insert(attachmentRecords);

      if (attachmentError) throw attachmentError;
    }

    console.log('Carrier onboarding saved successfully:', { carrierId, driverIds });

    return new Response(
      JSON.stringify({
        status: 'success',
        carrier_id: carrierId,
        driver_ids: driverIds,
        message: isDraft ? 'Draft saved successfully' : 'Onboarding submitted successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error saving carrier onboarding:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});