/**
 * Hook para detectar el estado de la red y manejar reconexiones
 */

"use client";

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true,
    wasOffline: false
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        isOnline: true,
        wasOffline: prev.wasOffline || !prev.isOnline
      }));
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        isOnline: false,
        wasOffline: prev.wasOffline
      }));
    };

    // Verificar estado inicial
    if (typeof window !== 'undefined') {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const resetWasOffline = () => {
    setNetworkStatus(prev => ({
      ...prev,
      wasOffline: false
    }));
  };

  return {
    ...networkStatus,
    resetWasOffline
  };
};
