-- Add account type fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'basic' 
  CHECK (account_type IN ('basic', 'professional'));
  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_enabled_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_onboarding_completed BOOLEAN DEFAULT false;

-- Set all existing users to 'professional' to preserve their data
UPDATE profiles SET 
  account_type = 'professional',
  professional_enabled_at = created_at,
  professional_onboarding_completed = true
WHERE account_type IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);