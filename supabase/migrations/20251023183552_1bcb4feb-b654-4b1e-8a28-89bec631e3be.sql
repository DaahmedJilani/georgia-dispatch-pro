-- Security Fix: Remove sensitive API keys from companies table
-- API keys should be stored in Supabase secrets, not in the database
-- This prevents credential theft by employees with database access

-- Remove sensitive API key columns
ALTER TABLE companies
  DROP COLUMN IF EXISTS airwallex_api_key,
  DROP COLUMN IF EXISTS docusign_api_key;

-- Keep airwallex_account_id and docusign_enabled as they are identifiers/flags, not secrets
-- Note: If different companies need different credentials, use separate Supabase projects
-- or implement a secure key management service