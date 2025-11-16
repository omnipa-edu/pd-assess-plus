/**
 * Video URL utilities for safe embedding
 * Supports YouTube and Instagram with URL validation
 */

export interface VideoInfo {
  platform: 'youtube' | 'instagram' | null;
  id: string | null;
  embedUrl: string | null;
  originalUrl: string;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
 */
export function extractYouTubeId(url: string): string | null {
  try {
    // Clean the URL - remove any whitespace
    const cleanUrl = url.trim();
    
    // Handle youtu.be short links
    const shortLinkMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (shortLinkMatch) {
      return shortLinkMatch[1];
    }
    
    const urlObj = new URL(cleanUrl);
    
    // youtu.be/ID format
    if (urlObj.hostname === 'youtu.be' || urlObj.hostname === 'www.youtu.be') {
      const id = urlObj.pathname.slice(1).split('?')[0].split('&')[0];
      // YouTube IDs are always 11 characters
      if (id.length === 11) return id;
    }
    
    // youtube.com/watch?v=ID format
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId && videoId.length === 11) return videoId;
      
      // youtube.com/embed/ID format
      const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
      
      // youtube.com/shorts/ID format
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) return shortsMatch[1];
    }
    
    return null;
  } catch {
    // If URL parsing fails, try regex fallback
    const regexMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return regexMatch ? regexMatch[1] : null;
  }
}

/**
 * Extract Instagram post ID from URL
 * Supports: instagram.com/p/ID, instagram.com/reel/ID
 */
export function extractInstagramId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname.includes('instagram.com')) {
      return null;
    }
    
    // Match /p/ID or /reel/ID patterns
    const match = urlObj.pathname.match(/\/(p|reel)\/([^/?]+)/);
    return match ? match[2] : null;
  } catch {
    return null;
  }
}

/**
 * Validate and parse video URL
 * Returns platform, ID, and privacy-enhanced embed URL
 */
export function parseVideoUrl(url: string): VideoInfo {
  const info: VideoInfo = {
    platform: null,
    id: null,
    embedUrl: null,
    originalUrl: url
  };
  
  // Try YouTube first
  const ytId = extractYouTubeId(url);
  if (ytId) {
    info.platform = 'youtube';
    info.id = ytId;
    // Simplified embed URL - removed origin parameter which causes Error 153
    // rel=0 hides related videos from other channels
    // modestbranding=1 reduces YouTube branding
    info.embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
    return info;
  }
  
  // Try Instagram
  const igId = extractInstagramId(url);
  if (igId) {
    info.platform = 'instagram';
    info.id = igId;
    // Instagram doesn't have a simple embed URL, we'll use the original
    info.embedUrl = url;
    return info;
  }
  
  return info;
}

/**
 * Check if URL is from an allowed video platform
 */
export function isAllowedVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return (
      hostname.includes('youtube.com') ||
      hostname.includes('youtu.be') ||
      hostname.includes('instagram.com')
    );
  } catch {
    return false;
  }
}

/**
 * Validate video URL and return error message if invalid
 */
export function validateVideoUrl(url: string): string | null {
  if (!url || url.trim() === '') {
    return 'URL is required';
  }
  
  if (!isAllowedVideoUrl(url)) {
    return 'Only YouTube and Instagram URLs are supported';
  }
  
  const info = parseVideoUrl(url);
  if (!info.platform || !info.id) {
    return 'Unable to extract video ID. Please check the URL format';
  }
  
  return null;
}

