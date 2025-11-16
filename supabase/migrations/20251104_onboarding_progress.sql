-- Migration: Add onboarding and progress tracking
-- Created: 2025-11-04
-- Purpose: Track user onboarding completion and dismissible UI state

-- Create profile_progress table for onboarding tracking
CREATE TABLE public.profile_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Onboarding checklist completion
  onboarding_dismissed BOOLEAN DEFAULT FALSE,
  completed_tasks JSONB DEFAULT '[]'::JSONB,
  
  -- First-time experience tracking
  first_login_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Empty state interactions
  dismissed_empty_states JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profile_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
  ON public.profile_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.profile_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.profile_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profile_progress_updated_at
  BEFORE UPDATE ON public.profile_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize progress on first login
CREATE OR REPLACE FUNCTION public.initialize_user_progress()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create progress record if it doesn't exist
  INSERT INTO public.profile_progress (user_id, first_login_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-initialize progress on user creation
CREATE TRIGGER on_user_progress_init
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_progress();

-- Create indexes for performance
CREATE INDEX idx_profile_progress_user_id ON public.profile_progress(user_id);
CREATE INDEX idx_profile_progress_onboarding_dismissed ON public.profile_progress(onboarding_dismissed);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profile_progress TO authenticated;

COMMENT ON TABLE public.profile_progress IS 'Tracks user onboarding completion and UI state preferences';
COMMENT ON COLUMN public.profile_progress.completed_tasks IS 'Array of task IDs that user has completed in onboarding checklist';
COMMENT ON COLUMN public.profile_progress.dismissed_empty_states IS 'Array of empty state IDs that user has dismissed';



