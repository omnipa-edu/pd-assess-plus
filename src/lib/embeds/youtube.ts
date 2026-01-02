/**
 * YouTube URL Parsing and Embed Generation
 * Supports multiple YouTube URL formats and generates safe embed URLs
 */

export interface YouTubeVideoInfo {
  id: string;
  embedUrl: string;
  canonicalUrl: string;
  platform: 'youtube';
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Remove any query parameters and fragments
  const cleanUrl = url.split('?')[0].split('#')[0];

  // Pattern 1: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = cleanUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Pattern 2: https://youtu.be/VIDEO_ID
  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Pattern 3: https://www.youtube.com/shorts/VIDEO_ID
  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Pattern 4: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Generate YouTube embed URL with privacy-enhanced mode
 */
export function generateYouTubeEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  start?: number;
  end?: number;
}): string {
  const baseUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  const params = new URLSearchParams();

  // Privacy and UX settings
  params.append('rel', '0'); // Don't show related videos from other channels
  params.append('modestbranding', '1'); // Hide YouTube logo
  params.append('playsinline', '1'); // Play inline on mobile

  if (options?.autoplay) {
    params.append('autoplay', '1');
  }

  if (options?.start) {
    params.append('start', options.start.toString());
  }

  if (options?.end) {
    params.append('end', options.end.toString());
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Parse YouTube URL and return embed information
 */
export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  return {
    id: videoId,
    embedUrl: generateYouTubeEmbedUrl(videoId),
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    platform: 'youtube',
  };
}

/**
 * Validate YouTube URL format
 */
export function validateYouTubeUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return {
      valid: false,
      error: 'Invalid YouTube URL. Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/shorts/...',
    };
  }

  return { valid: true };
}

