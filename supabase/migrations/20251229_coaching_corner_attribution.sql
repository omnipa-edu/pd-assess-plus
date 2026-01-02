-- Migration: Add Attribution Fields to Coaching Corner
-- Created: 2025-12-29
-- Purpose: Add attribution metadata for YouTube and Instagram embeds

-- Add attribution columns to existing coaching_corner table
ALTER TABLE public.coaching_corner
ADD COLUMN IF NOT EXISTS creator_name TEXT,
ADD COLUMN IF NOT EXISTS creator_handle TEXT,
ADD COLUMN IF NOT EXISTS creator_url TEXT,
ADD COLUMN IF NOT EXISTS source_platform TEXT CHECK (source_platform IN ('YouTube', 'Instagram', 'Other', NULL)),
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS license_note TEXT;

-- Rename video_url to url for consistency (if not already done)
-- Note: We'll keep video_url for backward compatibility but use url going forward
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'coaching_corner' 
                 AND column_name = 'url') THEN
    ALTER TABLE public.coaching_corner ADD COLUMN url TEXT;
    -- Copy existing video_url to url
    UPDATE public.coaching_corner SET url = video_url WHERE video_url IS NOT NULL;
  END IF;
END $$;

-- Add constraint: For YouTube/Instagram content, require attribution
-- This is a soft constraint (we'll enforce in application layer)
-- But we can add a check constraint for data integrity
-- Note: We make this nullable to allow existing records without attribution
-- Application layer will enforce attribution for new embeds
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_embed_attribution' 
    AND table_name = 'coaching_corner'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.coaching_corner DROP CONSTRAINT valid_embed_attribution;
  END IF;
END $$;

-- Don't add constraint for now - allow existing records to work
-- Application layer will enforce attribution requirements

-- Update content_type enum if needed (add 'link' type)
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in a transaction block
-- So we'll handle this separately if needed, or use TEXT with CHECK constraint
-- The existing CHECK constraint should handle 'link' if we add it

-- Add index for attribution queries
CREATE INDEX IF NOT EXISTS idx_coaching_corner_source_platform 
ON public.coaching_corner(source_platform) 
WHERE source_platform IS NOT NULL;

-- Add index for creator lookups
CREATE INDEX IF NOT EXISTS idx_coaching_corner_creator 
ON public.coaching_corner(creator_name) 
WHERE creator_name IS NOT NULL;

-- Comments
COMMENT ON COLUMN public.coaching_corner.creator_name IS 'Name of the content creator (required for embeds)';
COMMENT ON COLUMN public.coaching_corner.creator_handle IS 'Optional: Creator handle/channel name (e.g., @username)';
COMMENT ON COLUMN public.coaching_corner.creator_url IS 'Optional: Link to creator profile/channel';
COMMENT ON COLUMN public.coaching_corner.source_platform IS 'Platform source: YouTube, Instagram, or Other';
COMMENT ON COLUMN public.coaching_corner.source_url IS 'Original content URL (same as url for embeds)';
COMMENT ON COLUMN public.coaching_corner.license_note IS 'Optional: License or permission note (e.g., "Embedded with permission")';
COMMENT ON COLUMN public.coaching_corner.url IS 'Canonical URL for content (replaces video_url for consistency)';

