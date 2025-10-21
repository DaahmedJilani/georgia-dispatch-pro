-- Create function to handle company creation and user setup atomically
CREATE OR REPLACE FUNCTION public.create_company_for_user(
  _company_name text,
  _user_id uuid,
  _is_georgia_admin boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
BEGIN
  -- If Georgia admin, use existing company
  IF _is_georgia_admin THEN
    _company_id := '00000000-0000-0000-0000-000000000001';
  ELSE
    -- Create new company
    INSERT INTO companies (name)
    VALUES (_company_name)
    RETURNING id INTO _company_id;
  END IF;
  
  -- Update profile with company_id
  UPDATE profiles
  SET company_id = _company_id
  WHERE user_id = _user_id;
  
  -- Create admin role
  INSERT INTO user_roles (user_id, company_id, role)
  VALUES (_user_id, _company_id, 'admin');
  
  RETURN _company_id;
END;
$$;