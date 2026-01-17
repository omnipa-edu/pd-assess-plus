/**
 * Widget Dependency Validation
 * Enforces dependency rules during resize operations
 */

import type { WidgetId, SizePreset, Breakpoint } from './types';
import type { WidgetDependencyRules } from '@/components/dashboard/widgets/registry';
import { getWidgetDefinition } from '@/components/dashboard/widgets/registry';
import { getLaneWidth, getPresetWidth } from './columnUtils';
import { GRID_COLUMNS } from './types';

export interface DependencyValidationResult {
  valid: boolean;
  adjustedW?: number;
  adjustedH?: number;
  adjustedPreset?: SizePreset;
  reason?: string;
}

/**
 * Validate resize against widget dependencies
 */
export function validateDependencyResize(
  widgetId: WidgetId,
  preset: SizePreset,
  w: number,
  h: number,
  columnCount: number,
  breakpoint: Breakpoint
): DependencyValidationResult {
  const definition = getWidgetDefinition(widgetId);
  if (!definition?.dependencyRules) {
    return { valid: true };
  }
  
  const rules = definition.dependencyRules;
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const gridColumns = GRID_COLUMNS[breakpoint];
  
  // Check incompatible presets
  if (rules.incompatibleWithPresets?.includes(preset)) {
    // Find closest compatible preset
    const compatiblePresets: SizePreset[] = ['compact', 'standard', 'wide', 'full'].filter(
      (p) => !rules.incompatibleWithPresets?.includes(p as SizePreset)
    ) as SizePreset[];
    
    if (compatiblePresets.length === 0) {
      return {
        valid: false,
        reason: 'No compatible size presets available for this widget',
      };
    }
    
    // Use standard as fallback
    const fallbackPreset: SizePreset = compatiblePresets.includes('standard')
      ? 'standard'
      : compatiblePresets[0];
    const fallbackW = getPresetWidth(fallbackPreset, columnCount, breakpoint);
    
    return {
      valid: true,
      adjustedW: fallbackW,
      adjustedPreset: fallbackPreset,
      reason: `This widget cannot use ${preset} preset. Using ${fallbackPreset} instead.`,
    };
  }
  
  // Check minimum width requirement
  if (rules.requiresMinWidth && w < rules.requiresMinWidth) {
    const adjustedW = Math.max(w, rules.requiresMinWidth, laneWidth);
    return {
      valid: true,
      adjustedW: Math.min(adjustedW, gridColumns),
      reason: `This widget requires a minimum width of ${rules.requiresMinWidth} grid units.`,
    };
  }
  
  // Check minimum height requirement
  if (rules.requiresMinHeight && h < rules.requiresMinHeight) {
    return {
      valid: true,
      adjustedH: Math.max(h, rules.requiresMinHeight),
      reason: `This widget requires a minimum height of ${rules.requiresMinHeight} grid units.`,
    };
  }
  
  // Check prefers full row
  if (rules.prefersFullRow && preset !== 'full') {
    return {
      valid: true,
      adjustedW: gridColumns,
      adjustedPreset: 'full',
      reason: 'This widget works best at full width.',
    };
  }
  
  return { valid: true };
}

/**
 * Get validation message for display in UI
 */
export function getDependencyMessage(result: DependencyValidationResult): string | null {
  if (result.valid && result.reason) {
    return result.reason;
  }
  if (!result.valid) {
    return result.reason || 'This resize is not allowed for this widget.';
  }
  return null;
}



