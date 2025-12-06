-- Fix: Block direct inserts to audit_logs table
-- Audit inserts should only happen through the log_profile_changes() trigger

-- Drop the current permissive INSERT policy
DROP POLICY IF EXISTS "Allow insert on audit logs" ON audit_logs;

-- Create a restrictive INSERT policy that blocks all direct inserts
CREATE POLICY "Block direct inserts on audit logs" ON audit_logs 
FOR INSERT 
WITH CHECK (false);