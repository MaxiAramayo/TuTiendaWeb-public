/**
 * Componente Collapsible simple para secciones expandibles
 */

"use client";

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface CollapsibleContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ children, defaultOpen = false, open: controlledOpen, onOpenChange, className }, ref) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    
    const setOpen = (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    };

    return (
      <CollapsibleContext.Provider value={{ open, setOpen }}>
        <div ref={ref} className={cn('space-y-2', className)}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = 'Collapsible';

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ children, className, asChild = false }, ref) => {
    const context = useContext(CollapsibleContext);
    if (!context) {
      throw new Error('CollapsibleTrigger must be used within a Collapsible');
    }

    const { open, setOpen } = context;

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: () => setOpen(!open),
        'aria-expanded': open,
      });
    }

    return (
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between py-2 text-sm font-medium transition-all hover:underline',
          className
        )}
      >
        {children}
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
    );
  }
);

CollapsibleTrigger.displayName = 'CollapsibleTrigger';

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, className }, ref) => {
    const context = useContext(CollapsibleContext);
    if (!context) {
      throw new Error('CollapsibleContent must be used within a Collapsible');
    }

    const { open } = context;

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          open ? 'animate-in slide-in-from-top-1' : 'animate-out slide-out-to-top-1 hidden',
          className
        )}
      >
        <div className="pb-2">
          {children}
        </div>
      </div>
    );
  }
);

CollapsibleContent.displayName = 'CollapsibleContent';