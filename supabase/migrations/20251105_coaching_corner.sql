-- Migration: Coaching Corner feature
-- Created: 2025-11-05
-- Purpose: Add inspiring text and video content for learners and supervisors

-- Main coaching corner content table
CREATE TABLE IF NOT EXISTS public.coaching_corner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authorship and scope
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_scope TEXT NOT NULL CHECK (role_scope IN ('admin', 'supervisor')),
  
  -- Audience targeting
  audience TEXT NOT NULL CHECK (audience IN ('all', 'supervisors', 'learners')) DEFAULT 'all',
  
  -- Content
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'youtube', 'instagram')),
  body TEXT, -- For 'text' type (markdown-lite)
  video_url TEXT, -- For 'youtube' or 'instagram'
  
  -- Scheduling
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  
  -- Display options
  pinned BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_text_content CHECK (
    (content_type = 'text' AND body IS NOT NULL) OR
    (content_type IN ('youtube', 'instagram') AND video_url IS NOT NULL)
  )
);

-- Optional: Supervisor-specific scoping (show only to their assigned learners)
CREATE TABLE IF NOT EXISTS public.coaching_corner_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coaching_id UUID REFERENCES public.coaching_corner(id) ON DELETE CASCADE NOT NULL,
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coaching_id, supervisor_id)
);

-- Per-user dismissal tracking (optional)
CREATE TABLE IF NOT EXISTS public.coaching_corner_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coaching_id UUID REFERENCES public.coaching_corner(id) ON DELETE CASCADE NOT NULL,
  dismissed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coaching_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coaching_active ON public.coaching_corner(is_active, start_at, end_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coaching_pinned ON public.coaching_corner(pinned) WHERE pinned = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_coaching_audience ON public.coaching_corner(audience, is_active);
CREATE INDEX IF NOT EXISTS idx_coaching_scope_supervisor ON public.coaching_corner_scope(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_dismissals_user ON public.coaching_corner_dismissals(user_id);

-- Enable RLS
ALTER TABLE public.coaching_corner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_corner_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_corner_dismissals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coaching_corner

-- Anyone can view active coaching items in their scope
CREATE POLICY "Users can view active coaching"
  ON public.coaching_corner FOR SELECT
  USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= NOW())
    AND (end_at IS NULL OR end_at >= NOW())
  );

-- Admins can create coaching items with admin scope
CREATE POLICY "Admins can insert admin-scoped coaching"
  ON public.coaching_corner FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND role_scope = 'admin'
  );

-- Supervisors can create coaching items with supervisor scope
CREATE POLICY "Supervisors can insert supervisor-scoped coaching"
  ON public.coaching_corner FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'supervisor')
    AND role_scope = 'supervisor'
    AND created_by = auth.uid()
  );

-- Users can update their own coaching items
CREATE POLICY "Users can update their own coaching"
  ON public.coaching_corner FOR UPDATE
  USING (created_by = auth.uid());

-- Users can delete their own coaching items
CREATE POLICY "Users can delete their own coaching"
  ON public.coaching_corner FOR DELETE
  USING (created_by = auth.uid());

-- Admins can manage all coaching items
CREATE POLICY "Admins can manage all coaching"
  ON public.coaching_corner FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for coaching_corner_scope

CREATE POLICY "Users can view coaching scope"
  ON public.coaching_corner_scope FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage coaching scope"
  ON public.coaching_corner_scope FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.coaching_corner
      WHERE id = coaching_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for coaching_corner_dismissals

CREATE POLICY "Users can view their own dismissals"
  ON public.coaching_corner_dismissals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own dismissals"
  ON public.coaching_corner_dismissals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own dismissals"
  ON public.coaching_corner_dismissals FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_coaching_corner_updated_at
  BEFORE UPDATE ON public.coaching_corner
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one pinned item per role scope
CREATE OR REPLACE FUNCTION public.unpin_other_coaching()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pinned = TRUE THEN
    -- Unpin other items with the same role_scope
    UPDATE public.coaching_corner
    SET pinned = FALSE
    WHERE id != NEW.id
      AND pinned = TRUE
      AND role_scope = NEW.role_scope
      AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-unpin other items when pinning a new one
CREATE TRIGGER ensure_single_pinned
  BEFORE INSERT OR UPDATE OF pinned ON public.coaching_corner
  FOR EACH ROW
  WHEN (NEW.pinned = TRUE)
  EXECUTE FUNCTION public.unpin_other_coaching();

-- Grant permissions
GRANT SELECT ON public.coaching_corner TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coaching_corner TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.coaching_corner_scope TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.coaching_corner_dismissals TO authenticated;

-- Comments
COMMENT ON TABLE public.coaching_corner IS 'Stores coaching content (text or video) shown to users';
COMMENT ON COLUMN public.coaching_corner.role_scope IS 'Who created it: admin (org-wide) or supervisor (their scope)';
COMMENT ON COLUMN public.coaching_corner.audience IS 'Who can see it: all, supervisors only, or learners only';
COMMENT ON COLUMN public.coaching_corner.pinned IS 'If true, this item appears first (only one pinned per role_scope)';
COMMENT ON TABLE public.coaching_corner_scope IS 'Optional: limit supervisor coaching to specific supervisors';
COMMENT ON TABLE public.coaching_corner_dismissals IS 'Track which users dismissed which coaching items';

