-- Add custom password settings for Pro tier users
ALTER TABLE public.profiles ADD COLUMN custom_password_settings JSONB DEFAULT NULL;

-- Add comment to explain the custom password settings structure
COMMENT ON COLUMN public.profiles.custom_password_settings IS 'JSON object containing custom password configuration for Pro tier users. Structure: {"enabled": boolean, "password": string, "expires_at": timestamp}';