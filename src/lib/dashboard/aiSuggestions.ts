/**
 * AI-Driven Auto-Resize Suggestions
 * Rules-based system for suggesting optimal widget sizes
 */

import type { WidgetId, SizePreset, DashboardType } from './types';

export interface WidgetInteractionMetrics {
  widgetId: WidgetId;
  viewCount: number;
  expandedCount: number;
  collapsedCount: number;
  averageViewDuration: number;
  scrollDetected: boolean;
  lastInteraction: Date;
}

export interface ResizeSuggestion {
  widgetId: WidgetId;
  suggestedPreset: SizePreset;
  rationale: string;
  confidence: number; // 0-1
  trigger: 'usage_pattern' | 'content_clipping' | 'device_optimization';
}

/**
 * Calculate resize suggestion based on interaction metrics
 */
export function calculateResizeSuggestion(
  metrics: WidgetInteractionMetrics,
  currentPreset: SizePreset,
  columnCount: number
): ResizeSuggestion | null {
  // Rule 1: Frequently expanded widgets should be wider
  if (metrics.viewCount > 10) {
    const expansionRatio = metrics.expandedCount / metrics.viewCount;
    
    if (expansionRatio > 0.7 && currentPreset === 'standard') {
      if (columnCount >= 2) {
        return {
          widgetId: metrics.widgetId,
          suggestedPreset: 'wide',
          rationale: `Based on how often you expand this widget (${Math.round(expansionRatio * 100)}% of views), a wider layout may work better.`,
          confidence: Math.min(expansionRatio, 0.9),
          trigger: 'usage_pattern',
        };
      }
    }
    
    // Rule 2: Rarely expanded widgets could be compact
    if (expansionRatio < 0.2 && currentPreset === 'standard') {
      return {
        widgetId: metrics.widgetId,
        suggestedPreset: 'compact',
        rationale: `You rarely expand this widget. A more compact layout might save space.`,
        confidence: 1 - expansionRatio,
        trigger: 'usage_pattern',
      };
    }
  }
  
  // Rule 3: Scroll detected suggests need for more height/width
  if (metrics.scrollDetected && currentPreset !== 'full') {
    return {
      widgetId: metrics.widgetId,
      suggestedPreset: currentPreset === 'compact' ? 'standard' : 'wide',
      rationale: 'Content appears to be clipped. A larger size may improve readability.',
      confidence: 0.7,
      trigger: 'content_clipping',
    };
  }
  
  // Rule 4: Long average view duration suggests importance
  if (metrics.averageViewDuration > 30000 && currentPreset === 'compact') {
    // 30+ seconds average view time
    return {
      widgetId: metrics.widgetId,
      suggestedPreset: 'standard',
      rationale: 'You spend significant time viewing this widget. A larger size may improve your workflow.',
      confidence: 0.6,
      trigger: 'usage_pattern',
    };
  }
  
  return null;
}

/**
 * Get all suggestions for a dashboard layout
 */
export function getDashboardSuggestions(
  metrics: WidgetInteractionMetrics[],
  currentLayout: any,
  columnCount: number
): ResizeSuggestion[] {
  const suggestions: ResizeSuggestion[] = [];
  
  metrics.forEach((metric) => {
    const widgetSettings = currentLayout?.breakpoints?.desktop?.widgets?.[metric.widgetId];
    if (!widgetSettings) return;
    
    const suggestion = calculateResizeSuggestion(
      metric,
      widgetSettings.sizePreset || 'standard',
      columnCount
    );
    
    if (suggestion && suggestion.confidence > 0.5) {
      suggestions.push(suggestion);
    }
  });
  
  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Track widget interaction (to be called from widget components)
 */
export function trackWidgetInteraction(
  widgetId: WidgetId,
  action: 'view' | 'expand' | 'collapse' | 'scroll',
  duration?: number
): void {
  // In a real implementation, this would send to analytics/backend
  // For now, we'll use localStorage as a simple store
  if (typeof window === 'undefined') return;
  
  const key = `widget_metrics_${widgetId}`;
  const existing = localStorage.getItem(key);
  const metrics: WidgetInteractionMetrics = existing
    ? JSON.parse(existing)
    : {
        widgetId,
        viewCount: 0,
        expandedCount: 0,
        collapsedCount: 0,
        averageViewDuration: 0,
        scrollDetected: false,
        lastInteraction: new Date().toISOString(),
      };
  
  switch (action) {
    case 'view':
      metrics.viewCount++;
      if (duration) {
        metrics.averageViewDuration =
          (metrics.averageViewDuration * (metrics.viewCount - 1) + duration) / metrics.viewCount;
      }
      break;
    case 'expand':
      metrics.expandedCount++;
      break;
    case 'collapse':
      metrics.collapsedCount++;
      break;
    case 'scroll':
      metrics.scrollDetected = true;
      break;
  }
  
  metrics.lastInteraction = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(metrics));
}

/**
 * Get stored metrics for a widget
 */
export function getWidgetMetrics(widgetId: WidgetId): WidgetInteractionMetrics | null {
  if (typeof window === 'undefined') return null;
  
  const key = `widget_metrics_${widgetId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  return JSON.parse(stored);
}

