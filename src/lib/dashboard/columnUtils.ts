/**
 * Column Layout Utilities
 * Helper functions for column-based dashboard layouts
 */

import type { Breakpoint, ColumnCountDesktop, ColumnCountTablet, ColumnCountMobile, WidgetId, SizePreset } from './types';
import { GRID_COLUMNS, SIZE_PRESETS } from './types';

/**
 * Get valid column counts for a breakpoint
 */
export function getValidColumnCounts(breakpoint: Breakpoint): number[] {
  switch (breakpoint) {
    case 'desktop':
      return [1, 2, 3, 4];
    case 'tablet':
      return [1, 2];
    case 'mobile':
      return [1];
    default:
      return [1];
  }
}

/**
 * Calculate lane width in grid units for a given column count and breakpoint
 */
export function getLaneWidth(columnCount: number, breakpoint: Breakpoint): number {
  const gridColumns = GRID_COLUMNS[breakpoint];
  return Math.floor(gridColumns / columnCount);
}

/**
 * Calculate which column (lane) a widget is in based on its x position
 */
export function getColumnIndex(x: number, columnCount: number, breakpoint: Breakpoint): number {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  return Math.floor(x / laneWidth);
}

/**
 * Snap x position to lane boundaries
 */
export function snapToLane(x: number, columnCount: number, breakpoint: Breakpoint): number {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const columnIndex = Math.floor(x / laneWidth);
  return columnIndex * laneWidth;
}

/**
 * Get the x position range for a column
 */
export function getColumnXRange(columnIndex: number, columnCount: number, breakpoint: Breakpoint): { min: number; max: number } {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const gridColumns = GRID_COLUMNS[breakpoint];
  
  return {
    min: columnIndex * laneWidth,
    max: Math.min((columnIndex + 1) * laneWidth, gridColumns),
  };
}

/**
 * Calculate widget width for a size preset within a column
 */
export function getPresetWidth(
  preset: SizePreset,
  columnCount: number,
  breakpoint: Breakpoint
): number {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const gridColumns = GRID_COLUMNS[breakpoint];
  
  switch (preset) {
    case 'compact':
      // Half lane width, but minimum 1 grid unit
      return Math.max(1, Math.floor(laneWidth / 2));
    case 'standard':
      // Full lane width
      return laneWidth;
    case 'wide':
      // Two lanes, but only if columnCount allows
      if (columnCount >= 2) {
        return Math.min(laneWidth * 2, gridColumns);
      }
      // Fallback to full lane if only 1 column
      return laneWidth;
    case 'full':
      // Entire dashboard width
      return gridColumns;
    default:
      return laneWidth;
  }
}

/**
 * Validate that a widget's width respects column boundaries
 */
export function validateWidgetWidth(
  x: number,
  w: number,
  columnCount: number,
  breakpoint: Breakpoint
): { valid: boolean; adjustedX?: number; adjustedW?: number } {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const gridColumns = GRID_COLUMNS[breakpoint];
  const columnIndex = getColumnIndex(x, columnCount, breakpoint);
  const columnRange = getColumnXRange(columnIndex, columnCount, breakpoint);
  
  // If widget spans multiple columns, check if it's allowed
  const endX = x + w;
  const endColumnIndex = getColumnIndex(endX - 1, columnCount, breakpoint);
  
  // Widget can span multiple columns if it's wide or full preset
  // For now, allow any width as long as it doesn't exceed grid
  if (w > gridColumns) {
    return { valid: false, adjustedW: gridColumns };
  }
  
  // Snap x to lane boundary
  const snappedX = snapToLane(x, columnCount, breakpoint);
  
  return { valid: true, adjustedX: snappedX };
}

/**
 * Validate and adjust resize operation to respect column boundaries
 */
export function validateResize(
  x: number,
  y: number,
  w: number,
  h: number,
  columnCount: number,
  breakpoint: Breakpoint,
  minW: number = 2,
  maxW: number = 12,
  minH: number = 1,
  maxH: number = 6
): { valid: boolean; adjustedX?: number; adjustedY?: number; adjustedW?: number; adjustedH?: number } {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const gridColumns = GRID_COLUMNS[breakpoint];
  
  // Clamp width to min/max
  let adjustedW = Math.max(minW, Math.min(w, maxW, gridColumns));
  
  // Clamp height to min/max
  let adjustedH = Math.max(minH, Math.min(h, maxH));
  
  // Snap x to lane boundary
  let adjustedX = snapToLane(x, columnCount, breakpoint);
  
  // Ensure widget doesn't exceed grid boundaries
  if (adjustedX + adjustedW > gridColumns) {
    adjustedX = Math.max(0, gridColumns - adjustedW);
  }
  
  // Check if width spans columns correctly
  const startColumn = getColumnIndex(adjustedX, columnCount, breakpoint);
  const endColumn = getColumnIndex(adjustedX + adjustedW - 1, columnCount, breakpoint);
  
  // Allow full width or exact column spans
  if (adjustedW === gridColumns) {
    // Full width is always valid
    return { valid: true, adjustedX: 0, adjustedY: y, adjustedW, adjustedH };
  }
  
  // Check if width is a multiple of lane width (standard case)
  if (adjustedW % laneWidth === 0) {
    return { valid: true, adjustedX, adjustedY: y, adjustedW, adjustedH };
  }
  
  // If not a perfect multiple, snap to nearest valid width
  const lanes = Math.round(adjustedW / laneWidth);
  adjustedW = Math.max(laneWidth, lanes * laneWidth);
  
  // Ensure it doesn't exceed max
  adjustedW = Math.min(adjustedW, maxW, gridColumns);
  
  return { valid: true, adjustedX, adjustedY: y, adjustedW, adjustedH };
}

/**
 * Snap resize dimensions to lane boundaries
 */
export function snapResizeToLanes(
  x: number,
  w: number,
  columnCount: number,
  breakpoint: Breakpoint
): { x: number; w: number } {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  const gridColumns = GRID_COLUMNS[breakpoint];
  
  // Snap x to lane start
  const snappedX = snapToLane(x, columnCount, breakpoint);
  
  // Snap width to lane multiples
  const lanes = Math.round(w / laneWidth);
  const snappedW = Math.max(laneWidth, lanes * laneWidth);
  
  // Ensure it doesn't exceed grid
  const finalW = Math.min(snappedW, gridColumns);
  
  // Adjust x if needed to keep widget in bounds
  const finalX = Math.max(0, Math.min(snappedX, gridColumns - finalW));
  
  return { x: finalX, w: finalW };
}

/**
 * Determine if a preset is compatible with current column layout
 */
export function isPresetCompatible(
  preset: SizePreset,
  columnCount: number,
  breakpoint: Breakpoint
): { compatible: boolean; reason?: string } {
  const laneWidth = getLaneWidth(columnCount, breakpoint);
  
  switch (preset) {
    case 'compact':
    case 'standard':
      // Always compatible
      return { compatible: true };
    case 'wide':
      // Requires at least 2 columns
      if (columnCount < 2) {
        return {
          compatible: false,
          reason: 'Wide preset requires at least 2 columns',
        };
      }
      return { compatible: true };
    case 'full':
      // Always compatible (spans all columns)
      return { compatible: true };
    default:
      return { compatible: true };
  }
}

/**
 * Create column IDs for a given column count
 */
export function createColumnIds(columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, i) => `col-${i + 1}`);
}

