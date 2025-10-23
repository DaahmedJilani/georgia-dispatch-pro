-- Fix security vulnerability: Remove overly permissive company insert policy
-- Company creation should only happen through the secure create_company_for_user function
-- which runs as SECURITY DEFINER and properly validates the signup flow

DROP POLICY IF EXISTS "Users can create companies during signup" ON public.companies;

-- The create_company_for_user() function already handles company creation securely
-- during signup with proper validation and role assignment. No direct INSERT policy needed.