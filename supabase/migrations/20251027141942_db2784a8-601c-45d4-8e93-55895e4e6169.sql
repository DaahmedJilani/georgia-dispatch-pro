-- Fix user_roles policy to prevent unauthorized role assignments
-- Drop the overly permissive policy that allows users to create their own roles
DROP POLICY IF EXISTS "Users can create their own initial role" ON public.user_roles;

-- The 'Admins can manage roles in their company' policy already exists and is sufficient
-- Initial role assignment should only happen through the create_company_for_user function