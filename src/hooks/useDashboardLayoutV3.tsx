/**
 * useDashboardLayout Hook v3
 * Manages advanced grid-based dashboard layout with breakpoints, presets, and audit logging
 */

import { useState, useEffect, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from 'react-grid-layout';

import { supabase } from '@/integrations/supabase/client';
import { getDefaultLayout, migrateLegacyLayout } from '@/lib/dashboard/defaultLayouts';
import { SIZE_PRESETS } from '@/lib/dashboard/types';
import type {
  DashboardType,
  DashboardLayoutJson,
  WidgetGridLayout,
  WidgetId,
  Breakpoint,
  SizePreset,
} from '@/lib/dashboard/types';
import { getWidgetDefinition } from '@/components/dashboard/widgets/registry';

interface UseDashboardLayoutV3Options {
  dashboardType: DashboardType;
  userId: string;
  userRoles?: ('learner' | 'supervisor' | 'admin')[];
}

export function useDashboardLayoutV3({ 
  dashboardType, 
  userId,
  userRoles = [],
}: UseDashboardLayoutV3Options) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLayout, setDraftLayout] = useState<DashboardLayoutJson | null>(null);
  const [savedLayout, setSavedLayout] = useState<DashboardLayoutJson | null>(null);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('desktop');

  // Fetch saved layout from database
  const { data: layoutData, isLoading } = useQuery({
    queryKey: ['dashboard-layout-v3', userId, dashboardType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('dashboard_type', dashboardType)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Dashboard layouts table not found, using default layout');
          return getDefaultLayout(dashboardType);
        }
        console.error('Error fetching dashboard layout:', error);
        return getDefaultLayout(dashboardType);
      }

      if (data?.layout_json) {
        const layout = data.layout_json as any;
        
        // Migrate legacy layouts to v3
        if (layout.version !== 3 || !layout.breakpoints) {
          console.log('Migrating legacy layout to v3');
          return migrateLegacyLayout(layout);
        }
        
        return layout as DashboardLayoutJson;
      }

      return getDefaultLayout(dashboardType);
    },
    staleTime: 5 * 60 * 1000,
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

  // Log audit entry
  const logAudit = useCallback(async (
    action: 'save' | 'reset' | 'apply_ai' | 'remove_widget' | 'add_widget' | 'resize' | 'reorder',
    previousLayout: DashboardLayoutJson | null,
    newLayout: DashboardLayoutJson | null,
    metadata: Record<string, any> = {}
  ) => {
    try {
      await supabase.from('dashboard_layout_audit').insert({
        user_id: userId,
        dashboard_type: dashboardType,
        action,
        previous_layout: previousLayout,
        new_layout: newLayout,
        metadata,
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging failure shouldn't break the app
    }
  }, [userId, dashboardType]);

  // Save layout mutation
  const saveMutation = useMutation({
    mutationFn: async (layout: DashboardLayoutJson) => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: userId,
          dashboard_type: dashboardType,
          layout_json: layout,
          version: 3,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,dashboard_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data.layout_json as DashboardLayoutJson;
    },
    onSuccess: async (saved) => {
      // Log audit
      await logAudit('save', savedLayout, saved);
      
      setSavedLayout(saved);
      setDraftLayout(saved);
      setIsEditing(false);
      queryClient.setQueryData(['dashboard-layout-v3', userId, dashboardType], saved);
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout-v3', userId, dashboardType] });
    },
  });

  // Start editing mode
  const startEditing = useCallback(() => {
    setIsEditing(true);
    if (savedLayout) {
      setDraftLayout({ ...savedLayout });
    }
  }, [savedLayout]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    if (savedLayout) {
      setDraftLayout({ ...savedLayout });
    }
  }, [savedLayout]);

  // Save current draft layout
  const saveLayout = useCallback(async () => {
    if (!draftLayout) return;
    
    const layoutToSave: DashboardLayoutJson = {
      ...draftLayout,
      updatedAt: new Date().toISOString(),
    };
    
    await saveMutation.mutateAsync(layoutToSave);
  }, [draftLayout, saveMutation]);

  // Reset to default layout
  const resetToDefault = useCallback(async () => {
    const defaultLayout = getDefaultLayout(dashboardType);
    setDraftLayout(defaultLayout);
    await saveMutation.mutateAsync(defaultLayout);
    await logAudit('reset', savedLayout, defaultLayout);
  }, [dashboardType, saveMutation, savedLayout, logAudit]);

  // Handle layout change from react-grid-layout
  const handleLayoutChange = useCallback((layouts: Layout[]) => {
    if (!draftLayout || !isEditing) return;

    const updatedWidgets = draftLayout.breakpoints[currentBreakpoint].map((widget) => {
      const layout = layouts.find((l) => l.i === widget.widgetId);
      if (!layout) return widget;

      return {
        ...widget,
        x: layout.x,
        y: layout.y,
        w: layout.w,
        h: layout.h,
      };
    });

    setDraftLayout({
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: updatedWidgets,
      },
    });
  }, [draftLayout, isEditing, currentBreakpoint]);

  // Apply size preset to widget
  const applyPreset = useCallback((widgetId: WidgetId, preset: SizePreset) => {
    if (!draftLayout) return;

    const { w, h } = SIZE_PRESETS[preset];
    const maxW = currentBreakpoint === 'desktop' ? 12 : currentBreakpoint === 'tablet' ? 8 : 4;

    const updatedWidgets = draftLayout.breakpoints[currentBreakpoint].map((widget) => {
      if (widget.widgetId !== widgetId) return widget;

      return {
        ...widget,
        w: Math.min(w, maxW),
        h,
        sizePreset: preset,
        x: Math.min(widget.x, maxW - Math.min(w, maxW)), // Ensure widget fits
      };
    });

    setDraftLayout({
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: updatedWidgets,
      },
    });
  }, [draftLayout, currentBreakpoint]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: WidgetId) => {
    if (!draftLayout) return;

    const updateBreakpoint = (widgets: WidgetGridLayout[]) =>
      widgets.map((w) => (w.widgetId === widgetId ? { ...w, isVisible: !w.isVisible } : w));

    setDraftLayout({
      ...draftLayout,
      breakpoints: {
        desktop: updateBreakpoint(draftLayout.breakpoints.desktop),
        tablet: updateBreakpoint(draftLayout.breakpoints.tablet),
        mobile: updateBreakpoint(draftLayout.breakpoints.mobile),
      },
    });

    logAudit('remove_widget', savedLayout, draftLayout, { widgetId });
  }, [draftLayout, savedLayout, logAudit]);

  // Toggle widget collapse
  const toggleWidgetCollapse = useCallback((widgetId: WidgetId) => {
    if (!draftLayout) return;

    const updateBreakpoint = (widgets: WidgetGridLayout[]) =>
      widgets.map((w) => {
        if (w.widgetId !== widgetId) return w;
        const currentlyCollapsed = w.userCollapsed ?? w.defaultCollapsed;
        return { ...w, userCollapsed: !currentlyCollapsed };
      });

    setDraftLayout({
      ...draftLayout,
      breakpoints: {
        desktop: updateBreakpoint(draftLayout.breakpoints.desktop),
        tablet: updateBreakpoint(draftLayout.breakpoints.tablet),
        mobile: updateBreakpoint(draftLayout.breakpoints.mobile),
      },
    });
  }, [draftLayout]);

  // Set default collapsed state
  const setDefaultCollapsed = useCallback((widgetId: WidgetId, collapsed: boolean) => {
    if (!draftLayout) return;

    const updateBreakpoint = (widgets: WidgetGridLayout[]) =>
      widgets.map((w) => (w.widgetId === widgetId ? { ...w, defaultCollapsed: collapsed } : w));

    setDraftLayout({
      ...draftLayout,
      breakpoints: {
        desktop: updateBreakpoint(draftLayout.breakpoints.desktop),
        tablet: updateBreakpoint(draftLayout.breakpoints.tablet),
        mobile: updateBreakpoint(draftLayout.breakpoints.mobile),
      },
    });
  }, [draftLayout]);

  // Add widget to layout
  const addWidget = useCallback((widgetId: WidgetId) => {
    if (!draftLayout) return;

    const definition = getWidgetDefinition(widgetId);
    if (!definition) return;

    // Check if widget already exists
    const exists = draftLayout.breakpoints.desktop.some((w) => w.widgetId === widgetId);
    if (exists) {
      // Make it visible
      const updateBreakpoint = (widgets: WidgetGridLayout[]) =>
        widgets.map((w) => (w.widgetId === widgetId ? { ...w, isVisible: true } : w));

      setDraftLayout({
        ...draftLayout,
        breakpoints: {
          desktop: updateBreakpoint(draftLayout.breakpoints.desktop),
          tablet: updateBreakpoint(draftLayout.breakpoints.tablet),
          mobile: updateBreakpoint(draftLayout.breakpoints.mobile),
        },
      });
      return;
    }

    // Add new widget using default layout
    const newWidgetDesktop: WidgetGridLayout = {
      widgetId,
      x: definition.defaultLayout.desktop.x || 0,
      y: definition.defaultLayout.desktop.y || 0,
      w: definition.defaultLayout.desktop.w || 4,
      h: definition.defaultLayout.desktop.h || 3,
      isVisible: true,
      defaultCollapsed: false,
      userCollapsed: false,
      sizePreset: 'standard',
      minW: 2,
      maxW: 12,
      minH: 1,
      maxH: 6,
      ...definition.defaultLayout.desktop,
    };

    const newWidgetTablet: WidgetGridLayout = {
      ...newWidgetDesktop,
      x: definition.defaultLayout.tablet.x || 0,
      y: definition.defaultLayout.tablet.y || 0,
      w: definition.defaultLayout.tablet.w || 4,
      h: definition.defaultLayout.tablet.h || 3,
      maxW: 8,
      ...definition.defaultLayout.tablet,
    };

    const newWidgetMobile: WidgetGridLayout = {
      ...newWidgetDesktop,
      x: definition.defaultLayout.mobile.x || 0,
      y: definition.defaultLayout.mobile.y || 0,
      w: definition.defaultLayout.mobile.w || 4,
      h: definition.defaultLayout.mobile.h || 3,
      maxW: 4,
      ...definition.defaultLayout.mobile,
    };

    setDraftLayout({
      ...draftLayout,
      breakpoints: {
        desktop: [...draftLayout.breakpoints.desktop, newWidgetDesktop],
        tablet: [...draftLayout.breakpoints.tablet, newWidgetTablet],
        mobile: [...draftLayout.breakpoints.mobile, newWidgetMobile],
      },
    });

    logAudit('add_widget', savedLayout, draftLayout, { widgetId });
  }, [draftLayout, savedLayout, logAudit]);

  // Get visible widgets for current breakpoint
  const visibleWidgets = draftLayout
    ? draftLayout.breakpoints[currentBreakpoint].filter((w) => w.isVisible)
    : [];

  // Get widget by ID
  const getWidget = useCallback((widgetId: WidgetId): WidgetGridLayout | undefined => {
    return draftLayout?.breakpoints[currentBreakpoint].find((w) => w.widgetId === widgetId);
  }, [draftLayout, currentBreakpoint]);

  // Load AI recommendation (stub)
  const loadAIRecommendation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_layout_recommendations')
        .select('*')
        .eq('dashboard_type', dashboardType)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        console.warn('No AI recommendation available');
        return null;
      }

      return data.recommendation_json as DashboardLayoutJson;
    } catch (error) {
      console.error('Error loading AI recommendation:', error);
      return null;
    }
  }, [dashboardType]);

  // Apply AI recommendation
  const applyAIRecommendation = useCallback(async () => {
    const recommendation = await loadAIRecommendation();
    if (!recommendation) return;

    recommendation.source = 'ai_recommendation';
    setDraftLayout(recommendation);
    await saveMutation.mutateAsync(recommendation);
    await logAudit('apply_ai', savedLayout, recommendation);
  }, [loadAIRecommendation, saveMutation, savedLayout, logAudit]);

  return {
    // Layout data
    layout: draftLayout || savedLayout || getDefaultLayout(dashboardType),
    savedLayout,
    isLoading,
    currentBreakpoint,
    setCurrentBreakpoint,
    
    // Edit mode
    isEditing,
    startEditing,
    cancelEditing,
    
    // Actions
    saveLayout,
    resetToDefault,
    handleLayoutChange,
    applyPreset,
    toggleWidgetVisibility,
    toggleWidgetCollapse,
    setDefaultCollapsed,
    addWidget,
    applyAIRecommendation,
    
    // Computed
    visibleWidgets,
    getWidget,
    
    // Status
    isSaving: saveMutation.isPending,
    hasUnsavedChanges: isEditing && JSON.stringify(draftLayout) !== JSON.stringify(savedLayout),
  };
}

