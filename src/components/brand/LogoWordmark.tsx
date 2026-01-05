import { cn } from '@/lib/utils';

interface LogoWordmarkProps {
  className?: string;
}

/**
 * LogoWordmark Component
 * 
 * Renders the "Adaptive Competency" wordmark with proper dark mode contrast:
 * - "Adaptive" in white (dark mode) or foreground (light mode)
 * - "Competency" in primary teal accent color
 * 
 * All colors use CSS variables - no hardcoded values.
 */
export function LogoWordmark({ className = '' }: LogoWordmarkProps) {
  return (
    <span className={cn('font-semibold tracking-tight leading-none', className)}>
      <span className="text-foreground dark:text-white">Adaptive</span>{' '}
      <span className="text-primary">Competency</span>
    </span>
  );
}

