-- Grant permissions to authenticated users for the profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Grant select to anon (for public profile viewing if needed, though RLS will restrict)
GRANT SELECT ON public.profiles TO anon;