/**
 * Widget Registry v3
 * Maps widget IDs to their React components and metadata with role restrictions
 */

import { ReactNode } from 'react';

import { AchievementDisplay } from '@/components/achievements/AchievementDisplay';
import { SupervisorBenchmarkView } from '@/components/benchmarks/SupervisorBenchmarkView';
import { EpaTrajectoryView } from '@/components/benchmarks/EpaTrajectoryView';
import { CMESummaryCard } from '@/components/cme/CMESummaryCard';
import { CoachingCornerFeed } from '@/components/coaching/CoachingCornerFeed';
import { GoalsDisplay } from '@/components/goals/GoalsDisplay';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { LearningPlanCard } from '@/components/learningPlans/LearningPlanCard';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { LearnerPersonalizedPlan } from '@/components/personalization/LearnerPersonalizedPlan';
import { SupervisorPersonalizedView } from '@/components/personalization/SupervisorPersonalizedView';
import { TeachingStatisticsCard } from '@/components/teaching/TeachingStatisticsCard';
import { AdminStatsWidget } from '@/components/admin/widgets/AdminStatsWidget';
import { AdminQuickActionsWidget } from '@/components/admin/widgets/AdminQuickActionsWidget';
import { AdminRecentActivityWidget } from '@/components/admin/widgets/AdminRecentActivityWidget';
import { AdminOnboardingWidget } from '@/components/admin/widgets/AdminOnboardingWidget';

import type { WidgetId, DashboardType, WidgetGridLayout, SizePreset } from '@/lib/dashboard/types';

/**
 * Widget dependency rules for intelligent resizing
 */
export interface WidgetDependencyRules {
  requiresMinWidth?: number;        // e.g. charts need width >= 4
  requiresMinHeight?: number;       // e.g. tables need height >= 3
  expandsWith?: WidgetId[];         // widgetIds that should resize together
  prefersFullRow?: boolean;         // e.g. timeline widgets
  incompatibleWithPresets?: SizePreset[]; // presets that don't work for this widget
}

export interface WidgetDefinition {
  id: WidgetId;
  label: string;
  description: string;
  icon?: string;
  category?: string;
  
  // Role restrictions
  allowedRoles: ('learner' | 'supervisor' | 'admin')[];
  allowedDashboards: ('learner' | 'supervisor')[];
  
  // Default layout per breakpoint (v3 legacy)
  defaultLayout: {
    desktop: Partial<WidgetGridLayout>;
    tablet: Partial<WidgetGridLayout>;
    mobile: Partial<WidgetGridLayout>;
  };
  
  // Default placement for v4 (column-aware)
  defaultPlacement?: {
    breakpoint: 'mobile' | 'tablet' | 'desktop';
    columnIndex: number;
    orderIndex: number;
    sizePreset: 'compact' | 'standard' | 'wide' | 'full';
  }[];
  
  // Constraints
  constraints?: {
    minW: number;
    maxW: number;
    minH?: number;
    maxH?: number;
  };
  
  // Dependency rules for intelligent resizing
  dependencyRules?: WidgetDependencyRules;
  
  // Capabilities
  supportsResize: boolean;
  supportsCollapse: boolean;
}

export interface WidgetComponentProps {
  widgetId: WidgetId;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

/**
 * Widget definitions with role restrictions and default layouts
 */
export const widgetDefinitions: WidgetDefinition[] = [
  // Shared widgets
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'View and manage your notifications',
    category: 'General',
    allowedRoles: ['learner', 'supervisor', 'admin'],
    allowedDashboards: ['learner', 'supervisor', 'admin'],
    defaultLayout: {
      desktop: { x: 0, y: 0, w: 3, h: 1, sizePreset: 'compact' },
      tablet: { x: 0, y: 0, w: 2, h: 1, sizePreset: 'compact' },
      mobile: { x: 0, y: 0, w: 4, h: 1, sizePreset: 'compact' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  
  // Learner widgets
  {
    id: 'streak_display',
    label: 'Streak Display',
    description: 'Track your daily activity streaks',
    category: 'Gamification',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 1, w: 4, h: 3, sizePreset: 'standard' },
      tablet: { x: 0, y: 1, w: 4, h: 3, sizePreset: 'standard' },
      mobile: { x: 0, y: 1, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'achievement_display',
    label: 'Achievements',
    description: 'View your unlocked achievements and badges',
    category: 'Gamification',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 4, y: 1, w: 4, h: 3, sizePreset: 'standard' },
      tablet: { x: 4, y: 1, w: 4, h: 3, sizePreset: 'standard' },
      mobile: { x: 0, y: 4, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'goals_display',
    label: 'Goals',
    description: 'Track your learning and development goals',
    category: 'Goals',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 8, y: 1, w: 4, h: 3, sizePreset: 'standard' },
      tablet: { x: 0, y: 4, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 7, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'onboarding_checklist',
    label: 'Onboarding Checklist',
    description: 'Complete your onboarding tasks',
    category: 'Getting Started',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 4, w: 6, h: 3, sizePreset: 'wide' },
      tablet: { x: 0, y: 7, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 10, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'personalized_plan',
    label: 'Personalized Plan',
    description: 'Your personalized learning plan and recommendations',
    category: 'Learning',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 7, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 10, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 13, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'learning_plan_card',
    label: 'Learning Plan',
    description: 'Recommended learning activities and resources',
    category: 'Learning',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 11, w: 6, h: 3, sizePreset: 'wide' },
      tablet: { x: 0, y: 14, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 17, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'coaching_corner',
    label: "Coach's Corner",
    description: 'Inspiring content and coaching tips',
    category: 'Learning',
    allowedRoles: ['learner', 'supervisor'],
    allowedDashboards: ['learner', 'supervisor'],
    defaultLayout: {
      desktop: { x: 0, y: 14, w: 4, h: 3, sizePreset: 'standard' },
      tablet: { x: 0, y: 17, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 20, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'readiness_cards',
    label: 'Readiness Cards',
    description: 'Your EPA readiness progress and metrics',
    category: 'Assessments',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 17, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 20, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 23, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'epa_trajectory',
    label: 'EPA Trajectory',
    description: 'Visualize your EPA assessment trajectory over time',
    category: 'Assessments',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 21, w: 6, h: 3, sizePreset: 'wide' },
      tablet: { x: 0, y: 24, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 27, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'recent_assessments',
    label: 'Recent Assessments',
    description: 'View your recent EPA, direct observation, and narrative assessments',
    category: 'Assessments',
    allowedRoles: ['learner'],
    allowedDashboards: ['learner'],
    defaultLayout: {
      desktop: { x: 0, y: 24, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 27, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 30, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  
  // Supervisor widgets
  {
    id: 'cme_summary',
    label: 'CME Summary',
    description: 'Track your continuing medical education time',
    category: 'Teaching',
    allowedRoles: ['supervisor'],
    allowedDashboards: ['supervisor'],
    defaultLayout: {
      desktop: { x: 4, y: 7, w: 4, h: 3, sizePreset: 'standard' },
      tablet: { x: 0, y: 13, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 15, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'teaching_statistics',
    label: 'Teaching Statistics',
    description: 'View your teaching and feedback statistics',
    category: 'Teaching',
    allowedRoles: ['supervisor'],
    allowedDashboards: ['supervisor'],
    defaultLayout: {
      desktop: { x: 8, y: 7, w: 4, h: 3, sizePreset: 'standard' },
      tablet: { x: 0, y: 16, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 18, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'benchmark_comparison',
    label: 'Benchmark Comparison',
    description: 'Compare student performance against benchmarks',
    category: 'Analytics',
    allowedRoles: ['supervisor'],
    allowedDashboards: ['supervisor'],
    defaultLayout: {
      desktop: { x: 0, y: 10, w: 6, h: 3, sizePreset: 'wide' },
      tablet: { x: 0, y: 19, w: 8, h: 3, sizePreset: 'wide' },
      mobile: { x: 0, y: 21, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'personalized_view',
    label: 'Personalized View',
    description: 'AI-powered insights and recommendations',
    category: 'Analytics',
    allowedRoles: ['supervisor'],
    allowedDashboards: ['supervisor'],
    defaultLayout: {
      desktop: { x: 0, y: 13, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 22, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 24, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'statistics_grid',
    label: 'Statistics Grid',
    description: 'Quick overview of key teaching metrics',
    category: 'Analytics',
    allowedRoles: ['supervisor'],
    allowedDashboards: ['supervisor'],
    defaultLayout: {
      desktop: { x: 0, y: 17, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 26, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 28, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  // Admin widgets
  {
    id: 'admin_onboarding',
    label: 'Admin Onboarding',
    description: 'Recommended setup steps for your institution',
    category: 'Admin',
    allowedRoles: ['admin'],
    allowedDashboards: ['admin'],
    defaultLayout: {
      desktop: { x: 0, y: 0, w: 6, h: 3, sizePreset: 'wide' },
      tablet: { x: 0, y: 0, w: 8, h: 3, sizePreset: 'full' },
      mobile: { x: 0, y: 0, w: 4, h: 3, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'admin_stats',
    label: 'Admin Stats',
    description: 'Institution metrics and key counts',
    category: 'Admin',
    allowedRoles: ['admin'],
    allowedDashboards: ['admin'],
    defaultLayout: {
      desktop: { x: 0, y: 3, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 3, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 3, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'admin_quick_actions',
    label: 'Quick Actions',
    description: 'Shortcuts to common admin tasks',
    category: 'Admin',
    allowedRoles: ['admin'],
    allowedDashboards: ['admin'],
    defaultLayout: {
      desktop: { x: 0, y: 7, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 7, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 7, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
  {
    id: 'admin_recent_activity',
    label: 'Recent Activity',
    description: 'Latest changes across the platform',
    category: 'Admin',
    allowedRoles: ['admin'],
    allowedDashboards: ['admin'],
    defaultLayout: {
      desktop: { x: 0, y: 11, w: 12, h: 4, sizePreset: 'full' },
      tablet: { x: 0, y: 11, w: 8, h: 4, sizePreset: 'full' },
      mobile: { x: 0, y: 11, w: 4, h: 4, sizePreset: 'full' },
    },
    supportsResize: true,
    supportsCollapse: true,
  },
];

/**
 * Get widgets available for a dashboard type and user role
 */
export function getAvailableWidgets(
  dashboardType: DashboardType,
  userRoles: ('learner' | 'supervisor' | 'admin')[] = []
): WidgetDefinition[] {
  return widgetDefinitions.filter((widget) => {
    // Check if widget is allowed for this dashboard type
    if (!widget.allowedDashboards.includes(dashboardType)) {
      return false;
    }
    
    // Check if user has at least one allowed role
    if (userRoles.length === 0) {
      // If no roles provided, show all widgets for the dashboard type
      return true;
    }
    
    return userRoles.some((role) => widget.allowedRoles.includes(role));
  });
}

/**
 * Get widget definition by ID
 */
export function getWidgetDefinition(widgetId: WidgetId): WidgetDefinition | undefined {
  return widgetDefinitions.find((w) => w.id === widgetId);
}

/**
 * Render a widget component by ID
 */
export function renderWidget(
  widgetId: WidgetId,
  props: WidgetComponentProps
): ReactNode {
  const { isCollapsed, onToggleCollapse, className } = props;

  if (isCollapsed) {
    return (
      <div className={className}>
        <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Widget collapsed
        </div>
      </div>
    );
  }

  switch (widgetId) {
    case 'notifications':
      return <NotificationCenter className={className} />;
    case 'streak_display':
      return <StreakDisplay className={className} />;
    case 'achievement_display':
      return <AchievementDisplay className={className} />;
    case 'goals_display':
      return <GoalsDisplay className={className} />;
    case 'onboarding_checklist':
      return <OnboardingChecklist className={className} onTaskClick={() => {}} />;
    case 'personalized_plan':
      return <LearnerPersonalizedPlan className={className} />;
    case 'learning_plan_card':
      return <LearningPlanCard className={className} />;
    case 'coaching_corner':
      return <CoachingCornerFeed role="learner" className={className} />;
    case 'readiness_cards':
    case 'recent_assessments':
      // These are handled by CustomWidgetRenderer
      return null;
    case 'epa_trajectory':
      return <EpaTrajectoryView className={className} />;
    case 'cme_summary':
      return <CMESummaryCard className={className} />;
    case 'teaching_statistics':
      return <TeachingStatisticsCard className={className} />;
    case 'benchmark_comparison':
      return <SupervisorBenchmarkView className={className} />;
    case 'personalized_view':
      return <SupervisorPersonalizedView className={className} />;
    case 'statistics_grid':
      // Handled by CustomWidgetRenderer
      return null;
    case 'admin_onboarding':
      return <AdminOnboardingWidget />;
    case 'admin_stats':
      return <AdminStatsWidget />;
    case 'admin_quick_actions':
      return <AdminQuickActionsWidget />;
    case 'admin_recent_activity':
      return <AdminRecentActivityWidget />;
    default:
      console.warn(`Unknown widget ID: ${widgetId}`);
      return (
        <div className={className}>
          <div className="rounded-lg border bg-destructive/10 p-4 text-center text-sm text-destructive">
            Unknown widget: {widgetId}
          </div>
        </div>
      );
  }
}

/**
 * Legacy widget registry (for backward compatibility)
 */
export const widgetRegistry: Record<DashboardType, Array<{ id: WidgetId; label: string; description: string; category?: string }>> = {
  learner: widgetDefinitions
    .filter((w) => w.allowedDashboards.includes('learner'))
    .map((w) => ({
      id: w.id,
      label: w.label,
      description: w.description,
      category: w.category,
    })),
  supervisor: widgetDefinitions
    .filter((w) => w.allowedDashboards.includes('supervisor'))
    .map((w) => ({
      id: w.id,
      label: w.label,
      description: w.description,
      category: w.category,
    })),
  admin: widgetDefinitions
    .filter((w) => w.allowedDashboards.includes('admin'))
    .map((w) => ({
      id: w.id,
      label: w.label,
      description: w.description,
      category: w.category,
    })),
};
