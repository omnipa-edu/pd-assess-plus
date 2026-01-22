-- Migration: Resource recommendations and curated library
-- Created: 2026-01-22
-- Purpose: Add curated resources, recommendations, tags, and learning plan saves

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'guideline', 'review', 'article', 'video', 'podcast', 'pathway', 'policy', 'other'
  )),
  publisher TEXT NULL,
  summary TEXT NULL,
  estimated_minutes INT NOT NULL DEFAULT 10,
  level TEXT NOT NULL CHECK (level IN ('student', 'supervisor', 'both')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'archived')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  approved_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ NULL,
  archived_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS resources_url_unique ON public.resources (lower(url));

CREATE TABLE IF NOT EXISTS public.resource_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_type TEXT NOT NULL CHECK (tag_type IN ('epa', 'specialty', 'keyword', 'level')),
  tag_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tag_type, tag_value)
);

CREATE TABLE IF NOT EXISTS public.resource_tag_map (
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.resource_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.resource_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id UUID NULL,
  resource_id UUID NULL REFERENCES public.resources(id) ON DELETE SET NULL,
  url TEXT NULL,
  title TEXT NULL,
  resource_type TEXT NULL CHECK (resource_type IN (
    'guideline', 'review', 'article', 'video', 'podcast', 'pathway', 'policy', 'other'
  )),
  publisher TEXT NULL,
  estimated_minutes INT NOT NULL DEFAULT 10,
  level TEXT NOT NULL DEFAULT 'student' CHECK (level IN ('student', 'supervisor', 'both')),
  why_suggested TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (resource_id IS NOT NULL AND url IS NULL)
    OR (resource_id IS NULL AND url IS NOT NULL AND title IS NOT NULL AND resource_type IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS resource_recommendations_student_idx ON public.resource_recommendations(student_id);
CREATE INDEX IF NOT EXISTS resource_recommendations_supervisor_idx ON public.resource_recommendations(supervisor_id);
CREATE INDEX IF NOT EXISTS resource_recommendations_status_idx ON public.resource_recommendations(status);

CREATE TABLE IF NOT EXISTS public.resource_recommendation_tag_map (
  recommendation_id UUID NOT NULL REFERENCES public.resource_recommendations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.resource_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recommendation_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.learning_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_recommendation_id UUID NOT NULL REFERENCES public.resource_recommendations(id) ON DELETE CASCADE,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'completed', 'archived')),
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  UNIQUE (student_id, resource_recommendation_id)
);

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_recommendation_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plan_items ENABLE ROW LEVEL SECURITY;

-- resources: read approved by all authenticated
DROP POLICY IF EXISTS "resources_select_approved" ON public.resources;
CREATE POLICY "resources_select_approved"
  ON public.resources
  FOR SELECT
  TO authenticated
  USING (status = 'approved' AND archived_at IS NULL);

-- resources: admin full access
DROP POLICY IF EXISTS "resources_admin_all" ON public.resources;
CREATE POLICY "resources_admin_all"
  ON public.resources
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- resource_tags: authenticated can read
DROP POLICY IF EXISTS "resource_tags_select" ON public.resource_tags;
CREATE POLICY "resource_tags_select"
  ON public.resource_tags
  FOR SELECT
  TO authenticated
  USING (true);

-- resource_tags: admin manage
DROP POLICY IF EXISTS "resource_tags_admin_all" ON public.resource_tags;
CREATE POLICY "resource_tags_admin_all"
  ON public.resource_tags
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- resource_tag_map: authenticated can read approved resources
DROP POLICY IF EXISTS "resource_tag_map_select" ON public.resource_tag_map;
CREATE POLICY "resource_tag_map_select"
  ON public.resource_tag_map
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_tag_map.resource_id
        AND r.status = 'approved'
        AND r.archived_at IS NULL
    )
  );

-- resource_tag_map: admin manage
DROP POLICY IF EXISTS "resource_tag_map_admin_all" ON public.resource_tag_map;
CREATE POLICY "resource_tag_map_admin_all"
  ON public.resource_tag_map
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- resource_recommendations: student can read own
DROP POLICY IF EXISTS "resource_recommendations_student_read" ON public.resource_recommendations;
CREATE POLICY "resource_recommendations_student_read"
  ON public.resource_recommendations
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- resource_recommendations: supervisor can read own
DROP POLICY IF EXISTS "resource_recommendations_supervisor_read" ON public.resource_recommendations;
CREATE POLICY "resource_recommendations_supervisor_read"
  ON public.resource_recommendations
  FOR SELECT
  TO authenticated
  USING (supervisor_id = auth.uid());

-- resource_recommendations: admin can read all
DROP POLICY IF EXISTS "resource_recommendations_admin_read" ON public.resource_recommendations;
CREATE POLICY "resource_recommendations_admin_read"
  ON public.resource_recommendations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- resource_recommendations: supervisors can create for assigned students
DROP POLICY IF EXISTS "resource_recommendations_supervisor_insert" ON public.resource_recommendations;
CREATE POLICY "resource_recommendations_supervisor_insert"
  ON public.resource_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'supervisor')
    AND supervisor_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.supervisor_student_assignments ssa
        WHERE ssa.supervisor_id = auth.uid() AND ssa.student_id = student_id
      )
      OR EXISTS (
        SELECT 1 FROM public.student_supervisor_assignments ssa2
        WHERE ssa2.supervisor_id = auth.uid() AND ssa2.student_id = student_id
      )
    )
  );

-- resource_recommendations: supervisors can update own recommendations
DROP POLICY IF EXISTS "resource_recommendations_supervisor_update" ON public.resource_recommendations;
CREATE POLICY "resource_recommendations_supervisor_update"
  ON public.resource_recommendations
  FOR UPDATE
  TO authenticated
  USING (supervisor_id = auth.uid())
  WITH CHECK (supervisor_id = auth.uid());

-- resource_recommendations: admin full access
DROP POLICY IF EXISTS "resource_recommendations_admin_all" ON public.resource_recommendations;
CREATE POLICY "resource_recommendations_admin_all"
  ON public.resource_recommendations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- resource_recommendation_tag_map: read where user can see recommendation
DROP POLICY IF EXISTS "resource_recommendation_tag_map_select" ON public.resource_recommendation_tag_map;
CREATE POLICY "resource_recommendation_tag_map_select"
  ON public.resource_recommendation_tag_map
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resource_recommendations rr
      WHERE rr.id = resource_recommendation_tag_map.recommendation_id
        AND (
          rr.student_id = auth.uid()
          OR rr.supervisor_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

-- resource_recommendation_tag_map: supervisors can insert for their recommendations
DROP POLICY IF EXISTS "resource_recommendation_tag_map_insert" ON public.resource_recommendation_tag_map;
CREATE POLICY "resource_recommendation_tag_map_insert"
  ON public.resource_recommendation_tag_map
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resource_recommendations rr
      WHERE rr.id = resource_recommendation_tag_map.recommendation_id
        AND rr.supervisor_id = auth.uid()
    )
  );

-- resource_recommendation_tag_map: admin manage
DROP POLICY IF EXISTS "resource_recommendation_tag_map_admin_all" ON public.resource_recommendation_tag_map;
CREATE POLICY "resource_recommendation_tag_map_admin_all"
  ON public.resource_recommendation_tag_map
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- learning_plan_items: students manage own items
DROP POLICY IF EXISTS "learning_plan_items_student_all" ON public.learning_plan_items;
CREATE POLICY "learning_plan_items_student_all"
  ON public.learning_plan_items
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

