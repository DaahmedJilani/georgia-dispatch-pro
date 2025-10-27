-- Phase 10: Database Relationship Validation and Enhancements

-- Add contract_status to carriers for workflow tracking
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'draft';
COMMENT ON COLUMN carriers.contract_status IS 'Values: draft, sent, signed, activated, denied';

-- Add sale_stage to carriers for sales workflow tracker
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sale_stage TEXT DEFAULT 'follow_up';
COMMENT ON COLUMN carriers.sale_stage IS 'Values: follow_up, promise, closed, activated, denied';

-- Add stage_updated_at for timeline tracking
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add stage_updated_by for tracking who changed the stage
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS stage_updated_by UUID REFERENCES profiles(user_id);

-- Ensure all drivers have company_id (multi-tenant isolation)
UPDATE drivers SET company_id = (
  SELECT company_id FROM profiles WHERE profiles.user_id = drivers.user_id
) WHERE company_id IS NULL AND user_id IS NOT NULL;

-- Ensure all carriers have company_id
UPDATE carriers SET company_id = (
  SELECT company_id FROM profiles 
  WHERE profiles.user_id = carriers.sales_agent_id
) WHERE company_id IS NULL AND sales_agent_id IS NOT NULL;

-- Create index for better performance on sales workflow queries
CREATE INDEX IF NOT EXISTS idx_carriers_sale_stage ON carriers(sale_stage, sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_carriers_contract_status ON carriers(contract_status);

-- Add trigger to update stage_updated_at automatically
CREATE OR REPLACE FUNCTION update_carrier_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.sale_stage IS DISTINCT FROM NEW.sale_stage) THEN
    NEW.stage_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER carrier_stage_update_trigger
  BEFORE UPDATE ON carriers
  FOR EACH ROW
  EXECUTE FUNCTION update_carrier_stage_timestamp();