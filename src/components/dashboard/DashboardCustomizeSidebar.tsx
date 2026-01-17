/**
 * DashboardCustomizeSidebar Component
 * Sidebar for customizing dashboard layout with widget management
 */

import { useState } from 'react';

import { GripVertical, X, Plus, Smartphone, Save, X as XIcon } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AddWidgetsDrawer } from '@/components/dashboard/AddWidgetsDrawer';
import { WidgetSizePresetSelector } from '@/components/dashboard/WidgetSizePresetSelector';
import { AISuggestionBadge } from '@/components/dashboard/AISuggestionBadge';
import { getWidgetDefinition } from '@/components/dashboard/widgets/registry';
import type { LegacyWidgetLayout, WidgetId, SizePreset, Breakpoint } from '@/lib/dashboard/types';
import type { ResizeSuggestion } from '@/lib/dashboard/aiSuggestions';

interface DashboardCustomizeSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: LegacyWidgetLayout[];
  onReorder: (widgetId: WidgetId, newOrder: number) => void;
  onRemove: (widgetId: WidgetId) => void;
  onToggleVisibility: (widgetId: WidgetId) => void;
  onToggleCollapse: (widgetId: WidgetId) => void;
  onSetDefaultCollapsed: (widgetId: WidgetId, collapsed: boolean) => void;
  onSetSizePreset?: (widgetId: WidgetId, preset: SizePreset) => void;
  onAddWidget: (widgetId: WidgetId) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  dashboardType: 'learner' | 'supervisor';
  aiSuggestions?: ResizeSuggestion[];
  onApplyAISuggestion?: (widgetId: WidgetId, preset: SizePreset) => void;
  onApplyMobileOptimizedLayout?: (options?: { autoSave?: boolean }) => Promise<boolean> | boolean;
  currentBreakpoint?: Breakpoint;
  columnCount?: number;
}

interface WidgetListItemProps {
  widget: LegacyWidgetLayout;
  onRemove: (widgetId: WidgetId) => void;
  onToggleVisibility: (widgetId: WidgetId) => void;
  onToggleCollapse: (widgetId: WidgetId) => void;
  onSetDefaultCollapsed: (widgetId: WidgetId, collapsed: boolean) => void;
  onSetSizePreset?: (widgetId: WidgetId, preset: SizePreset) => void;
  currentBreakpoint?: Breakpoint;
  columnCount?: number;
}

function WidgetListItem({
  widget,
  onRemove,
  onToggleVisibility,
  onToggleCollapse,
  onSetDefaultCollapsed,
  onSetSizePreset,
  currentBreakpoint,
  columnCount,
}: WidgetListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.widgetId });

  const definition = getWidgetDefinition(widget.widgetId);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : 'hover:border-primary/50'
      } ${!widget.isVisible ? 'opacity-50' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">
            {definition?.label || widget.widgetId}
          </p>
          {!widget.isVisible && (
            <Badge variant="secondary" className="text-xs">Hidden</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {definition?.description || ''}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={widget.isVisible}
          onCheckedChange={() => onToggleVisibility(widget.widgetId)}
          className="h-4 w-4"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onRemove(widget.widgetId)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DashboardCustomizeSidebar({
  open,
  onOpenChange,
  widgets,
  onReorder,
  onRemove,
  onToggleVisibility,
  onToggleCollapse,
  onSetDefaultCollapsed,
  onSetSizePreset,
  onAddWidget,
  onSave,
  onCancel,
  onReset,
  hasUnsavedChanges,
  isSaving,
  dashboardType,
  aiSuggestions,
  onApplyAISuggestion,
  onApplyMobileOptimizedLayout,
  currentBreakpoint = 'desktop',
  columnCount = 2,
}: DashboardCustomizeSidebarProps) {
  const [selectedWidget, setSelectedWidget] = useState<WidgetId | null>(null);

  const selectedWidgetData = selectedWidget
    ? widgets.find((w) => w.widgetId === selectedWidget)
    : null;

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

    onReorder(activeWidget.widgetId, overWidget.order);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Customize Dashboard</SheetTitle>
            <SheetDescription>
              Arrange your widgets, hide what you don't need, and personalize your view.
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4" />

          {/* Scrollable content */}
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-6 pb-4">
            {/* Mobile Layout */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Mobile Layout</Label>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-auto py-3 flex items-center justify-center gap-2"
                onClick={async () => {
                  await onApplyMobileOptimizedLayout?.({ autoSave: true });
                }}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">Apply Mobile-Optimized Layout</span>
              </Button>
            </div>

            <Separator />

            {/* AI Suggestions Section */}
            {aiSuggestions && aiSuggestions.length > 0 && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">AI Suggestions</Label>
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion) => {
                      const definition = getWidgetDefinition(suggestion.widgetId);
                      return (
                        <div
                          key={suggestion.widgetId}
                          className="flex items-start justify-between gap-2 p-3 border rounded-lg bg-primary/5"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {definition?.label || suggestion.widgetId}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {suggestion.rationale}
                            </p>
                          </div>
                          <AISuggestionBadge
                            suggestion={suggestion}
                            onApply={() => onApplyAISuggestion?.(suggestion.widgetId, suggestion.suggestedPreset)}
                            onDismiss={() => {
                              // Suggestions will refresh on next edit mode start
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Widget List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Widgets</Label>
                <AddWidgetsDrawer
                  dashboardType={dashboardType}
                  currentWidgetIds={widgets.map((w) => w.widgetId)}
                  onAddWidget={(widgetId) => {
                    onAddWidget(widgetId);
                  }}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  }
                />
              </div>

              <ScrollArea className="h-[400px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={widgets.map((w) => w.widgetId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {widgets.map((widget) => (
                      <WidgetListItem
                        key={widget.widgetId}
                        widget={widget}
                        onRemove={onRemove}
                        onToggleVisibility={onToggleVisibility}
                        onToggleCollapse={onToggleCollapse}
                        onSetDefaultCollapsed={onSetDefaultCollapsed}
                        onSetSizePreset={onSetSizePreset}
                        currentBreakpoint={currentBreakpoint}
                        columnCount={columnCount}
                      />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            </div>

            {/* Selected Widget Settings */}
            {selectedWidgetData && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">
                    Widget Settings
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="default-collapse" className="text-sm">
                        Start collapsed
                      </Label>
                      <Switch
                        id="default-collapse"
                        checked={selectedWidgetData.defaultCollapsed}
                        onCheckedChange={(checked) =>
                          onSetDefaultCollapsed(selectedWidgetData.widgetId, checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            </div>
          </ScrollArea>

          {/* Fixed footer with actions - always visible */}
          <div className="border-t bg-background px-6 py-4 space-y-2 flex-shrink-0">
            <Button
              variant="default"
              className="w-full"
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={onCancel}
                disabled={isSaving}
              >
                <XIcon className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onReset}
                disabled={isSaving}
              >
                Reset
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

