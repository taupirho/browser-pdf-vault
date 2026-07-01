
-- 1. Attach missing triggers on profiles for privilege enforcement
DROP TRIGGER IF EXISTS enforce_profile_update_restrictions_trg ON public.profiles;
CREATE TRIGGER enforce_profile_update_restrictions_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_update_restrictions();

DROP TRIGGER IF EXISTS enforce_password_settings_by_tier_trg ON public.profiles;
CREATE TRIGGER enforce_password_settings_by_tier_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_password_settings_by_tier();

DROP TRIGGER IF EXISTS reset_daily_usage_trg ON public.profiles;
CREATE TRIGGER reset_daily_usage_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.reset_daily_usage();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tighten DSAR insert policy (no more USING/CHECK true)
DROP POLICY IF EXISTS "Anyone can create DSAR request" ON public.dsar_requests;
CREATE POLICY "Anyone can create DSAR request"
ON public.dsar_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 3 AND 320
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND request_type IN ('access','deletion','correction','portability','opt_out')
  AND (details IS NULL OR length(details) <= 5000)
  AND (name IS NULL OR length(name) <= 200)
);

-- 3. Revoke EXECUTE on internal SECURITY DEFINER trigger functions
REVOKE EXECUTE ON FUNCTION public.enforce_profile_update_restrictions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_password_settings_by_tier() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_daily_usage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_profile_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_subscription_limits() FROM PUBLIC, anon, authenticated;

-- 4. Revoke SELECT (GraphQL discovery) from anon on all app tables — none require pre-login reads
REVOKE SELECT ON public.audit_logs FROM anon;
REVOKE SELECT ON public.dsar_requests FROM anon;
REVOKE SELECT ON public.email_automations FROM anon;
REVOKE SELECT ON public.pdf_history FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.referrals FROM anon;

-- Also hide backend-only tables from signed-in users' GraphQL schema
REVOKE SELECT ON public.audit_logs FROM authenticated;
REVOKE SELECT ON public.dsar_requests FROM authenticated;
REVOKE SELECT ON public.email_automations FROM authenticated;
