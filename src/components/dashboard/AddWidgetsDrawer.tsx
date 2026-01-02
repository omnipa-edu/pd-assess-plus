/**
 * AddWidgetsDrawer Component
 * Drawer/modal for adding widgets to the dashboard
 */

import { useState } from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getAvailableWidgets, type WidgetMetadata } from '@/components/dashboard/widgets/registry';
import type { DashboardType, WidgetId } from '@/lib/dashboard/types';

interface AddWidgetsDrawerProps {
  dashboardType: DashboardType;
  currentWidgetIds: WidgetId[];
  onAddWidget: (widgetId: WidgetId) => void;
  trigger?: React.ReactNode;
}

export function AddWidgetsDrawer({
  dashboardType,
  currentWidgetIds,
  onAddWidget,
  trigger,
}: AddWidgetsDrawerProps) {
  const [open, setOpen] = useState(false);
  const availableWidgets = getAvailableWidgets(dashboardType);

  // Group widgets by category
  const widgetsByCategory = availableWidgets.reduce((acc, widget) => {
    const category = widget.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(widget);
    return acc;
  }, {} as Record<string, WidgetMetadata[]>);

  const handleAddWidget = (widgetId: WidgetId) => {
    onAddWidget(widgetId);
    // Don't close drawer - allow adding multiple widgets
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      {trigger || (
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Widgets
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Add Widgets to Dashboard</DrawerTitle>
          <DrawerDescription>
            Select widgets to add to your dashboard. You can reorder them after adding.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-4">
            {Object.entries(widgetsByCategory).map(([category, widgets]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {widgets.map((widget) => {
                    const isAdded = currentWidgetIds.includes(widget.id);
                    return (
                      <div
                        key={widget.id}
                        className={`rounded-lg border p-4 transition-colors ${
                          isAdded
                            ? 'border-muted bg-muted/50'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{widget.label}</h4>
                              {isAdded && (
                                <Badge variant="secondary" className="text-xs">
                                  Added
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {widget.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant={isAdded ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleAddWidget(widget.id)}
                            disabled={isAdded}
                          >
                            {isAdded ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}

