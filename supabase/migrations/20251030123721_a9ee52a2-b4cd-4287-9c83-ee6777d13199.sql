-- Create contract templates table for managing contract documents
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  document_url TEXT,
  file_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Admins can manage contract templates in their company
CREATE POLICY "Admins can manage contract templates"
ON public.contract_templates
FOR ALL
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Users can view active templates in their company
CREATE POLICY "Users can view active templates in their company"
ON public.contract_templates
FOR SELECT
USING (
  company_id = get_user_company(auth.uid()) 
  AND is_active = true
);

-- Create trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for contract templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-templates', 'contract-templates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contract templates
CREATE POLICY "Admins can upload contract templates"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'contract-templates' 
  AND auth.uid() IN (
    SELECT ur.user_id 
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  )
);

CREATE POLICY "Admins can view contract templates"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'contract-templates' 
  AND auth.uid() IN (
    SELECT ur.user_id 
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update contract templates"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'contract-templates' 
  AND auth.uid() IN (
    SELECT ur.user_id 
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete contract templates"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'contract-templates' 
  AND auth.uid() IN (
    SELECT ur.user_id 
    FROM public.user_roles ur
    WHERE ur.role = 'admin'
  )
);