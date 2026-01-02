/**
 * useDashboardLayoutV4 Hook
 * Manages v4 column-based dashboard layout state, persistence, and editing
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { getDefaultLayoutV4, migrateV3ToV4 } from '@/lib/dashboard/defaultLayoutsV4';
import { createColumnIds, getLaneWidth, snapToLane, getPresetWidth, validateResize, getColumnIndex } from '@/lib/dashboard/columnUtils';
import { validateDependencyResize, getDependencyMessage } from '@/lib/dashboard/dependencyValidation';
import type {
  DashboardType,
  WidgetId,
  DashboardLayoutJson,
  DashboardLayoutJsonV3,
  LegacyDashboardLayoutJson,
  Breakpoint,
  ColumnLayout,
  WidgetSettings,
  SizePreset,
} from '@/lib/dashboard/types';
import { GRID_COLUMNS, SIZE_PRESETS } from '@/lib/dashboard/types';

interface UseDashboardLayoutV4Options {
  dashboardType: DashboardType;
  userId: string;
  currentBreakpoint: Breakpoint;
}

export function useDashboardLayoutV4({
  dashboardType,
  userId,
  currentBreakpoint,
}: UseDashboardLayoutV4Options) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLayout, setDraftLayout] = useState<DashboardLayoutJson | null>(null);
  const [savedLayout, setSavedLayout] = useState<DashboardLayoutJson | null>(null);

  // Fetch saved layout from database
  const { data: layoutData, isLoading } = useQuery({
    queryKey: ['dashboard-layout-v4', userId, dashboardType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('dashboard_type', dashboardType)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Dashboard layouts table not found, using default layout');
          return getDefaultLayoutV4(dashboardType);
        }
        console.error('Error fetching dashboard layout:', error);
        return getDefaultLayoutV4(dashboardType);
      }

      if (data?.layout_json) {
        const layout = data.layout_json as any;
        
        // Migrate v3 or legacy to v4
        if (layout.version === 3) {
          return migrateV3ToV4(layout as DashboardLayoutJsonV3);
        }
        if (!layout.version || layout.version < 4) {
          // Legacy v1/v2 - migrate through v3 first
          return getDefaultLayoutV4(dashboardType);
        }
        
        // Already v4
        if (layout.version === 4 && layout.breakpoints) {
          return layout as DashboardLayoutJson;
        }
      }

      return getDefaultLayoutV4(dashboardType);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Initialize saved layout and draft
  useEffect(() => {
    if (layoutData) {
      const v4Layout = layoutData as DashboardLayoutJson;
      setSavedLayout(v4Layout);
      if (!draftLayout) {
        setDraftLayout(JSON.parse(JSON.stringify(v4Layout))); // Deep copy
      }
    }
  }, [layoutData]);

  // Save layout mutation
  const saveMutation = useMutation({
    mutationFn: async (layout: DashboardLayoutJson) => {
      // Log audit entry
      await supabase.from('dashboard_layout_audit').insert({
        user_id: userId,
        dashboard_type: dashboardType,
        action: 'save',
        previous_layout: savedLayout,
        new_layout: layout,
      });

      // Save layout
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: userId,
          dashboard_type: dashboardType,
          version: 4,
          layout_json: layout,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,dashboard_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const layout = data.layout_json as DashboardLayoutJson;
      setSavedLayout(layout);
      setDraftLayout(JSON.parse(JSON.stringify(layout)));
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout-v4', userId, dashboardType] });
    },
  });

  // Get current breakpoint layout
  const currentBreakpointLayout = useMemo(() => {
    if (!draftLayout) return null;
    return draftLayout.breakpoints[currentBreakpoint];
  }, [draftLayout, currentBreakpoint]);

  // Get visible widgets for current breakpoint
  const visibleWidgets = useMemo(() => {
    if (!currentBreakpointLayout) return [];
    
    const widgets: Array<{ widgetId: WidgetId; columnId: string; order: number }> = [];
    
    currentBreakpointLayout.columns.forEach((column) => {
      if (column.isCollapsed) return;
      
      column.widgetOrder.forEach((widgetId, orderIndex) => {
        const settings = currentBreakpointLayout.widgets[widgetId];
        if (settings?.isVisible) {
          widgets.push({
            widgetId,
            columnId: column.columnId,
            order: orderIndex,
          });
        }
      });
    });
    
    return widgets;
  }, [currentBreakpointLayout]);

  // Start editing
  const startEditing = useCallback(() => {
    if (savedLayout) {
      setDraftLayout(JSON.parse(JSON.stringify(savedLayout)));
    }
    setIsEditing(true);
  }, [savedLayout]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    if (savedLayout) {
      setDraftLayout(JSON.parse(JSON.stringify(savedLayout)));
    }
    setIsEditing(false);
  }, [savedLayout]);

  // Save layout
  const saveLayout = useCallback(async () => {
    if (!draftLayout) return;
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      updatedAt: new Date().toISOString(),
    };
    
    // Include pending resize events in save
    await saveMutation.mutateAsync(updatedLayout, {
      resizeEvents: pendingResizeEvents,
    });
    
    // Clear pending events
    setPendingResizeEvents([]);
    setIsEditing(false);
  }, [draftLayout, saveMutation, pendingResizeEvents]);

  // Reset to default
  const resetToDefault = useCallback(async () => {
    const defaultLayout = getDefaultLayoutV4(dashboardType);
    
    // Log audit
    await supabase.from('dashboard_layout_audit').insert({
      user_id: userId,
      dashboard_type: dashboardType,
      action: 'reset',
      previous_layout: savedLayout,
      new_layout: defaultLayout,
    });
    
    setDraftLayout(defaultLayout);
    await saveMutation.mutateAsync(defaultLayout);
    setIsEditing(false);
  }, [dashboardType, userId, savedLayout, saveMutation]);

  // Change column count
  const changeColumnCount = useCallback(async (
    breakpoint: Breakpoint,
    newColumnCount: number
  ) => {
    if (!draftLayout) return;
    
    const currentLayout = draftLayout.breakpoints[breakpoint];
    if (currentLayout.columnCount === newColumnCount) return;
    
    // Redistribute widgets across new columns
    const allWidgetIds: WidgetId[] = [];
    currentLayout.columns.forEach((col) => {
      allWidgetIds.push(...col.widgetOrder);
    });
    
    const newColumnIds = createColumnIds(newColumnCount);
    const widgetsPerColumn = Math.ceil(allWidgetIds.length / newColumnCount);
    
    const newColumns: ColumnLayout[] = newColumnIds.map((columnId, colIndex) => {
      const startIndex = colIndex * widgetsPerColumn;
      const endIndex = Math.min(startIndex + widgetsPerColumn, allWidgetIds.length);
      return {
        columnId,
        isCollapsed: false,
        widgetOrder: allWidgetIds.slice(startIndex, endIndex),
      };
    });
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [breakpoint]: {
          ...currentLayout,
          columnCount: newColumnCount,
          columns: newColumns,
        },
      },
    };
    
    // Log audit
    await supabase.from('dashboard_layout_audit').insert({
      user_id: userId,
      dashboard_type: dashboardType,
      action: 'change_columns',
      previous_layout: draftLayout,
      new_layout: updatedLayout,
      metadata: { breakpoint, newColumnCount },
    });
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, dashboardType, userId]);

  // Move widget between columns
  const moveWidget = useCallback((
    widgetId: WidgetId,
    targetColumnId: string,
    targetOrder: number
  ) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    const updatedColumns = currentBreakpointLayout.columns.map((col) => {
      // Remove from source column
      const newOrder = col.widgetOrder.filter((id) => id !== widgetId);
      
      // Add to target column
      if (col.columnId === targetColumnId) {
        newOrder.splice(targetOrder, 0, widgetId);
      }
      
      return { ...col, widgetOrder: newOrder };
    });
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: {
          ...currentBreakpointLayout,
          columns: updatedColumns,
        },
      },
    };
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback((widgetId: WidgetId) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    const settings = currentBreakpointLayout.widgets[widgetId];
    if (!settings) return;
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: {
          ...currentBreakpointLayout,
          widgets: {
            ...currentBreakpointLayout.widgets,
            [widgetId]: {
              ...settings,
              isVisible: !settings.isVisible,
            },
          },
        },
      },
    };
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint]);

  // Set widget size preset
  const setWidgetSizePreset = useCallback((
    widgetId: WidgetId,
    preset: SizePreset
  ) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    const settings = currentBreakpointLayout.widgets[widgetId];
    if (!settings) return;
    
    // Validate against dependency rules
    const dependencyCheck = validateDependencyResize(
      widgetId,
      preset,
      0, // Will be calculated
      0, // Will be calculated
      currentBreakpointLayout.columnCount,
      currentBreakpoint
    );
    
    // Use adjusted preset if dependency rules require it
    const finalPreset = dependencyCheck.adjustedPreset || preset;
    
    // Calculate new width/height based on preset
    const newW = dependencyCheck.adjustedW || getPresetWidth(finalPreset, currentBreakpointLayout.columnCount, currentBreakpoint);
    const newH = dependencyCheck.adjustedH || SIZE_PRESETS[finalPreset].h;
    
    // Find widget's current column and position
    let widgetColumn: ColumnLayout | undefined;
    let widgetColumnIndex = -1;
    currentBreakpointLayout.columns.forEach((col, idx) => {
      if (col.widgetOrder.includes(widgetId)) {
        widgetColumn = col;
        widgetColumnIndex = idx;
      }
    });
    
    if (!widgetColumn) return;
    
    // Update grid if it exists
    const currentGrid = currentBreakpointLayout.grid || [];
    const gridIndex = currentGrid.findIndex((g) => g.i === widgetId);
    const laneWidth = getLaneWidth(currentBreakpointLayout.columnCount, currentBreakpoint);
    const newX = widgetColumnIndex * laneWidth;
    
    let updatedGrid = [...currentGrid];
    if (gridIndex >= 0) {
      updatedGrid[gridIndex] = {
        ...updatedGrid[gridIndex],
        x: newX,
        w: newW,
        h: newH,
      };
    } else {
      updatedGrid.push({
        i: widgetId,
        x: newX,
        y: 0, // Will be calculated by grid
        w: newW,
        h: newH,
      });
    }
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: {
          ...currentBreakpointLayout,
          widgets: {
            ...currentBreakpointLayout.widgets,
            [widgetId]: {
              ...settings,
              sizePreset: finalPreset,
            },
          },
          grid: updatedGrid,
        },
      },
    };
    
    // Track preset change for audit
    const currentGrid = currentBreakpointLayout.grid || [];
    const oldGridItem = currentGrid.find((g) => g.i === widgetId);
    setPendingResizeEvents((prev) => [
      ...prev,
      {
        widgetId,
        action: 'change_size_preset',
        previous: { preset: settings.sizePreset, w: oldGridItem?.w, h: oldGridItem?.h },
        next: { preset: finalPreset, w: newW, h: newH },
        trigger: 'user',
      },
    ]);
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint, pendingResizeEvents]);

  // Resize widget (free resize)
  const resizeWidget = useCallback((
    widgetId: WidgetId,
    w: number,
    h: number,
    x?: number,
    y?: number
  ) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    const settings = currentBreakpointLayout.widgets[widgetId];
    if (!settings) return;
    
    // Get current grid position
    const currentGrid = currentBreakpointLayout.grid || [];
    const gridItem = currentGrid.find((g) => g.i === widgetId);
    const currentX = x ?? gridItem?.x ?? 0;
    const currentY = y ?? gridItem?.y ?? 0;
    
    // Validate resize
    const validation = validateResize(
      currentX,
      currentY,
      w,
      h,
      currentBreakpointLayout.columnCount,
      currentBreakpoint,
      settings.minW,
      settings.maxW,
      settings.minH,
      settings.maxH
    );
    
    if (!validation.valid) return;
    
    const { adjustedX, adjustedY, adjustedW, adjustedH } = validation;
    
    // Update grid
    const gridIndex = currentGrid.findIndex((g) => g.i === widgetId);
    
    let updatedGrid = [...currentGrid];
    if (gridIndex >= 0) {
      updatedGrid[gridIndex] = {
        ...updatedGrid[gridIndex],
        x: adjustedX ?? updatedGrid[gridIndex].x,
        y: adjustedY ?? updatedGrid[gridIndex].y,
        w: adjustedW ?? w,
        h: adjustedH ?? h,
      };
    } else {
      updatedGrid.push({
        i: widgetId,
        x: adjustedX ?? 0,
        y: adjustedY ?? 0,
        w: adjustedW ?? w,
        h: adjustedH ?? h,
      });
    }
    
    // Determine if preset should be updated based on new size
    const laneWidth = getLaneWidth(currentBreakpointLayout.columnCount, currentBreakpoint);
    const gridColumns = GRID_COLUMNS[currentBreakpoint];
    let newPreset: SizePreset | undefined = settings.sizePreset;
    
    if (adjustedW === gridColumns) {
      newPreset = 'full';
    } else if (adjustedW === laneWidth * 2 && currentBreakpointLayout.columnCount >= 2) {
      newPreset = 'wide';
    } else if (adjustedW === laneWidth) {
      newPreset = 'standard';
    } else if (adjustedW === Math.floor(laneWidth / 2)) {
      newPreset = 'compact';
    }
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: {
          ...currentBreakpointLayout,
          widgets: {
            ...currentBreakpointLayout.widgets,
            [widgetId]: {
              ...settings,
              sizePreset: newPreset,
            },
          },
          grid: updatedGrid,
        },
      },
    };
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint]);

  // Add widget
  const addWidget = useCallback((widgetId: WidgetId) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    // Add to first column
    const firstColumn = currentBreakpointLayout.columns[0];
    const newColumns = currentBreakpointLayout.columns.map((col, idx) => {
      if (idx === 0) {
        return {
          ...col,
          widgetOrder: [...col.widgetOrder, widgetId],
        };
      }
      return col;
    });
    
    // Create widget settings
    const newWidget: WidgetSettings = {
      widgetId,
      isVisible: true,
      defaultCollapsed: false,
      userCollapsed: false,
      sizePreset: 'standard',
      minW: 2,
      maxW: 12,
      minH: 1,
      maxH: 6,
    };
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: {
          ...currentBreakpointLayout,
          columns: newColumns,
          widgets: {
            ...currentBreakpointLayout.widgets,
            [widgetId]: newWidget,
          },
        },
      },
    };
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint]);

  // Toggle widget collapse
  const toggleWidgetCollapse = useCallback((widgetId: WidgetId) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    const settings = currentBreakpointLayout.widgets[widgetId];
    if (!settings) return;
    
    const updatedLayout: DashboardLayoutJson = {
      ...draftLayout,
      breakpoints: {
        ...draftLayout.breakpoints,
        [currentBreakpoint]: {
          ...currentBreakpointLayout,
          widgets: {
            ...currentBreakpointLayout.widgets,
            [widgetId]: {
              ...settings,
              userCollapsed: !settings.userCollapsed,
            },
          },
        },
      },
    };
    
    setDraftLayout(updatedLayout);
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!draftLayout || !savedLayout) return false;
    return JSON.stringify(draftLayout) !== JSON.stringify(savedLayout);
  }, [draftLayout, savedLayout]);

  // Handle grid resize stop - updates grid position and potentially moves widget between columns
  const handleGridResizeStop = useCallback((
    widgetId: WidgetId,
    w: number,
    h: number,
    x: number,
    y: number
  ) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    // Use the resizeWidget function which handles validation
    resizeWidget(widgetId, w, h, x, y);
    
    // Also check if widget moved to a different column and update column structure
    const newColumnIndex = getColumnIndex(x, currentBreakpointLayout.columnCount, currentBreakpoint);
    const currentColumn = currentBreakpointLayout.columns.find((col) =>
      col.widgetOrder.includes(widgetId)
    );
    
    if (currentColumn) {
      const currentColumnIndex = currentBreakpointLayout.columns.findIndex((col) =>
        col.columnId === currentColumn.columnId
      );
      
      // If moved to different column, update column structure
      if (currentColumnIndex !== newColumnIndex && newColumnIndex >= 0) {
        const targetColumn = currentBreakpointLayout.columns[newColumnIndex];
        if (targetColumn) {
          // Remove from old column, add to new column
          const updatedColumns = currentBreakpointLayout.columns.map((col, idx) => {
            if (idx === currentColumnIndex) {
              return {
                ...col,
                widgetOrder: col.widgetOrder.filter((id) => id !== widgetId),
              };
            }
            if (idx === newColumnIndex) {
              return {
                ...col,
                widgetOrder: [...col.widgetOrder, widgetId],
              };
            }
            return col;
          });
          
          const updatedLayout: DashboardLayoutJson = {
            ...draftLayout,
            breakpoints: {
              ...draftLayout.breakpoints,
              [currentBreakpoint]: {
                ...currentBreakpointLayout,
                columns: updatedColumns,
              },
            },
          };
          
          setDraftLayout(updatedLayout);
        }
      }
    }
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint, resizeWidget]);

  // Handle grid drag stop - updates column structure
  const handleGridDragStop = useCallback((
    widgetId: WidgetId,
    x: number,
    y: number
  ) => {
    if (!draftLayout || !currentBreakpointLayout) return;
    
    const laneWidth = getLaneWidth(currentBreakpointLayout.columnCount, currentBreakpoint);
    
    // Determine target column
    const targetColumnIndex = getColumnIndex(x, currentBreakpointLayout.columnCount, currentBreakpoint);
    const targetColumn = currentBreakpointLayout.columns[targetColumnIndex];
    
    if (!targetColumn) return;
    
    // Find current column
    const currentColumn = currentBreakpointLayout.columns.find((col) =>
      col.widgetOrder.includes(widgetId)
    );
    
    if (!currentColumn) return;
    
    const currentColumnIndex = currentBreakpointLayout.columns.findIndex((col) =>
      col.columnId === currentColumn.columnId
    );
    
    // If moved to different column, update structure
    if (currentColumnIndex !== targetColumnIndex) {
      const updatedColumns = currentBreakpointLayout.columns.map((col, idx) => {
        if (idx === currentColumnIndex) {
          return {
            ...col,
            widgetOrder: col.widgetOrder.filter((id) => id !== widgetId),
          };
        }
        if (idx === targetColumnIndex) {
          // Add to end of target column (or calculate position based on Y)
          return {
            ...col,
            widgetOrder: [...col.widgetOrder, widgetId],
          };
        }
        return col;
      });
      
      // Update grid position
      const currentGrid = currentBreakpointLayout.grid || [];
      const gridIndex = currentGrid.findIndex((g) => g.i === widgetId);
      const snappedX = snapToLane(x, currentBreakpointLayout.columnCount, currentBreakpoint);
      
      let updatedGrid = [...currentGrid];
      if (gridIndex >= 0) {
        updatedGrid[gridIndex] = {
          ...updatedGrid[gridIndex],
          x: snappedX,
          y,
        };
      } else {
        updatedGrid.push({
          i: widgetId,
          x: snappedX,
          y,
          w: laneWidth,
          h: 3,
        });
      }
      
      const updatedLayout: DashboardLayoutJson = {
        ...draftLayout,
        breakpoints: {
          ...draftLayout.breakpoints,
          [currentBreakpoint]: {
            ...currentBreakpointLayout,
            columns: updatedColumns,
            grid: updatedGrid,
          },
        },
      };
      
      setDraftLayout(updatedLayout);
    } else {
      // Same column, just update Y position in grid
      const currentGrid = currentBreakpointLayout.grid || [];
      const gridIndex = currentGrid.findIndex((g) => g.i === widgetId);
      
      if (gridIndex >= 0) {
        const updatedGrid = [...currentGrid];
        updatedGrid[gridIndex] = {
          ...updatedGrid[gridIndex],
          y,
        };
        
        const updatedLayout: DashboardLayoutJson = {
          ...draftLayout,
          breakpoints: {
            ...draftLayout.breakpoints,
            [currentBreakpoint]: {
              ...currentBreakpointLayout,
              grid: updatedGrid,
            },
          },
        };
        
        setDraftLayout(updatedLayout);
      }
    }
  }, [draftLayout, currentBreakpointLayout, currentBreakpoint]);

  return {
    layout: draftLayout || getDefaultLayoutV4(dashboardType),
    isLoading,
    isEditing,
    hasUnsavedChanges,
    isSaving: saveMutation.isPending,
    currentBreakpointLayout,
    visibleWidgets,
    startEditing,
    cancelEditing,
    saveLayout,
    resetToDefault,
    changeColumnCount,
    moveWidget,
    toggleWidgetVisibility,
    setWidgetSizePreset,
    addWidget,
    toggleWidgetCollapse,
    resizeWidget,
    handleGridResizeStop,
    handleGridDragStop,
    // Dependency validation helper
    validateDependency: (widgetId: WidgetId, preset: SizePreset, w: number, h: number) => {
      if (!currentBreakpointLayout) return { valid: true };
      return validateDependencyResize(
        widgetId,
        preset,
        w,
        h,
        currentBreakpointLayout.columnCount,
        currentBreakpoint
      );
    },
    getDependencyMessage,
  };
}

