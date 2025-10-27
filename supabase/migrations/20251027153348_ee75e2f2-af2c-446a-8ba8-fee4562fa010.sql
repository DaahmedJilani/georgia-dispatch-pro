-- Fix messages table foreign keys
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

ALTER TABLE public.messages
ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE,
ADD CONSTRAINT messages_recipient_id_fkey 
  FOREIGN KEY (recipient_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE;

-- Fix notes table foreign keys
ALTER TABLE public.notes
DROP CONSTRAINT IF EXISTS notes_author_id_fkey,
DROP CONSTRAINT IF EXISTS notes_recipient_id_fkey;

ALTER TABLE public.notes
ADD CONSTRAINT notes_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE CASCADE,
ADD CONSTRAINT notes_recipient_id_fkey 
  FOREIGN KEY (recipient_id) 
  REFERENCES public.profiles(user_id) 
  ON DELETE SET NULL;