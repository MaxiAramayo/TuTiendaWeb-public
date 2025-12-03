import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Save,
  Settings,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { useProfile } from '../../hooks/useProfile';
import { updateScheduleAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import type { StoreProfile } from '../../types/store.type';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import type {
  ProfileFormData,
  FormState,
  WeeklySchedule,
  DailySchedule,
  TimePeriod
} from '../../types/store.type';

interface ScheduleSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

/**
 * Días de la semana
 */
const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miercoles', short: 'Mie' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sabado', short: 'Sab' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' }
] as const;

/**
 * Horarios predefinidos con múltiples períodos
 */
const PRESET_SCHEDULES = {
  business: {
    name: 'Horario comercial',
    description: 'Lunes a viernes 9:00 - 18:00',
    schedule: {
      monday: { closed: false, periods: [{ open: '09:00', close: '18:00', nextDay: false }] },
      tuesday: { closed: false, periods: [{ open: '09:00', close: '18:00', nextDay: false }] },
      wednesday: { closed: false, periods: [{ open: '09:00', close: '18:00', nextDay: false }] },
      thursday: { closed: false, periods: [{ open: '09:00', close: '18:00', nextDay: false }] },
      friday: { closed: false, periods: [{ open: '09:00', close: '18:00', nextDay: false }] },
      saturday: { closed: true, periods: [] },
      sunday: { closed: true, periods: [] }
    }
  },
  retail: {
    name: 'Tienda retail',
    description: 'Lunes a sábado 10:00 - 20:00',
    schedule: {
      monday: { closed: false, periods: [{ open: '10:00', close: '20:00', nextDay: false }] },
      tuesday: { closed: false, periods: [{ open: '10:00', close: '20:00', nextDay: false }] },
      wednesday: { closed: false, periods: [{ open: '10:00', close: '20:00', nextDay: false }] },
      thursday: { closed: false, periods: [{ open: '10:00', close: '20:00', nextDay: false }] },
      friday: { closed: false, periods: [{ open: '10:00', close: '20:00', nextDay: false }] },
      saturday: { closed: false, periods: [{ open: '10:00', close: '20:00', nextDay: false }] },
      sunday: { closed: true, periods: [] }
    }
  },
  restaurant: {
    name: 'Restaurante (doble horario)',
    description: 'Almuerzo 12:00-16:00, Cena 19:00-23:00',
    schedule: {
      monday: { closed: false, periods: [{ open: '12:00', close: '16:00', nextDay: false }, { open: '19:00', close: '23:00', nextDay: false }] },
      tuesday: { closed: false, periods: [{ open: '12:00', close: '16:00', nextDay: false }, { open: '19:00', close: '23:00', nextDay: false }] },
      wednesday: { closed: false, periods: [{ open: '12:00', close: '16:00', nextDay: false }, { open: '19:00', close: '23:00', nextDay: false }] },
      thursday: { closed: false, periods: [{ open: '12:00', close: '16:00', nextDay: false }, { open: '19:00', close: '23:00', nextDay: false }] },
      friday: { closed: false, periods: [{ open: '12:00', close: '16:00', nextDay: false }, { open: '19:00', close: '23:00', nextDay: false }] },
      saturday: { closed: false, periods: [{ open: '12:00', close: '16:00', nextDay: false }, { open: '19:00', close: '23:00', nextDay: false }] },
      sunday: { closed: true, periods: [] }
    }
  },
  nightclub: {
    name: 'Vida nocturna',
    description: 'Viernes y sábado 22:00 - 04:00 (siguiente día)',
    schedule: {
      monday: { closed: true, periods: [] },
      tuesday: { closed: true, periods: [] },
      wednesday: { closed: true, periods: [] },
      thursday: { closed: true, periods: [] },
      friday: { closed: false, periods: [{ open: '22:00', close: '04:00', nextDay: true }] },
      saturday: { closed: false, periods: [{ open: '22:00', close: '04:00', nextDay: true }] },
      sunday: { closed: true, periods: [] }
    }
  },
  always: {
    name: 'Siempre abierto (24/7)',
    description: 'Abierto las 24 horas',
    schedule: {
      monday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] },
      tuesday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] },
      wednesday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] },
      thursday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] },
      friday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] },
      saturday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] },
      sunday: { closed: false, periods: [{ open: '00:00', close: '23:59', nextDay: false }] }
    }
  }
};

/**
 * Horarios comunes para selección rápida
 */
const COMMON_HOURS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00',
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '23:59'
];

/**
 * Componente de sección de horarios con múltiples períodos
 */
export function ScheduleSection({
  formData,
  formState,
  updateField,
  onSave,
  isSaving = false,
}: ScheduleSectionProps) {
  const { user } = useAuthClient();
  const { profile } = useProfile();
  const { setProfile } = useProfileStore();
  const [isSectionSaving, setIsSectionSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showPresets, setShowPresets] = useState(false);

  // Estado de horarios con múltiples períodos
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

    // Usar datos existentes si están disponibles
    if (formData.schedule) {
      return { ...defaultSchedule, ...formData.schedule };
    }

    return defaultSchedule;
  });

  // Convertir schedule con períodos a formato simple para el backend
  const convertPeriodsScheduleToSimple = useCallback((periodsSchedule: WeeklySchedule) => {
    const simpleSchedule: Record<string, string> = {};

    Object.entries(periodsSchedule).forEach(([day, dayData]) => {
      if (dayData.closed || !dayData.periods || dayData.periods.length === 0) {
        simpleSchedule[day] = 'Cerrado';
      } else {
        // Convertir múltiples períodos a string
        const periodsText = dayData.periods.map((period: TimePeriod) => {
          const closeText = period.nextDay ? `${period.close}+1` : period.close;
          return `${period.open}-${closeText}`;
        }).join(', ');
        simpleSchedule[day] = periodsText;
      }
    });

    return simpleSchedule;
  }, []);

  // Guardar cambios de la sección usando Server Action
  const handleSectionSave = useCallback(async () => {
    if (!user?.uid) {
      toast.error('No se pudo identificar al usuario');
      return;
    }

    if (!profile?.id) {
      toast.error('No se encontró el perfil de la tienda');
      return;
    }

    setIsSectionSaving(true);
    try {
      // Actualizar el campo schedule en el formulario
      updateField('schedule', schedule);

      // Convertir a Record<string, ...> para Server Action
      const scheduleData: Record<string, { closed?: boolean; periods?: Array<{ open: string; close: string; nextDay?: boolean }> }> = {};
      Object.entries(schedule).forEach(([day, data]) => {
        scheduleData[day] = data;
      });

      // Guardar usando Server Action
      const result = await updateScheduleAction(scheduleData);

      if (result.success) {
        // Refrescar el store para actualizar todos los componentes
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        toast.success('Horarios guardados correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] || 'Error al guardar los horarios. Inténtalo de nuevo.';
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Error al guardar horarios:', err);
      toast.error('Error al guardar los horarios. Inténtalo de nuevo.');
    } finally {
      setIsSectionSaving(false);
    }
  }, [user?.uid, profile?.id, schedule, updateField, setProfile]);

  // Aplicar horario predefinido
  const applyPreset = useCallback((presetKey: string) => {
    if (presetKey && PRESET_SCHEDULES[presetKey as keyof typeof PRESET_SCHEDULES]) {
      const preset = PRESET_SCHEDULES[presetKey as keyof typeof PRESET_SCHEDULES];
      setSchedule(preset.schedule);
      setSelectedPreset(presetKey);
      setShowPresets(false);

      updateField('schedule', preset.schedule);

      toast.success(`Horario "${preset.name}" aplicado correctamente`);
    }
  }, [updateField]);

  // Actualizar horario de un día específico
  const updateDaySchedule = useCallback((day: string, newDayData: DailySchedule) => {
    const newSchedule = {
      ...schedule,
      [day]: newDayData
    };

    setSchedule(newSchedule);
    setSelectedPreset(''); // Limpiar preset al hacer cambios manuales
    updateField('schedule', newSchedule);
  }, [schedule, updateField]);

  // Agregar período a un día
  const addPeriod = useCallback((day: string) => {
    const daySchedule = schedule[day as keyof WeeklySchedule];
    const newPeriod: TimePeriod = {
      open: '09:00',
      close: '18:00',
      nextDay: false
    };

    const newDayData: DailySchedule = {
      ...daySchedule,
      closed: false,
      periods: [...(daySchedule.periods || []), newPeriod]
    };

    updateDaySchedule(day, newDayData);
  }, [schedule, updateDaySchedule]);

  // Eliminar período de un día
  const removePeriod = useCallback((day: string, periodIndex: number) => {
    const daySchedule = schedule[day as keyof WeeklySchedule];
    const newPeriods = (daySchedule.periods || []).filter((_, index) => index !== periodIndex);

    const newDayData: DailySchedule = {
      ...daySchedule,
      periods: newPeriods,
      closed: newPeriods.length === 0
    };

    updateDaySchedule(day, newDayData);
  }, [schedule, updateDaySchedule]);

  // Actualizar período específico
  const updatePeriod = useCallback((day: string, periodIndex: number, field: keyof TimePeriod, value: any) => {
    const daySchedule = schedule[day as keyof WeeklySchedule];
    const newPeriods = [...(daySchedule.periods || [])];
    newPeriods[periodIndex] = {
      ...newPeriods[periodIndex],
      [field]: value
    };

    const newDayData: DailySchedule = {
      ...daySchedule,
      periods: newPeriods
    };

    updateDaySchedule(day, newDayData);
  }, [schedule, updateDaySchedule]);

  // Formatear horario para mostrar
  const formatScheduleDisplay = useMemo(() => {
    return DAYS_OF_WEEK.map(day => {
      const daySchedule = schedule[day.key as keyof WeeklySchedule];

      if (daySchedule.closed || (daySchedule.periods || []).length === 0) {
        return `${day.short}: Cerrado`;
      }

      const periodsText = (daySchedule.periods || []).map(period => {
        const closeText = period.nextDay ? `${period.close}+1` : period.close;
        return `${period.open}-${closeText}`;
      }).join(', ');

      return `${day.short}: ${periodsText}`;
    }).join(' | ');
  }, [schedule]);

  // Limpiar todos los horarios
  const clearAllSchedules = useCallback(() => {
    const emptySchedule: WeeklySchedule = {
      monday: { closed: true, periods: [] },
      tuesday: { closed: true, periods: [] },
      wednesday: { closed: true, periods: [] },
      thursday: { closed: true, periods: [] },
      friday: { closed: true, periods: [] },
      saturday: { closed: true, periods: [] },
      sunday: { closed: true, periods: [] }
    };

    setSchedule(emptySchedule);
    setSelectedPreset('');
    updateField('schedule', emptySchedule);

    toast.success('Todos los horarios han sido limpiados');
  }, [updateField]);

  return (
    <div className="space-y-6">
      {/* Header con título y botón de guardar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Horarios de atención</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura los horarios de atención de tu tienda. Puedes agregar múltiples horarios por día y horarios que se extiendan hasta el día siguiente.
          </p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving}
          className="flex items-center space-x-2"
        >
          {isSectionSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center space-x-1"
          >
            <Settings className="w-4 h-4" />
            <span>Plantillas</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAllSchedules}
            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpiar todo</span>
          </Button>
        </div>

        {selectedPreset && (
          <Badge variant="secondary" className="text-xs">
            Usando: {PRESET_SCHEDULES[selectedPreset as keyof typeof PRESET_SCHEDULES]?.name}
          </Badge>
        )}
      </div>

      {/* Plantillas predefinidas */}
      {showPresets && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border rounded-lg p-4 bg-gray-50"
        >
          <h4 className="text-sm font-medium mb-3">Plantillas de horarios (recomendado)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(PRESET_SCHEDULES).map(([key, preset]) => (
              <Button
                key={key}
                type="button"
                variant={selectedPreset === key ? "default" : "outline"}
                onClick={() => applyPreset(key)}
                className="flex flex-col items-start p-3 h-auto text-left"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-gray-500">{preset.description}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <Separator />

      {/* Resumen del horario actual */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-1">Horario actual:</p>
        <p className="text-sm font-mono text-gray-800 break-all">
          {formatScheduleDisplay}
        </p>
      </div>

      {/* Configuración por día */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-gray-700">
          Configuración personalizada
        </Label>

        {DAYS_OF_WEEK.map((day, index) => {
          const daySchedule = schedule[day.key as keyof WeeklySchedule];

          return (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border rounded-lg p-4"
            >
              {/* Encabezado del día */}
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
                          periods: checked && (daySchedule.periods || []).length === 0
                            ? [{ open: '09:00', close: '18:00', nextDay: false }]
                            : daySchedule.periods
                        };
                        updateDaySchedule(day.key, newDayData);
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {daySchedule.closed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                </div>

                {/* Botón para agregar período */}
                {!daySchedule.closed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPeriod(day.key)}
                    className="flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar horario</span>
                  </Button>
                )}
              </div>

              {/* Períodos de tiempo */}
              {!daySchedule.closed && (
                <div className="space-y-3">
                  {(daySchedule.periods || []).map((period, periodIndex) => (
                    <div key={periodIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="text-xs">
                          Horario {periodIndex + 1}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePeriod(day.key, periodIndex)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Hora de apertura */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Hora de apertura</Label>
                          <Select
                            value={period.open}
                            onValueChange={(value) => updatePeriod(day.key, periodIndex, 'open', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar hora" />
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

                        {/* Hora de cierre */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Hora de cierre</Label>
                          <Select
                            value={period.close}
                            onValueChange={(value) => updatePeriod(day.key, periodIndex, 'close', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar hora" />
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

                        {/* Día siguiente */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Configuración</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch
                              checked={period.nextDay}
                              onCheckedChange={(checked) => updatePeriod(day.key, periodIndex, 'nextDay', checked)}
                            />
                            <Label className="text-sm text-gray-600">Continúa al día siguiente</Label>
                          </div>
                        </div>
                      </div>

                      {/* Resumen del período */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {period.open} - {period.close}{period.nextDay ? ' (día siguiente)' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(daySchedule.periods || []).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No hay horarios configurados para este día</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPeriod(day.key)}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar primer horario
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center space-x-1">
          <CheckCircle className="w-4 h-4" />
          <span>Consejos para los horarios</span>
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Puedes agregar múltiples horarios por día (ej: almuerzo y cena)</li>
          <li>• Activa &quot;Día siguiente&quot; para horarios que cruzan la medianoche</li>
          <li>• Los horarios se muestran en tu tienda online</li>
          <li>• Usa las plantillas para configurar rápidamente</li>
          <li>• Mantén los horarios siempre actualizados</li>
        </ul>
      </motion.div>

      {/* Estado de validación */}
      {formState.errors?.schedule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-900">Error en horarios</h4>
          </div>
          <p className="text-sm text-red-800">{formState.errors.schedule}</p>
        </motion.div>
      )}
    </div>
  );
}

export default ScheduleSection;