-- Create sales activity tracking table
CREATE TABLE IF NOT EXISTS public.sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sales_agent_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('carrier', 'driver')),
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('follow_up', 'promise', 'closed', 'activated')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dispatch performance tracking table
CREATE TABLE IF NOT EXISTS public.dispatch_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dispatcher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES public.carriers(id) ON DELETE SET NULL,
  revenue NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dispatcher notes table
CREATE TABLE IF NOT EXISTS public.dispatcher_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  dispatcher_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  admin_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add document visibility field to documents table if not exists
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'dispatcher' CHECK (visibility IN ('sales', 'dispatcher', 'driver', 'admin', 'carrier'));

-- Enable RLS on new tables
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatcher_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_activities
CREATE POLICY "Sales agents can view their own activities"
ON public.sales_activities FOR SELECT
USING (sales_agent_id = auth.uid());

CREATE POLICY "Sales agents can insert their own activities"
ON public.sales_activities FOR INSERT
WITH CHECK (sales_agent_id = auth.uid() AND company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can view all sales activities in their company"
ON public.sales_activities FOR SELECT
USING (company_id = get_user_company(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dispatch_performance
CREATE POLICY "Dispatchers can view their own performance"
ON public.dispatch_performance FOR SELECT
USING (dispatcher_id = auth.uid());

CREATE POLICY "Dispatchers can insert their own performance"
ON public.dispatch_performance FOR INSERT
WITH CHECK (dispatcher_id = auth.uid() AND company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can view all dispatch performance in their company"
ON public.dispatch_performance FOR SELECT
USING (company_id = get_user_company(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for dispatcher_notes
CREATE POLICY "Dispatchers can manage their own notes"
ON public.dispatcher_notes FOR ALL
USING (dispatcher_id = auth.uid() AND company_id = get_user_company(auth.uid()));

CREATE POLICY "Admins can view and add feedback to all notes in their company"
ON public.dispatcher_notes FOR ALL
USING (company_id = get_user_company(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for dispatcher_notes updated_at
CREATE TRIGGER update_dispatcher_notes_updated_at
BEFORE UPDATE ON public.dispatcher_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_activities_agent ON public.sales_activities(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_company ON public.sales_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_performance_dispatcher ON public.dispatch_performance(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_performance_company ON public.dispatch_performance(company_id);
CREATE INDEX IF NOT EXISTS idx_dispatcher_notes_dispatcher ON public.dispatcher_notes(dispatcher_id);
CREATE INDEX IF NOT EXISTS idx_dispatcher_notes_company ON public.dispatcher_notes(company_id);