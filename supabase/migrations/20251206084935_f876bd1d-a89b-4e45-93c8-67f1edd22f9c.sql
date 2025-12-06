-- Add explicit DELETE policy to profiles table to prevent data deletion
CREATE POLICY "No one can delete profiles" ON profiles 
FOR DELETE 
USING (false);