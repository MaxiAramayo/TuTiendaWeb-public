"use client";

import React, { useState, useCallback, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

interface ImageWithLoaderProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  containerClassName?: string;
  fallbackIconClassName?: string;
  loaderSize?: 'sm' | 'md' | 'lg' | 'xl';
  useSkeletonBg?: boolean;
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({
  containerClassName,
  fallbackIconClassName,
  className,
  src,
  alt,
  loaderSize = 'sm',
  useSkeletonBg = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Ref para detectar si el <img> nativo ya está completo (cache hit)
  const imgNodeRef = useRef<HTMLImageElement | null>(null);

  const handleRef = useCallback((node: HTMLImageElement | null) => {
    imgNodeRef.current = node;
    // Si el browser ya terminó de cargar la imagen antes de que React
    // registrara el handler onLoad (cache hit), marcamos como cargada
    if (node && node.complete && node.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, []);

  // Si no hay src o hubo un error
  if (!src || hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-100",
        containerClassName
      )}>
        <ImageIcon className={cn("text-gray-400", fallbackIconClassName || "w-10 h-10")} />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {/* Skeleton — se desmonta completamente al cargar para que animate-pulse no siga corriendo */}
      {!isLoaded && (
        <div className={cn(
          "absolute inset-0 z-10 flex items-center justify-center",
          useSkeletonBg ? "bg-gray-200 animate-pulse" : "bg-black/5"
        )}>
          <LoadingSpinner size={loaderSize} spinnerOnly className="text-gray-400" />
        </div>
      )}

      {/* Imagen real */}
      <Image
        ref={handleRef as React.Ref<HTMLImageElement>}
        src={src}
        alt={alt || "Imagen"}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        {...props}
      />
    </div>
  );
};

export default ImageWithLoader;
