/**
 * WidgetResizeHandle Component
 * Visual resize handle for widgets in edit mode
 */

import { Maximize2 } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WidgetResizeHandleProps {
  isVisible: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function WidgetResizeHandle({ isVisible, onMouseDown }: WidgetResizeHandleProps) {
  if (!isVisible) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize bg-background/80 border border-t-0 border-l-0 rounded-tl-lg flex items-center justify-center hover:bg-background z-10"
            onMouseDown={onMouseDown}
            style={{ cursor: 'nwse-resize' }}
          >
            <Maximize2 className="h-3 w-3 text-muted-foreground rotate-45" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">Resize widget</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

