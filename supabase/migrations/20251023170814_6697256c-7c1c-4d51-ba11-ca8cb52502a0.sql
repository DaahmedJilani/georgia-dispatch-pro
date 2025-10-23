-- Fix security warning: Restrict broker contact information access
-- Only admins and dispatchers need access to sensitive broker details
-- This prevents data theft if lower-privileged accounts are compromised

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view brokers in their company" ON public.brokers;

-- Create a restricted policy: only admins and dispatchers can view brokers
CREATE POLICY "Admins and dispatchers can view brokers"
ON public.brokers
FOR SELECT
USING (
  (company_id = get_user_company(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dispatcher'::app_role))
);