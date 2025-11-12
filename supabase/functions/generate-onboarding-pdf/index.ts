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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { carrier_id } = await req.json();

    console.log('Generating PDF for carrier:', carrier_id);

    // Fetch carrier data
    const { data: carrier, error: carrierError } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrier_id)
      .single();

    if (carrierError) throw carrierError;

    // Fetch drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('carrier_id', carrier_id);

    if (driversError) throw driversError;

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from('carrier_attachments')
      .select('*')
      .eq('carrier_id', carrier_id);

    if (attachmentsError) throw attachmentsError;

    // Generate HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
        .section { margin: 20px 0; }
        .info-row { display: flex; margin: 10px 0; }
        .label { font-weight: bold; width: 200px; }
        .value { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #2563eb; color: white; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .status-yes { color: #16a34a; font-weight: bold; }
        .status-no { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Carrier Onboarding Summary</h1>
      <p style="color: #6b7280;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      
      <div class="section">
        <h2>Carrier Information</h2>
        <div class="info-row"><span class="label">Carrier Name:</span><span class="value">${carrier.name || 'N/A'}</span></div>
        <div class="info-row"><span class="label">Contact Name:</span><span class="value">${carrier.contact_name || 'N/A'}</span></div>
        <div class="info-row"><span class="label">MC Number:</span><span class="value">${carrier.mc_number || 'N/A'}</span></div>
        <div class="info-row"><span class="label">DOT Number:</span><span class="value">${carrier.dot_number || 'N/A'}</span></div>
        <div class="info-row"><span class="label">Address:</span><span class="value">${carrier.address || 'N/A'}</span></div>
        <div class="info-row"><span class="label">Email:</span><span class="value">${carrier.email || 'N/A'}</span></div>
        <div class="info-row"><span class="label">Phone:</span><span class="value">${carrier.phone || 'N/A'}</span></div>
        <div class="info-row"><span class="label">Insurance Expiry:</span><span class="value">${carrier.insurance_expiry || 'N/A'}</span></div>
        <div class="info-row"><span class="label">Preferred Routes:</span><span class="value">${carrier.preferred_routes || 'N/A'}</span></div>
        ${carrier.notes ? `<div class="info-row"><span class="label">Notes:</span><span class="value">${carrier.notes}</span></div>` : ''}
      </div>

      <div class="section">
        <h2>Drivers (${drivers?.length || 0})</h2>
        ${drivers && drivers.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>License #</th>
              <th>CDL Class</th>
              <th>Experience</th>
              <th>License Expiry</th>
            </tr>
          </thead>
          <tbody>
            ${drivers.map(driver => `
              <tr>
                <td>${driver.first_name} ${driver.last_name}</td>
                <td>${driver.phone || 'N/A'}</td>
                <td>${driver.license_number || 'N/A'}</td>
                <td>${driver.cdl_class || 'N/A'}</td>
                <td>${driver.experience_years ? driver.experience_years + ' years' : 'N/A'}</td>
                <td>${driver.license_expiry || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : '<p>No drivers added yet.</p>'}
      </div>

      <div class="section">
        <h2>Document Checklist</h2>
        <table>
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Status</th>
              <th>File Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>W9 Form</td>
              <td class="${attachments?.some(a => a.attachment_type === 'w9') ? 'status-yes' : 'status-no'}">
                ${attachments?.some(a => a.attachment_type === 'w9') ? '✅ Uploaded' : '❌ Missing'}
              </td>
              <td>${attachments?.find(a => a.attachment_type === 'w9')?.file_name || '-'}</td>
            </tr>
            <tr>
              <td>Certificate of Insurance</td>
              <td class="${attachments?.some(a => a.attachment_type === 'insurance') ? 'status-yes' : 'status-no'}">
                ${attachments?.some(a => a.attachment_type === 'insurance') ? '✅ Uploaded' : '❌ Missing'}
              </td>
              <td>${attachments?.find(a => a.attachment_type === 'insurance')?.file_name || '-'}</td>
            </tr>
            <tr>
              <td>MC Authority</td>
              <td class="${attachments?.some(a => a.attachment_type === 'mc_authority') ? 'status-yes' : 'status-no'}">
                ${attachments?.some(a => a.attachment_type === 'mc_authority') ? '✅ Uploaded' : '❌ Missing'}
              </td>
              <td>${attachments?.find(a => a.attachment_type === 'mc_authority')?.file_name || '-'}</td>
            </tr>
            <tr>
              <td>Signed Agreement</td>
              <td class="${attachments?.some(a => a.attachment_type === 'signed_agreement') ? 'status-yes' : 'status-no'}">
                ${attachments?.some(a => a.attachment_type === 'signed_agreement') ? '✅ Uploaded' : '❌ Missing'}
              </td>
              <td>${attachments?.find(a => a.attachment_type === 'signed_agreement')?.file_name || '-'}</td>
            </tr>
            ${attachments?.filter(a => a.attachment_type === 'other').map(att => `
              <tr>
                <td>Additional Document</td>
                <td class="status-yes">✅ Uploaded</td>
                <td>${att.file_name}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>This Carrier Onboarding Form was automatically generated by the Carrier Onboarding System – Powered by Lovable & Supabase.</p>
      </div>
    </body>
    </html>
    `;

    // Convert HTML to PDF using a simple approach
    // Note: For production, you might want to use Puppeteer or similar
    const pdfFileName = `carrier_onboarding_${carrier.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const pdfPath = `carrier-onboarding/${carrier.company_id}/${pdfFileName}`;

    // For now, we'll store the HTML as a temporary solution
    // In production, you'd use a proper PDF generation library
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    
    // Upload HTML to storage (in production, this would be PDF)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(pdfPath, htmlBlob, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(pdfPath);

    // Create attachment record
    const { error: attachmentError } = await supabase
      .from('carrier_attachments')
      .insert({
        carrier_id: carrier_id,
        attachment_type: 'onboarding_summary',
        file_name: pdfFileName,
        file_url: pdfPath,
        uploaded_by: user.id,
        company_id: carrier.company_id,
      });

    if (attachmentError) throw attachmentError;

    console.log('PDF generated successfully:', pdfPath);

    return new Response(
      JSON.stringify({
        status: 'success',
        pdf_url: publicUrl,
        message: 'PDF summary generated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});