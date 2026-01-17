/**
 * AISuggestionBadge Component
 * Badge showing AI resize suggestions
 */

import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { ResizeSuggestion } from '@/lib/dashboard/aiSuggestions';

interface AISuggestionBadgeProps {
  suggestion: ResizeSuggestion;
  onApply: () => void;
  onDismiss: () => void;
}

export function AISuggestionBadge({
  suggestion,
  onApply,
  onDismiss,
}: AISuggestionBadgeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
        >
          <Sparkles className="mr-1 h-3 w-3" />
          Suggested
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Size Suggestion</h4>
            <p className="text-sm text-muted-foreground">{suggestion.rationale}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                onApply();
              }}
              className="flex-1"
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}



