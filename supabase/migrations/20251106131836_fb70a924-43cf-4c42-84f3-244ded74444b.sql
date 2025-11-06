-- Update the subscription limits trigger to handle 'ltd' tier with Pro-level capabilities
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set limits based on subscription tier
  CASE NEW.subscription_tier
    WHEN 'free' THEN
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 250;
    WHEN 'starter' THEN
      NEW.max_daily_files = 10;
      NEW.max_file_size_kb = 1024; -- 1MB
    WHEN 'pro' THEN
      NEW.max_daily_files = 50;
      NEW.max_file_size_kb = 10240; -- 10MB
    WHEN 'ltd' THEN
      NEW.max_daily_files = 50;
      NEW.max_file_size_kb = 10240; -- 10MB (same as Pro)
    ELSE
      -- Default to free tier limits for unknown tiers
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 250;
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- Update the enforce_password_settings_by_tier function to allow custom passwords for LTD tier
CREATE OR REPLACE FUNCTION public.enforce_password_settings_by_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.subscription_tier NOT IN ('pro', 'ltd') THEN
    NEW.custom_password_settings = NULL;
  END IF;
  RETURN NEW;
END;
$function$;