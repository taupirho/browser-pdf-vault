-- Create table for PDF protection history
CREATE TABLE public.pdf_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  original_size_bytes INTEGER NOT NULL,
  protected_size_bytes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries by user
CREATE INDEX idx_pdf_history_user_id ON public.pdf_history(user_id);
CREATE INDEX idx_pdf_history_created_at ON public.pdf_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.pdf_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own history
CREATE POLICY "Users can view their own PDF history"
ON public.pdf_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF history"
ON public.pdf_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF history"
ON public.pdf_history
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- No one can update history (immutable records)
CREATE POLICY "No one can update PDF history"
ON public.pdf_history
FOR UPDATE
USING (false);