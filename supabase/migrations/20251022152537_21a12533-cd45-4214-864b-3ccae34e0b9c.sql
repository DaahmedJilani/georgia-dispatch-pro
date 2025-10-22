-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can view documents in their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents to their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
  broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  airwallex_payment_link TEXT,
  airwallex_payment_id TEXT,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view invoices in their company"
ON public.invoices FOR SELECT
USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins and dispatchers can manage invoices"
ON public.invoices FOR ALL
USING (
  company_id = get_user_company(auth.uid()) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dispatcher'::app_role))
);

-- Trigger for invoices updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add notification preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Update file_path in documents table to be nullable (for storage bucket)
ALTER TABLE public.documents
ALTER COLUMN file_path DROP NOT NULL;