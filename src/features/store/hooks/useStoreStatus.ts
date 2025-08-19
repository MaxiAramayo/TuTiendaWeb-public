/**
 * Hook para gestión del estado de tienda basado en horarios
 * 
 * @module features/store/hooks/useStoreStatus
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { WeeklySchedule, DailySchedule, StoreStatus } from '../types/store.types';
import { ScheduleService } from '../api/scheduleService';

/**
 * Hook para calcular y mantener actualizado el estado de la tienda
 * @param schedule Horarios semanales de la tienda
 * @param updateInterval Intervalo de actualización en milisegundos (default: 60000 = 1 minuto)
 * @returns Estado actual de la tienda
 */
export const useStoreStatus = (
  schedule: WeeklySchedule | null,
  updateInterval: number = 60000
): {
  status: StoreStatus | null;
  isLoading: boolean;
  lastUpdated: Date | null;
} => {
  const [status, setStatus] = useState<StoreStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Función para calcular el estado
  const calculateStatus = useCallback(() => {
    if (!schedule) {
      setStatus(null);
      setIsLoading(false);
      return;
    }

    try {
      const newStatus = ScheduleService.calculateStoreStatus(schedule, schedule.timezone || 'America/Argentina/Buenos_Aires');
      setStatus(prevStatus => {
        // Solo actualizar si el estado realmente cambió
        if (prevStatus?.isOpen !== newStatus.isOpen) {
          return newStatus;
        }
        return prevStatus || newStatus;
      });
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error('Error calculando estado de tienda:', error);
      setStatus({
        isOpen: false,
        nextChange: undefined
      });
      setIsLoading(false);
    }
  }, [schedule]);

  // Calcular estado inicial
  useEffect(() => {
    calculateStatus();
  }, [calculateStatus]);

  // Configurar actualización periódica
  useEffect(() => {
    if (!schedule) return;

    const interval = setInterval(() => {
      calculateStatus();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [calculateStatus, updateInterval, schedule]);

  return {
    status,
    isLoading,
    lastUpdated
  };
};

/**
 * Hook simplificado que solo retorna si la tienda está abierta
 * @param schedule Horarios semanales de la tienda
 * @returns true si la tienda está abierta
 */
export const useIsStoreOpen = (schedule: WeeklySchedule | null): boolean => {
  const { status } = useStoreStatus(schedule);
  return status?.isOpen ?? false;
};

/**
 * Hook para obtener el próximo cambio de estado
 * @param schedule Horarios semanales de la tienda
 * @returns Información del próximo cambio
 */
export const useNextStatusChange = (
  schedule: WeeklySchedule | null
): StoreStatus['nextChange'] | null => {
  const { status } = useStoreStatus(schedule);
  return status?.nextChange ?? null;
};

/**
 * Hook para verificar si la tienda estará abierta en una fecha específica
 * @param schedule Horarios semanales
 * @param date Fecha a verificar
 * @returns true si estará abierta
 */
export const useWillStoreBeOpen = (
  schedule: WeeklySchedule | null,
  date: Date
): boolean => {
  return useMemo(() => {
    if (!schedule) return false;
    return ScheduleService.isStoreOpen(schedule, date);
  }, [schedule, date]);
};

/**
 * Hook para obtener información detallada del estado de la tienda
 * @param schedule Horarios semanales
 * @returns Información detallada del estado
 */
export const useStoreStatusDetails = (schedule: WeeklySchedule | null) => {
  const { status, isLoading, lastUpdated } = useStoreStatus(schedule);

  const statusText = useMemo(() => {
    if (!status) return 'Estado desconocido';
    
    if (status.isOpen) {
      return status.nextChange 
        ? `Abierto - ${status.nextChange.message}`
        : 'Abierto';
    } else {
      return status.nextChange 
        ? `Cerrado - ${status.nextChange.message}`
        : 'Cerrado';
    }
  }, [status]);

  const statusColor = useMemo(() => {
    if (!status) return 'gray';
    return status.isOpen ? 'green' : 'red';
  }, [status]);

  const timeUntilChange = useMemo(() => {
    if (!status?.nextChange) return null;
    
    const now = new Date();
    const changeTime = status.nextChange.dateTime;
    const diffMs = changeTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [status]);

  return {
    status,
    isLoading,
    lastUpdated,
    statusText,
    statusColor,
    timeUntilChange,
    isOpen: status?.isOpen ?? false,
    nextChange: status?.nextChange ?? null
  };
};

/**
 * Hook para obtener los horarios de hoy
 * @param schedule Horarios semanales
 * @returns Horario de hoy o null
 */
export const useTodaySchedule = (schedule: WeeklySchedule | null) => {
  return useMemo(() => {
    if (!schedule) return null;
    
    const today = new Date();
    const dayNames: (keyof WeeklySchedule)[] = [
      'sunday', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday'
    ];
    
    const todayName = dayNames[today.getDay()];
    return schedule[todayName];
  }, [schedule]);
};

/**
 * Hook para obtener un resumen semanal de horarios
 * @param schedule Horarios semanales
 * @returns Resumen de horarios por día
 */
export const useWeeklyScheduleSummary = (schedule: WeeklySchedule | null) => {
  return useMemo(() => {
    if (!schedule) return [];
    
    const dayNames = [
      { key: 'monday' as const, label: 'Lunes' },
      { key: 'tuesday' as const, label: 'Martes' },
      { key: 'wednesday' as const, label: 'Miércoles' },
      { key: 'thursday' as const, label: 'Jueves' },
      { key: 'friday' as const, label: 'Viernes' },
      { key: 'saturday' as const, label: 'Sábado' },
      { key: 'sunday' as const, label: 'Domingo' }
    ];
    
    return dayNames.map(({ key, label }) => {
      const daySchedule = schedule[key];
      
      return {
        day: label,
        isOpen: daySchedule.isOpen,
        hours: daySchedule.isOpen && daySchedule.openTime && daySchedule.closeTime
          ? `${daySchedule.openTime} - ${daySchedule.closeTime}`
          : 'Cerrado',
        breaks: daySchedule.breaks || []
      };
    });
  }, [schedule]);
};