-- Update handle_new_user function to capture company_name from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, subscription_tier, max_daily_files, max_file_size_kb, company_name)
  VALUES (
    NEW.id, 
    NEW.email,
    'free',
    2,
    250,
    NEW.raw_user_meta_data ->> 'company_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;