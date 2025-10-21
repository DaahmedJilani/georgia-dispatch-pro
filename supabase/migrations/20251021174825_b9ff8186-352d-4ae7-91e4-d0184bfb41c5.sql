-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatcher', 'driver', 'carrier', 'broker');

-- Create load_status enum
CREATE TYPE public.load_status AS ENUM ('pending', 'assigned', 'picked', 'in_transit', 'delivered', 'cancelled');

-- Companies table (multi-tenant)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Brokers/Customers table
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  license_expiry DATE,
  status TEXT DEFAULT 'available',
  current_location_lat DECIMAL,
  current_location_lng DECIMAL,
  last_location_update TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Carriers table
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mc_number TEXT,
  dot_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  insurance_expiry DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

-- Loads table (core feature)
CREATE TABLE public.loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  load_number TEXT NOT NULL,
  broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  
  -- Pickup details
  pickup_location TEXT NOT NULL,
  pickup_city TEXT,
  pickup_state TEXT,
  pickup_date TIMESTAMPTZ,
  pickup_notes TEXT,
  
  -- Delivery details
  delivery_location TEXT NOT NULL,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_date TIMESTAMPTZ,
  delivery_notes TEXT,
  
  -- Load details
  commodity TEXT,
  weight DECIMAL,
  rate DECIMAL,
  distance DECIMAL,
  
  -- Status
  status public.load_status DEFAULT 'pending',
  
  -- References
  reference_number TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(company_id, load_number)
);

ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL, -- 'rate_confirmation', 'bol', 'pod', 'invoice', etc.
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create security definer function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for Companies
CREATE POLICY "Users can view their own company"
ON public.companies FOR SELECT
TO authenticated
USING (id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins can update their company"
ON public.companies FOR UPDATE
TO authenticated
USING (
  id = public.get_user_company(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for User Roles
CREATE POLICY "Users can view roles in their company"
ON public.user_roles FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins can manage roles in their company"
ON public.user_roles FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS Policies for Profiles
CREATE POLICY "Users can view profiles in their company"
ON public.profiles FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- RLS Policies for Brokers
CREATE POLICY "Users can view brokers in their company"
ON public.brokers FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins and dispatchers can manage brokers"
ON public.brokers FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- RLS Policies for Drivers
CREATE POLICY "Users can view drivers in their company"
ON public.drivers FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Drivers can update their own info"
ON public.drivers FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins and dispatchers can manage drivers"
ON public.drivers FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- RLS Policies for Carriers
CREATE POLICY "Users can view carriers in their company"
ON public.carriers FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins and dispatchers can manage carriers"
ON public.carriers FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- RLS Policies for Loads
CREATE POLICY "Users can view loads in their company"
ON public.loads FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Drivers can update their assigned loads"
ON public.loads FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins and dispatchers can manage loads"
ON public.loads FOR ALL
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- RLS Policies for Documents
CREATE POLICY "Users can view documents in their company"
ON public.documents FOR SELECT
TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users can upload documents to their company"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE
TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND uploaded_by = auth.uid()
);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brokers_updated_at
BEFORE UPDATE ON public.brokers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carriers_updated_at
BEFORE UPDATE ON public.carriers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loads_updated_at
BEFORE UPDATE ON public.loads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
