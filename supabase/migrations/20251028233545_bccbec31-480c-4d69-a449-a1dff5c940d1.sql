-- Cleanup Test/Demo Data
-- Remove all data associated with test companies while preserving user credentials

DO $$
DECLARE
  test_company_1 UUID := '4808783a-fc0e-46ed-ae6e-efe23eef900f'; -- Test Logistics LLC
  test_company_2 UUID := '65f4d409-574a-49fa-881f-c930d0f4d922'; -- Demo Freight Corp
BEGIN
  -- Delete dispatch performance data
  DELETE FROM dispatch_performance WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete dispatcher notes
  DELETE FROM dispatcher_notes WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete locations
  DELETE FROM locations WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete invoices
  DELETE FROM invoices WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete loads
  DELETE FROM loads WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete carrier contacts
  DELETE FROM carrier_contacts WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete carriers
  DELETE FROM carriers WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete drivers
  DELETE FROM drivers WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete brokers
  DELETE FROM brokers WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete documents
  DELETE FROM documents WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete messages
  DELETE FROM messages WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete notes
  DELETE FROM notes WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete audit logs
  DELETE FROM audit_logs WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete sales activities
  DELETE FROM sales_activities WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete WIP assignments
  DELETE FROM wip_assignments WHERE company_id IN (test_company_1, test_company_2);
  
  -- Update profiles to remove company association (keeps user auth credentials)
  UPDATE profiles 
  SET company_id = NULL 
  WHERE company_id IN (test_company_1, test_company_2);
  
  -- Delete user roles for test company users
  DELETE FROM user_roles WHERE company_id IN (test_company_1, test_company_2);
  
  -- Finally, delete the test companies themselves
  DELETE FROM companies WHERE id IN (test_company_1, test_company_2);
  
  RAISE NOTICE 'Test data cleanup completed successfully. User credentials preserved.';
END $$;