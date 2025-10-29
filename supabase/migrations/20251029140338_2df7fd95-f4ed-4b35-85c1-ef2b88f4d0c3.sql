-- Add subscription tiers to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic' 
  CHECK (subscription_tier IN ('basic', 'pro')),
ADD COLUMN IF NOT EXISTS subscription_features JSONB DEFAULT '{
  "driver_portal": false,
  "messages": false,
  "fleet_map": false,
  "invoices": false
}'::jsonb;

-- Update existing companies to Pro tier (since they currently have full access)
UPDATE companies 
SET subscription_tier = 'pro',
    subscription_amount = 50.00,
    subscription_features = '{
      "driver_portal": true,
      "messages": true,
      "fleet_map": true,
      "invoices": true
    }'::jsonb
WHERE subscription_tier IS NULL OR subscription_tier = 'basic';

-- Function to automatically set features based on tier
CREATE OR REPLACE FUNCTION set_subscription_features()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier = 'pro' THEN
    NEW.subscription_features = '{
      "driver_portal": true,
      "messages": true,
      "fleet_map": true,
      "invoices": true
    }'::jsonb;
    NEW.subscription_amount = 50.00;
  ELSE
    NEW.subscription_features = '{
      "driver_portal": false,
      "messages": false,
      "fleet_map": false,
      "invoices": false
    }'::jsonb;
    NEW.subscription_amount = 20.00;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update features when tier changes
DROP TRIGGER IF EXISTS update_subscription_features_trigger ON companies;
CREATE TRIGGER update_subscription_features_trigger
  BEFORE INSERT OR UPDATE OF subscription_tier ON companies
  FOR EACH ROW
  EXECUTE FUNCTION set_subscription_features();

-- Function to create company for new user signup
CREATE OR REPLACE FUNCTION create_company_for_new_user(
  _user_id UUID,
  _company_name TEXT,
  _tier TEXT DEFAULT 'basic'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
  _amount NUMERIC;
BEGIN
  -- Determine subscription amount
  _amount := CASE WHEN _tier = 'pro' THEN 50.00 ELSE 20.00 END;
  
  -- Create company
  INSERT INTO companies (name, subscription_tier, subscription_amount, subscription_status)
  VALUES (_company_name, _tier, _amount, 'active')
  RETURNING id INTO _company_id;
  
  -- Update profile with company_id
  UPDATE profiles SET company_id = _company_id WHERE user_id = _user_id;
  
  -- Create admin role
  INSERT INTO user_roles (user_id, company_id, role)
  VALUES (_user_id, _company_id, 'admin');
  
  RETURN _company_id;
END;
$$;