-- Restore password column to pdf_history
-- RLS already ensures users can only see their own records
ALTER TABLE public.pdf_history ADD COLUMN IF NOT EXISTS password text;