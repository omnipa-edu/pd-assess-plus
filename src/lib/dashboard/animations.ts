/**
 * Dashboard Resize Animations
 * Handles smooth resize animations with accessibility support
 */

/**
 * Get animation duration based on user preferences
 */
export function getAnimationDuration(): number {
  if (typeof window === 'undefined') return 200;
  
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion ? 0 : 200; // 200ms default, 0 for reduced motion
}

/**
 * Get animation easing function
 */
export function getAnimationEasing(): string {
  return 'ease-out';
}

/**
 * CSS transition string for resize animations
 */
export function getResizeTransition(): string {
  const duration = getAnimationDuration();
  if (duration === 0) return 'none';
  
  return `width ${duration}ms ${getAnimationEasing()}, height ${duration}ms ${getAnimationEasing()}, transform ${duration}ms ${getAnimationEasing()}`;
}

/**
 * Check if animations should be enabled
 */
export function shouldAnimate(): boolean {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hook to detect reduced motion preference
 */
export function useReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}



