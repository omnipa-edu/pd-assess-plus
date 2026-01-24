/**
 * Dashboard Layout Types v4
 * TypeScript types for column-based dashboard customization with resizable widgets
 */

export type DashboardType = 'learner' | 'supervisor' | 'admin';
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
export type SizePreset = 'compact' | 'standard' | 'wide' | 'full';
export type LayoutSource = 'user' | 'ai_recommendation';
export type WidgetAutoMode = 'manual' | 'auto_collapse' | 'auto_expand';

// Column count constraints
export type ColumnCountDesktop = 1 | 2 | 3 | 4;
export type ColumnCountTablet = 1 | 2;
export type ColumnCountMobile = 1;

export type WidgetId =
  // Learner widgets
  | 'streak_display'
  | 'achievement_display'
  | 'goals_display'
  | 'onboarding_checklist'
  | 'personalized_plan'
  | 'learning_plan_card'
  | 'coaching_corner'
  | 'readiness_cards'
  | 'epa_trajectory'
  | 'recent_assessments'
  // Supervisor widgets
  | 'cme_summary'
  | 'teaching_statistics'
  | 'benchmark_comparison'
  | 'personalized_view'
  | 'statistics_grid'
  // Shared widgets
  | 'notifications'
  // Admin widgets
  | 'admin_stats'
  | 'admin_quick_actions'
  | 'admin_recent_activity'
  | 'admin_onboarding';

/**
 * Widget settings (v4)
 */
export interface WidgetSettings {
  widgetId: WidgetId;
  isVisible: boolean;
  defaultCollapsed: boolean;
  userCollapsed: boolean;
  autoMode?: WidgetAutoMode;
  sizePreset?: SizePreset;
  minW: number;
  maxW: number;
  minH?: number;
  maxH?: number;
}

/**
 * Column layout structure (v4)
 */
export interface ColumnLayout {
  columnId: string; // e.g. 'col-1', 'col-2'
  title?: string; // optional future use
  isCollapsed?: boolean; // persisted column collapsed state
  widgetOrder: WidgetId[]; // ordered list of widget IDs in this column
}

/**
 * Breakpoint layout with columns (v4)
 */
export interface BreakpointLayout {
  columnCount: number; // 1-4 for desktop, 1-2 for tablet, 1 for mobile
  columns: ColumnLayout[]; // length must equal columnCount
  widgets: Record<WidgetId, WidgetSettings>; // widgetId -> settings
  grid?: Array<{ // optional: react-grid-layout positions for pixel-perfect placement
    i: string; // widgetId
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

/**
 * Dashboard layout for v4 (column-based with breakpoints)
 */
export interface DashboardLayoutJson {
  dashboardType: DashboardType;
  version: 4;
  source: LayoutSource;
  breakpoints: Record<Breakpoint, BreakpointLayout>;
  updatedAt: string;
}

/**
 * Grid layout for a single widget (react-grid-layout format) - v3 legacy
 */
export interface WidgetGridLayout {
  widgetId: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  isVisible: boolean;
  defaultCollapsed: boolean;
  userCollapsed: boolean;
  autoMode?: WidgetAutoMode;
  sizePreset?: SizePreset;
  minW: number;
  maxW: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
}

/**
 * Dashboard layout for v3 (grid-based with breakpoints) - legacy
 */
export interface DashboardLayoutJsonV3 {
  dashboardType: DashboardType;
  version: 3;
  breakpoints: Record<Breakpoint, WidgetGridLayout[]>;
  source: LayoutSource;
  updatedAt: string;
}

/**
 * Legacy v1/v2 layout (for migration)
 */
export interface LegacyWidgetLayout {
  widgetId: WidgetId;
  order: number;
  isVisible: boolean;
  defaultCollapsed: boolean;
  userCollapsed: boolean;
  autoMode?: WidgetAutoMode;
  size: 'sm' | 'md' | 'lg';
}

export interface LegacyDashboardLayoutJson {
  dashboardType: DashboardType;
  widgets: LegacyWidgetLayout[];
  updatedAt: string;
}

/**
 * Database row structure
 */
export interface DashboardLayoutRow {
  id: string;
  user_id: string;
  dashboard_type: DashboardType;
  version: number;
  layout_json: DashboardLayoutJson | DashboardLayoutJsonV3 | LegacyDashboardLayoutJson;
  updated_at: string;
  created_at: string;
}

/**
 * Audit log entry (v4)
 */
export interface DashboardLayoutAuditEntry {
  id: string;
  user_id: string;
  dashboard_type: DashboardType;
  action: 'save' | 'reset' | 'apply_ai' | 'change_columns' | 'move_widget' | 'resize_widget' | 'hide_widget' | 'add_widget';
  previous_layout: DashboardLayoutJson | DashboardLayoutJsonV3 | LegacyDashboardLayoutJson | null;
  new_layout: DashboardLayoutJson | DashboardLayoutJsonV3 | LegacyDashboardLayoutJson | null;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * AI Recommendation (v4)
 */
export interface DashboardLayoutRecommendation {
  id: string;
  dashboard_type: DashboardType;
  role: 'learner' | 'supervisor' | 'admin';
  recommendation_json: DashboardLayoutJson;
  rationale: string | null;
  usage_patterns?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Size preset definitions
 */
export const SIZE_PRESETS: Record<SizePreset, { w: number; h: number }> = {
  compact: { w: 3, h: 2 },
  standard: { w: 4, h: 3 },
  wide: { w: 6, h: 3 },
  full: { w: 12, h: 4 },
};

/**
 * Grid column counts per breakpoint
 */
export const GRID_COLUMNS: Record<Breakpoint, number> = {
  mobile: 4,
  tablet: 8,
  desktop: 12,
};
