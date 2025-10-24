-- Fix profiles table RLS - require authentication
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

CREATE POLICY "Users can view profiles in their company"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid()) OR 
  ((company_id IS NOT NULL) AND 
   (get_user_company(auth.uid()) IS NOT NULL) AND 
   (company_id = get_user_company(auth.uid())))
);

-- Verify companies table requires authentication
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (id = get_user_company(auth.uid()));

-- Update master admin policies to allow viewing all companies
CREATE POLICY "Master admins can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_master_admin = true
  )
);