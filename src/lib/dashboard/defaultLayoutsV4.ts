/**
 * Default Dashboard Layouts v4
 * Column-based layouts with breakpoint support
 */

import type {
  DashboardLayoutJson,
  BreakpointLayout,
  ColumnLayout,
  WidgetSettings,
  DashboardType,
  Breakpoint,
  WidgetId,
  SizePreset,
} from './types';
import { GRID_COLUMNS, SIZE_PRESETS } from './types';
import { getLaneWidth, getPresetWidth, createColumnIds } from './columnUtils';

/**
 * Create default widget settings
 */
function createWidgetSettings(
  widgetId: WidgetId,
  preset: SizePreset = 'standard',
  isVisible: boolean = true
): WidgetSettings {
  const { w, h } = SIZE_PRESETS[preset];
  
  return {
    widgetId,
    isVisible,
    defaultCollapsed: false,
    userCollapsed: false,
    sizePreset: preset,
    minW: 2,
    maxW: 12,
    minH: 1,
    maxH: 6,
  };
}

/**
 * Create default breakpoint layout with columns
 */
function createBreakpointLayout(
  widgetIds: WidgetId[],
  columnCount: number,
  breakpoint: Breakpoint,
  widgetPresets: Record<WidgetId, SizePreset> = {}
): BreakpointLayout {
  const columnIds = createColumnIds(columnCount);
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  
  // Distribute widgets across columns
  const columns: ColumnLayout[] = columnIds.map((columnId, colIndex) => {
    // Calculate which widgets go in this column
    const widgetsPerColumn = Math.ceil(widgetIds.length / columnCount);
    const startIndex = colIndex * widgetsPerColumn;
    const endIndex = Math.min(startIndex + widgetsPerColumn, widgetIds.length);
    const columnWidgets = widgetIds.slice(startIndex, endIndex);
    
    return {
      columnId,
      isCollapsed: false,
      widgetOrder: columnWidgets,
    };
  });
  
  // Create widget settings
  const widgets: Record<WidgetId, WidgetSettings> = {};
  widgetIds.forEach((widgetId) => {
    const preset = widgetPresets[widgetId] || 'standard';
    widgets[widgetId] = createWidgetSettings(widgetId, preset);
  });
  
  return {
    columnCount,
    columns,
    widgets,
  };
}

/**
 * Default Learner Dashboard Layout v4
 */
export function getDefaultLearnerLayoutV4(): DashboardLayoutJson {
  const learnerWidgets: WidgetId[] = [
    'notifications',
    'streak_display',
    'achievement_display',
    'goals_display',
    'onboarding_checklist',
    'personalized_plan',
    'learning_plan_card',
    'coaching_corner',
    'readiness_cards',
    'epa_trajectory',
    'recent_assessments',
  ];
  
  const widgetPresets: Record<WidgetId, SizePreset> = {
    notifications: 'compact',
    streak_display: 'standard',
    achievement_display: 'standard',
    goals_display: 'standard',
    onboarding_checklist: 'wide',
    personalized_plan: 'full',
    learning_plan_card: 'wide',
    coaching_corner: 'standard',
    readiness_cards: 'full',
    epa_trajectory: 'wide',
    recent_assessments: 'full',
  };
  
  return {
    dashboardType: 'learner',
    version: 4,
    source: 'user',
    breakpoints: {
      desktop: createBreakpointLayout(learnerWidgets, 2, 'desktop', widgetPresets),
      tablet: createBreakpointLayout(learnerWidgets, 2, 'tablet', widgetPresets),
      mobile: createBreakpointLayout(learnerWidgets, 1, 'mobile', widgetPresets),
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Default Supervisor Dashboard Layout v4
 */
export function getDefaultSupervisorLayoutV4(): DashboardLayoutJson {
  const supervisorWidgets: WidgetId[] = [
    'notifications',
    'cme_summary',
    'teaching_statistics',
    'benchmark_comparison',
    'personalized_view',
    'statistics_grid',
    'coaching_corner',
  ];
  
  const widgetPresets: Record<WidgetId, SizePreset> = {
    notifications: 'compact',
    cme_summary: 'standard',
    teaching_statistics: 'standard',
    benchmark_comparison: 'wide',
    personalized_view: 'full',
    statistics_grid: 'full',
    coaching_corner: 'standard',
  };
  
  return {
    dashboardType: 'supervisor',
    version: 4,
    source: 'user',
    breakpoints: {
      desktop: createBreakpointLayout(supervisorWidgets, 2, 'desktop', widgetPresets),
      tablet: createBreakpointLayout(supervisorWidgets, 2, 'tablet', widgetPresets),
      mobile: createBreakpointLayout(supervisorWidgets, 1, 'mobile', widgetPresets),
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get default v4 layout for a dashboard type
 */
export function getDefaultLayoutV4(dashboardType: DashboardType): DashboardLayoutJson {
  if (dashboardType === 'learner') {
    return getDefaultLearnerLayoutV4();
  }
  return getDefaultSupervisorLayoutV4();
}

/**
 * Migrate v3 layout to v4
 */
export function migrateV3ToV4(v3Layout: any): DashboardLayoutJson {
  const dashboardType = v3Layout.dashboardType || 'learner';
  const defaultV4 = getDefaultLayoutV4(dashboardType);
  
  // If it's already v4, return as-is
  if (v3Layout.version === 4 && v3Layout.breakpoints) {
    return v3Layout as DashboardLayoutJson;
  }
  
  // Migrate each breakpoint
  const breakpoints: Record<Breakpoint, BreakpointLayout> = {
    desktop: migrateBreakpoint(v3Layout.breakpoints?.desktop || [], 'desktop', 2),
    tablet: migrateBreakpoint(v3Layout.breakpoints?.tablet || [], 'tablet', 2),
    mobile: migrateBreakpoint(v3Layout.breakpoints?.mobile || [], 'mobile', 1),
  };
  
  return {
    dashboardType,
    version: 4,
    source: v3Layout.source || 'user',
    breakpoints,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Migrate a single breakpoint from v3 to v4
 */
function migrateBreakpoint(
  v3Widgets: any[],
  breakpoint: Breakpoint,
  defaultColumnCount: number
): BreakpointLayout {
  // Extract visible widgets
  const visibleWidgets = v3Widgets.filter((w: any) => w.isVisible);
  const widgetIds = visibleWidgets.map((w: any) => w.widgetId);
  
  // Create columns
  const columnCount = defaultColumnCount;
  const columnIds = createColumnIds(columnCount);
  const widgetsPerColumn = Math.ceil(widgetIds.length / columnCount);
  
  const columns: ColumnLayout[] = columnIds.map((columnId, colIndex) => {
    const startIndex = colIndex * widgetsPerColumn;
    const endIndex = Math.min(startIndex + widgetsPerColumn, widgetIds.length);
    return {
      columnId,
      isCollapsed: false,
      widgetOrder: widgetIds.slice(startIndex, endIndex),
    };
  });
  
  // Create widget settings from v3 data
  const widgets: Record<WidgetId, WidgetSettings> = {};
  visibleWidgets.forEach((v3Widget: any) => {
    widgets[v3Widget.widgetId] = {
      widgetId: v3Widget.widgetId,
      isVisible: true,
      defaultCollapsed: v3Widget.defaultCollapsed || false,
      userCollapsed: v3Widget.userCollapsed || false,
      sizePreset: v3Widget.sizePreset || 'standard',
      minW: v3Widget.minW || 2,
      maxW: v3Widget.maxW || 12,
      minH: v3Widget.minH || 1,
      maxH: v3Widget.maxH || 6,
    };
  });
  
  return {
    columnCount,
    columns,
    widgets,
  };
}


