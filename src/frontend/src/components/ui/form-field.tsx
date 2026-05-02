import * as React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export function FormField({ label, hint, error, children, required, className }: FormFieldProps) {
  const inputId = React.useId();
  const describedById = React.useId();
  const hasError = !!error;
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: (children as React.ReactElement<{ id?: string }>).props.id ?? inputId,
        'aria-invalid': hasError || undefined,
        'aria-describedby': (error || hint) ? describedById : undefined,
      })
    : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={inputId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive" aria-hidden="true">*</span>}
        </Label>
      )}
      {child}
      {hasError ? (
        <p id={describedById} role="alert" className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p id={describedById} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
