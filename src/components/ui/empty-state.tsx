/**
 * EmptyState Component
 * Rich empty state with icon, description, and CTAs
 */
import { LucideIcon } from 'lucide-react';
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
        "flex flex-col items-center justify-center text-center p-8 py-12 rounded-lg border border-dashed border-border bg-muted/10",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <Icon 
          className="h-8 w-8 text-primary" 
          aria-hidden="true"
        />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
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



