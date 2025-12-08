-- Add password column to pdf_history table
ALTER TABLE public.pdf_history
ADD COLUMN password text;