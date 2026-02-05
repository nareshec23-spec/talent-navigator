-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('hr', 'candidate');

-- Create enum for employment types
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- Create enum for location types
CREATE TYPE public.location_type AS ENUM ('remote', 'india', 'abroad', 'hybrid');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('applied', 'reviewing', 'shortlisted', 'rejected', 'hired');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'candidate',
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    bio TEXT,
    resume_url TEXT,
    skills TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    company_name TEXT,
    company_position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hr_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    employment_type employment_type NOT NULL DEFAULT 'full_time',
    location_type location_type NOT NULL DEFAULT 'remote',
    location_details TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    required_skills TEXT[] DEFAULT '{}',
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status application_status DEFAULT 'applied' NOT NULL,
    cover_letter TEXT,
    hr_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(job_id, candidate_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE user_id = user_uuid
$$;

-- Profile policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "HR can view all profiles"
ON public.profiles FOR SELECT
USING (public.get_user_role(auth.uid()) = 'hr');

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Everyone can view active jobs"
ON public.jobs FOR SELECT
USING (is_active = TRUE OR hr_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "HR can create jobs"
ON public.jobs FOR INSERT
WITH CHECK (
    hr_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'hr')
);

CREATE POLICY "HR can update their own jobs"
ON public.jobs FOR UPDATE
USING (hr_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "HR can delete their own jobs"
ON public.jobs FOR DELETE
USING (hr_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Applications policies
CREATE POLICY "Candidates can view their own applications"
ON public.applications FOR SELECT
USING (candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "HR can view applications for their jobs"
ON public.applications FOR SELECT
USING (job_id IN (SELECT id FROM public.jobs WHERE hr_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Candidates can create applications"
ON public.applications FOR INSERT
WITH CHECK (
    candidate_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid() AND role = 'candidate')
);

CREATE POLICY "HR can update applications for their jobs"
ON public.applications FOR UPDATE
USING (job_id IN (SELECT id FROM public.jobs WHERE hr_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'candidate')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();