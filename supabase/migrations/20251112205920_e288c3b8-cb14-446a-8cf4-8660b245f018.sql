-- Add driver portal access and invitation tracking columns
ALTER TABLE drivers 
  ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS portal_access_revoked_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries on portal access
CREATE INDEX IF NOT EXISTS idx_drivers_portal_access ON drivers(portal_access_enabled) WHERE portal_access_enabled = true;