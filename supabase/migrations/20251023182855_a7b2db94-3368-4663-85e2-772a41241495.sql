-- Phase 2: Step 2 - Schema enhancements and new tables

-- Add DocuSign and Airwallex support to companies
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS docusign_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS docusign_api_key text,
  ADD COLUMN IF NOT EXISTS airwallex_account_id text;

-- Add contract tracking to carriers
ALTER TABLE carriers
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS docusign_status text DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS docusign_envelope_id text;

-- Add sales tracking to loads
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS sales_agent_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS sales_percentage numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS factoring boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS contract_signed boolean DEFAULT false;

-- Add uploaded_for tracking to documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS uploaded_for text;

-- Update documents visibility constraint to include new roles
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_visibility_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_visibility_check 
    CHECK (visibility IN ('sales', 'dispatcher', 'driver', 'carrier', 'admin'));

-- Create location tracking table for real-time GPS data
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  load_id uuid REFERENCES loads(id) ON DELETE SET NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy numeric,
  heading numeric,
  speed numeric,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_driver_timestamp 
  ON locations(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_load 
  ON locations(load_id) WHERE load_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_company 
  ON locations(company_id);

-- Enable RLS on locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Locations policies
CREATE POLICY "Users can view locations in their company"
ON locations FOR SELECT
USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "Drivers can insert their own location"
ON locations FOR INSERT
WITH CHECK (
  company_id = get_user_company(auth.uid()) 
  AND driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

-- Add payment link tracking to invoices
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_link_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS link_created_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS payment_link_expires_at timestamp with time zone;

-- Enhanced document visibility policies
DROP POLICY IF EXISTS "Users can view documents based on visibility and role" ON documents;
DROP POLICY IF EXISTS "Users can view documents in their company" ON documents;

CREATE POLICY "Enhanced document visibility"
ON documents FOR SELECT
USING (
  company_id = get_user_company(auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (visibility = 'sales' AND has_role(auth.uid(), 'sales'::app_role))
    OR (visibility IN ('dispatcher', 'driver') AND has_role(auth.uid(), 'dispatcher'::app_role))
    OR (visibility = 'driver' AND driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
    OR (visibility = 'carrier' AND carrier_id IN (
      SELECT carrier_id FROM drivers WHERE user_id = auth.uid()
    ))
  )
);

-- Enhanced WIP visibility
DROP POLICY IF EXISTS "Users can view WIP in their company" ON wip_assignments;

CREATE POLICY "Enhanced WIP visibility"
ON wip_assignments FOR SELECT
USING (
  company_id = get_user_company(auth.uid()) AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'dispatcher'::app_role)
    OR user_id = auth.uid()
  )
);

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read, created_at DESC);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Add master_admin flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_master_admin boolean DEFAULT false;