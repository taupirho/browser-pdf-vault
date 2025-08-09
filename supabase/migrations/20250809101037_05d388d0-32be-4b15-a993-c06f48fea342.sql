-- Restrict client-side updates to sensitive profile columns and add necessary triggers

-- 1) Column-level permissions: lock down updates to sensitive fields
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (company_name, custom_password_settings) ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;

-- 2) Triggers to keep data consistent and automatically manage timestamps/limits/usage resets
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS reset_profiles_daily_usage ON public.profiles;
CREATE TRIGGER reset_profiles_daily_usage
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.reset_daily_usage();

DROP TRIGGER IF EXISTS apply_subscription_limits_ins ON public.profiles;
CREATE TRIGGER apply_subscription_limits_ins
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_subscription_limits();

DROP TRIGGER IF EXISTS apply_subscription_limits_upd ON public.profiles;
CREATE TRIGGER apply_subscription_limits_upd
BEFORE UPDATE OF subscription_tier ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_subscription_limits();

-- 3) Harden function search_path to avoid hijacking via mutable search_path
ALTER FUNCTION public.update_subscription_limits() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.reset_daily_usage() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;