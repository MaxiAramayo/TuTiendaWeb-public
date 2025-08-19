/**
 * Componente Select simple sin Radix UI
 * 
 * Reemplazo temporal para evitar errores de "Maximum update depth exceeded"
 * causados por Radix UI Select
 */

'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SimpleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
}

const SimpleSelect = forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, placeholder, options, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
      </div>
    );
  }
);

SimpleSelect.displayName = "SimpleSelect";

export { SimpleSelect };