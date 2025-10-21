-- Fix RLS policies for signup flow

-- Allow new users to create companies during signup
CREATE POLICY "Users can create companies during signup"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to insert their own user_roles during signup
CREATE POLICY "Users can create their own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create Georgia Industrials admin account
-- First insert the company
INSERT INTO public.companies (id, name, email, phone)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Georgia Industrials Inc',
  'ahmad@georgiaindustrials.com',
  NULL
);

-- Note: The user account will need to be created through the signup form
-- with email: ahmad@georgiaindustrials.com
-- The profile and role will be set up automatically via the signup flow