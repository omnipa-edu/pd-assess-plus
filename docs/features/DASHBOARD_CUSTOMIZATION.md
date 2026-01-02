# Dashboard Customization Feature

## Overview
User-customizable dashboards with drag-and-drop layout editing, widget management, and persistent layouts per user.

## Features Implemented

### 1. Edit Mode
- **Wrench Icon**: Small grey wrench icon in dashboard header to enter edit mode
- **Edit Controls**: Save, Cancel, and Reset buttons when in edit mode
- **Visual Indicators**: "Editing dashboard" badge and drag handles on widgets

### 2. Widget Management
- **Drag & Drop**: Reorder widgets by dragging
- **Add Widgets**: Drawer to add widgets from available list
- **Remove Widgets**: Hide widgets from dashboard (doesn't delete data)
- **Collapse/Expand**: Toggle widget collapse state
- **Default Collapse**: Set widgets to start collapsed by default

### 3. Persistence
- Layouts saved per user per dashboard type (learner/supervisor)
- Automatically loads saved layout on page load
- Falls back to default layout if no saved layout exists

## Installation

**Important**: Install required packages first:

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Database Migration

Run the migration to create the `dashboard_layouts` table:

```sql
-- File: supabase/migrations/20251229_dashboard_layouts.sql
```

This creates:
- `dashboard_layouts` table with RLS policies
- Indexes for performance
- Automatic `updated_at` trigger

## Architecture

### Components

1. **`useDashboardLayout` Hook** (`src/hooks/useDashboardLayout.tsx`)
   - Manages layout state and persistence
   - Handles edit mode, reordering, visibility, collapse states
   - Provides save/cancel/reset functionality

2. **`DashboardGrid`** (`src/components/dashboard/DashboardGrid.tsx`)
   - Renders widgets in drag-and-drop grid
   - Shows edit controls when in edit mode
   - Handles widget collapse/expand

3. **`DashboardEditControls`** (`src/components/dashboard/DashboardEditControls.tsx`)
   - Wrench icon and edit mode controls
   - Save/Cancel/Reset buttons
   - Edit mode indicator badge

4. **`AddWidgetsDrawer`** (`src/components/dashboard/AddWidgetsDrawer.tsx`)
   - Drawer for adding widgets
   - Shows available widgets grouped by category
   - Indicates which widgets are already added

5. **Widget Registry** (`src/components/dashboard/widgets/registry.tsx`)
   - Maps widget IDs to React components
   - Defines widget metadata (label, description, category)
   - Validates widget availability per dashboard type

6. **`CustomWidgetRenderer`** (`src/components/dashboard/CustomWidgetRenderer.tsx`)
   - Handles special widgets that need custom props
   - Examples: `readiness_cards`, `recent_assessments`, `statistics_grid`

### Default Layouts

Default widget orders defined in `src/lib/dashboard/defaultLayouts.ts`:
- `defaultLearnerLayout`: Widget order for student dashboard
- `defaultSupervisorLayout`: Widget order for supervisor dashboard

## Widget IDs

### Learner Dashboard Widgets
- `notifications` - Notification center
- `streak_display` - Activity streaks
- `achievement_display` - Achievement badges
- `goals_display` - User goals
- `onboarding_checklist` - Onboarding tasks
- `personalized_plan` - Personalized learning plan
- `learning_plan_card` - Learning plan recommendations
- `coaching_corner` - Coaching corner content
- `readiness_cards` - EPA readiness cards
- `epa_trajectory` - EPA trajectory visualization
- `recent_assessments` - Recent assessments tabs

### Supervisor Dashboard Widgets
- `notifications` - Notification center
- `streak_display` - Activity streaks
- `achievement_display` - Achievement badges
- `goals_display` - User goals
- `onboarding_checklist` - Onboarding tasks
- `coaching_corner` - Coaching corner content
- `cme_summary` - CME time summary
- `teaching_statistics` - Teaching statistics
- `benchmark_comparison` - Benchmark comparison
- `personalized_view` - Personalized supervisor view
- `statistics_grid` - Statistics grid (4 cards)
- `recent_assessments` - Recent assessments

## Usage

### Entering Edit Mode
1. Click the wrench icon in the dashboard header
2. Edit mode activates - drag handles and remove buttons appear
3. "Add Widgets" button appears

### Reordering Widgets
1. In edit mode, drag widgets by their grip handle
2. Drop to reorder
3. Click "Save" to persist changes

### Adding Widgets
1. Click "Add Widgets" button in edit mode
2. Browse available widgets by category
3. Click "Add" on desired widgets
4. Widgets appear in the dashboard
5. Click "Save" to persist

### Removing Widgets
1. In edit mode, click the X button on a widget
2. Widget is hidden (not deleted)
3. Can be re-added via "Add Widgets" drawer
4. Click "Save" to persist

### Collapsing Widgets
1. In edit mode, click the collapse/expand button
2. Widget collapses/expands
3. Set "Start collapsed" toggle to make it default
4. Click "Save" to persist

### Resetting to Default
1. In edit mode, click "Reset"
2. Confirm in dialog
3. Layout resets to default
4. Changes are saved automatically

## Technical Details

### Layout JSON Structure
```typescript
{
  dashboardType: 'learner' | 'supervisor',
  widgets: [
    {
      widgetId: 'streak_display',
      order: 1,
      isVisible: true,
      defaultCollapsed: false,
      userCollapsed: false,
      size: 'md'
    },
    // ... more widgets
  ],
  updatedAt: '2025-12-29T...'
}
```

### Collapse State Logic
- `defaultCollapsed`: Widget starts collapsed on load
- `userCollapsed`: User's explicit collapse preference (overrides default)
- Effective collapsed state: `userCollapsed ?? defaultCollapsed`

### Drag & Drop
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Vertical list sorting strategy
- Keyboard and pointer sensors for accessibility

## Testing

### Manual Testing Checklist
1. ✅ Click wrench icon to enter edit mode
2. ✅ Drag widgets to reorder
3. ✅ Remove widgets (hide them)
4. ✅ Add widgets from drawer
5. ✅ Collapse/expand widgets
6. ✅ Set default collapse state
7. ✅ Save layout
8. ✅ Cancel editing (revert changes)
9. ✅ Reset to default layout
10. ✅ Reload page (layout persists)
11. ✅ Works on mobile (single column)
12. ✅ Works on desktop (multi-column)

## Future Enhancements
- [ ] Widget size customization (sm/md/lg)
- [ ] Multi-column grid layout
- [ ] Widget-specific settings
- [ ] Export/import layouts
- [ ] Share layouts between users
- [ ] Admin dashboard customization

