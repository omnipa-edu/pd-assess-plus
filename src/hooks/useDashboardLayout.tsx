/**
 * useDashboardLayout Hook
 * Manages dashboard layout state, persistence, and editing
 */

import { useState, useEffect, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { getDefaultLayout } from '@/lib/dashboard/defaultLayouts';
import { getDashboardSuggestions, getWidgetMetrics, type ResizeSuggestion, type WidgetInteractionMetrics } from '@/lib/dashboard/aiSuggestions';
import type {
  DashboardType,
  WidgetId,
  LegacyDashboardLayoutJson,
  LegacyWidgetLayout,
  SizePreset,
} from '@/lib/dashboard/types';

interface UseDashboardLayoutOptions {
  dashboardType: DashboardType;
  userId: string;
}

export function useDashboardLayout({ dashboardType, userId }: UseDashboardLayoutOptions) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLayout, setDraftLayout] = useState<LegacyDashboardLayoutJson | null>(null);
  const [savedLayout, setSavedLayout] = useState<LegacyDashboardLayoutJson | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<ResizeSuggestion[]>([]);

  // Fetch saved layout from database
  const { data: layoutData, isLoading } = useQuery({
    queryKey: ['dashboard-layout', userId, dashboardType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('dashboard_type', dashboardType)
        .maybeSingle();

      // Handle errors gracefully - if table doesn't exist or no data, use default
      if (error) {
        // PGRST116 is "not found" - that's okay, we'll use default
        // 406 might mean table doesn't exist yet (migration not run)
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Dashboard layouts table not found or no data, using default layout:', error.message);
          return getDefaultLayout(dashboardType);
        }
        console.error('Error fetching dashboard layout:', error);
        // For other errors, still return default to prevent breaking the app
        return getDefaultLayout(dashboardType);
      }

      if (data?.layout_json) {
        const layout = data.layout_json as any;
        
        // Check if it's v3 layout (has breakpoints) - if so, we need to use v3 hook
        // For now, migrate it to v2 format for backward compatibility
        if (layout.version === 3 && layout.breakpoints) {
          console.warn('v3 layout detected but using v2 hook. Consider migrating to useDashboardLayoutV3.');
          // Return default for now - v3 layouts should use v3 hook
          return getDefaultLayout(dashboardType) as any;
        }
        
        // Ensure it has widgets array (v2 format)
        if (!layout.widgets) {
          return getDefaultLayout(dashboardType) as any;
        }
        
        return layout as LegacyDashboardLayoutJson;
      }

      // No saved layout, return default
      return getDefaultLayout(dashboardType);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize saved layout and draft
  useEffect(() => {
    if (layoutData) {
      setSavedLayout(layoutData);
      if (!isEditing) {
        setDraftLayout(layoutData);
      }
    }
  }, [layoutData, isEditing]);

  // Generate AI suggestions when editing starts
  useEffect(() => {
    if (!isEditing || !draftLayout) {
      setAISuggestions([]);
      return;
    }

    // Check if layout has widgets array (v2 format)
    const widgets = (draftLayout as LegacyDashboardLayoutJson).widgets;
    if (!widgets || !Array.isArray(widgets)) {
      setAISuggestions([]);
      return;
    }

    // Collect metrics for all visible widgets
    const metrics = widgets
      .map((widget) => getWidgetMetrics(widget.widgetId))
      .filter((m): m is WidgetInteractionMetrics => m !== null);

    if (metrics.length > 0) {
      // Convert v2 layout to format expected by getDashboardSuggestions
      // Map v2 'size' to v4 'sizePreset'
      const sizeToPreset = (size: 'sm' | 'md' | 'lg'): SizePreset => {
        if (size === 'sm') return 'compact';
        if (size === 'lg') return 'wide';
        return 'standard';
      };
      
      const currentLayout = {
        breakpoints: {
          desktop: {
            widgets: widgets.reduce((acc, widget) => {
              const sizePreset = sizeToPreset(widget.size || 'md');
              acc[widget.widgetId] = {
                sizePreset,
              };
              return acc;
            }, {} as Record<WidgetId, { sizePreset: SizePreset }>),
          },
        },
      };
      
      const suggestions = getDashboardSuggestions(
        metrics,
        currentLayout,
        2 // Default column count for v2
      );
      setAISuggestions(suggestions);
    } else {
      setAISuggestions([]);
    }
  }, [isEditing, draftLayout]);

  // Save layout mutation
  const saveMutation = useMutation({
    mutationFn: async (layout: LegacyDashboardLayoutJson) => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: userId,
          dashboard_type: dashboardType,
          layout_json: layout,
          version: 1,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,dashboard_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data.layout_json as LegacyDashboardLayoutJson;
    },
    onSuccess: (saved) => {
      setSavedLayout(saved);
      setDraftLayout(saved);
      setIsEditing(false);
      queryClient.setQueryData(['dashboard-layout', userId, dashboardType], saved);
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout', userId, dashboardType] });
    },
  });

  // Start editing mode
  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (savedLayout) {
      setDraftLayout({ ...savedLayout });
    }
  }, [savedLayout]);

  // Cancel editing and revert to saved layout
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    if (savedLayout) {
      setDraftLayout({ ...savedLayout });
    }
  }, [savedLayout]);

  // Save current draft layout
  const saveLayout = useCallback(async () => {
    if (!draftLayout) return;
    
    const layoutToSave: LegacyDashboardLayoutJson = {
      ...draftLayout,
      updatedAt: new Date().toISOString(),
    };
    
    await saveMutation.mutateAsync(layoutToSave);
  }, [draftLayout, saveMutation]);

  // Reset to default layout
  const resetToDefault = useCallback(async () => {
    const defaultV3Layout = getDefaultLayout(dashboardType === 'admin' ? 'learner' : dashboardType);
    const defaultV2Layout: LegacyDashboardLayoutJson = {
      dashboardType: dashboardType === 'admin' ? 'learner' : dashboardType,
      widgets: defaultV3Layout.breakpoints?.desktop?.map((w, idx) => ({
        widgetId: w.widgetId,
        order: idx,
        isVisible: w.isVisible,
        defaultCollapsed: w.defaultCollapsed,
        userCollapsed: w.userCollapsed,
        size: w.sizePreset === 'compact' ? 'sm' : w.sizePreset === 'wide' ? 'lg' : 'md',
      })) || [],
      updatedAt: new Date().toISOString(),
    };
    setDraftLayout(defaultV2Layout);
    await saveMutation.mutateAsync(defaultV2Layout);
  }, [dashboardType, saveMutation]);

  // Move widget to new position
  const moveWidget = useCallback((widgetId: WidgetId, newOrder: number) => {
    if (!draftLayout || !draftLayout.widgets) return;

    const updatedWidgets = [...draftLayout.widgets];
    const widgetIndex = updatedWidgets.findIndex((w) => w.widgetId === widgetId);
    
    if (widgetIndex === -1) return;

    const widget = updatedWidgets[widgetIndex];
    const oldOrder = widget.order;

    // Update the moved widget's order
    widget.order = newOrder;

    // Shift other widgets
    updatedWidgets.forEach((w) => {
      if (w.widgetId !== widgetId) {
        if (oldOrder < newOrder) {
          // Moving down: shift widgets between old and new position up
          if (w.order > oldOrder && w.order <= newOrder) {
            w.order -= 1;
          }
        } else {
          // Moving up: shift widgets between new and old position down
          if (w.order >= newOrder && w.order < oldOrder) {
            w.order += 1;
          }
        }
      }
    });

    setDraftLayout({
      ...draftLayout,
      widgets: updatedWidgets.sort((a, b) => a.order - b.order),
    });
  }, [draftLayout]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: WidgetId) => {
    if (!draftLayout || !draftLayout.widgets) return;

    const updatedWidgets = draftLayout.widgets.map((w) =>
      w.widgetId === widgetId ? { ...w, isVisible: !w.isVisible } : w
    );

    setDraftLayout({
      ...draftLayout,
      widgets: updatedWidgets,
    });
  }, [draftLayout]);

  // Toggle widget collapse state
  const toggleWidgetCollapse = useCallback((widgetId: WidgetId) => {
    if (!draftLayout || !draftLayout.widgets) return;

    const updatedWidgets = draftLayout.widgets.map((w) => {
      if (w.widgetId !== widgetId) return w;
      const currentlyCollapsed = w.userCollapsed ?? w.defaultCollapsed;
      return { ...w, userCollapsed: !currentlyCollapsed };
    });

    setDraftLayout({
      ...draftLayout,
      widgets: updatedWidgets,
    });
  }, [draftLayout]);

  // Set default collapsed state for a widget
  const setDefaultCollapsed = useCallback((widgetId: WidgetId, collapsed: boolean) => {
    if (!draftLayout || !draftLayout.widgets) return;

    const updatedWidgets = draftLayout.widgets.map((w) =>
      w.widgetId === widgetId ? { ...w, defaultCollapsed: collapsed } : w
    );

    setDraftLayout({
      ...draftLayout,
      widgets: updatedWidgets,
    });
  }, [draftLayout]);

  // Set widget size preset
  const setWidgetSizePreset = useCallback((widgetId: WidgetId, preset: SizePreset) => {
    if (!draftLayout || !draftLayout.widgets) return;

    // Map v4 preset to v2 size
    const presetToSize = (preset: SizePreset): 'sm' | 'md' | 'lg' => {
      if (preset === 'compact') return 'sm';
      if (preset === 'wide' || preset === 'full') return 'lg';
      return 'md';
    };

    const updatedWidgets = draftLayout.widgets.map((w) =>
      w.widgetId === widgetId ? { ...w, size: presetToSize(preset) } : w
    );

    setDraftLayout({
      ...draftLayout,
      widgets: updatedWidgets,
    });
  }, [draftLayout]);

  // Add widget to layout
  const addWidget = useCallback((widgetId: WidgetId) => {
    if (!draftLayout || !draftLayout.widgets) return;

    // Check if widget already exists
    const exists = draftLayout.widgets.some((w) => w.widgetId === widgetId);
    if (exists) {
      // If it exists but is hidden, make it visible
      const updatedWidgets = draftLayout.widgets.map((w) =>
        w.widgetId === widgetId ? { ...w, isVisible: true } : w
      );
      setDraftLayout({
        ...draftLayout,
        widgets: updatedWidgets,
      });
      return;
    }

    // Add new widget at the end
    const maxOrder = Math.max(...draftLayout.widgets.map((w) => w.order), -1);
    const newWidget: LegacyWidgetLayout = {
      widgetId,
      order: maxOrder + 1,
      isVisible: true,
      defaultCollapsed: false,
      userCollapsed: false,
      size: 'md',
    };

    setDraftLayout({
      ...draftLayout,
      widgets: [...draftLayout.widgets, newWidget].sort((a, b) => a.order - b.order),
    });
  }, [draftLayout]);

  // Get visible widgets sorted by order
  const visibleWidgets = draftLayout && draftLayout.widgets
    ? draftLayout.widgets
        .filter((w) => w.isVisible)
        .sort((a, b) => a.order - b.order)
    : [];

  // Get widget by ID
  const getWidget = useCallback((widgetId: WidgetId): LegacyWidgetLayout | undefined => {
    return draftLayout?.widgets.find((w) => w.widgetId === widgetId);
  }, [draftLayout]);

  // Ensure we always return a valid v2 layout with widgets array
  const defaultLayout = getDefaultLayout(dashboardType === 'admin' ? 'learner' : dashboardType) as any;
  const defaultV2Layout: LegacyDashboardLayoutJson = {
    dashboardType: dashboardType === 'admin' ? 'learner' : dashboardType,
    widgets: defaultLayout.breakpoints?.desktop?.map((w, idx) => ({
      widgetId: w.widgetId,
      order: idx,
      isVisible: w.isVisible,
      defaultCollapsed: w.defaultCollapsed,
      userCollapsed: w.userCollapsed,
      size: w.sizePreset === 'compact' ? 'sm' : w.sizePreset === 'wide' ? 'lg' : 'md',
    })) || [],
    updatedAt: new Date().toISOString(),
  };

  const currentLayout = draftLayout || savedLayout || defaultV2Layout;
  const safeLayout = currentLayout && currentLayout.widgets 
    ? currentLayout 
    : defaultV2Layout;

  return {
    // Layout data
    layout: safeLayout,
    savedLayout: savedLayout && savedLayout.widgets ? savedLayout : null,
    isLoading,
    
    // Edit mode
    isEditing,
    startEditing,
    cancelEditing,
    
    // Actions
    saveLayout,
    resetToDefault,
    moveWidget,
    toggleWidgetVisibility,
    toggleWidgetCollapse,
    setDefaultCollapsed,
    setWidgetSizePreset,
    addWidget,
    
    // Computed
    visibleWidgets: safeLayout && safeLayout.widgets
      ? safeLayout.widgets.filter((w) => w.isVisible).sort((a, b) => a.order - b.order)
      : [],
    getWidget,
    
    // Status
    isSaving: saveMutation.isPending,
    hasUnsavedChanges: isEditing && draftLayout !== savedLayout,
    
    // AI Suggestions
    aiSuggestions,
    applyAISuggestion: useCallback((widgetId: WidgetId, preset: SizePreset) => {
      if (!draftLayout) return;
      
      // Map v4 preset to v2 size
      const presetToSize = (preset: SizePreset): 'sm' | 'md' | 'lg' => {
        if (preset === 'compact') return 'sm';
        if (preset === 'wide' || preset === 'full') return 'lg';
        return 'md';
      };
      
      const layout = draftLayout as LegacyDashboardLayoutJson;
      if (!layout.widgets) return;
      
      const updatedWidgets = layout.widgets.map((w) =>
        w.widgetId === widgetId
          ? { ...w, size: presetToSize(preset) }
          : w
      );
      
      setDraftLayout({
        ...layout,
        widgets: updatedWidgets,
      });
    }, [draftLayout]),
  };
}

