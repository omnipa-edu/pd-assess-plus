-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'supervisor', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  student_id TEXT,
  program TEXT,
  year_of_training TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create EPA assessments table
CREATE TABLE public.epa_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  epa_number TEXT NOT NULL,
  patient_demographics TEXT,
  clinical_setting TEXT,
  complexity TEXT,
  observations TEXT,
  feedback TEXT,
  rating TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct observation assessments table
CREATE TABLE public.direct_observation_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  procedure_type TEXT NOT NULL,
  clinical_context TEXT,
  performance_rating TEXT,
  technical_skills TEXT,
  professionalism TEXT,
  feedback TEXT,
  areas_for_improvement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create narrative assessments table
CREATE TABLE public.narrative_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assessment_period TEXT,
  clinical_context TEXT,
  strengths TEXT,
  areas_for_growth TEXT,
  overall_progression TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epa_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_observation_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_assessments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Supervisors and admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'supervisor') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- EPA assessments policies
CREATE POLICY "Students can view their own EPA assessments"
  ON public.epa_assessments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Supervisors can view all EPA assessments"
  ON public.epa_assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can create EPA assessments"
  ON public.epa_assessments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can update EPA assessments"
  ON public.epa_assessments FOR UPDATE
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

-- Direct observation policies
CREATE POLICY "Students can view their own direct observations"
  ON public.direct_observation_assessments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Supervisors can view all direct observations"
  ON public.direct_observation_assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can create direct observations"
  ON public.direct_observation_assessments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can update direct observations"
  ON public.direct_observation_assessments FOR UPDATE
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

-- Narrative assessments policies
CREATE POLICY "Students can view their own narrative assessments"
  ON public.narrative_assessments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Supervisors can view all narrative assessments"
  ON public.narrative_assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can create narrative assessments"
  ON public.narrative_assessments FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supervisors can update narrative assessments"
  ON public.narrative_assessments FOR UPDATE
  USING (public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epa_assessments_updated_at
  BEFORE UPDATE ON public.epa_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_observation_assessments_updated_at
  BEFORE UPDATE ON public.direct_observation_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_narrative_assessments_updated_at
  BEFORE UPDATE ON public.narrative_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();