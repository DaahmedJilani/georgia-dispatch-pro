-- Add username column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create unique index for username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) 
WHERE username IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN profiles.username IS 'Unique username for internal staff login (Sales, Dispatch, Treasury). Drivers use email login.';