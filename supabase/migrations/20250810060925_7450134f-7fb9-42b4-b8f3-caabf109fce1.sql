-- Create DSAR requests table
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  request_type text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'received'
);

-- Enable RLS and add policies
ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a DSAR request (public form)
CREATE POLICY IF NOT EXISTS "Anyone can create DSAR request"
ON public.dsar_requests
FOR INSERT
WITH CHECK (true);

-- No one can read/update/delete DSAR requests via the public API
CREATE POLICY IF NOT EXISTS "No one can select DSAR requests"
ON public.dsar_requests
FOR SELECT
USING (false);

CREATE POLICY IF NOT EXISTS "No one can update DSAR requests"
ON public.dsar_requests
FOR UPDATE
USING (false);

CREATE POLICY IF NOT EXISTS "No one can delete DSAR requests"
ON public.dsar_requests
FOR DELETE
USING (false);

-- Minimal audit logs for profile updates
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  action text NOT NULL,
  row_id uuid,
  user_id uuid,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts (via triggers); block reads/updates/deletes
CREATE POLICY IF NOT EXISTS "Allow insert on audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "No one can select audit logs"
ON public.audit_logs
FOR SELECT
USING (false);

CREATE POLICY IF NOT EXISTS "No one can update audit logs"
ON public.audit_logs
FOR UPDATE
USING (false);

CREATE POLICY IF NOT EXISTS "No one can delete audit logs"
ON public.audit_logs
FOR DELETE
USING (false);

-- Trigger to log inserts/updates on profiles
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.audit_logs(table_name, action, row_id, user_id, changes)
  VALUES (
    'profiles',
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_audit_ins ON public.profiles;
CREATE TRIGGER profiles_audit_ins
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_changes();

DROP TRIGGER IF EXISTS profiles_audit_upd ON public.profiles;
CREATE TRIGGER profiles_audit_upd
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_changes();