/**
 * Default Dashboard Layouts v3
 * Grid-based layouts with breakpoint support
 */

import type { DashboardLayoutJson, WidgetGridLayout, Breakpoint, SizePreset } from './types';
import { SIZE_PRESETS, GRID_COLUMNS } from './types';

/**
 * Create default grid layout for a widget
 */
function createWidgetLayout(
  widgetId: string,
  x: number,
  y: number,
  preset: SizePreset = 'standard',
  breakpoint: Breakpoint = 'desktop'
): WidgetGridLayout {
  const { w, h } = SIZE_PRESETS[preset];
  const maxW = GRID_COLUMNS[breakpoint];
  
  return {
    widgetId: widgetId as any,
    x: Math.min(x, maxW - w), // Ensure widget fits
    y,
    w,
    h,
    isVisible: true,
    defaultCollapsed: false,
    userCollapsed: false,
    autoMode: 'manual',
    sizePreset: preset,
    minW: 2,
    maxW: maxW,
    minH: 1,
    maxH: 6,
  };
}

/**
 * Default widget order and positions for Learner Dashboard
 */
export const defaultLearnerLayout: DashboardLayoutJson = {
  dashboardType: 'learner',
  version: 3,
  source: 'user',
  breakpoints: {
    desktop: [
      createWidgetLayout('notifications', 0, 0, 'compact', 'desktop'),
      createWidgetLayout('streak_display', 0, 1, 'standard', 'desktop'),
      createWidgetLayout('achievement_display', 4, 1, 'standard', 'desktop'),
      createWidgetLayout('goals_display', 8, 1, 'standard', 'desktop'),
      createWidgetLayout('onboarding_checklist', 0, 4, 'wide', 'desktop'),
      createWidgetLayout('personalized_plan', 0, 7, 'full', 'desktop'),
      createWidgetLayout('learning_plan_card', 0, 11, 'wide', 'desktop'),
      createWidgetLayout('coaching_corner', 0, 14, 'standard', 'desktop'),
      createWidgetLayout('readiness_cards', 0, 17, 'full', 'desktop'),
      createWidgetLayout('epa_trajectory', 0, 21, 'wide', 'desktop'),
      createWidgetLayout('recent_assessments', 0, 24, 'full', 'desktop'),
    ],
    tablet: [
      createWidgetLayout('notifications', 0, 0, 'compact', 'tablet'),
      createWidgetLayout('streak_display', 0, 1, 'standard', 'tablet'),
      createWidgetLayout('achievement_display', 4, 1, 'standard', 'tablet'),
      createWidgetLayout('goals_display', 0, 4, 'wide', 'tablet'),
      createWidgetLayout('onboarding_checklist', 0, 7, 'wide', 'tablet'),
      createWidgetLayout('personalized_plan', 0, 10, 'full', 'tablet'),
      createWidgetLayout('learning_plan_card', 0, 14, 'wide', 'tablet'),
      createWidgetLayout('coaching_corner', 0, 17, 'wide', 'tablet'),
      createWidgetLayout('readiness_cards', 0, 20, 'full', 'tablet'),
      createWidgetLayout('epa_trajectory', 0, 24, 'wide', 'tablet'),
      createWidgetLayout('recent_assessments', 0, 27, 'full', 'tablet'),
    ],
    mobile: [
      createWidgetLayout('notifications', 0, 0, 'compact', 'mobile'),
      createWidgetLayout('streak_display', 0, 1, 'full', 'mobile'),
      createWidgetLayout('achievement_display', 0, 3, 'full', 'mobile'),
      createWidgetLayout('goals_display', 0, 6, 'full', 'mobile'),
      createWidgetLayout('onboarding_checklist', 0, 9, 'full', 'mobile'),
      createWidgetLayout('personalized_plan', 0, 12, 'full', 'mobile'),
      createWidgetLayout('learning_plan_card', 0, 16, 'full', 'mobile'),
      createWidgetLayout('coaching_corner', 0, 20, 'full', 'mobile'),
      createWidgetLayout('readiness_cards', 0, 24, 'full', 'mobile'),
      createWidgetLayout('epa_trajectory', 0, 28, 'full', 'mobile'),
      createWidgetLayout('recent_assessments', 0, 32, 'full', 'mobile'),
    ],
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Default widget order and positions for Supervisor Dashboard
 */
export const defaultSupervisorLayout: DashboardLayoutJson = {
  dashboardType: 'supervisor',
  version: 3,
  source: 'user',
  breakpoints: {
    desktop: [
      createWidgetLayout('notifications', 0, 0, 'compact', 'desktop'),
      createWidgetLayout('streak_display', 0, 1, 'standard', 'desktop'),
      createWidgetLayout('achievement_display', 4, 1, 'standard', 'desktop'),
      createWidgetLayout('goals_display', 8, 1, 'standard', 'desktop'),
      createWidgetLayout('onboarding_checklist', 0, 4, 'wide', 'desktop'),
      createWidgetLayout('coaching_corner', 0, 7, 'standard', 'desktop'),
      createWidgetLayout('cme_summary', 4, 7, 'standard', 'desktop'),
      createWidgetLayout('teaching_statistics', 8, 7, 'standard', 'desktop'),
      createWidgetLayout('benchmark_comparison', 0, 10, 'wide', 'desktop'),
      createWidgetLayout('personalized_view', 0, 13, 'full', 'desktop'),
      createWidgetLayout('statistics_grid', 0, 17, 'full', 'desktop'),
      createWidgetLayout('recent_assessments', 0, 21, 'full', 'desktop'),
    ],
    tablet: [
      createWidgetLayout('notifications', 0, 0, 'compact', 'tablet'),
      createWidgetLayout('streak_display', 0, 1, 'standard', 'tablet'),
      createWidgetLayout('achievement_display', 4, 1, 'standard', 'tablet'),
      createWidgetLayout('goals_display', 0, 4, 'wide', 'tablet'),
      createWidgetLayout('onboarding_checklist', 0, 7, 'wide', 'tablet'),
      createWidgetLayout('coaching_corner', 0, 10, 'wide', 'tablet'),
      createWidgetLayout('cme_summary', 0, 13, 'wide', 'tablet'),
      createWidgetLayout('teaching_statistics', 0, 16, 'wide', 'tablet'),
      createWidgetLayout('benchmark_comparison', 0, 19, 'full', 'tablet'),
      createWidgetLayout('personalized_view', 0, 23, 'full', 'tablet'),
      createWidgetLayout('statistics_grid', 0, 27, 'full', 'tablet'),
      createWidgetLayout('recent_assessments', 0, 31, 'full', 'tablet'),
    ],
    mobile: [
      createWidgetLayout('notifications', 0, 0, 'compact', 'mobile'),
      createWidgetLayout('streak_display', 0, 1, 'full', 'mobile'),
      createWidgetLayout('achievement_display', 0, 3, 'full', 'mobile'),
      createWidgetLayout('goals_display', 0, 6, 'full', 'mobile'),
      createWidgetLayout('onboarding_checklist', 0, 9, 'full', 'mobile'),
      createWidgetLayout('coaching_corner', 0, 12, 'full', 'mobile'),
      createWidgetLayout('cme_summary', 0, 15, 'full', 'mobile'),
      createWidgetLayout('teaching_statistics', 0, 18, 'full', 'mobile'),
      createWidgetLayout('benchmark_comparison', 0, 21, 'full', 'mobile'),
      createWidgetLayout('personalized_view', 0, 24, 'full', 'mobile'),
      createWidgetLayout('statistics_grid', 0, 28, 'full', 'mobile'),
      createWidgetLayout('recent_assessments', 0, 32, 'full', 'mobile'),
    ],
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Get default layout for a dashboard type
 */
export const defaultAdminLayout: DashboardLayoutJson = {
  dashboardType: 'admin',
  version: 3,
  source: 'user',
  breakpoints: {
    desktop: [
      createWidgetLayout('admin_onboarding', 0, 0, 'wide', 'desktop'),
      createWidgetLayout('admin_stats', 0, 3, 'full', 'desktop'),
      createWidgetLayout('admin_quick_actions', 0, 7, 'full', 'desktop'),
      createWidgetLayout('admin_recent_activity', 0, 11, 'full', 'desktop'),
      createWidgetLayout('admin_resource_library', 0, 15, 'full', 'desktop'),
    ],
    tablet: [
      createWidgetLayout('admin_onboarding', 0, 0, 'full', 'tablet'),
      createWidgetLayout('admin_stats', 0, 3, 'full', 'tablet'),
      createWidgetLayout('admin_quick_actions', 0, 7, 'full', 'tablet'),
      createWidgetLayout('admin_recent_activity', 0, 11, 'full', 'tablet'),
      createWidgetLayout('admin_resource_library', 0, 15, 'full', 'tablet'),
    ],
    mobile: [
      createWidgetLayout('admin_onboarding', 0, 0, 'full', 'mobile'),
      createWidgetLayout('admin_stats', 0, 3, 'full', 'mobile'),
      createWidgetLayout('admin_quick_actions', 0, 7, 'full', 'mobile'),
      createWidgetLayout('admin_recent_activity', 0, 11, 'full', 'mobile'),
      createWidgetLayout('admin_resource_library', 0, 15, 'full', 'mobile'),
    ],
  },
  updatedAt: new Date().toISOString(),
};

export function getDefaultLayout(dashboardType: 'learner' | 'supervisor' | 'admin'): DashboardLayoutJson {
  if (dashboardType === 'admin') return defaultAdminLayout;
  return dashboardType === 'learner' ? defaultLearnerLayout : defaultSupervisorLayout;
}

/**
 * Migrate legacy v1/v2 layout to v3
 */
export function migrateLegacyLayout(legacy: any): DashboardLayoutJson {
  const dashboardType = legacy.dashboardType || 'learner';
  const defaultLayout = getDefaultLayout(dashboardType);
  
  // If it's already v3, return as-is
  if (legacy.version === 3 && legacy.breakpoints) {
    return legacy as DashboardLayoutJson;
  }
  
  // Migrate from v1/v2: convert order-based to grid-based
  const widgets = legacy.widgets || [];
  const desktop: WidgetGridLayout[] = [];
  const tablet: WidgetGridLayout[] = [];
  const mobile: WidgetGridLayout[] = [];
  
  let y = 0;
  widgets.forEach((widget: any, index: number) => {
    if (!widget.isVisible) return;
    
    const preset: SizePreset = widget.size === 'sm' ? 'compact' : 
                                widget.size === 'lg' ? 'wide' : 'standard';
    
    const desktopLayout = createWidgetLayout(widget.widgetId, 0, y, preset, 'desktop');
    const tabletLayout = createWidgetLayout(widget.widgetId, 0, y, preset, 'tablet');
    const mobileLayout = createWidgetLayout(widget.widgetId, 0, y, 'full', 'mobile');
    
    desktopLayout.defaultCollapsed = widget.defaultCollapsed || false;
    desktopLayout.userCollapsed = widget.userCollapsed || false;
    desktopLayout.autoMode = widget.autoMode || 'manual';
    tabletLayout.defaultCollapsed = widget.defaultCollapsed || false;
    tabletLayout.userCollapsed = widget.userCollapsed || false;
    tabletLayout.autoMode = widget.autoMode || 'manual';
    mobileLayout.defaultCollapsed = widget.defaultCollapsed || false;
    mobileLayout.userCollapsed = widget.userCollapsed || false;
    mobileLayout.autoMode = widget.autoMode || 'manual';
    
    desktop.push(desktopLayout);
    tablet.push(tabletLayout);
    mobile.push(mobileLayout);
    
    y += desktopLayout.h + 1; // Add spacing
  });
  
  return {
    dashboardType,
    version: 3,
    source: 'user',
    breakpoints: { desktop, tablet, mobile },
    updatedAt: new Date().toISOString(),
  };
}
