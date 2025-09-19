import React, { useState, useCallback } from 'react';
import { Clock, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useProfileStore } from '../../api/profileStore';
import { toast } from 'sonner';
import type { ProfileFormData, WeeklySchedule, DailySchedule, TimePeriod } from '../../types/store.type';

interface ScheduleSectionProps {
  formData: {
    schedule: any; // o el tipo específico que uses para horarios
  };
  updateField: (field: string, value: any) => void;
}

/**
 * Días de la semana
 */
const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' }
] as const;

/**
 * Horarios comunes para selección rápida
 */
const COMMON_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

/**
 * Componente de sección de horarios con múltiples períodos
 */
export function ScheduleSection({
  formData,
  updateField,
}: ScheduleSectionProps) {
  const { user } = useAuthStore();
  const { updateSchedule, getSectionState, storeProfile } = useProfileStore();

  // Estado de horarios simplificado
  const [schedule, setSchedule] = useState(() => {
    const defaultSchedule: WeeklySchedule = {
      monday: { closed: true, periods: [] },
      tuesday: { closed: true, periods: [] },
      wednesday: { closed: true, periods: [] },
      thursday: { closed: true, periods: [] },
      friday: { closed: true, periods: [] },
      saturday: { closed: true, periods: [] },
      sunday: { closed: true, periods: [] }
    };

    if (formData.schedule) {
      return { ...defaultSchedule, ...formData.schedule };
    }
    return defaultSchedule;
  });

  // Obtener estado de la sección
  const sectionState = getSectionState('schedule');

  // Guardar cambios
  const handleSectionSave = useCallback(async () => {
    if (!user?.id || !storeProfile?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }
    
    try {
      const success = await updateSchedule(schedule);
      if (success) {
        toast.success('Horarios guardados correctamente');
      }
    } catch (err) {
      console.error('Error al guardar horarios:', err);
      toast.error('Error al guardar los horarios');
    }
  }, [user?.id, storeProfile?.id, schedule, updateSchedule]);

  // Actualizar horario de un día
  const updateDaySchedule = useCallback((day: string, newDayData: DailySchedule) => {
    const newSchedule = { ...schedule, [day]: newDayData };
    setSchedule(newSchedule);
    updateField('schedule', newSchedule);
  }, [schedule, updateField]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Horarios de atención</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura los horarios de atención de tu tienda
          </p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={sectionState.isSaving}
          className="flex items-center space-x-2"
        >
          {sectionState.isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{sectionState.isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      {/* Configuración por día */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const daySchedule = schedule[day.key as keyof WeeklySchedule];
          
          return (
            <div key={day.key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Label className="font-medium text-gray-900 min-w-[80px]">
                    {day.label}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!daySchedule.closed}
                      onCheckedChange={(checked) => {
                        const newDayData: DailySchedule = {
                          closed: !checked,
                          periods: checked && (!daySchedule.periods || daySchedule.periods.length === 0)
                            ? [{ open: '09:00', close: '18:00', nextDay: false }] 
                            : daySchedule.periods || []
                        };
                        updateDaySchedule(day.key, newDayData);
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {daySchedule.closed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Horario simple */}
              {!daySchedule.closed && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Hora de apertura</Label>
                    <Select
                      value={daySchedule.periods?.[0]?.open || '09:00'}
                      onValueChange={(value) => {
                        const currentPeriod = daySchedule.periods?.[0] || { open: '09:00', close: '18:00', nextDay: false };
                        const newDayData: DailySchedule = {
                          closed: false,
                          periods: [{ ...currentPeriod, open: value }]
                        };
                        updateDaySchedule(day.key, newDayData);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_HOURS.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Hora de cierre</Label>
                    <Select
                      value={daySchedule.periods?.[0]?.close || '18:00'}
                      onValueChange={(value) => {
                        const currentPeriod = daySchedule.periods?.[0] || { open: '09:00', close: '18:00', nextDay: false };
                        const newDayData: DailySchedule = {
                          closed: false,
                          periods: [{ ...currentPeriod, close: value }]
                        };
                        updateDaySchedule(day.key, newDayData);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_HOURS.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScheduleSection;