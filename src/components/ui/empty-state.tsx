/**
 * EmptyState Component
 * Rich empty state with icon, description, and CTAs
 */
import { type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-8 py-12 text-center",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <Icon 
          className="h-8 w-8 text-primary" 
          aria-hidden="true"
        />
      </div>
      
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              size="default"
              aria-label={primaryAction.label}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="outline"
              size="default"
              aria-label={secondaryAction.label}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};



