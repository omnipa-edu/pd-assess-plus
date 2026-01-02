# Dashboard Customization Engine v3

## Overview
Advanced grid-based dashboard customization system with multi-column layouts, resizable widgets, size presets, breakpoint support, AI recommendations, and audit logging.

## Features Implemented

### ✅ Core Features
- **Grid-based Layout**: 12/8/4 column grids (desktop/tablet/mobile)
- **Resizable Widgets**: Drag and resize widgets with constraints
- **Size Presets**: Compact, Standard, Wide, Full presets
- **Breakpoint Support**: Separate layouts for mobile/tablet/desktop
- **Role Restrictions**: Widgets filtered by user role
- **Visual Preview**: Wireframe preview modal before saving
- **AI Recommendations**: Stub system for AI-suggested layouts
- **Audit Logging**: All layout changes are logged

### ✅ Components Created
1. **DashboardGridV3** - Grid layout using react-grid-layout
2. **WidgetSizePresetMenu** - Dropdown for size presets
3. **LayoutPreviewModal** - Wireframe preview modal
4. **DashboardEditToolbar** - Enhanced toolbar with preview/AI buttons
5. **useDashboardLayoutV3** - Hook with v3 features
6. **useBreakpoint** - Breakpoint detection hook

### ✅ Database Migrations
- `dashboard_layout_audit` - Audit log table
- `dashboard_layout_recommendations` - AI recommendations table
- Updated `dashboard_layouts` to support v3 schema

## Installation

### 1. Install Dependencies
```bash
npm install react-grid-layout @types/react-grid-layout
```

### 2. Run Database Migrations
Execute in Supabase SQL Editor:
- `supabase/migrations/20251229_dashboard_layouts.sql` (if not already run)
- `supabase/migrations/20251229_dashboard_layouts_v3.sql` (new)

## Architecture

### Data Model v3
```typescript
interface DashboardLayoutJson {
  dashboardType: 'learner' | 'supervisor';
  version: 3;
  breakpoints: {
    desktop: WidgetGridLayout[];
    tablet: WidgetGridLayout[];
    mobile: WidgetGridLayout[];
  };
  source: 'user' | 'ai_recommendation';
  updatedAt: string;
}

interface WidgetGridLayout {
  widgetId: string;
  x: number;  // Column position
  y: number;  // Row position
  w: number;  // Width in grid units
  h: number;  // Height in grid units
  isVisible: boolean;
  defaultCollapsed: boolean;
  userCollapsed: boolean;
  sizePreset?: 'compact' | 'standard' | 'wide' | 'full';
  minW: number;
  maxW: number;
  minH?: number;
  maxH?: number;
}
```

### Size Presets
- **Compact**: 3×2 grid units
- **Standard**: 4×3 grid units
- **Wide**: 6×3 grid units
- **Full**: 12×4 grid units

### Grid Columns
- **Desktop**: 12 columns
- **Tablet**: 8 columns
- **Mobile**: 4 columns

## Migration from v2

The system automatically migrates legacy v1/v2 layouts to v3 on first load:
- Converts order-based layout to grid-based
- Creates separate layouts for each breakpoint
- Preserves visibility and collapse states

## Usage

### Basic Integration
```tsx
import { useDashboardLayoutV3 } from '@/hooks/useDashboardLayoutV3';
import { DashboardGridV3 } from '@/components/dashboard/DashboardGridV3';
import { DashboardEditToolbar } from '@/components/dashboard/DashboardEditToolbar';
import { LayoutPreviewModal } from '@/components/dashboard/LayoutPreviewModal';
import { useBreakpoint } from '@/hooks/useBreakpoint';

function MyDashboard() {
  const breakpoint = useBreakpoint();
  const layout = useDashboardLayoutV3({
    dashboardType: 'learner',
    userId: user?.id || '',
    userRoles: ['learner'],
  });

  return (
    <>
      <DashboardEditToolbar
        isEditing={layout.isEditing}
        hasUnsavedChanges={layout.hasUnsavedChanges}
        isSaving={layout.isSaving}
        currentLayout={layout.layout}
        onStartEditing={layout.startEditing}
        onCancel={layout.cancelEditing}
        onSave={layout.saveLayout}
        onReset={layout.resetToDefault}
        onPreview={() => setShowPreview(true)}
        onTryAI={layout.applyAIRecommendation}
      />
      
      <DashboardGridV3
        widgets={layout.visibleWidgets}
        isEditing={layout.isEditing}
        currentBreakpoint={breakpoint}
        renderWidget={renderWidget}
        onLayoutChange={layout.handleLayoutChange}
        onRemove={layout.toggleWidgetVisibility}
        onToggleCollapse={layout.toggleWidgetCollapse}
        onSetDefaultCollapsed={layout.setDefaultCollapsed}
        onPresetChange={layout.applyPreset}
      />
      
      <LayoutPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        layout={layout.layout}
        onAccept={layout.saveLayout}
      />
    </>
  );
}
```

## Widget Registry

Widgets now include role restrictions and default layouts:

```typescript
interface WidgetDefinition {
  id: WidgetId;
  allowedRoles: ('learner' | 'supervisor' | 'admin')[];
  allowedDashboards: ('learner' | 'supervisor')[];
  defaultLayout: {
    desktop: Partial<WidgetGridLayout>;
    tablet: Partial<WidgetGridLayout>;
    mobile: Partial<WidgetGridLayout>;
  };
  supportsResize: boolean;
  supportsCollapse: boolean;
}
```

## Audit Logging

All layout changes are automatically logged:
- `save` - User saves layout
- `reset` - User resets to default
- `apply_ai` - User applies AI recommendation
- `remove_widget` - User removes widget
- `add_widget` - User adds widget
- `resize` - User resizes widget
- `reorder` - User reorders widgets

## AI Recommendations (Stub)

The system includes a stub for AI recommendations:
1. Recommendations stored in `dashboard_layout_recommendations` table
2. Loaded via `loadAIRecommendation()` hook method
3. Applied via `applyAIRecommendation()` hook method
4. Can be extended with actual ML/AI logic later

## Next Steps

### To Complete Integration:
1. ✅ Install `react-grid-layout` package
2. ✅ Run database migrations
3. ⏳ Update `StudentDashboard.tsx` to use v3 components
4. ⏳ Update `SupervisorDashboard.tsx` to use v3 components
5. ⏳ Test across all breakpoints
6. ⏳ Add AI recommendation seeding (optional)

### Example Dashboard Update:
Replace the old `DashboardGrid` usage with:
```tsx
// Old
<DashboardGrid
  widgets={layout.visibleWidgets}
  isEditing={layout.isEditing}
  renderWidget={renderWidget}
  onReorder={layout.moveWidget}
  // ...
/>

// New
<DashboardGridV3
  widgets={layout.visibleWidgets}
  isEditing={layout.isEditing}
  currentBreakpoint={breakpoint}
  renderWidget={renderWidget}
  onLayoutChange={layout.handleLayoutChange}
  onPresetChange={layout.applyPreset}
  // ...
/>
```

## Testing Checklist

- [ ] Install react-grid-layout
- [ ] Run migrations
- [ ] Test drag and drop
- [ ] Test resizing widgets
- [ ] Test size presets
- [ ] Test breakpoint switching
- [ ] Test preview modal
- [ ] Test AI recommendations (stub)
- [ ] Test audit logging
- [ ] Test role restrictions
- [ ] Test mobile/tablet/desktop layouts
- [ ] Test migration from v2

## Known Limitations

1. **AI Recommendations**: Currently stubbed - needs actual ML/AI implementation
2. **Widget Height**: Some widgets may need custom height constraints
3. **Performance**: Large numbers of widgets (>20) may need optimization
4. **Mobile Touch**: Touch interactions may need refinement

## Files Created/Modified

### New Files:
- `supabase/migrations/20251229_dashboard_layouts_v3.sql`
- `src/hooks/useDashboardLayoutV3.tsx`
- `src/hooks/useBreakpoint.tsx`
- `src/components/dashboard/DashboardGridV3.tsx`
- `src/components/dashboard/WidgetSizePresetMenu.tsx`
- `src/components/dashboard/LayoutPreviewModal.tsx`
- `src/components/dashboard/DashboardEditToolbar.tsx`

### Modified Files:
- `src/lib/dashboard/types.ts` - Added v3 types
- `src/lib/dashboard/defaultLayouts.ts` - Added v3 defaults and migration
- `src/components/dashboard/widgets/registry.tsx` - Added role restrictions

