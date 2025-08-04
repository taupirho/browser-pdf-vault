-- Fix security warnings by updating functions with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, subscription_tier, max_daily_files, max_file_size_kb)
  VALUES (
    NEW.id, 
    NEW.email,
    'free',
    2,
    250
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset usage count if it's a new day
  IF NEW.last_usage_reset < CURRENT_DATE THEN
    NEW.daily_usage_count = 0;
    NEW.last_usage_reset = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;