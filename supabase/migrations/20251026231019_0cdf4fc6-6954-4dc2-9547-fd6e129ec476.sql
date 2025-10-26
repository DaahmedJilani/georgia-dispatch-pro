-- Create messages table for in-app communication
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  load_id UUID REFERENCES public.loads(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_company_id ON public.messages(company_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_load_id ON public.messages(load_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  company_id = get_user_company(auth.uid()) AND 
  (sender_id = auth.uid() OR recipient_id = auth.uid())
);

CREATE POLICY "Users can send messages in their company"
ON public.messages
FOR INSERT
WITH CHECK (
  company_id = get_user_company(auth.uid()) AND 
  sender_id = auth.uid()
);

CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (recipient_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.messages IS 'In-app messaging system for communication between users';