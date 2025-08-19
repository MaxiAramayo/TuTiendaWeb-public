/**
 * Componente Skeleton para el módulo QR
 * 
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Componente skeleton para el estado de carga del módulo QR
 */
const QRModuleSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          {/* QR Preview Skeleton */}
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-6">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-32 w-32 mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 mx-auto" />
                <Skeleton className="h-4 w-40 mx-auto" />
              </div>
            </div>
          </div>

          {/* Actions Skeleton */}
          <div className="flex justify-center space-x-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModuleSkeleton;
