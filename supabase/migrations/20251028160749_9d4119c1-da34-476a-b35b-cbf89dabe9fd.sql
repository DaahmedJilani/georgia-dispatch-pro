-- Fix RLS Policies: Allow Sales agents to create and manage carriers
CREATE POLICY "Sales agents can create carriers"
ON carriers FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company(auth.uid()) AND
  has_role(auth.uid(), 'sales'::app_role) AND
  sales_agent_id = auth.uid()
);

CREATE POLICY "Sales agents can update their carriers"
ON carriers FOR UPDATE TO authenticated
USING (
  company_id = get_user_company(auth.uid()) AND
  sales_agent_id = auth.uid()
);

-- Fix RLS Policies: Allow Sales agents to create and manage drivers
CREATE POLICY "Sales agents can create drivers"
ON drivers FOR INSERT TO authenticated
WITH CHECK (
  company_id = get_user_company(auth.uid()) AND
  has_role(auth.uid(), 'sales'::app_role) AND
  sales_agent_id = auth.uid()
);

CREATE POLICY "Sales agents can update their drivers"
ON drivers FOR UPDATE TO authenticated
USING (
  company_id = get_user_company(auth.uid()) AND
  sales_agent_id = auth.uid()
);

-- Add is_new_activation column to dispatch_performance for tracking first loads
ALTER TABLE dispatch_performance 
ADD COLUMN IF NOT EXISTS is_new_activation BOOLEAN DEFAULT false;