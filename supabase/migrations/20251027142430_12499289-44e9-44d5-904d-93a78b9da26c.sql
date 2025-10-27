-- Add INSERT policy for documents to enforce visibility rules
CREATE POLICY "Users must respect visibility rules on insert"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company(auth.uid()) AND
  (
    -- Admins can upload with any visibility
    has_role(auth.uid(), 'admin'::app_role) OR
    -- Sales can only upload sales or dispatcher visibility
    (visibility IN ('sales', 'dispatcher') AND has_role(auth.uid(), 'sales'::app_role)) OR
    -- Dispatchers can upload dispatcher, driver, or carrier visibility
    (visibility IN ('dispatcher', 'driver', 'carrier') AND has_role(auth.uid(), 'dispatcher'::app_role)) OR
    -- Drivers can only upload driver visibility for their own records
    (visibility = 'driver' AND driver_id IN (
      SELECT id FROM drivers WHERE user_id = auth.uid()
    ))
  )
);