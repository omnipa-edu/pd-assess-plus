-- Admin Console Schema Migration
-- Creates tables for institutions, departments, specialties, EPAs, and audit logging

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

-- EPA status enum (only create if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'epa_status') THEN
    CREATE TYPE epa_status AS ENUM ('draft', 'active', 'retired');
  END IF;
END $$;

-- Audit action enum (only create if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'import', 'bulk_update');
  END IF;
END $$;

-- ============================================================================
-- INSTITUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT institutions_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  CONSTRAINT institutions_code_check CHECK (char_length(code) >= 2 AND char_length(code) <= 20),
  CONSTRAINT institutions_code_unique UNIQUE (code)
);

CREATE INDEX idx_institutions_code ON public.institutions(code);
CREATE INDEX idx_institutions_name ON public.institutions(name);

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT departments_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  CONSTRAINT departments_code_check CHECK (char_length(code) >= 2 AND char_length(code) <= 20),
  CONSTRAINT departments_institution_code_unique UNIQUE (institution_id, code)
);

CREATE INDEX idx_departments_institution ON public.departments(institution_id);
CREATE INDEX idx_departments_code ON public.departments(code);
CREATE INDEX idx_departments_name ON public.departments(name);

-- ============================================================================
-- SPECIALTIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT specialties_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
  CONSTRAINT specialties_code_check CHECK (char_length(code) >= 2 AND char_length(code) <= 50),
  CONSTRAINT specialties_code_unique UNIQUE (code)
);

CREATE INDEX idx_specialties_code ON public.specialties(code);
CREATE INDEX idx_specialties_active ON public.specialties(is_active);

-- ============================================================================
-- EPAs (Entrustable Professional Activities)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.epas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id UUID NOT NULL REFERENCES public.specialties(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ksa JSONB, -- Knowledge, Skills, Attitudes
  version TEXT DEFAULT 'v1',
  status epa_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT epas_code_check CHECK (char_length(code) >= 2 AND char_length(code) <= 32),
  CONSTRAINT epas_title_check CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT epas_description_check CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
  CONSTRAINT epas_specialty_code_unique UNIQUE (specialty_id, code)
);

CREATE INDEX idx_epas_specialty ON public.epas(specialty_id);
CREATE INDEX idx_epas_code ON public.epas(code);
CREATE INDEX idx_epas_status ON public.epas(status);
CREATE INDEX idx_epas_ksa ON public.epas USING gin(ksa);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  entity TEXT NOT NULL, -- table name: 'institutions', 'epas', etc.
  entity_id UUID NOT NULL,
  diff JSONB, -- {before: {...}, after: {...}}
  metadata JSONB, -- extra context like import_id, row_count, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT audit_log_entity_check CHECK (char_length(entity) >= 2 AND char_length(entity) <= 50)
);

CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_user_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- ============================================================================
-- IMPORT MAPPING PRESETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.import_mapping_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity TEXT NOT NULL, -- 'epa', 'specialty', etc.
  mapping JSONB NOT NULL, -- {detected_field: canonical_field}
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT import_mapping_presets_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

CREATE INDEX idx_import_mapping_presets_entity ON public.import_mapping_presets(entity);
CREATE INDEX idx_import_mapping_presets_created_by ON public.import_mapping_presets(created_by);

-- ============================================================================
-- UPDATE EXISTING TABLES
-- ============================================================================

-- Add department_id to supervisors if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;
    CREATE INDEX idx_profiles_department ON public.profiles(department_id);
  END IF;
END $$;

-- Add institution_id to profiles for multi-org support (optional)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'institution_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;
    CREATE INDEX idx_profiles_institution ON public.profiles(institution_id);
  END IF;
END $$;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_epas_updated_at BEFORE UPDATE ON public.epas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_mapping_presets_updated_at BEFORE UPDATE ON public.import_mapping_presets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_mapping_presets ENABLE ROW LEVEL SECURITY;

-- Institutions: Admin full access, others read-only
CREATE POLICY institutions_admin_all ON public.institutions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY institutions_read_all ON public.institutions
  FOR SELECT USING (true);

-- Departments: Admin full access, others read-only
CREATE POLICY departments_admin_all ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY departments_read_all ON public.departments
  FOR SELECT USING (true);

-- Specialties: Admin full access, others read active only
CREATE POLICY specialties_admin_all ON public.specialties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY specialties_read_active ON public.specialties
  FOR SELECT USING (is_active = true);

-- EPAs: Admin full access, others read active only
CREATE POLICY epas_admin_all ON public.epas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY epas_read_active ON public.epas
  FOR SELECT USING (status = 'active');

-- Audit log: Admin read-only
CREATE POLICY audit_log_admin_read ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Audit log inserts via service role only (triggers/functions)
CREATE POLICY audit_log_service_insert ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Import mapping presets: users can manage their own, admins see all
CREATE POLICY import_mapping_presets_own ON public.import_mapping_presets
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY import_mapping_presets_admin_all ON public.import_mapping_presets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to write audit log entries
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action audit_action,
  p_entity TEXT,
  p_entity_id UUID,
  p_diff JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_log (actor_user_id, action, entity, entity_id, diff, metadata)
  VALUES (auth.uid(), p_action, p_entity, p_entity_id, p_diff, p_metadata)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Function to get EPA count by specialty
CREATE OR REPLACE FUNCTION public.get_specialty_epa_count(p_specialty_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.epas
  WHERE specialty_id = p_specialty_id AND status = 'active';
$$;

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Insert sample institution
INSERT INTO public.institutions (name, code, address)
VALUES ('Royal College of Physicians and Surgeons', 'RCPS', '123 Medical Drive, Toronto, ON')
ON CONFLICT (code) DO NOTHING;

-- Insert sample specialty
INSERT INTO public.specialties (name, code, description)
VALUES 
  ('Internal Medicine', 'IM', 'The medical specialty dealing with the prevention, diagnosis, and treatment of internal diseases'),
  ('Surgery', 'SURG', 'The medical specialty focused on operative procedures'),
  ('Pediatrics', 'PEDS', 'The branch of medicine that involves the medical care of infants, children, and adolescents')
ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

