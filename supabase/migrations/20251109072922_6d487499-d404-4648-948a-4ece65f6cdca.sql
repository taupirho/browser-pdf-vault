-- Update the subscription limits function to set free tier to 1 PDF per day
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set limits based on subscription tier
  CASE NEW.subscription_tier
    WHEN 'free' THEN
      NEW.max_daily_files = 1;
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
      NEW.max_daily_files = 1;
      NEW.max_file_size_kb = 250;
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- Update the new user handler to set free tier to 1 PDF per day
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, subscription_tier, max_daily_files, max_file_size_kb, company_name)
  VALUES (
    NEW.id, 
    NEW.email,
    'free',
    1,
    250,
    NEW.raw_user_meta_data ->> 'company_name'
  );
  RETURN NEW;
END;
$function$;