-- Migration: Procedures table for admin-managed procedure types (direct observation)
-- Uses existing epa_status enum. Procedures are global in v1 (no specialty_id).

CREATE TABLE IF NOT EXISTS public.procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status epa_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT procedures_code_check CHECK (char_length(code) >= 1 AND char_length(code) <= 64),
  CONSTRAINT procedures_title_check CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT procedures_code_unique UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_procedures_status ON public.procedures(status);
CREATE INDEX IF NOT EXISTS idx_procedures_title ON public.procedures(title);

ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS procedures_admin_all ON public.procedures;
CREATE POLICY procedures_admin_all ON public.procedures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS procedures_read_active ON public.procedures;
CREATE POLICY procedures_read_active ON public.procedures
  FOR SELECT
  USING (status = 'active');

COMMENT ON TABLE public.procedures IS 'Admin-managed procedure types for direct observation assessments';
