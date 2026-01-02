/**
 * DashboardEditControls Component
 * Edit mode controls (Save, Cancel, Reset buttons)
 */

import { useState } from 'react';

import { Wrench, Save, X, RotateCcw } from 'lucide-react';

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

interface DashboardEditControlsProps {
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onStartEditing: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReset: () => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

export function DashboardEditControls({
  isEditing,
  hasUnsavedChanges,
  isSaving,
  onStartEditing,
  onCancel,
  onSave,
  onReset,
  showSidebar,
  onToggleSidebar,
}: DashboardEditControlsProps) {
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

  // When editing, controls are in the sidebar, but show a badge
  return (
    <>
      <Badge variant="secondary" className="bg-primary/10 text-primary">
        Customizing
      </Badge>

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

