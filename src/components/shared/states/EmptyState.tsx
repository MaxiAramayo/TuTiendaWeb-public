/**
 * Componente EmptyState para mostrar estados vacíos
 * 
 * Componente reutilizable para mostrar estados cuando no hay datos,
 * con soporte para diferentes variantes y acciones.
 * 
 * @module components/shared
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Icono a mostrar */
  icon?: React.ReactNode;
  /** Título del estado vacío */
  title: string;
  /** Descripción del estado vacío */
  description?: string;
  /** Botón de acción principal */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  };
  /** Botón de acción secundaria */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  };
  /** Si debe mostrarse dentro de una Card */
  withCard?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Tamaño del componente */
  size?: "sm" | "md" | "lg";
  /** Variante visual */
  variant?: "default" | "minimal" | "illustration";
}

/**
 * Componente para mostrar estados vacíos con un diseño consistente
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  withCard = false,
  className,
  size = "md",
  variant = "default"
}) => {
  const sizeClasses = {
    sm: "p-6",
    md: "p-8 md:p-12",
    lg: "p-12 md:p-16"
  };

  const iconSizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20"
  };

  const titleSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizeClasses[size],
      className
    )}>
      {/* Icono */}
      {icon && (
        <div className={cn(
          "flex items-center justify-center text-muted-foreground/60 mb-4",
          iconSizeClasses[size],
          variant === "illustration" && "text-primary/20"
        )}>
          {icon}
        </div>
      )}

      {/* Contenido de texto */}
      <div className="space-y-2 mb-6">
        <h3 className={cn(
          "font-semibold text-foreground",
          titleSizeClasses[size]
        )}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            "text-muted-foreground leading-relaxed max-w-md mx-auto",
            size === "sm" ? "text-sm" : "text-base"
          )}>
            {description}
          </p>
        )}
      </div>

      {/* Acciones */}
      {(action || secondaryAction) && (
        <div className={cn(
          "flex gap-3",
          size === "sm" ? "flex-col w-full max-w-xs" : "flex-col sm:flex-row"
        )}>
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              size={size === "sm" ? "sm" : "default"}
              className="min-w-[120px]"
            >
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || "outline"}
              size={size === "sm" ? "sm" : "default"}
              className="min-w-[120px]"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (withCard) {
    return (
      <Card className={cn(
        "border-dashed",
        variant === "minimal" && "border-none shadow-none bg-transparent"
      )}>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

/**
 * Variantes predefinidas de EmptyState para casos comunes
 */
export const EmptyStateVariants = {
  /**
   * Estado vacío para listas de datos
   */
  NoData: ({ 
    title = "No hay datos disponibles", 
    description = "Aún no hay información para mostrar aquí.",
    ...props 
  }: Partial<EmptyStateProps>) => (
    <EmptyState
      title={title}
      description={description}
      {...props}
    />
  ),

  /**
   * Estado vacío para búsquedas sin resultados
   */
  NoResults: ({ 
    title = "No se encontraron resultados", 
    description = "Intenta ajustar tus criterios de búsqueda.",
    ...props 
  }: Partial<EmptyStateProps>) => (
    <EmptyState
      title={title}
      description={description}
      {...props}
    />
  ),

  /**
   * Estado vacío para errores de carga
   */
  Error: ({ 
    title = "Error al cargar los datos", 
    description = "Hubo un problema al cargar la información. Intenta de nuevo.",
    ...props 
  }: Partial<EmptyStateProps>) => (
    <EmptyState
      title={title}
      description={description}
      variant="minimal"
      {...props}
    />
  ),

  /**
   * Estado vacío para funciones próximamente
   */
  ComingSoon: ({ 
    title = "Próximamente", 
    description = "Esta funcionalidad estará disponible pronto.",
    ...props 
  }: Partial<EmptyStateProps>) => (
    <EmptyState
      title={title}
      description={description}
      variant="illustration"
      {...props}
    />
  )
};
