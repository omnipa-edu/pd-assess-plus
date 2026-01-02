/**
 * Extract URL from embed code
 * Supports iframe embed codes and other common embed formats
 */

/**
 * Extract URL from iframe embed code
 * Handles: <iframe src="..."></iframe> and variations
 */
export function extractUrlFromIframe(embedCode: string): string | null {
  if (!embedCode || !embedCode.trim()) return null;

  // Try to match iframe src attribute
  const iframeMatch = embedCode.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    return iframeMatch[1].trim();
  }

  // Try to match iframe src without quotes
  const iframeMatch2 = embedCode.match(/<iframe[^>]+src=([^\s>]+)/i);
  if (iframeMatch2 && iframeMatch2[1]) {
    return iframeMatch2[1].trim().replace(/["']/g, '');
  }

  return null;
}

/**
 * Extract URL from object/embed tags (legacy embeds)
 */
export function extractUrlFromObject(embedCode: string): string | null {
  if (!embedCode || !embedCode.trim()) return null;

  // Try object tag with param value
  const objectMatch = embedCode.match(/<param[^>]+name=["']?movie["']?[^>]+value=["']([^"']+)["']/i);
  if (objectMatch && objectMatch[1]) {
    return objectMatch[1].trim();
  }

  // Try embed tag src
  const embedMatch = embedCode.match(/<embed[^>]+src=["']([^"']+)["']/i);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1].trim();
  }

  return null;
}

/**
 * Extract URL from any embed code format
 * Returns the extracted URL or null if no URL found
 */
export function extractUrlFromEmbedCode(embedCode: string): string | null {
  if (!embedCode || !embedCode.trim()) return null;

  // First, try iframe (most common)
  const iframeUrl = extractUrlFromIframe(embedCode);
  if (iframeUrl) return iframeUrl;

  // Then try object/embed tags
  const objectUrl = extractUrlFromObject(embedCode);
  if (objectUrl) return objectUrl;

  // If it's already a plain URL, return it
  const urlPattern = /^https?:\/\/[^\s<>"']+$/i;
  if (urlPattern.test(embedCode.trim())) {
    return embedCode.trim();
  }

  return null;
}

/**
 * Check if input looks like embed code (contains HTML tags)
 */
export function isEmbedCode(input: string): boolean {
  if (!input || !input.trim()) return false;
  
  // Check for common HTML embed tags
  const embedPattern = /<(iframe|embed|object|video)[^>]*>/i;
  return embedPattern.test(input);
}

