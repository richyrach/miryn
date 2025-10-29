-- Create profile for the existing user with a valid handle
INSERT INTO public.profiles (user_id, handle, display_name, account_type)
VALUES (
  '0106158a-f144-4057-95ae-7f28b74832a1',
  'temp0106158af144',
  'New User',
  'basic'
)
ON CONFLICT (user_id) DO NOTHING;