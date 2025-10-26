-- Create 2FA verification codes table
CREATE TABLE IF NOT EXISTS public.two_factor_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  method TEXT NOT NULL, -- 'sms' or 'email'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_two_factor_codes_user_id ON public.two_factor_codes(user_id);
CREATE INDEX idx_two_factor_codes_expires_at ON public.two_factor_codes(expires_at);

-- Add 2FA enabled flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method TEXT DEFAULT 'sms'; -- 'sms' or 'email'

-- Enable RLS
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own 2FA codes"
ON public.two_factor_codes
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own 2FA codes"
ON public.two_factor_codes
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own 2FA codes"
ON public.two_factor_codes
FOR UPDATE
USING (user_id = auth.uid());

COMMENT ON TABLE public.two_factor_codes IS 'Two-factor authentication verification codes';