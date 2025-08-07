-- Revert the subscription limits function back to 250KB for free tier
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set limits based on subscription tier
  CASE NEW.subscription_tier
    WHEN 'free' THEN
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 250; -- Back to 250KB
    WHEN 'starter' THEN
      NEW.max_daily_files = 10;
      NEW.max_file_size_kb = 1024; -- 1MB
    WHEN 'pro' THEN
      NEW.max_daily_files = 50;
      NEW.max_file_size_kb = 10240; -- 10MB
    ELSE
      -- Default to free tier limits for unknown tiers
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 250;
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- Update existing free tier users back to 250KB limit
UPDATE public.profiles 
SET max_file_size_kb = 250 
WHERE subscription_tier = 'free';