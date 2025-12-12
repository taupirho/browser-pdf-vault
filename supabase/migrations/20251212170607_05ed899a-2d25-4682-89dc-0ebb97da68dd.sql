-- Create referrals table to track referral relationships and rewards
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, converted, expired
  reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  converted_at timestamp with time zone,
  UNIQUE(referred_id),
  UNIQUE(referrer_id, referred_id)
);

-- Add referral_code column to profiles for each user's unique code
ALTER TABLE public.profiles 
ADD COLUMN referral_code text UNIQUE,
ADD COLUMN bonus_daily_files integer NOT NULL DEFAULT 0,
ADD COLUMN bonus_expires_at timestamp with time zone;

-- Create index for referral code lookups
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referral records"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "No one can update referrals"
ON public.referrals
FOR UPDATE
USING (false);

CREATE POLICY "No one can delete referrals"
ON public.referrals
FOR DELETE
USING (false);

-- Create email_automations table to track sent emails
CREATE TABLE public.email_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_type text NOT NULL, -- 'upgrade_day_3', 'upgrade_day_7', 'upgrade_day_14'
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, email_type)
);

-- Enable RLS on email_automations
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_automations (admin only via service role)
CREATE POLICY "No public access to email automations"
ON public.email_automations
FOR ALL
USING (false);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a unique 8-character code
  NEW.referral_code = upper(substr(md5(random()::text || NEW.user_id::text), 1, 8));
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code on profile creation
CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = upper(substr(md5(random()::text || user_id::text), 1, 8))
WHERE referral_code IS NULL;