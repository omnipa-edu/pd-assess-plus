/**
 * DashboardGrid Component v3
 * Grid-based layout using react-grid-layout with breakpoint support
 */

import { useState, useMemo, useCallback } from 'react';

import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { GripVertical, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WidgetSizePresetMenu } from '@/components/dashboard/WidgetSizePresetMenu';
import { GRID_COLUMNS, SIZE_PRESETS } from '@/lib/dashboard/types';
import type { WidgetGridLayout, Breakpoint, SizePreset } from '@/lib/dashboard/types';

// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';

interface DashboardGridV3Props {
  widgets: WidgetGridLayout[];
  isEditing: boolean;
  currentBreakpoint: Breakpoint;
  renderWidget: (widgetId: string, isCollapsed: boolean) => React.ReactNode;
  onLayoutChange: (layouts: Layout[]) => void;
  onRemove: (widgetId: string) => void;
  onToggleCollapse: (widgetId: string) => void;
  onSetDefaultCollapsed: (widgetId: string, collapsed: boolean) => void;
  onPresetChange: (widgetId: string, preset: SizePreset) => void;
  className?: string;
}

export function DashboardGridV3({
  widgets,
  isEditing,
  currentBreakpoint,
  renderWidget,
  onLayoutChange,
  onRemove,
  onToggleCollapse,
  onSetDefaultCollapsed,
  onPresetChange,
  className,
}: DashboardGridV3Props) {
  const columns = GRID_COLUMNS[currentBreakpoint];
  const rowHeight = 60; // Pixels per grid unit height

  // Convert WidgetGridLayout to react-grid-layout format
  const gridLayouts: Layout[] = useMemo(() => {
    return widgets
      .filter((w) => w.isVisible)
      .map((widget) => ({
        i: widget.widgetId,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
        minW: widget.minW,
        maxW: widget.maxW,
        minH: widget.minH || 1,
        maxH: widget.maxH || 6,
        static: !isEditing || widget.static,
      }));
  }, [widgets, isEditing]);

  // Handle layout change from react-grid-layout
  const handleLayoutChange = useCallback(
    (layouts: Layout[]) => {
      if (!isEditing) return;
      onLayoutChange(layouts);
    },
    [isEditing, onLayoutChange]
  );

  return (
    <div className={className}>
      <GridLayout
        className="layout"
        layouts={{ [currentBreakpoint]: gridLayouts }}
        breakpoints={{ mobile: 0, tablet: 768, desktop: 1024 }}
        cols={{ mobile: 4, tablet: 8, desktop: 12 }}
        rowHeight={rowHeight}
        width={typeof window !== 'undefined' ? window.innerWidth : 1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets
          .filter((w) => w.isVisible)
          .map((widget) => {
            const isCollapsed = widget.userCollapsed || widget.defaultCollapsed;

            return (
              <div key={widget.widgetId}>
                <Card className="relative h-full overflow-hidden">
                  {/* Edit Mode Controls */}
                  {isEditing && (
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-background/90 p-1 shadow-sm backdrop-blur-sm">
                      {/* Drag Handle */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Drag to move</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Size Preset Menu */}
                      <WidgetSizePresetMenu
                        widget={widget}
                        onPresetSelect={(preset) => onPresetChange(widget.widgetId, preset)}
                        breakpoint={currentBreakpoint}
                      />

                      {/* Remove Button */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => onRemove(widget.widgetId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove widget</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Collapse Toggle */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onToggleCollapse(widget.widgetId)}
                            >
                              {isCollapsed ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isCollapsed ? 'Expand' : 'Collapse'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Default Collapse Setting */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-1">
                              <Settings className="h-3 w-3 text-muted-foreground" />
                              <Switch
                                checked={widget.defaultCollapsed}
                                onCheckedChange={(checked) =>
                                  onSetDefaultCollapsed(widget.widgetId, checked)
                                }
                                className="h-4 w-4"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {widget.defaultCollapsed
                              ? 'Starts collapsed by default'
                              : 'Starts expanded by default'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Widget Content */}
                  <div className={isEditing ? 'pt-8' : ''}>
                    {!isCollapsed && renderWidget(widget.widgetId, isCollapsed)}
                    {isCollapsed && !isEditing && (
                      <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
                        Widget collapsed
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
      </GridLayout>
    </div>
  );
}

