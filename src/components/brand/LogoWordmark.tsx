import { cn } from '@/lib/utils';
import { branding } from '@/lib/branding';

interface LogoWordmarkProps {
  className?: string;
}

/**
 * LogoWordmark Component
 * 
 * Renders the application wordmark with proper dark mode contrast:
 * - First word in white (dark mode) or foreground (light mode)
 * - Second word in primary teal accent color
 * 
 * All colors use CSS variables - no hardcoded values.
 */
export function LogoWordmark({ className = '' }: LogoWordmarkProps) {
  // Split app name into words for styling
  const words = branding.appName.split(' ');
  const firstWord = words[0];
  const restOfName = words.slice(1).join(' ');
  
  return (
    <span className={cn('font-semibold tracking-tight leading-none', className)}>
      <span className="text-foreground dark:text-white">{firstWord}</span>
      {restOfName && <>{' '}<span className="text-primary">{restOfName}</span></>}
    </span>
  );
}


