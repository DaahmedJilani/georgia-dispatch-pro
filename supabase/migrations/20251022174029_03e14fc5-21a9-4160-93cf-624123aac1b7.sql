-- Simplified Seed Demo Data for Georgia Dispatch Pro
-- Creates operational demo data without auth users

-- Ensure the demo company exists (Georgia Industrials Inc)
INSERT INTO public.companies (id, name, email, phone, address, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Georgia Industrials Inc',
  'admin@georgiaindustrials.com',
  '+1-404-555-0100',
  '1234 Industrial Pkwy, Atlanta, GA 30303',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;

-- Create brokers
INSERT INTO public.brokers (id, name, company_name, email, phone, address, payment_terms, notes, company_id)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'John Stevens', 'C.H. Robinson', 'john.stevens@chrobinson.com', '+1-952-937-8500', '14701 Charlson Rd, Eden Prairie, MN 55347', 'Net 30', 'Large volume broker, reliable payments', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Lisa Parker', 'TQL (Total Quality Logistics)', 'lisa.parker@tql.com', '+1-513-831-2000', '4289 Ivy Pointe Blvd, Cincinnati, OH 45245', 'Net 45', 'Fast load matching, good communication', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'Mark Reynolds', 'Landstar', 'mark.reynolds@landstar.com', '+1-904-390-1000', '13410 Sutton Park Dr S, Jacksonville, FL 32224', 'Net 30', 'Premium rates, mostly long haul', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Rachel Kim', 'XPO Logistics', 'rachel.kim@xpo.com', '+1-855-976-6951', '5 American Ln, Greenwich, CT 06831', 'Quick Pay Available', 'Variety of load types, flexible scheduling', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Create carriers
INSERT INTO public.carriers (id, name, mc_number, dot_number, address, phone, email, insurance_expiry, notes, company_id)
VALUES 
  ('30000000-0000-0000-0000-000000000001', 'Swift Transportation', 'MC-123456', 'DOT-234567', '2200 S 75th Ave, Phoenix, AZ 85043', '+1-602-269-9700', 'dispatch@swifttrans.com', '2025-12-31', 'Large national carrier', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'Schneider National', 'MC-234567', 'DOT-345678', '3101 S Packerland Dr, Green Bay, WI 54313', '+1-920-592-2000', 'dispatch@schneider.com', '2025-11-30', 'Temperature controlled specialists', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', 'J.B. Hunt Transport', 'MC-345678', 'DOT-456789', '615 J.B. Hunt Corporate Dr, Lowell, AR 72745', '+1-479-820-0000', 'dispatch@jbhunt.com', '2026-01-15', 'Intermodal and dedicated services', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Create drivers (without user_id since they're demo data)
INSERT INTO public.drivers (id, first_name, last_name, email, phone, license_number, license_expiry, user_id, company_id, status, current_location_lat, current_location_lng, notes)
VALUES 
  ('40000000-0000-0000-0000-000000000001', 'David', 'Martinez', 'david.martinez@demo.com', '+1-404-555-0105', 'GA-CDL-12345', '2026-12-31', NULL, '00000000-0000-0000-0000-000000000001', 'available', 33.7490, -84.3880, 'Experienced driver, prefers long haul'),
  ('40000000-0000-0000-0000-000000000002', 'Robert', 'Anderson', 'robert.anderson@demo.com', '+1-404-555-0106', 'GA-CDL-23456', '2027-03-15', NULL, '00000000-0000-0000-0000-000000000001', 'on_load', 34.0522, -118.2437, 'Currently on route to LA'),
  ('40000000-0000-0000-0000-000000000003', 'William', 'Taylor', 'william.taylor@demo.com', '+1-404-555-0107', 'GA-CDL-34567', '2026-08-22', NULL, '00000000-0000-0000-0000-000000000001', 'on_load', 32.7767, -96.7970, 'Specializes in refrigerated loads'),
  ('40000000-0000-0000-0000-000000000004', 'Jennifer', 'White', 'jennifer.white@demo.com', '+1-404-555-0108', 'GA-CDL-45678', '2027-11-10', NULL, '00000000-0000-0000-0000-000000000001', 'available', 33.7490, -84.3880, 'Hazmat certified'),
  ('40000000-0000-0000-0000-000000000005', 'Daniel', 'Harris', 'daniel.harris@demo.com', '+1-404-555-0109', 'GA-CDL-56789', '2026-06-05', NULL, '00000000-0000-0000-0000-000000000001', 'off_duty', 33.7490, -84.3880, 'Team driver, prefers night runs')
ON CONFLICT (id) DO NOTHING;

-- Create loads with various statuses
INSERT INTO public.loads (
  id, load_number, reference_number, 
  pickup_location, pickup_city, pickup_state, pickup_date, pickup_notes,
  delivery_location, delivery_city, delivery_state, delivery_date, delivery_notes,
  commodity, weight, distance, rate, status,
  broker_id, driver_id, carrier_id, company_id, notes
)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'GFL-00001', 'REF-0001', 
   '1234 Industry Blvd, Atlanta, GA', 'Atlanta', 'GA', (NOW() - INTERVAL '5 days')::timestamp, 'Dock hours 8AM-4PM',
   '5678 Market St, Los Angeles, CA', 'Los Angeles', 'CA', (NOW() - INTERVAL '3 days')::timestamp, 'Appointment required',
   'Electronics', 42000, 2175, 4500.00, 'delivered'::load_status,
   '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 
   '00000000-0000-0000-0000-000000000001', 'Delivered on time, no issues'),
   
  ('50000000-0000-0000-0000-000000000002', 'GFL-00002', 'REF-0002',
   '2345 Warehouse Rd, Charlotte, NC', 'Charlotte', 'NC', (NOW() - INTERVAL '3 days')::timestamp, 'Loading starts at 6AM',
   '6789 Distribution Way, Dallas, TX', 'Dallas', 'TX', (NOW() - INTERVAL '1 day')::timestamp, 'Receiver closes at 5PM',
   'Automotive Parts', 38500, 1150, 2800.00, 'delivered'::load_status,
   '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'Smooth delivery, POD received'),
   
  ('50000000-0000-0000-0000-000000000003', 'GFL-00003', 'REF-0003',
   '3456 Commerce Dr, Miami, FL', 'Miami', 'FL', (NOW() - INTERVAL '1 day')::timestamp, 'Gate pass required',
   '7890 Industrial Pkwy, Houston, TX', 'Houston', 'TX', NOW()::timestamp, 'Temperature controlled 35-40°F',
   'Pharmaceuticals', 28000, 1200, 3200.00, 'in_transit'::load_status,
   '20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'Driver ETA 3 hours'),
   
  ('50000000-0000-0000-0000-000000000004', 'GFL-00004', 'REF-0004',
   '4567 Port Access Rd, Savannah, GA', 'Savannah', 'GA', NOW()::timestamp, 'Container pickup at port',
   '8901 Commerce Ct, Chicago, IL', 'Chicago', 'IL', (NOW() + INTERVAL '2 days')::timestamp, 'Deliver to dock 12',
   'Import Goods', 44000, 850, 2100.00, 'picked'::load_status,
   '20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'Container sealed, in transit'),
   
  ('50000000-0000-0000-0000-000000000005', 'GFL-00005', 'REF-0005',
   '5678 Manufacturing Way, Nashville, TN', 'Nashville', 'TN', (NOW() + INTERVAL '1 day')::timestamp, 'Call 30 min before arrival',
   '9012 Retail Blvd, Denver, CO', 'Denver', 'CO', (NOW() + INTERVAL '3 days')::timestamp, 'Unload at rear dock',
   'Furniture', 35000, 1450, 2900.00, 'assigned'::load_status,
   '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001', 'Driver confirmed, ready to pickup tomorrow'),
   
  ('50000000-0000-0000-0000-000000000006', 'GFL-00006', 'REF-0006',
   '6789 Factory Ln, Birmingham, AL', 'Birmingham', 'AL', (NOW() + INTERVAL '2 days')::timestamp, 'Forklift loading',
   '0123 Store Rd, Portland, OR', 'Portland', 'OR', (NOW() + INTERVAL '5 days')::timestamp, 'Liftgate required',
   'Building Materials', 48000, 2650, 5100.00, 'pending'::load_status,
   '20000000-0000-0000-0000-000000000002', NULL, '30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'Awaiting driver assignment'),
   
  ('50000000-0000-0000-0000-000000000007', 'GFL-00007', 'REF-0007',
   '7890 Supply Chain Dr, Jacksonville, FL', 'Jacksonville', 'FL', (NOW() + INTERVAL '3 days')::timestamp, 'Dock door B7',
   '1234 Distribution Center, Seattle, WA', 'Seattle', 'WA', (NOW() + INTERVAL '6 days')::timestamp, 'Team drivers preferred',
   'Consumer Electronics', 32000, 2850, 5500.00, 'pending'::load_status,
   '20000000-0000-0000-0000-000000000003', NULL, '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'High value load, requires tracking'),
   
  ('50000000-0000-0000-0000-000000000008', 'GFL-00008', 'REF-0008',
   '8901 Logistics Ave, Memphis, TN', 'Memphis', 'TN', (NOW() + INTERVAL '4 days')::timestamp, 'FedEx facility pickup',
   '2345 Warehouse Complex, Boston, MA', 'Boston', 'MA', (NOW() + INTERVAL '6 days')::timestamp, 'Delivery window 8AM-12PM',
   'Medical Supplies', 15000, 1250, 2600.00, 'pending'::load_status,
   '20000000-0000-0000-0000-000000000004', NULL, '30000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001', 'Time sensitive, priority load'),
   
  ('50000000-0000-0000-0000-000000000009', 'GFL-00009', 'REF-0009',
   '9012 Industrial Park, New Orleans, LA', 'New Orleans', 'LA', (NOW() - INTERVAL '7 days')::timestamp, 'Port facility',
   '3456 Commerce Dr, New York, NY', 'New York', 'NY', (NOW() - INTERVAL '5 days')::timestamp, 'Manhattan delivery',
   'Textiles', 25000, 1400, 3100.00, 'delivered'::load_status,
   '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001', 'Completed successfully'),
   
  ('50000000-0000-0000-0000-000000000010', 'GFL-00010', 'REF-0010',
   '0123 Shipping Blvd, Tampa, FL', 'Tampa', 'FL', (NOW() + INTERVAL '5 days')::timestamp, 'Refrigerated pickup',
   '4567 Food Service Way, Minneapolis, MN', 'Minneapolis', 'MN', (NOW() + INTERVAL '7 days')::timestamp, 'Keep frozen -10°F',
   'Frozen Foods', 40000, 1550, 3400.00, 'pending'::load_status,
   '20000000-0000-0000-0000-000000000002', NULL, '30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001', 'Reefer unit required, temp monitoring')
ON CONFLICT (id) DO NOTHING;

-- Create invoices for delivered loads
INSERT INTO public.invoices (
  id, invoice_number, load_id, broker_id, invoice_date, due_date, amount, status, 
  payment_date, company_id, notes
)
VALUES
  ('60000000-0000-0000-0000-000000000001', 'INV-2025-0001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 
   (NOW() - INTERVAL '3 days')::date, (NOW() + INTERVAL '27 days')::date, 4500.00, 'paid', 
   (NOW() - INTERVAL '1 day')::date, '00000000-0000-0000-0000-000000000001', 'Payment received via ACH'),
   
  ('60000000-0000-0000-0000-000000000002', 'INV-2025-0002', '50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
   (NOW() - INTERVAL '1 day')::date, (NOW() + INTERVAL '44 days')::date, 2800.00, 'pending',
   NULL, '00000000-0000-0000-0000-000000000001', 'Awaiting broker payment'),
   
  ('60000000-0000-0000-0000-000000000003', 'INV-2025-0003', '50000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001',
   (NOW() - INTERVAL '5 days')::date, (NOW() + INTERVAL '25 days')::date, 3100.00, 'paid',
   (NOW() - INTERVAL '3 days')::date, '00000000-0000-0000-0000-000000000001', 'Quick pay applied')
ON CONFLICT (id) DO NOTHING;

-- Create sample document records
INSERT INTO public.documents (
  id, file_name, file_path, document_type, file_size, 
  load_id, company_id
)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'BOL-GFL-00001.pdf', 'documents/50000000-0000-0000-0000-000000000001/bol.pdf', 'bill_of_lading', 245680,
   '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
   
  ('70000000-0000-0000-0000-000000000002', 'POD-GFL-00001.pdf', 'documents/50000000-0000-0000-0000-000000000001/pod.pdf', 'proof_of_delivery', 189430,
   '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
   
  ('70000000-0000-0000-0000-000000000003', 'BOL-GFL-00002.pdf', 'documents/50000000-0000-0000-0000-000000000002/bol.pdf', 'bill_of_lading', 267890,
   '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
   
  ('70000000-0000-0000-0000-000000000004', 'POD-GFL-00002.pdf', 'documents/50000000-0000-0000-0000-000000000002/pod.pdf', 'proof_of_delivery', 195620,
   '50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
   
  ('70000000-0000-0000-0000-000000000005', 'BOL-GFL-00009.pdf', 'documents/50000000-0000-0000-0000-000000000009/bol.pdf', 'bill_of_lading', 223450,
   '50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001'),
   
  ('70000000-0000-0000-0000-000000000006', 'POD-GFL-00009.pdf', 'documents/50000000-0000-0000-0000-000000000009/pod.pdf', 'proof_of_delivery', 201340,
   '50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;