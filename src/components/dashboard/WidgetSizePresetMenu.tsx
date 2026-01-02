/**
 * WidgetSizePresetMenu Component
 * Dropdown menu for selecting widget size presets
 */

import { Check } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SIZE_PRESETS } from '@/lib/dashboard/types';
import type { SizePreset, WidgetGridLayout } from '@/lib/dashboard/types';

interface WidgetSizePresetMenuProps {
  widget: WidgetGridLayout;
  onPresetSelect: (preset: SizePreset) => void;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

const presetLabels: Record<SizePreset, string> = {
  compact: 'Compact',
  standard: 'Standard',
  wide: 'Wide',
  full: 'Full',
};

export function WidgetSizePresetMenu({
  widget,
  onPresetSelect,
  breakpoint,
}: WidgetSizePresetMenuProps) {
  const currentPreset = widget.sizePreset || 'standard';
  const maxW = breakpoint === 'desktop' ? 12 : breakpoint === 'tablet' ? 8 : 4;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <span className="text-xs">Size</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Size Preset</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(SIZE_PRESETS) as SizePreset[]).map((preset) => {
          const { w, h } = SIZE_PRESETS[preset];
          const fits = w <= maxW;
          
          return (
            <DropdownMenuItem
              key={preset}
              onClick={() => fits && onPresetSelect(preset)}
              disabled={!fits}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span>{presetLabels[preset]}</span>
                <span className="text-xs text-muted-foreground">
                  {w} × {h} {!fits && '(too wide)'}
                </span>
              </div>
              {currentPreset === preset && (
                <Check className="ml-2 h-4 w-4" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

