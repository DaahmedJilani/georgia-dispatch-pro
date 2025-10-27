-- Drop the existing foreign key constraint on audit_logs.user_id
ALTER TABLE public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Add foreign key constraint to profiles(user_id) instead
ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;