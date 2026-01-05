/**
 * WidgetSizePresetSelector Component
 * Dropdown for selecting widget size presets with dependency validation
 */

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { isPresetCompatible } from '@/lib/dashboard/columnUtils';
import type { SizePreset, Breakpoint, WidgetId } from '@/lib/dashboard/types';
import { getWidgetDefinition } from '@/components/dashboard/widgets/registry';

interface WidgetSizePresetSelectorProps {
  widgetId: WidgetId;
  currentPreset: SizePreset | undefined;
  columnCount: number;
  breakpoint: Breakpoint;
  onSelect: (preset: SizePreset) => void;
  className?: string;
}

const presetLabels: Record<SizePreset, string> = {
  compact: 'Compact',
  standard: 'Standard',
  wide: 'Wide',
  full: 'Full Width',
};

export function WidgetSizePresetSelector({
  widgetId,
  currentPreset,
  columnCount,
  breakpoint,
  onSelect,
  className,
}: WidgetSizePresetSelectorProps) {
  const definition = getWidgetDefinition(widgetId);
  const incompatiblePresets = definition?.dependencyRules?.incompatibleWithPresets || [];

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 text-xs ${className}`}
              >
                {currentPreset ? presetLabels[currentPreset] : 'Size'}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Change widget size</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Size Preset</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(['compact', 'standard', 'wide', 'full'] as SizePreset[]).map((preset) => {
          const compatibility = isPresetCompatible(preset, columnCount, breakpoint);
          const isIncompatible = incompatiblePresets.includes(preset);
          const isDisabled = !compatibility.compatible || isIncompatible;
          const isSelected = currentPreset === preset;

          return (
            <TooltipProvider key={preset}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    onClick={() => !isDisabled && onSelect(preset)}
                    disabled={isDisabled}
                    className="flex items-center justify-between"
                  >
                    <span>{presetLabels[preset]}</span>
                    {isSelected && <Check className="h-4 w-4" />}
                  </DropdownMenuItem>
                </TooltipTrigger>
                {isDisabled && (
                  <TooltipContent>
                    {isIncompatible
                      ? 'This size is not compatible with this widget'
                      : compatibility.reason || 'Not available'}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


