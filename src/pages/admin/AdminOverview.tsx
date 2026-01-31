/**
 * AdminOverview Page
 * Main dashboard for administrators with key metrics and quick actions
 */

import { BookOpen, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute';
import { DashboardCustomizeSidebar } from '@/components/dashboard/DashboardCustomizeSidebar';
import { DashboardEditControls } from '@/components/dashboard/DashboardEditControls';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { renderWidget } from '@/components/dashboard/widgets/registry';
import { ResourceLibraryDialog } from '@/components/resources/ResourceLibraryDialog';
import { Button } from '@/components/ui/button';
import { DashboardGridSkeleton } from '@/components/ui/skeleton-loaders';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import type { WidgetId } from '@/lib/dashboard/types';
import { useState } from 'react';

const AdminOverview = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const dashboardLayout = useDashboardLayout({
    dashboardType: 'admin',
    userId: user?.id || '',
  });

  const handleSaveLayout = async () => {
    try {
      await dashboardLayout.saveLayout();
      toast({
        title: 'Dashboard saved',
        description: 'Your admin dashboard layout has been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save dashboard layout.',
        variant: 'destructive',
      });
    }
  };

  const renderWidgetContent = (widgetId: WidgetId, isCollapsed: boolean) => {
    return renderWidget(widgetId, {
      widgetId,
      isCollapsed,
      onToggleCollapse: () => dashboardLayout.toggleWidgetCollapse(widgetId),
      className: '',
    });
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Console</h1>
              <p className="mt-2 text-muted-foreground">
                Manage users, organizations, and assessment frameworks
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setAddResourceOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add resource
              </Button>
              <Button variant="outline" asChild>
                <Link to="/admin/resources">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View resources
                </Link>
              </Button>
              <DashboardEditControls
              isEditing={dashboardLayout.isEditing}
              hasUnsavedChanges={dashboardLayout.hasUnsavedChanges}
              isSaving={dashboardLayout.isSaving}
              onStartEditing={dashboardLayout.startEditing}
              onCancel={dashboardLayout.cancelEditing}
              onSave={handleSaveLayout}
              onReset={dashboardLayout.resetToDefault}
            />
            </div>
          </div>

          <ResourceLibraryDialog
            open={addResourceOpen}
            onOpenChange={setAddResourceOpen}
          />

          <DashboardCustomizeSidebar
            open={dashboardLayout.isEditing}
            onOpenChange={(open) => {
              if (!open) {
                dashboardLayout.cancelEditing();
              } else {
                dashboardLayout.startEditing();
              }
            }}
            widgets={dashboardLayout.layout.widgets}
            onReorder={dashboardLayout.moveWidget}
            onRemove={dashboardLayout.toggleWidgetVisibility}
            onToggleVisibility={dashboardLayout.toggleWidgetVisibility}
            onToggleCollapse={dashboardLayout.toggleWidgetCollapse}
            onSetDefaultCollapsed={dashboardLayout.setDefaultCollapsed}
            onSetAutoMode={dashboardLayout.setAutoMode}
            onSetSizePreset={dashboardLayout.setWidgetSizePreset}
            onAddWidget={dashboardLayout.addWidget}
            onSave={handleSaveLayout}
            onCancel={dashboardLayout.cancelEditing}
            onReset={dashboardLayout.resetToDefault}
            hasUnsavedChanges={dashboardLayout.hasUnsavedChanges}
            isSaving={dashboardLayout.isSaving}
            dashboardType="admin"
          />

          {dashboardLayout.isLoading ? (
            <DashboardGridSkeleton cards={3} />
          ) : (
            <DashboardGrid
              widgets={dashboardLayout.visibleWidgets}
              isEditing={dashboardLayout.isEditing}
              renderWidget={renderWidgetContent}
              onReorder={dashboardLayout.moveWidget}
              onRemove={dashboardLayout.toggleWidgetVisibility}
              onToggleCollapse={dashboardLayout.toggleWidgetCollapse}
              onSetDefaultCollapsed={dashboardLayout.setDefaultCollapsed}
            />
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
};

export default AdminOverview;

