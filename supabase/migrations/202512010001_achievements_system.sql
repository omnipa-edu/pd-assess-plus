-- Migration: Achievements and Badges System
-- Created: 2025-12-01
-- Purpose: Track user achievements, badges, and milestones

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

-- Achievement category enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_category') THEN
    CREATE TYPE achievement_category AS ENUM (
      'first_steps',
      'consistency',
      'quality',
      'milestone',
      'engagement',
      'excellence'
    );
  END IF;
END $$;

-- Achievement rarity enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_rarity') THEN
    CREATE TYPE achievement_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
  END IF;
END $$;

-- ============================================================================
-- ACHIEVEMENTS DEFINITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Achievement details
  code TEXT NOT NULL UNIQUE, -- e.g., 'first_assessment', 'streak_7_days'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category achievement_category NOT NULL,
  rarity achievement_rarity DEFAULT 'common',
  
  -- Visual
  icon TEXT, -- Icon name or emoji
  color TEXT, -- Hex color code
  
  -- Criteria (stored as JSONB for flexibility)
  criteria JSONB NOT NULL, -- e.g., {"type": "count", "target": 10, "entity": "assessments"}
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT achievement_definitions_name_check CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT achievement_definitions_description_check CHECK (char_length(description) >= 1 AND char_length(description) <= 500),
  CONSTRAINT achievement_definitions_code_check CHECK (char_length(code) >= 1 AND char_length(code) <= 50)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_code ON public.achievement_definitions(code);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON public.achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_active ON public.achievement_definitions(is_active) WHERE is_active = true;

-- ============================================================================
-- USER ACHIEVEMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievement_definitions(id) ON DELETE CASCADE NOT NULL,
  
  -- Unlock details
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Progress tracking (for multi-level achievements)
  progress JSONB DEFAULT '{}'::JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent - drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;
CREATE POLICY "System can insert achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (true); -- Will be restricted by service role in practice

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);

-- ============================================================================
-- ACHIEVEMENT PROGRESS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievement_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_code TEXT NOT NULL, -- Reference to achievement_definitions.code
  
  -- Progress tracking
  current_value INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  
  -- Metadata
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_code)
);

-- Enable RLS
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (idempotent - drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own progress" ON public.achievement_progress;
CREATE POLICY "Users can view their own progress"
  ON public.achievement_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can manage progress" ON public.achievement_progress;
CREATE POLICY "System can manage progress"
  ON public.achievement_progress FOR ALL
  WITH CHECK (true); -- Will be restricted by service role in practice

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_id ON public.achievement_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_achievement_code ON public.achievement_progress(achievement_code);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to unlock an achievement
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  p_user_id UUID,
  p_achievement_code TEXT
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_id UUID;
  v_unlock_id UUID;
BEGIN
  -- Get achievement ID
  SELECT id INTO v_achievement_id
  FROM public.achievement_definitions
  WHERE code = p_achievement_code
    AND is_active = true;
  
  IF v_achievement_id IS NULL THEN
    RAISE EXCEPTION 'Achievement not found: %', p_achievement_code;
  END IF;
  
  -- Insert achievement (ON CONFLICT to handle duplicates)
  INSERT INTO public.user_achievements (user_id, achievement_id)
  VALUES (p_user_id, v_achievement_id)
  ON CONFLICT (user_id, achievement_id) DO NOTHING
  RETURNING id INTO v_unlock_id;
  
  -- If already unlocked, return existing ID
  IF v_unlock_id IS NULL THEN
    SELECT id INTO v_unlock_id
    FROM public.user_achievements
    WHERE user_id = p_user_id
      AND achievement_id = v_achievement_id;
  END IF;
  
  RETURN v_unlock_id;
END;
$$;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION public.update_achievement_progress(
  p_user_id UUID,
  p_achievement_code TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_def RECORD;
  v_current_value INTEGER;
  v_target_value INTEGER;
  v_unlocked BOOLEAN := false;
BEGIN
  -- Get achievement definition
  SELECT id, criteria INTO v_achievement_def
  FROM public.achievement_definitions
  WHERE code = p_achievement_code
    AND is_active = true;
  
  IF v_achievement_def.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Extract target value from criteria
  v_target_value := (v_achievement_def.criteria->>'target')::INTEGER;
  
  -- Update or insert progress
  INSERT INTO public.achievement_progress (
    user_id,
    achievement_code,
    current_value,
    target_value
  )
  VALUES (
    p_user_id,
    p_achievement_code,
    p_increment,
    v_target_value
  )
  ON CONFLICT (user_id, achievement_code)
  DO UPDATE SET
    current_value = achievement_progress.current_value + p_increment,
    last_updated_at = NOW()
  RETURNING current_value INTO v_current_value;
  
  -- Check if achievement should be unlocked
  IF v_current_value >= v_target_value THEN
    PERFORM public.unlock_achievement(p_user_id, p_achievement_code);
    v_unlocked := true;
  END IF;
  
  RETURN v_unlocked;
END;
$$;

-- Function to get user achievements
CREATE OR REPLACE FUNCTION public.get_user_achievements(p_user_id UUID)
RETURNS TABLE (
  achievement_id UUID,
  code TEXT,
  name TEXT,
  description TEXT,
  category achievement_category,
  rarity achievement_rarity,
  icon TEXT,
  color TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ad.id,
    ad.code,
    ad.name,
    ad.description,
    ad.category,
    ad.rarity,
    ad.icon,
    ad.color,
    ua.unlocked_at
  FROM public.achievement_definitions ad
  LEFT JOIN public.user_achievements ua ON ad.id = ua.achievement_id AND ua.user_id = p_user_id
  WHERE ad.is_active = true
  ORDER BY 
    CASE WHEN ua.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
    ad.category,
    ad.rarity,
    ad.name;
$$;

-- Grant permissions
GRANT SELECT ON public.achievement_definitions TO authenticated;
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.achievement_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_achievement TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_achievement_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_achievements TO authenticated;

-- Comments
COMMENT ON TABLE public.achievement_definitions IS 'Definitions of all available achievements';
COMMENT ON TABLE public.user_achievements IS 'Achievements unlocked by users';
COMMENT ON TABLE public.achievement_progress IS 'Progress tracking for achievements';
COMMENT ON FUNCTION public.unlock_achievement IS 'Unlocks an achievement for a user';
COMMENT ON FUNCTION public.update_achievement_progress IS 'Updates progress toward an achievement and unlocks if target reached';
COMMENT ON FUNCTION public.get_user_achievements IS 'Gets all achievements with unlock status for a user';

-- ============================================================================
-- SEED DATA: Initial Achievement Definitions
-- ============================================================================

INSERT INTO public.achievement_definitions (code, name, description, category, rarity, icon, color, criteria) VALUES
-- First Steps
('first_assessment', 'First Steps', 'Complete your first assessment', 'first_steps', 'common', '🎯', '#3B82F6', '{"type": "count", "target": 1, "entity": "assessments"}'),
('profile_complete', 'Profile Complete', 'Complete your profile information', 'first_steps', 'common', '👤', '#10B981', '{"type": "profile_complete"}'),

-- Consistency
('streak_3_days', 'Getting Started', 'Complete assessments 3 days in a row', 'consistency', 'common', '🔥', '#F59E0B', '{"type": "streak", "target": 3}'),
('streak_7_days', 'Week Warrior', 'Complete assessments 7 days in a row', 'consistency', 'uncommon', '🔥', '#EF4444', '{"type": "streak", "target": 7}'),
('streak_30_days', 'Consistency Master', 'Complete assessments 30 days in a row', 'consistency', 'rare', '🔥', '#8B5CF6', '{"type": "streak", "target": 30}'),

-- Milestones
('assessments_10', 'Getting the Hang of It', 'Complete 10 assessments', 'milestone', 'common', '📊', '#3B82F6', '{"type": "count", "target": 10, "entity": "assessments"}'),
('assessments_25', 'Making Progress', 'Complete 25 assessments', 'milestone', 'uncommon', '📈', '#10B981', '{"type": "count", "target": 25, "entity": "assessments"}'),
('assessments_50', 'Assessment Pro', 'Complete 50 assessments', 'milestone', 'rare', '🏆', '#F59E0B', '{"type": "count", "target": 50, "entity": "assessments"}'),
('assessments_100', 'Century Club', 'Complete 100 assessments', 'milestone', 'epic', '💯', '#EF4444', '{"type": "count", "target": 100, "entity": "assessments"}'),

-- Quality
('smart_feedback_10', 'Smart Feedback User', 'Use Smart Feedback Assistant 10 times', 'quality', 'uncommon', '✨', '#8B5CF6', '{"type": "count", "target": 10, "entity": "smart_feedback_uses"}'),
('high_quality_feedback', 'Quality Feedback', 'Receive high-quality feedback rating', 'quality', 'rare', '⭐', '#F59E0B', '{"type": "quality", "target": 4, "entity": "feedback_quality"}'),

-- Engagement
('weekly_active', 'Weekly Active', 'Be active for 4 weeks in a row', 'engagement', 'uncommon', '📅', '#10B981', '{"type": "weekly_active", "target": 4}'),
('coaching_viewer', 'Learning Enthusiast', 'View 10 coaching corner items', 'engagement', 'common', '💡', '#3B82F6', '{"type": "count", "target": 10, "entity": "coaching_views"}'),

-- Excellence
('oscore_improvement', 'On the Rise', 'Improve your O-score by 0.5 points', 'excellence', 'uncommon', '📈', '#10B981', '{"type": "oscore_improvement", "target": 0.5}'),
('top_performer', 'Top Performer', 'Achieve average O-score of 4.5+', 'excellence', 'rare', '🌟', '#F59E0B', '{"type": "oscore_average", "target": 4.5}')
ON CONFLICT (code) DO NOTHING;

