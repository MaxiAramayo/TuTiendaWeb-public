/**
 * Componente para mostrar horarios y estado de la tienda
 * 
 * @module features/store/components/ui/StoreScheduleDisplay
 */

'use client';

import React from 'react';
import { Clock, Calendar, MapPin, Phone, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklySchedule, StoreStatus, DailySchedule, NextStatusChange } from '../../types/store.types';
import { useStoreStatus, useTodaySchedule } from '../../hooks/useStoreStatus';
import { useThemeClasses, useThemeStyles } from '../../hooks/useStoreTheme';

/**
 * Props del componente StoreScheduleDisplay
 */
interface StoreScheduleDisplayProps {
  schedule: WeeklySchedule;
  className?: string;
  variant?: 'compact' | 'detailed' | 'minimal';
  showStatus?: boolean;
  showNextChange?: boolean;
  showWeeklyView?: boolean;
  onScheduleClick?: () => void;
}

/**
 * Mapeo de días de la semana
 */
const DAYS_MAP = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
} as const;

/**
 * Componente principal StoreScheduleDisplay
 */
export const StoreScheduleDisplay: React.FC<StoreScheduleDisplayProps> = ({
  schedule,
  className,
  variant = 'compact',
  showStatus = true,
  showNextChange = true,
  showWeeklyView = false,
  onScheduleClick
}) => {
  const { status, isLoading } = useStoreStatus(schedule);
  const todaySchedule = useTodaySchedule(schedule);

  if (variant === 'minimal') {
    return status ? (
      <StoreStatusBadge 
        status={status}
        nextChange={status.nextChange}
        className={className}
        onClick={onScheduleClick}
      />
    ) : null;
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {showStatus && (
          <div className="flex items-center gap-2">
            {status && <StoreStatusBadge status={status} />}
            {showNextChange && status?.nextChange && (
              <span className="text-sm text-muted-foreground">
                {status.nextChange.message}
              </span>
            )}
          </div>
        )}
        
        {todaySchedule && typeof todaySchedule === 'object' && (
          <TodayScheduleDisplay 
            schedule={todaySchedule}
            onClick={onScheduleClick}
          />
        )}
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios
          </CardTitle>
          {showStatus && status && <StoreStatusBadge status={status} />}
        </div>
        
        {showNextChange && status?.nextChange && (
          <p className="text-sm text-muted-foreground">
            {status.nextChange.message}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {todaySchedule && typeof todaySchedule === 'object' && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Hoy
            </h4>
            <TodayScheduleDisplay schedule={todaySchedule} detailed />
          </div>
        )}
        
        {showWeeklyView && (
          <div>
            <h4 className="font-medium text-sm mb-2">Horarios de la semana</h4>
            <WeeklyScheduleDisplay schedule={schedule} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Componente para mostrar el estado de la tienda como badge
 */
interface StoreStatusBadgeProps {
  status: StoreStatus;
  nextChange?: NextStatusChange | null;
  className?: string;
  onClick?: () => void;
}

export const StoreStatusBadge: React.FC<StoreStatusBadgeProps> = ({
  status,
  nextChange,
  className,
  onClick
}) => {
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();
  
  const getStatusConfig = () => {
    if (status.isOpen) {
      return {
        label: 'Abierto',
        variant: 'default' as const,
        className: `${themeClasses.status.success} shadow-sm border-[var(--store-secondary)]/20`,
        dotColor: 'bg-green-500',
        pulseColor: 'bg-green-400'
      };
    } else {
      return {
        label: 'Cerrado',
        variant: 'secondary' as const,
        className: `${themeClasses.status.error} bg-[var(--store-secondary)]/10 text-[var(--store-secondary)] border-[var(--store-secondary)]/20`,
        dotColor: 'bg-red-500',
        pulseColor: 'bg-red-400'
      };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-2 font-medium px-3 py-1.5 text-sm',
        config.className,
        {
          'cursor-pointer hover:opacity-80 transition-opacity': onClick
        },
        className
      )}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center">
        <div className={cn('w-2.5 h-2.5 rounded-full', config.dotColor)} />
        {status.isOpen && (
          <div 
            className={cn(
              'absolute w-2.5 h-2.5 rounded-full animate-ping opacity-75',
              config.pulseColor
            )}
          />
        )}
      </div>
      {config.label}
    </Badge>
  );
};

/**
 * Componente para mostrar el horario de hoy
 */
interface TodayScheduleDisplayProps {
  schedule: DailySchedule;
  detailed?: boolean;
  onClick?: () => void;
}

export const TodayScheduleDisplay: React.FC<TodayScheduleDisplayProps> = ({
  schedule,
  detailed = false,
  onClick
}) => {
  if (!schedule.isOpen || !schedule.openTime || !schedule.closeTime) {
    return (
      <div 
        className={cn(
          'text-sm text-muted-foreground',
          { 'cursor-pointer hover:text-foreground': onClick }
        )}
        onClick={onClick}
      >
        Cerrado hoy
      </div>
    );
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  return (
    <div 
      className={cn(
        'space-y-1',
        { 'cursor-pointer': onClick }
      )}
      onClick={onClick}
    >
      {/* Horario principal */}
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>
          {formatTime(schedule.openTime)} - {formatTime(schedule.closeTime)}
        </span>
      </div>
      
      {/* Recesos */}
      {detailed && schedule.breaks && schedule.breaks.length > 0 && (
        <div className="ml-6 space-y-1">
          {schedule.breaks.map((breakTime, index) => (
            <div key={index} className="text-xs text-muted-foreground">
              Receso: {formatTime(breakTime.startTime)} - {formatTime(breakTime.endTime)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Componente para mostrar horarios de toda la semana
 */
interface WeeklyScheduleDisplayProps {
  schedule: WeeklySchedule;
  compact?: boolean;
}

export const WeeklyScheduleDisplay: React.FC<WeeklyScheduleDisplayProps> = ({
  schedule,
  compact = false
}) => {
  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  const getDayScheduleText = (daySchedule: DailySchedule) => {
    if (!daySchedule.isOpen || !daySchedule.openTime || !daySchedule.closeTime) {
      return 'Cerrado';
    }
    
    let text = `${formatTime(daySchedule.openTime)} - ${formatTime(daySchedule.closeTime)}`;
    
    if (!compact && daySchedule.breaks && daySchedule.breaks.length > 0) {
      const breaksText = daySchedule.breaks
        .map(b => `${formatTime(b.startTime)}-${formatTime(b.endTime)}`)
        .join(', ');
      text += ` (Recesos: ${breaksText})`;
    }
    
    return text;
  };

  return (
    <div className="space-y-2">
      {Object.entries(DAYS_MAP).map(([dayKey, dayName]) => {
        const daySchedule = schedule[dayKey as keyof WeeklySchedule];
        if (!daySchedule) return null;
        
        return (
          <div 
            key={dayKey}
            className={cn(
              'flex justify-between items-start text-sm',
              { 'py-1': !compact }
            )}
          >
            <span className="font-medium min-w-[80px]">{dayName}</span>
            <span className={cn(
              'text-right flex-1',
              {
                'text-muted-foreground': typeof daySchedule === 'string' || !daySchedule.isOpen,
                'text-foreground': typeof daySchedule === 'object' && daySchedule.isOpen
              }
            )}>
              {typeof daySchedule === 'string' ? daySchedule : getDayScheduleText(daySchedule)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Componente compacto para header
 */
interface StoreScheduleHeaderProps {
  schedule: WeeklySchedule;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export const StoreScheduleHeader: React.FC<StoreScheduleHeaderProps> = ({
  schedule,
  showDetails = false,
  onToggleDetails
}) => {
  const { status, isLoading } = useStoreStatus(schedule);
  const isOpen = status?.isOpen ?? false;
  const nextChange = status?.nextChange ?? null;
  const todaySchedule = useTodaySchedule(schedule);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {status && <StoreStatusBadge status={status} />}
        
        {todaySchedule && typeof todaySchedule === 'object' && todaySchedule.isOpen && todaySchedule.openTime && todaySchedule.closeTime && (
          <span className="text-sm text-muted-foreground">
            {todaySchedule.openTime.slice(0, 5)} - {todaySchedule.closeTime.slice(0, 5)}
          </span>
        )}
      </div>
      
      {nextChange && (
        <span className="text-xs text-muted-foreground hidden md:inline">
          {nextChange.message}
        </span>
      )}
      
      {onToggleDetails && (
        <button
          onClick={onToggleDetails}
          className={`text-xs text-blue-600 hover:text-blue-800 transition-colors`}
        >
          {showDetails ? 'Ocultar' : 'Ver horarios'}
        </button>
      )}
    </div>
  );
};

export default StoreScheduleDisplay;