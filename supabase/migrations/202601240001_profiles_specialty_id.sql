-- Migration: Add specialty_id to profiles
-- Created: 2026-01-24
-- Purpose: Link profiles to specialties

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialty_id UUID;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_specialty_id_fkey
  FOREIGN KEY (specialty_id)
  REFERENCES public.specialties(id)
  ON DELETE SET NULL;
