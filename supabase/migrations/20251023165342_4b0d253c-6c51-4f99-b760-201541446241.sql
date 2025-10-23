-- Add sales metadata columns to loads table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'sales_percentage') THEN
    ALTER TABLE public.loads ADD COLUMN sales_percentage numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'factoring') THEN
    ALTER TABLE public.loads ADD COLUMN factoring boolean DEFAULT false;
  END IF;
END $$;

-- Add DocuSign and contract fields to carriers table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'contract_signed') THEN
    ALTER TABLE public.carriers ADD COLUMN contract_signed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'docusign_envelope_id') THEN
    ALTER TABLE public.carriers ADD COLUMN docusign_envelope_id text;
  END IF;
END $$;

-- Add carrier_id to drivers table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'carrier_id') THEN
    ALTER TABLE public.drivers ADD COLUMN carrier_id uuid REFERENCES public.carriers(id);
  END IF;
END $$;