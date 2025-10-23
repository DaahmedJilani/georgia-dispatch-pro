-- Phase 2: Step 1 - Add missing roles to app_role enum
-- Note: Enum values must be added in separate transactions
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'treasury';