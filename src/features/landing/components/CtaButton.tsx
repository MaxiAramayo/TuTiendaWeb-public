/**
 * Componente de botón de llamada a la acción (CTA)
 * 
 * Botón reutilizable con diferentes variantes para utilizarse en toda la landing page
 * 
 * @module features/landing/components
 */

import React from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Definir las variantes del botón usando class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
        secondary: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
        link: "text-purple-600 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 rounded-md",
        md: "h-10 py-2 px-5",
        lg: "h-12 px-8 rounded-md text-base",
        xl: "h-14 px-10 rounded-lg text-lg"
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  href?: string;
  className?: string;
  children: React.ReactNode;
}

const CtaButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, href, children, ...props }, ref) => {
    // Si tiene href, renderizar como Link
    if (href) {
      return (
        <Link
          href={href}
          className={cn(buttonVariants({ variant, size, className }))}
        >
          {children}
        </Link>
      );
    }

    // De lo contrario, renderizar como botón
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CtaButton.displayName = "CtaButton";

export default CtaButton; 