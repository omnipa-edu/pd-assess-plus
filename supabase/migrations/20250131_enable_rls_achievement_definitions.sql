-- Migration: Enable RLS on achievement_definitions table
-- Created: 2025-01-31
-- Purpose: Fix security issue - enable Row Level Security on public.achievement_definitions

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on achievement_definitions table
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Allow all authenticated users to read active achievement definitions
-- This is reference data that users need to see what achievements are available
DROP POLICY IF EXISTS "Authenticated users can view active achievement definitions" ON public.achievement_definitions;
CREATE POLICY "Authenticated users can view active achievement definitions"
  ON public.achievement_definitions
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to manage achievement definitions
-- Only admins/service role should be able to create, update, or delete definitions
DROP POLICY IF EXISTS "Service role can manage achievement definitions" ON public.achievement_definitions;
CREATE POLICY "Service role can manage achievement definitions"
  ON public.achievement_definitions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view active achievement definitions" ON public.achievement_definitions IS 
  'Allows authenticated users to read active achievement definitions (reference data)';

COMMENT ON POLICY "Service role can manage achievement definitions" ON public.achievement_definitions IS 
  'Allows service role (admin operations) to create, update, and delete achievement definitions';
