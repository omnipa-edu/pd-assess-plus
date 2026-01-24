/**
 * DashboardGrid Component
 * Renders widgets in a drag-and-drop single-column layout
 */

import { ReactNode } from 'react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { LegacyWidgetLayout, WidgetId } from '@/lib/dashboard/types';

interface DashboardGridProps {
  widgets: LegacyWidgetLayout[];
  isEditing: boolean;
  renderWidget: (widgetId: WidgetId, isCollapsed: boolean) => ReactNode;
  onReorder: (widgetId: WidgetId, newOrder: number) => void;
  onRemove: (widgetId: WidgetId) => void;
  onToggleCollapse: (widgetId: WidgetId) => void;
  onSetDefaultCollapsed: (widgetId: WidgetId, collapsed: boolean) => void;
  className?: string;
}

interface SortableWidgetItemProps {
  widget: LegacyWidgetLayout;
  isEditing: boolean;
  renderWidget: (widgetId: WidgetId, isCollapsed: boolean) => ReactNode;
  onRemove: (widgetId: WidgetId) => void;
  onToggleCollapse: (widgetId: WidgetId) => void;
  onSetDefaultCollapsed: (widgetId: WidgetId, collapsed: boolean) => void;
}

function SortableWidgetItem({
  widget,
  isEditing,
  renderWidget,
  onRemove,
  onToggleCollapse,
  onSetDefaultCollapsed,
}: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.widgetId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Widget is collapsed if:
  // - userCollapsed is explicitly true, OR
  // - defaultCollapsed is true and userCollapsed is not explicitly false
  const autoMode = widget.autoMode ?? 'manual';
  const isCollapsed = autoMode === 'auto_collapse'
    ? true
    : autoMode === 'auto_expand'
    ? false
    : widget.userCollapsed === true
    ? true
    : widget.userCollapsed === false
    ? false
    : widget.defaultCollapsed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card className="relative overflow-visible group">
        {/* Hover-based Edit Controls - Only show on hover when editing */}
        {isEditing && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/95 border shadow-md hover:bg-background"
                    onClick={() => onToggleCollapse(widget.widgetId)}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[100]">
                  {isCollapsed ? 'Expand widget' : 'Collapse widget'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-background/95 border shadow-md hover:bg-background"
                    onClick={() => onRemove(widget.widgetId)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[100]">
                  Hide widget
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-grab active:cursor-grabbing bg-background/95 border shadow-md hover:bg-background"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[100]">
                  Drag to reorder
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Widget Content */}
        <div>
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
}

export function DashboardGrid({
  widgets,
  isEditing,
  renderWidget,
  onReorder,
  onRemove,
  onToggleCollapse,
  onSetDefaultCollapsed,
  className,
}: DashboardGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeWidget = widgets.find((w) => w.widgetId === active.id);
    const overWidget = widgets.find((w) => w.widgetId === over.id);

    if (!activeWidget || !overWidget) return;

    const oldIndex = widgets.findIndex((w) => w.widgetId === active.id);
    const newIndex = widgets.findIndex((w) => w.widgetId === over.id);

    // Calculate new order based on position
    const newOrder = overWidget.order;
    onReorder(activeWidget.widgetId, newOrder);
  };

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((w) => w.widgetId)}
          strategy={verticalListSortingStrategy}
        >
          {/* Single-column layout for consistent sizing */}
          <div className="grid grid-cols-1 gap-6">
            {widgets.map((widget) => (
              <SortableWidgetItem
                key={widget.widgetId}
                widget={widget}
                isEditing={isEditing}
                renderWidget={renderWidget}
                onRemove={onRemove}
                onToggleCollapse={onToggleCollapse}
                onSetDefaultCollapsed={onSetDefaultCollapsed}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
