-- Migration: Add tags and priority columns to coaching_corner
-- Created: 2025-11-28
-- Purpose: Enable adaptive coaching content selection based on WBA activity

-- Add tags column (text array for flexible tagging)
ALTER TABLE public.coaching_corner
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add priority column (integer for manual weighting)
ALTER TABLE public.coaching_corner
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Create index on tags for efficient filtering
CREATE INDEX IF NOT EXISTS idx_coaching_corner_tags 
ON public.coaching_corner USING gin(tags) 
WHERE is_active = true;

-- Create index on priority for sorting
CREATE INDEX IF NOT EXISTS idx_coaching_corner_priority 
ON public.coaching_corner(priority DESC, created_at DESC) 
WHERE is_active = true;

-- Comments
COMMENT ON COLUMN public.coaching_corner.tags IS 'Array of tags for adaptive selection (e.g., ["epa:ENT-1", "topic:feedback", "level:low"])';
COMMENT ON COLUMN public.coaching_corner.priority IS 'Manual priority weight for content selection (higher = more important)';

