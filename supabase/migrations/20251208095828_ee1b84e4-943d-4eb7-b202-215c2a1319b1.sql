-- Fix the log_profile_changes function to use SECURITY DEFINER
-- This allows the trigger to insert into audit_logs with elevated privileges
CREATE OR REPLACE FUNCTION public.log_profile_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;