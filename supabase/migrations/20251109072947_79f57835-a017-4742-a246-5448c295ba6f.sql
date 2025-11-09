-- Update existing free tier users to 1 PDF per day
UPDATE profiles 
SET max_daily_files = 1 
WHERE subscription_tier = 'free';