-- Subscription Management System
-- Add subscription tracking columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS subscription_due_date DATE DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE,
ADD COLUMN IF NOT EXISTS subscription_payment_status TEXT DEFAULT 'paid' CHECK (subscription_payment_status IN ('paid', 'pending', 'overdue', 'suspended')),
ADD COLUMN IF NOT EXISTS last_payment_date DATE,
ADD COLUMN IF NOT EXISTS subscription_amount NUMERIC DEFAULT 99.00,
ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_companies_payment_status ON companies(subscription_payment_status);
CREATE INDEX IF NOT EXISTS idx_companies_due_date ON companies(subscription_due_date);

-- Create subscription payment history table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies for subscription_payments
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admins can manage subscription payments"
ON subscription_payments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_master_admin = true
  )
);

-- Allow company admins to view their own payment history
CREATE POLICY "Company admins can view their payment history"
ON subscription_payments FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE user_id = auth.uid()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);