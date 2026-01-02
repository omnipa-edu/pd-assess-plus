/**
 * Unified Embed Utilities
 * Provides a single interface for YouTube and Instagram embeds
 */

import { parseInstagramUrl, validateInstagramUrl, type InstagramPostInfo } from './instagram';
import { parseYouTubeUrl, validateYouTubeUrl, type YouTubeVideoInfo } from './youtube';

export type EmbedPlatform = 'youtube' | 'instagram' | null;

export interface EmbedInfo {
  platform: EmbedPlatform;
  id: string;
  embedUrl: string;
  canonicalUrl: string;
}

/**
 * Parse URL and return embed information
 */
export function parseEmbedUrl(url: string): EmbedInfo | null {
  // Try YouTube first
  const youtubeInfo = parseYouTubeUrl(url);
  if (youtubeInfo) {
    return {
      platform: 'youtube',
      id: youtubeInfo.id,
      embedUrl: youtubeInfo.embedUrl,
      canonicalUrl: youtubeInfo.canonicalUrl,
    };
  }

  // Try Instagram
  const instagramInfo = parseInstagramUrl(url);
  if (instagramInfo) {
    return {
      platform: 'instagram',
      id: instagramInfo.shortcode,
      embedUrl: instagramInfo.embedUrl,
      canonicalUrl: instagramInfo.canonicalUrl,
    };
  }

  return null;
}

/**
 * Validate embed URL
 */
export function validateEmbedUrl(url: string, platform?: EmbedPlatform): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  if (platform === 'youtube' || (!platform && url.includes('youtube') || url.includes('youtu.be'))) {
    return validateYouTubeUrl(url);
  }

  if (platform === 'instagram' || (!platform && url.includes('instagram.com'))) {
    return validateInstagramUrl(url);
  }

  // If no platform specified and URL doesn't match known patterns
  const embedInfo = parseEmbedUrl(url);
  if (!embedInfo) {
    return {
      valid: false,
      error: 'Invalid URL. Supported platforms: YouTube and Instagram',
    };
  }

  return { valid: true };
}

/**
 * Get platform name for display
 */
export function getPlatformName(platform: EmbedPlatform): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'instagram':
      return 'Instagram';
    default:
      return 'Unknown';
  }
}

