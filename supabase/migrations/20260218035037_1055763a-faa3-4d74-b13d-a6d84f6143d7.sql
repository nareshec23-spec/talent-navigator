
-- Add profile URL fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leetcode_url text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url text DEFAULT NULL;

-- Add required profile URL flags to jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS require_linkedin boolean DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS require_leetcode boolean DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS require_github boolean DEFAULT false;
