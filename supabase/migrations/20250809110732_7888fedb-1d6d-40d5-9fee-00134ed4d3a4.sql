-- 1) Trigger function to enforce password settings only for Pro users
CREATE OR REPLACE FUNCTION public.enforce_password_settings_by_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.subscription_tier IS DISTINCT FROM 'pro' THEN
    NEW.custom_password_settings = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Create trigger on profiles table (before insert or update)
DROP TRIGGER IF EXISTS trg_enforce_password_settings_by_tier ON public.profiles;
CREATE TRIGGER trg_enforce_password_settings_by_tier
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_password_settings_by_tier();

-- 3) One-time cleanup: NULL out custom_password_settings for all non-Pro users
UPDATE public.profiles
SET custom_password_settings = NULL
WHERE subscription_tier IS DISTINCT FROM 'pro' OR subscription_tier IS NULL;