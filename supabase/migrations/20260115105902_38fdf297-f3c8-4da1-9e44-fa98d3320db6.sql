-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "No direct SELECT on pdf_history" ON public.pdf_history;

-- Re-create the original SELECT policy allowing users to view their own history
CREATE POLICY "Users can view their own PDF history"
ON public.pdf_history
FOR SELECT
USING (auth.uid() = user_id);