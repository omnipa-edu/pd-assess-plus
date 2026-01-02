/**
 * Form Field Error Component
 * Displays validation error messages for form fields
 */

import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FormFieldErrorProps {
  error?: string;
  className?: string;
}

export function FormFieldError({ error, className }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-sm text-destructive', className)}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span role="alert">{error}</span>
    </div>
  );
}





