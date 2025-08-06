-- Update profiles table to set proper limits for each subscription tier
-- This ensures starter and pro tiers have appropriate daily file and size limits

-- Update starter tier limits (if any exist)
UPDATE public.profiles 
SET 
  max_daily_files = 10,
  max_file_size_kb = 1024,
  updated_at = now()
WHERE subscription_tier = 'starter';

-- Update pro tier limits (if any exist)  
UPDATE public.profiles
SET 
  max_daily_files = 50,
  max_file_size_kb = 10240,
  updated_at = now()
WHERE subscription_tier = 'pro';

-- Create a function to automatically set limits when subscription tier changes
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set limits based on subscription tier
  CASE NEW.subscription_tier
    WHEN 'free' THEN
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 250;
    WHEN 'starter' THEN
      NEW.max_daily_files = 10;
      NEW.max_file_size_kb = 1024;
    WHEN 'pro' THEN
      NEW.max_daily_files = 50;
      NEW.max_file_size_kb = 10240;
    ELSE
      -- Default to free tier limits for unknown tiers
      NEW.max_daily_files = 2;
      NEW.max_file_size_kb = 250;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update limits when subscription tier changes
DROP TRIGGER IF EXISTS trigger_update_subscription_limits ON public.profiles;
CREATE TRIGGER trigger_update_subscription_limits
  BEFORE INSERT OR UPDATE OF subscription_tier ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_limits();