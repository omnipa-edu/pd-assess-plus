import { describe, it, expect } from 'vitest';

import { cn } from '../utils';

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('base-class', true && 'conditional-class')).toBe('base-class conditional-class');
    expect(cn('base-class', false && 'conditional-class')).toBe('base-class');
  });

  it('should deduplicate conflicting Tailwind classes', () => {
    // twMerge should keep the last class when there's a conflict
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['px-2', 'py-1'], 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({
      'px-2': true,
      'py-1': true,
      'hidden': false,
    })).toBe('px-2 py-1');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null, undefined, false)).toBe('');
  });

  it('should handle complex combinations', () => {
    expect(cn(
      'base',
      { 'conditional': true },
      ['array', 'classes'],
      false && 'not-included',
      'final'
    )).toBe('base conditional array classes final');
  });
});

