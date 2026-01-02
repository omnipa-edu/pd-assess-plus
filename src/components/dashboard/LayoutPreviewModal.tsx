/**
 * LayoutPreviewModal Component
 * Visual wireframe preview of dashboard layout
 */

import { useState } from 'react';

import { Monitor, Tablet, Smartphone } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getWidgetDefinition } from '@/components/dashboard/widgets/registry';
import { GRID_COLUMNS } from '@/lib/dashboard/types';
import type { DashboardLayoutJson, Breakpoint, WidgetGridLayout } from '@/lib/dashboard/types';

interface LayoutPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: DashboardLayoutJson;
  onAccept?: () => void;
}

export function LayoutPreviewModal({
  open,
  onOpenChange,
  layout,
  onAccept,
}: LayoutPreviewModalProps) {
  const [selectedBreakpoint, setSelectedBreakpoint] = useState<Breakpoint>('desktop');

  const widgets = layout.breakpoints[selectedBreakpoint].filter((w) => w.isVisible);
  const columns = GRID_COLUMNS[selectedBreakpoint];
  const columnWidth = 100 / columns;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview Layout</DialogTitle>
          <DialogDescription>
            Preview how your dashboard will look. This is a wireframe view without live data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Breakpoint Selector */}
          <Tabs value={selectedBreakpoint} onValueChange={(v) => setSelectedBreakpoint(v as Breakpoint)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="desktop" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="tablet" className="flex items-center gap-2">
                <Tablet className="h-4 w-4" />
                Tablet
              </TabsTrigger>
              <TabsTrigger value="mobile" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedBreakpoint} className="mt-4">
              <div className="relative border-2 border-dashed border-muted rounded-lg p-4 bg-muted/20">
                {/* Grid Background */}
                <div
                  className="absolute inset-0 grid gap-1 p-4"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  }}
                >
                  {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="border border-muted/30 rounded" />
                  ))}
                </div>

                {/* Widgets */}
                <div className="relative min-h-[600px]">
                  {widgets.map((widget) => {
                    const definition = getWidgetDefinition(widget.widgetId);
                    const isCollapsed = widget.userCollapsed || widget.defaultCollapsed;

                    return (
                      <div
                        key={widget.widgetId}
                        className="absolute border-2 border-primary/50 bg-primary/10 rounded-lg p-2 flex flex-col"
                        style={{
                          left: `${(widget.x / columns) * 100}%`,
                          top: `${widget.y * 40}px`, // Approximate row height
                          width: `${(widget.w / columns) * 100}%`,
                          height: `${widget.h * 40}px`,
                        }}
                      >
                        <div className="text-xs font-semibold text-primary">
                          {definition?.label || widget.widgetId}
                        </div>
                        {isCollapsed && (
                          <div className="text-xs text-muted-foreground mt-1">(Collapsed)</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-auto">
                          {widget.w} × {widget.h}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onAccept && (
              <Button onClick={onAccept}>
                Accept Layout
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

