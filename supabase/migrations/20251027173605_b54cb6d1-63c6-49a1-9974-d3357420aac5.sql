-- Phase 1: Database Schema Fixes for Role Relationships

-- Add dispatcher_id to loads table
ALTER TABLE loads ADD COLUMN IF NOT EXISTS dispatcher_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Add dispatcher_id to drivers table  
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS dispatcher_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Add role tracking to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_role TEXT;

-- Add company logo field
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add sales agent tracking to carriers
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS sales_agent_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Update drivers sales_agent_id to use profiles instead of auth.users
-- First check if column exists and what it references
DO $$ 
BEGIN
  -- Add sales_agent_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'drivers' 
    AND column_name = 'sales_agent_id'
  ) THEN
    ALTER TABLE drivers ADD COLUMN sales_agent_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_loads_dispatcher_id ON loads(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_drivers_dispatcher_id ON drivers(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_carriers_sales_agent_id ON carriers(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_drivers_sales_agent_id ON drivers(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_roles ON messages(sender_role, recipient_role);

-- Update RLS policy for messages to include role-based filtering
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;

CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
USING (
  company_id = get_user_company(auth.uid()) 
  AND (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
  )
);