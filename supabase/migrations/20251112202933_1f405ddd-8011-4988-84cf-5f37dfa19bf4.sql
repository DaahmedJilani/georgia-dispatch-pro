-- Phase 1: Update carriers table with new fields
ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS preferred_routes text;

-- Phase 2: Update drivers table with new fields
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS cdl_class text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS license_file_url text,
ADD COLUMN IF NOT EXISTS medical_card_url text,
ADD COLUMN IF NOT EXISTS signed_agreement_url text;

-- Phase 3: Create carrier_attachments table
CREATE TABLE IF NOT EXISTS public.carrier_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  attachment_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id),
  company_id uuid NOT NULL REFERENCES public.companies(id)
);

-- Enable RLS on carrier_attachments
ALTER TABLE public.carrier_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carrier_attachments
CREATE POLICY "Admins can manage all attachments in their company"
ON public.carrier_attachments
FOR ALL
TO authenticated
USING (company_id = get_user_company(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Dispatchers can view and upload attachments in their company"
ON public.carrier_attachments
FOR SELECT
TO authenticated
USING (company_id = get_user_company(auth.uid()) AND has_role(auth.uid(), 'dispatcher'::app_role));

CREATE POLICY "Dispatchers can insert attachments in their company"
ON public.carrier_attachments
FOR INSERT
TO authenticated
WITH CHECK (company_id = get_user_company(auth.uid()) AND has_role(auth.uid(), 'dispatcher'::app_role));

CREATE POLICY "Sales agents can view attachments for their carriers"
ON public.carrier_attachments
FOR SELECT
TO authenticated
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'sales'::app_role)
  AND carrier_id IN (
    SELECT id FROM public.carriers WHERE sales_agent_id = auth.uid()
  )
);

CREATE POLICY "Sales agents can upload attachments for their carriers"
ON public.carrier_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'sales'::app_role)
  AND carrier_id IN (
    SELECT id FROM public.carriers WHERE sales_agent_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_carrier_attachments_carrier_id ON public.carrier_attachments(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_attachments_company_id ON public.carrier_attachments(company_id);