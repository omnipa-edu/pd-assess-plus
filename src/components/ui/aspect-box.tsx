/**
 * AspectBox Component
 * Responsive container that maintains aspect ratio (default 16:9)
 */
import { cn } from '@/lib/utils';

interface AspectBoxProps {
  ratio?: number;
  children: React.ReactNode;
  className?: string;
}

export function AspectBox({ ratio = 16 / 9, children, className }: AspectBoxProps) {
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-lg bg-muted", className)}
      style={{ paddingTop: `${(100 / ratio)}%` }}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

