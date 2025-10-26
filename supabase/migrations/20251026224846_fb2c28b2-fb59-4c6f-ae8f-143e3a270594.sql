-- Add GPS consent field to drivers table
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS gps_consent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN drivers.gps_consent IS 'Driver consent for GPS location tracking';