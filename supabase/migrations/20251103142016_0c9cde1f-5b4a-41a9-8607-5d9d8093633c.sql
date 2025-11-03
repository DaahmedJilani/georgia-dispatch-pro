-- Add DELETE policies for admins only

-- Loads
CREATE POLICY "Only admins can delete loads"
ON loads FOR DELETE
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Carriers
CREATE POLICY "Only admins can delete carriers"
ON carriers FOR DELETE
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Drivers
CREATE POLICY "Only admins can delete drivers"
ON drivers FOR DELETE
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Brokers
CREATE POLICY "Only admins can delete brokers"
ON brokers FOR DELETE
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Profiles (only admins can delete team members)
CREATE POLICY "Only admins can delete profiles"
ON profiles FOR DELETE
USING (
  company_id = get_user_company(auth.uid()) 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_master_admin = true
    )
  )
);

-- User roles (only admins can delete roles)
CREATE POLICY "Only admins can delete user roles"
ON user_roles FOR DELETE
USING (
  company_id = get_user_company(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);