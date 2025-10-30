-- Create OpenSign envelope tracking table
CREATE TABLE public.envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Entity relationships
  carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
  
  -- User tracking
  sales_agent_id UUID,
  created_by UUID,
  
  -- OpenSign data
  opensign_envelope_id TEXT UNIQUE,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  
  -- Signer information
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'signed', 'declined', 'expired', 'error'
  )),
  
  -- Document URLs
  unsigned_document_url TEXT,
  signed_document_url TEXT,
  
  -- Timeline timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  signing_url TEXT,
  ip_address INET,
  user_agent TEXT,
  notes TEXT
);

-- Webhook events audit log
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID REFERENCES envelopes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX idx_envelopes_company_id ON envelopes(company_id);
CREATE INDEX idx_envelopes_carrier_id ON envelopes(carrier_id);
CREATE INDEX idx_envelopes_status ON envelopes(status);
CREATE INDEX idx_envelopes_opensign_id ON envelopes(opensign_envelope_id);
CREATE INDEX idx_webhook_events_envelope_id ON webhook_events(envelope_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);

-- Enable RLS
ALTER TABLE envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for envelopes
CREATE POLICY "Admins can manage all envelopes in their company"
ON envelopes FOR ALL
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Sales agents can manage their own envelopes"
ON envelopes FOR ALL
USING (
  sales_agent_id = auth.uid() OR created_by = auth.uid()
);

CREATE POLICY "Dispatchers can view envelopes in their company"
ON envelopes FOR SELECT
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'dispatcher'::app_role)
);

CREATE POLICY "Carriers can view their own envelopes"
ON envelopes FOR SELECT
USING (
  carrier_id IN (
    SELECT c.id FROM carriers c
    LEFT JOIN drivers d ON d.carrier_id = c.id
    WHERE d.user_id = auth.uid()
  )
);

-- RLS Policies for webhook_events
CREATE POLICY "Admins can view webhook events in their company"
ON webhook_events FOR SELECT
USING (
  envelope_id IN (
    SELECT id FROM envelopes 
    WHERE company_id = get_user_company(auth.uid())
  ) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Update trigger for envelopes
CREATE TRIGGER update_envelopes_updated_at
BEFORE UPDATE ON envelopes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing DocuSign data
INSERT INTO envelopes (
  company_id,
  carrier_id,
  opensign_envelope_id,
  signer_email,
  signer_name,
  status,
  created_at,
  signed_at
)
SELECT 
  c.company_id,
  c.id AS carrier_id,
  c.docusign_envelope_id AS opensign_envelope_id,
  COALESCE(c.email, 'unknown@georgiaindustrials.com') AS signer_email,
  c.name AS signer_name,
  CASE 
    WHEN c.contract_signed = true THEN 'signed'
    WHEN c.docusign_status = 'sent' THEN 'sent'
    WHEN c.docusign_status = 'completed' THEN 'signed'
    ELSE 'draft'
  END AS status,
  c.created_at,
  c.contract_signed_at AS signed_at
FROM carriers c
WHERE c.docusign_envelope_id IS NOT NULL;

-- Add envelope reference to carriers
ALTER TABLE carriers ADD COLUMN envelope_id UUID REFERENCES envelopes(id) ON DELETE SET NULL;

-- Link migrated envelopes
UPDATE carriers c
SET envelope_id = e.id
FROM envelopes e
WHERE e.carrier_id = c.id
AND e.opensign_envelope_id = c.docusign_envelope_id;

-- Deprecate old DocuSign columns
ALTER TABLE carriers RENAME COLUMN docusign_envelope_id TO legacy_docusign_envelope_id;
ALTER TABLE carriers RENAME COLUMN docusign_status TO legacy_docusign_status;

COMMENT ON COLUMN carriers.legacy_docusign_envelope_id IS 'DEPRECATED - Migrated to envelopes table';
COMMENT ON COLUMN carriers.legacy_docusign_status IS 'DEPRECATED - Migrated to envelopes table';

-- Create signed-contracts storage bucket policies
CREATE POLICY "Admins can upload signed contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signed-contracts'
  AND auth.uid() IN (
    SELECT user_id FROM user_roles 
    WHERE role = 'admin' AND company_id = get_user_company(auth.uid())
  )
);

CREATE POLICY "Users can view signed contracts in their company"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signed-contracts'
  AND (split_part(name, '/', 1))::uuid IN (
    SELECT id FROM companies WHERE id = get_user_company(auth.uid())
  )
);