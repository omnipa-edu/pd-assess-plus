/**
 * DashboardEditToolbar Component
 * Toolbar with edit controls including preview button
 */

import { useState } from 'react';

import { Wrench, Save, X, RotateCcw, Eye, Sparkles } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DashboardLayoutJson } from '@/lib/dashboard/types';

interface DashboardEditToolbarProps {
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  currentLayout: DashboardLayoutJson;
  onStartEditing: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReset: () => void;
  onPreview?: () => void;
  onTryAI?: () => void;
}

export function DashboardEditToolbar({
  isEditing,
  hasUnsavedChanges,
  isSaving,
  currentLayout,
  onStartEditing,
  onCancel,
  onSave,
  onReset,
  onPreview,
  onTryAI,
}: DashboardEditToolbarProps) {
  const [showResetDialog, setShowResetDialog] = useState(false);

  if (!isEditing) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onStartEditing}
              className="text-muted-foreground hover:text-foreground"
            >
              <Wrench className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Customize dashboard</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Editing dashboard
        </Badge>
        
        {onTryAI && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTryAI}
                  disabled={isSaving}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Try Recommended
                </Button>
              </TooltipTrigger>
              <TooltipContent>Try AI-recommended layout</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {onPreview && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreview}
                  disabled={isSaving}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview layout wireframe</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResetDialog(true)}
          disabled={isSaving}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Layout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your dashboard to the default layout. All your customizations will be lost.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onReset();
                setShowResetDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset to Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

