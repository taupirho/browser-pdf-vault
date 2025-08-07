-- Update the subscription limits function to allow 10MB for free tier
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set limits based on subscription tier
  CASE NEW.subscription_tier
    WHEN 'free' THEN
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 10240; -- 10MB in KB
    WHEN 'starter' THEN
      NEW.max_daily_files = 10;
      NEW.max_file_size_kb = 10240; -- Keep same as free for now
    WHEN 'pro' THEN
      NEW.max_daily_files = 50;
      NEW.max_file_size_kb = 51200; -- 50MB in KB
    ELSE
      -- Default to free tier limits for unknown tiers
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 10240;
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- Update existing free tier users to have the new 10MB limit
UPDATE public.profiles 
SET max_file_size_kb = 10240 
WHERE subscription_tier = 'free';