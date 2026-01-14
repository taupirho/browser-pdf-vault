-- Fix High: Restrict profile UPDATE to only allow safe fields
-- Users should NOT be able to update subscription_tier, max_daily_files, max_file_size_kb, etc.

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a new restrictive UPDATE policy
-- Users can only update: company_name, custom_password_settings
CREATE POLICY "Users can update their own profile (restricted fields)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);

-- Create a trigger to enforce allowed fields only
CREATE OR REPLACE FUNCTION public.enforce_profile_update_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from changing protected fields
  -- Only allow changes to: company_name, custom_password_settings, updated_at
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Cannot modify subscription_tier';
  END IF;
  
  IF NEW.max_daily_files IS DISTINCT FROM OLD.max_daily_files THEN
    RAISE EXCEPTION 'Cannot modify max_daily_files';
  END IF;
  
  IF NEW.max_file_size_kb IS DISTINCT FROM OLD.max_file_size_kb THEN
    RAISE EXCEPTION 'Cannot modify max_file_size_kb';
  END IF;
  
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'Cannot modify referral_code';
  END IF;
  
  IF NEW.bonus_daily_files IS DISTINCT FROM OLD.bonus_daily_files THEN
    RAISE EXCEPTION 'Cannot modify bonus_daily_files';
  END IF;
  
  IF NEW.bonus_expires_at IS DISTINCT FROM OLD.bonus_expires_at THEN
    RAISE EXCEPTION 'Cannot modify bonus_expires_at';
  END IF;
  
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify user_id';
  END IF;
  
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Cannot modify email';
  END IF;
  
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify id';
  END IF;
  
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce restrictions (only for non-service role updates)
DROP TRIGGER IF EXISTS enforce_profile_update_restrictions_trigger ON public.profiles;
CREATE TRIGGER enforce_profile_update_restrictions_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (current_setting('role', true) != 'service_role')
EXECUTE FUNCTION public.enforce_profile_update_restrictions();

-- Fix High: Remove plaintext password storage from pdf_history
-- Drop the password column entirely - passwords should never be stored
ALTER TABLE public.pdf_history DROP COLUMN IF EXISTS password;