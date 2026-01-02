/**
 * ColumnAwareGrid Component
 * Renders widgets in a column-based grid with react-grid-layout, lane constraints, and animations
 */

import { ReactNode, useState, useMemo } from 'react';

import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WidgetSizePresetSelector } from '@/components/dashboard/WidgetSizePresetSelector';
import { getResizeTransition, shouldAnimate } from '@/lib/dashboard/animations';
import { getLaneWidth, getColumnIndex, snapToLane, validateResize } from '@/lib/dashboard/columnUtils';
import type { WidgetId, Breakpoint, SizePreset } from '@/lib/dashboard/types';
import { GRID_COLUMNS } from '@/lib/dashboard/types';
import type { BreakpointLayout } from '@/lib/dashboard/types';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './ColumnAwareGrid.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ColumnAwareGridProps {
  breakpointLayout: BreakpointLayout;
  currentBreakpoint: Breakpoint;
  isEditing: boolean;
  renderWidget: (widgetId: WidgetId, isCollapsed: boolean) => ReactNode;
  onResizeStop: (widgetId: WidgetId, w: number, h: number, x: number, y: number) => void;
  onDragStop: (widgetId: WidgetId, x: number, y: number) => void;
  onSetSizePreset?: (widgetId: WidgetId, preset: SizePreset) => void;
  onToggleVisibility?: (widgetId: WidgetId) => void;
  onToggleCollapse?: (widgetId: WidgetId) => void;
  className?: string;
}

export function ColumnAwareGrid({
  breakpointLayout,
  currentBreakpoint,
  isEditing,
  renderWidget,
  onResizeStop,
  onDragStop,
  onSetSizePreset,
  onToggleVisibility,
  onToggleCollapse,
  className,
}: ColumnAwareGridProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizingWidget, setResizingWidget] = useState<WidgetId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const gridColumns = GRID_COLUMNS[currentBreakpoint];
  const laneWidth = getLaneWidth(breakpointLayout.columnCount, currentBreakpoint);

  // Convert breakpoint layout to react-grid-layout format
  const layouts: Record<string, Layout[]> = {
    lg: [], // Desktop
    md: [], // Tablet
    sm: [], // Mobile
  };

  // Build layout for current breakpoint - memoized for performance
  const currentLayout: Layout[] = useMemo(() => {
    const layout: Layout[] = [];
    let yPosition = 0;
    
    breakpointLayout.columns.forEach((column, colIndex) => {
      if (column.isCollapsed) return;
      
      let columnY = 0; // Track Y position within this column
      
      column.widgetOrder.forEach((widgetId) => {
        const settings = breakpointLayout.widgets[widgetId];
        if (!settings?.isVisible) return;
        
        // Get grid position from stored grid or calculate from column
        const gridItem = breakpointLayout.grid?.find((g) => g.i === widgetId);
        const storedX = gridItem?.x;
        const storedY = gridItem?.y;
        const storedW = gridItem?.w;
        const storedH = gridItem?.h;
        
        // Calculate X position - prefer stored, fallback to column-based
        let x: number;
        if (storedX !== undefined) {
          // Snap stored X to nearest column boundary
          x = snapToLane(storedX, breakpointLayout.columnCount, currentBreakpoint);
        } else {
          x = colIndex * laneWidth;
        }
        
        // Calculate Y position - prefer stored, fallback to stacking
        const y = storedY !== undefined ? storedY : columnY;
        
        // Calculate width - prefer stored, fallback to lane width
        const w = storedW ?? laneWidth;
        
        // Calculate height - prefer stored, fallback to default
        const h = storedH ?? 3;
        
        // Ensure widget fits in grid
        const finalX = Math.max(0, Math.min(x, gridColumns - Math.min(w, gridColumns)));
        const finalW = Math.max(settings.minW, Math.min(w, settings.maxW, gridColumns));
        const finalH = Math.max(settings.minH || 1, Math.min(h, settings.maxH || 6));
        
        layout.push({
          i: widgetId,
          x: finalX,
          y,
          w: finalW,
          h: finalH,
          minW: settings.minW,
          maxW: Math.min(settings.maxW, gridColumns),
          minH: settings.minH || 1,
          maxH: settings.maxH || 6,
          static: !isEditing,
        });
        
        // Update column Y for next widget
        columnY = y + finalH + 1; // Add spacing
      });
    });
    
    return layout;
  }, [breakpointLayout, currentBreakpoint, isEditing, gridColumns, laneWidth]);

  // Map to responsive breakpoints
  if (currentBreakpoint === 'desktop') {
    layouts.lg = currentLayout;
  } else if (currentBreakpoint === 'tablet') {
    layouts.md = currentLayout;
  } else {
    layouts.sm = currentLayout;
  }

  const handleResizeStart = (_layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setIsResizing(true);
    setResizingWidget(newItem.i as WidgetId);
  };

  const handleResizeStop = (_layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setIsResizing(false);
    setResizingWidget(null);
    
    const widgetId = newItem.i as WidgetId;
    const settings = breakpointLayout.widgets[widgetId];
    if (!settings) return;
    
    // Validate and snap to lanes
    const validation = validateResize(
      newItem.x,
      newItem.y,
      newItem.w,
      newItem.h,
      breakpointLayout.columnCount,
      currentBreakpoint,
      settings.minW,
      settings.maxW,
      settings.minH,
      settings.maxH
    );
    
    if (!validation.valid) return;
    
    const { adjustedX, adjustedY, adjustedW, adjustedH } = validation;
    onResizeStop(
      widgetId,
      adjustedW ?? newItem.w,
      adjustedH ?? newItem.h,
      adjustedX ?? newItem.x,
      adjustedY ?? newItem.y
    );
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = (_layout: Layout[], oldItem: Layout, newItem: Layout) => {
    setIsDragging(false);
    const widgetId = newItem.i as WidgetId;
    
    // Snap X to column boundary
    const snappedX = snapToLane(newItem.x, breakpointLayout.columnCount, currentBreakpoint);
    
    // Determine which column the widget should be in
    const targetColumnIndex = getColumnIndex(snappedX, breakpointLayout.columnCount, currentBreakpoint);
    
    // Adjust X to be at the start of the target column
    const finalX = targetColumnIndex * laneWidth;
    
    onDragStop(widgetId, finalX, newItem.y);
  };

  // Determine if widget is collapsed
  const isWidgetCollapsed = (widgetId: WidgetId): boolean => {
    const settings = breakpointLayout.widgets[widgetId];
    if (!settings) return false;
    return settings.userCollapsed === true 
      ? true 
      : settings.userCollapsed === false 
      ? false 
      : settings.defaultCollapsed;
  };

  return (
    <div className={`relative ${className || ''}`}>
      {/* Edit mode grid overlay */}
      {isEditing && (
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${100 / gridColumns}% 20px`,
            opacity: 0.5,
          }}
        />
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 768, sm: 0 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={60}
        isDraggable={isEditing}
        isResizable={isEditing}
        resizeHandles={['se']} // Bottom-right only
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={shouldAnimate() && !isResizing && !isDragging}
        compactType={null} // Don't auto-compact, respect Y positions
        preventCollision={false} // Allow overlapping during drag, validate on stop
      >
        {currentLayout.map((item) => {
          const widgetId = item.i as WidgetId;
          const settings = breakpointLayout.widgets[widgetId];
          const isCollapsed = isWidgetCollapsed(widgetId);
          const isCurrentlyResizing = resizingWidget === widgetId;
          
          return (
            <div
              key={widgetId}
              className={`relative ${isCurrentlyResizing ? 'is-resizing' : ''}`}
              style={{
                transition: isCurrentlyResizing ? 'none' : getResizeTransition(),
              }}
            >
              <Card className="relative overflow-visible group h-full border-2 transition-colors" style={{
                borderColor: isEditing ? 'rgba(0,0,0,0.1)' : 'transparent',
              }}>
                {/* Edit mode controls - top-right */}
                {isEditing && (
                  <div className="absolute right-2 top-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/95 border rounded-md p-1 shadow-md">
                    {/* Size preset selector */}
                    {onSetSizePreset && (
                      <WidgetSizePresetSelector
                        widgetId={widgetId}
                        currentPreset={settings?.sizePreset}
                        columnCount={breakpointLayout.columnCount}
                        breakpoint={currentBreakpoint}
                        onSelect={(preset) => onSetSizePreset(widgetId, preset)}
                        className="h-6"
                      />
                    )}
                    
                    {/* Toggle visibility */}
                    {onToggleVisibility && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onToggleVisibility(widgetId)}
                            >
                              {settings?.isVisible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Toggle visibility</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* Toggle collapse */}
                    {onToggleCollapse && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onToggleCollapse(widgetId)}
                            >
                              {isCollapsed ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronUp className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{isCollapsed ? 'Expand' : 'Collapse'}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}

                {/* Drag handle - top-left (only in edit mode) */}
                {isEditing && (
                  <div className="absolute left-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="h-8 w-8 cursor-grab active:cursor-grabbing bg-background/95 border shadow-md hover:bg-background rounded flex items-center justify-center"
                            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Drag to move</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Widget content */}
                <div className="h-full" style={{
                  transition: isCurrentlyResizing ? 'none' : getResizeTransition(),
                }}>
                  {!isCollapsed && renderWidget(widgetId, isCollapsed)}
                  {isCollapsed && !isEditing && (
                    <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                      Widget collapsed
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </ResponsiveGridLayout>
      
      {/* Dynamic transition styles */}
      <style>{`
        .react-grid-item {
          transition: ${isResizing || isDragging ? 'none' : getResizeTransition()} !important;
        }
      `}</style>
    </div>
  );
}

