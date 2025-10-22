-- Add Airwallex credentials columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS airwallex_api_key text,
ADD COLUMN IF NOT EXISTS airwallex_account_id text;

-- Enable Realtime for drivers table (for live GPS tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- Create function to send SMS notification on load assignment
CREATE OR REPLACE FUNCTION public.notify_driver_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  driver_phone text;
  load_info text;
BEGIN
  -- Only send notification when status changes to 'assigned' and driver is assigned
  IF NEW.status = 'assigned' AND NEW.driver_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'assigned' OR OLD.driver_id IS NULL OR OLD.driver_id != NEW.driver_id) THEN
    
    -- Get driver phone
    SELECT phone INTO driver_phone
    FROM public.drivers
    WHERE id = NEW.driver_id;
    
    IF driver_phone IS NOT NULL THEN
      -- Build load info message
      load_info := 'New load assigned: ' || NEW.load_number || 
                   ' | Pickup: ' || NEW.pickup_city || ', ' || NEW.pickup_state ||
                   ' | Delivery: ' || NEW.delivery_city || ', ' || NEW.delivery_state;
      
      -- Call edge function to send SMS (async, won't block)
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-sms-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object(
          'to', driver_phone,
          'message', load_info
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for load assignment notifications
DROP TRIGGER IF EXISTS trigger_notify_driver_on_assignment ON public.loads;
CREATE TRIGGER trigger_notify_driver_on_assignment
  AFTER INSERT OR UPDATE OF status, driver_id ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_driver_on_assignment();

-- Create function to auto-generate invoice on delivery
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_num text;
  next_num integer;
BEGIN
  -- Only create invoice when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    
    -- Check if invoice already exists for this load
    IF NOT EXISTS (SELECT 1 FROM public.invoices WHERE load_id = NEW.id) THEN
      
      -- Generate invoice number
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
      INTO next_num
      FROM public.invoices
      WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%';
      
      invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::text, 4, '0');
      
      -- Create invoice
      INSERT INTO public.invoices (
        invoice_number,
        load_id,
        broker_id,
        invoice_date,
        due_date,
        amount,
        status,
        company_id,
        created_by,
        notes
      ) VALUES (
        invoice_num,
        NEW.id,
        NEW.broker_id,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        NEW.rate,
        'pending',
        NEW.company_id,
        NEW.created_by,
        'Auto-generated on delivery'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto invoice generation
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice ON public.loads;
CREATE TRIGGER trigger_auto_generate_invoice
  AFTER UPDATE OF status ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_invoice_on_delivery();