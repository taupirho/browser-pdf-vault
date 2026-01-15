-- Create a view that excludes the password column for safe SELECT access
CREATE VIEW public.pdf_history_safe
WITH (security_invoker=on) AS
  SELECT id, user_id, file_name, original_size_bytes, protected_size_bytes, created_at
  FROM public.pdf_history;

-- Drop existing SELECT policy and replace with one that denies direct access
DROP POLICY IF EXISTS "Users can view their own PDF history" ON public.pdf_history;

CREATE POLICY "No direct SELECT on pdf_history" 
  ON public.pdf_history 
  FOR SELECT 
  USING (false);