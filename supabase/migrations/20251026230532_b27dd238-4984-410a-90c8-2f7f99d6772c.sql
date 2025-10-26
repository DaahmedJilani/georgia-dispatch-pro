-- Create audit_logs table to track all changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- 'load', 'invoice', 'document', 'driver', 'broker', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  old_data JSONB,
  new_data JSONB,
  changes JSONB, -- specific fields that changed
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view audit logs in their company"
ON public.audit_logs
FOR SELECT
USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to log changes
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _action TEXT;
  _changes JSONB;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    _action := 'created';
    _company_id := NEW.company_id;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'updated';
    _company_id := NEW.company_id;
    -- Calculate what changed
    _changes := jsonb_build_object(
      'changed_fields', (
        SELECT jsonb_object_agg(key, jsonb_build_object('old', value, 'new', new_value))
        FROM jsonb_each(to_jsonb(OLD)) old_row(key, value)
        JOIN jsonb_each(to_jsonb(NEW)) new_row(new_key, new_value) ON old_row.key = new_row.new_key
        WHERE old_row.value IS DISTINCT FROM new_row.new_value
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'deleted';
    _company_id := OLD.company_id;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    company_id,
    user_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    changes
  ) VALUES (
    _company_id,
    auth.uid(),
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    _action,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    _changes
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for loads table
DROP TRIGGER IF EXISTS audit_loads_changes ON public.loads;
CREATE TRIGGER audit_loads_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.loads
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Create triggers for invoices table
DROP TRIGGER IF EXISTS audit_invoices_changes ON public.invoices;
CREATE TRIGGER audit_invoices_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Create triggers for documents table
DROP TRIGGER IF EXISTS audit_documents_changes ON public.documents;
CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Create triggers for drivers table
DROP TRIGGER IF EXISTS audit_drivers_changes ON public.drivers;
CREATE TRIGGER audit_drivers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

-- Create triggers for brokers table
DROP TRIGGER IF EXISTS audit_brokers_changes ON public.brokers;
CREATE TRIGGER audit_brokers_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();

COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail for all entity changes in the system';