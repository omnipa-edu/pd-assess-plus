/**
 * Tests for video URL parsing and validation
 */
import { describe, it, expect } from 'vitest';

import {
  extractYouTubeId,
  extractInstagramId,
  parseVideoUrl,
  isAllowedVideoUrl,
  validateVideoUrl,
} from '../video-utils';

describe('extractYouTubeId', () => {
  it('should extract ID from standard watch URL', () => {
    const id = extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from youtu.be short URL', () => {
    const id = extractYouTubeId('https://youtu.be/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from embed URL', () => {
    const id = extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should handle URLs with query parameters', () => {
    const id = extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should return null for invalid YouTube URL', () => {
    const id = extractYouTubeId('https://www.youtube.com/channel/UC123456');
    expect(id).toBeNull();
  });

  it('should return null for non-YouTube URL', () => {
    const id = extractYouTubeId('https://www.example.com');
    expect(id).toBeNull();
  });

  it('should return null for invalid URL string', () => {
    const id = extractYouTubeId('not a url');
    expect(id).toBeNull();
  });
});

describe('extractInstagramId', () => {
  it('should extract ID from post URL', () => {
    const id = extractInstagramId('https://www.instagram.com/p/ABC123xyz/');
    expect(id).toBe('ABC123xyz');
  });

  it('should extract ID from reel URL', () => {
    const id = extractInstagramId('https://www.instagram.com/reel/ABC123xyz/');
    expect(id).toBe('ABC123xyz');
  });

  it('should handle URLs with query parameters', () => {
    const id = extractInstagramId('https://www.instagram.com/p/ABC123xyz/?utm_source=ig_web');
    expect(id).toBe('ABC123xyz');
  });

  it('should return null for profile URL', () => {
    const id = extractInstagramId('https://www.instagram.com/username/');
    expect(id).toBeNull();
  });

  it('should return null for non-Instagram URL', () => {
    const id = extractInstagramId('https://www.example.com');
    expect(id).toBeNull();
  });

  it('should return null for invalid URL string', () => {
    const id = extractInstagramId('not a url');
    expect(id).toBeNull();
  });
});

describe('parseVideoUrl', () => {
  it('should parse YouTube URL correctly', () => {
    const result = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toEqual({
      platform: 'youtube',
      id: 'dQw4w9WgXcQ',
      embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('should parse Instagram URL correctly', () => {
    const url = 'https://www.instagram.com/p/ABC123xyz/';
    const result = parseVideoUrl(url);
    expect(result).toEqual({
      platform: 'instagram',
      id: 'ABC123xyz',
      embedUrl: url,
      originalUrl: url,
    });
  });

  it('should return null values for unrecognized URL', () => {
    const url = 'https://www.example.com/video';
    const result = parseVideoUrl(url);
    expect(result).toEqual({
      platform: null,
      id: null,
      embedUrl: null,
      originalUrl: url,
    });
  });

  it('should prioritize YouTube over Instagram', () => {
    // Just to test the order of checking
    const result = parseVideoUrl('https://youtu.be/test123');
    expect(result.platform).toBe('youtube');
  });
});

describe('isAllowedVideoUrl', () => {
  it('should allow YouTube URLs', () => {
    expect(isAllowedVideoUrl('https://www.youtube.com/watch?v=123')).toBe(true);
    expect(isAllowedVideoUrl('https://youtu.be/123')).toBe(true);
  });

  it('should allow Instagram URLs', () => {
    expect(isAllowedVideoUrl('https://www.instagram.com/p/123/')).toBe(true);
  });

  it('should reject non-whitelisted domains', () => {
    expect(isAllowedVideoUrl('https://www.vimeo.com/123')).toBe(false);
    expect(isAllowedVideoUrl('https://www.example.com')).toBe(false);
  });

  it('should handle invalid URLs', () => {
    expect(isAllowedVideoUrl('not a url')).toBe(false);
    expect(isAllowedVideoUrl('')).toBe(false);
  });

  it('should be case-insensitive for hostnames', () => {
    expect(isAllowedVideoUrl('https://WWW.YOUTUBE.COM/watch?v=123')).toBe(true);
    expect(isAllowedVideoUrl('https://INSTAGRAM.COM/p/123/')).toBe(true);
  });
});

describe('validateVideoUrl', () => {
  it('should return null for valid YouTube URL', () => {
    const error = validateVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(error).toBeNull();
  });

  it('should return null for valid Instagram URL', () => {
    const error = validateVideoUrl('https://www.instagram.com/p/ABC123xyz/');
    expect(error).toBeNull();
  });

  it('should return error for empty URL', () => {
    const error = validateVideoUrl('');
    expect(error).toBe('URL is required');
  });

  it('should return error for whitespace-only URL', () => {
    const error = validateVideoUrl('   ');
    expect(error).toBe('URL is required');
  });

  it('should return error for non-whitelisted domain', () => {
    const error = validateVideoUrl('https://www.vimeo.com/123');
    expect(error).toBe('Only YouTube and Instagram URLs are supported');
  });

  it('should return error for YouTube URL without video ID', () => {
    const error = validateVideoUrl('https://www.youtube.com/channel/UC123');
    expect(error).toBe('Unable to extract video ID. Please check the URL format');
  });

  it('should return error for Instagram profile URL', () => {
    const error = validateVideoUrl('https://www.instagram.com/username/');
    expect(error).toBe('Unable to extract video ID. Please check the URL format');
  });

  it('should return error for invalid URL format', () => {
    const error = validateVideoUrl('not a url');
    expect(error).toBe('Only YouTube and Instagram URLs are supported');
  });
});

describe('Edge cases and security', () => {
  it('should handle URLs with various protocols', () => {
    expect(isAllowedVideoUrl('http://youtube.com/watch?v=123')).toBe(true);
    expect(isAllowedVideoUrl('https://youtube.com/watch?v=123')).toBe(true);
  });

  it('should handle URLs with www and without', () => {
    expect(extractYouTubeId('https://youtube.com/watch?v=test123')).toBe('test123');
    expect(extractYouTubeId('https://www.youtube.com/watch?v=test123')).toBe('test123');
  });

  it('should not extract from javascript: URLs', () => {
    expect(isAllowedVideoUrl('javascript:alert(1)')).toBe(false);
  });

  it('should handle very long video IDs', () => {
    const longId = 'a'.repeat(100);
    const url = `https://www.youtube.com/watch?v=${longId}`;
    expect(extractYouTubeId(url)).toBe(longId);
  });

  it('should handle special characters in video IDs', () => {
    const id = 'abc_-123XYZ';
    const url = `https://www.youtube.com/watch?v=${id}`;
    expect(extractYouTubeId(url)).toBe(id);
  });
});

