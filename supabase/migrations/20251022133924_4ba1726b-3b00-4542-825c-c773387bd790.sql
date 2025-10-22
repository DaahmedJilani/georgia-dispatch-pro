-- Drop existing SELECT policy that allows potential cross-company leakage
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create a more restrictive policy that properly handles NULL company_ids
CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  user_id = auth.uid()
  OR
  -- Users can see profiles in their company only if both have a company_id
  (
    company_id IS NOT NULL 
    AND get_user_company(auth.uid()) IS NOT NULL
    AND company_id = get_user_company(auth.uid())
  )
);