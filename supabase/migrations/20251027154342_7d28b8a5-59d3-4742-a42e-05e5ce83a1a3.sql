-- Fix drivers.user_id foreign key
ALTER TABLE public.drivers
DROP CONSTRAINT IF EXISTS drivers_user_id_fkey;

ALTER TABLE public.drivers
ADD CONSTRAINT drivers_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Fix documents.uploaded_by foreign key
ALTER TABLE public.documents
DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;

ALTER TABLE public.documents
ADD CONSTRAINT documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;

-- Fix carrier_contacts.created_by foreign key
ALTER TABLE public.carrier_contacts
DROP CONSTRAINT IF EXISTS carrier_contacts_created_by_fkey;

ALTER TABLE public.carrier_contacts
ADD CONSTRAINT carrier_contacts_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;

-- Fix invoices.created_by foreign key
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;

-- Fix loads.created_by foreign key
ALTER TABLE public.loads
DROP CONSTRAINT IF EXISTS loads_created_by_fkey;

ALTER TABLE public.loads
ADD CONSTRAINT loads_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;

-- Fix loads.sales_user_id foreign key
ALTER TABLE public.loads
DROP CONSTRAINT IF EXISTS loads_sales_user_id_fkey;

ALTER TABLE public.loads
ADD CONSTRAINT loads_sales_user_id_fkey 
  FOREIGN KEY (sales_user_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;

-- Fix wip_assignments.assigned_by foreign key
ALTER TABLE public.wip_assignments
DROP CONSTRAINT IF EXISTS wip_assignments_assigned_by_fkey;

ALTER TABLE public.wip_assignments
ADD CONSTRAINT wip_assignments_assigned_by_fkey 
  FOREIGN KEY (assigned_by) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;