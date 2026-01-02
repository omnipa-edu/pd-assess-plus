-- Migration: Goals and Gamification System
-- Created: 2025-12-02
-- Purpose: User goals, streak tracking, and enhanced gamification

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

-- Goal type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_type') THEN
    CREATE TYPE goal_type AS ENUM (
      'assessment_count',
      'oscore_target',
      'streak_days',
      'epa_readiness',
      'feedback_quality',
      'weekly_active',
      'custom'
    );
  END IF;
END $$;

-- Goal status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_status') THEN
    CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
  END IF;
END $$;

-- Goal period enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_period') THEN
    CREATE TYPE goal_period AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom');
  END IF;
END $$;

-- ============================================================================
-- GOALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Goal details
  title TEXT NOT NULL,
  description TEXT,
  type goal_type NOT NULL,
  status goal_status DEFAULT 'active',
  
  -- Target and progress
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT, -- e.g., 'assessments', 'days', 'points'
  
  -- Time period
  period goal_period,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB, -- For type-specific data (e.g., epa_code for epa_readiness)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT goals_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT goals_target_check CHECK (target_value > 0),
  CONSTRAINT goals_date_check CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent - drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
CREATE POLICY "Users can view their own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
CREATE POLICY "Users can insert their own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
CREATE POLICY "Users can update their own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
CREATE POLICY "Users can delete their own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON public.goals(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_goals_type ON public.goals(type);

-- ============================================================================
-- STREAK TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Streak details
  streak_type TEXT NOT NULL, -- 'assessment', 'login', 'feedback', etc.
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  -- Tracking
  last_activity_date DATE,
  streak_start_date DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, streak_type)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent - drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own streaks" ON public.user_streaks;
CREATE POLICY "Users can insert their own streaks"
  ON public.user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;
CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON public.user_streaks(streak_type);

-- ============================================================================
-- ACTIVITY LOG TABLE (for streak calculation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'assessment', 'login', 'feedback', etc.
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, activity_type, activity_date)
);

-- Enable RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent - drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity_log;
CREATE POLICY "Users can view their own activity"
  ON public.user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity" ON public.user_activity_log;
CREATE POLICY "System can insert activity"
  ON public.user_activity_log FOR INSERT
  WITH CHECK (true); -- Will be restricted by service role in practice

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_date ON public.user_activity_log(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type_date ON public.user_activity_log(user_id, activity_type, activity_date);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update goal progress
CREATE OR REPLACE FUNCTION public.update_goal_progress(
  p_goal_id UUID,
  p_increment NUMERIC DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal RECORD;
  v_completed BOOLEAN := false;
BEGIN
  -- Get goal
  SELECT * INTO v_goal
  FROM public.goals
  WHERE id = p_goal_id
    AND user_id = auth.uid()
    AND status = 'active';
  
  IF v_goal.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update progress
  UPDATE public.goals
  SET 
    current_value = LEAST(current_value + p_increment, target_value),
    updated_at = NOW()
  WHERE id = p_goal_id;
  
  -- Check if completed
  SELECT (current_value >= target_value) INTO v_completed
  FROM public.goals
  WHERE id = p_goal_id;
  
  IF v_completed THEN
    UPDATE public.goals
    SET 
      status = 'completed',
      completed_at = NOW()
    WHERE id = p_goal_id;
  END IF;
  
  RETURN v_completed;
END;
$$;

-- Function to log activity and update streaks
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT
)
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_streak RECORD;
  v_new_streak INTEGER;
BEGIN
  -- Insert or ignore activity log
  INSERT INTO public.user_activity_log (user_id, activity_type, activity_date)
  VALUES (p_user_id, p_activity_type, v_today)
  ON CONFLICT (user_id, activity_type, activity_date) DO NOTHING;
  
  -- Get or create streak record
  INSERT INTO public.user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
  VALUES (p_user_id, p_activity_type, 1, 1, v_today, v_today)
  ON CONFLICT (user_id, streak_type)
  DO UPDATE SET
    last_activity_date = v_today,
    updated_at = NOW();
  
  -- Get current streak
  SELECT * INTO v_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id
    AND streak_type = p_activity_type;
  
  -- Check if yesterday had activity (continuing streak)
  IF EXISTS (
    SELECT 1 FROM public.user_activity_log
    WHERE user_id = p_user_id
      AND activity_type = p_activity_type
      AND activity_date = v_yesterday
  ) THEN
    -- Continue streak
    v_new_streak := v_streak.current_streak + 1;
  ELSE
    -- Check if streak was broken (last activity was more than 1 day ago)
    IF v_streak.last_activity_date < v_yesterday THEN
      -- Reset streak
      v_new_streak := 1;
      UPDATE public.user_streaks
      SET streak_start_date = v_today
      WHERE user_id = p_user_id AND streak_type = p_activity_type;
    ELSE
      -- Continue streak (same day activity)
      v_new_streak := v_streak.current_streak;
    END IF;
  END IF;
  
  -- Update streak
  UPDATE public.user_streaks
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_activity_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id AND streak_type = p_activity_type;
  
  RETURN v_new_streak;
END;
$$;

-- Function to get user's current streak
CREATE OR REPLACE FUNCTION public.get_user_streak(
  p_user_id UUID,
  p_streak_type TEXT DEFAULT 'assessment'
)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(current_streak, 0)::INTEGER
  FROM public.user_streaks
  WHERE user_id = p_user_id
    AND streak_type = p_streak_type;
$$;

-- Function to get goal progress percentage
CREATE OR REPLACE FUNCTION public.get_goal_progress(p_goal_id UUID)
RETURNS NUMERIC
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN target_value > 0 THEN (current_value / target_value * 100)
      ELSE 0
    END
  FROM public.goals
  WHERE id = p_goal_id
    AND user_id = auth.uid();
$$;

-- Create triggers for updated_at (idempotent)
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_streaks TO authenticated;
GRANT SELECT, INSERT ON public.user_activity_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_goal_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_streak TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_goal_progress TO authenticated;

-- Comments
COMMENT ON TABLE public.goals IS 'User-defined goals for tracking progress';
COMMENT ON TABLE public.user_streaks IS 'Tracks user streaks for various activity types';
COMMENT ON TABLE public.user_activity_log IS 'Daily activity log for streak calculation';
COMMENT ON FUNCTION public.update_goal_progress IS 'Updates goal progress and marks as completed if target reached';
COMMENT ON FUNCTION public.log_user_activity IS 'Logs user activity and updates streak counters';
COMMENT ON FUNCTION public.get_user_streak IS 'Returns current streak for a user and activity type';
COMMENT ON FUNCTION public.get_goal_progress IS 'Returns goal progress as percentage';

