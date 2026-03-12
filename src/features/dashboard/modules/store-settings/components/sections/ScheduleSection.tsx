'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Trash2,
  Calendar
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' }
] as const;

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
    name: 'Restaurante',
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
  always: {
    name: '24/7',
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

const COMMON_HOURS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00',
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '23:59'
];

const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { closed: true, periods: [] },
  tuesday: { closed: true, periods: [] },
  wednesday: { closed: true, periods: [] },
  thursday: { closed: true, periods: [] },
  friday: { closed: true, periods: [] },
  saturday: { closed: true, periods: [] },
  sunday: { closed: true, periods: [] }
};

function normalizeWeeklySchedule(input?: WeeklySchedule): WeeklySchedule {
  const base: WeeklySchedule = {
    ...DEFAULT_WEEKLY_SCHEDULE,
    ...(input || {})
  };

  const normalized = { ...base } as WeeklySchedule;

  (Object.keys(DEFAULT_WEEKLY_SCHEDULE) as Array<keyof WeeklySchedule>).forEach((day) => {
    const dayValue = base[day] || { closed: true, periods: [] };
    const periods = Array.isArray(dayValue.periods)
      ? dayValue.periods.filter((p) => p?.open && p?.close)
      : [];

    normalized[day] = {
      ...dayValue,
      closed: typeof dayValue.closed === 'boolean' ? dayValue.closed : periods.length === 0,
      periods,
    };
  });

  return normalized;
}

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

  const [schedule, setSchedule] = useState<WeeklySchedule>(() =>
    normalizeWeeklySchedule(formData.schedule)
  );

  useEffect(() => {
    setSchedule(normalizeWeeklySchedule(formData.schedule));
  }, [formData.schedule]);

  const handleSectionSave = useCallback(async () => {
    if (!user?.uid || !profile?.id) {
      toast.error('Error de sesión');
      return;
    }

    setIsSectionSaving(true);
    try {
      updateField('schedule', schedule);

      const scheduleData: Record<string, any> = {};
      Object.entries(schedule).forEach(([day, data]) => {
        scheduleData[day] = data;
      });

      const result = await updateScheduleAction(scheduleData);

      if (result.success) {
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        toast.success('Horarios guardados correctamente');
      } else {
        toast.error(result.errors._form?.[0] || 'Error al guardar horarios');
      }
    } catch (err) {
      toast.error('Error al guardar los horarios');
    } finally {
      setIsSectionSaving(false);
    }
  }, [user?.uid, profile?.id, schedule, updateField, setProfile]);

  const applyPreset = useCallback((presetKey: string) => {
    if (presetKey && PRESET_SCHEDULES[presetKey as keyof typeof PRESET_SCHEDULES]) {
      const preset = PRESET_SCHEDULES[presetKey as keyof typeof PRESET_SCHEDULES];
      setSchedule(preset.schedule);
      setSelectedPreset(presetKey);
      setShowPresets(false);
      updateField('schedule', preset.schedule);
      toast.success(`Horario "${preset.name}" aplicado`);
    }
  }, [updateField]);

  const updateDaySchedule = useCallback((day: string, newDayData: DailySchedule) => {
    const newSchedule = { ...schedule, [day]: newDayData };
    setSchedule(newSchedule);
    setSelectedPreset('');
    updateField('schedule', newSchedule);
  }, [schedule, updateField]);

  const addPeriod = useCallback((day: string) => {
    const daySchedule = schedule[day as keyof WeeklySchedule];
    const newPeriod: TimePeriod = { open: '09:00', close: '18:00', nextDay: false };
    const newDayData: DailySchedule = {
      ...daySchedule,
      closed: false,
      periods: [...(daySchedule.periods || []), newPeriod]
    };
    updateDaySchedule(day, newDayData);
  }, [schedule, updateDaySchedule]);

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

  const updatePeriod = useCallback((day: string, periodIndex: number, field: keyof TimePeriod, value: any) => {
    const daySchedule = schedule[day as keyof WeeklySchedule];
    const newPeriods = [...(daySchedule.periods || [])];
    newPeriods[periodIndex] = { ...newPeriods[periodIndex], [field]: value };
    const newDayData: DailySchedule = { ...daySchedule, periods: newPeriods };
    updateDaySchedule(day, newDayData);
  }, [schedule, updateDaySchedule]);

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
    toast.success('Horarios limpiados');
  }, [updateField]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Horarios de Atención</h3>
          <p className="text-sm text-gray-500 mt-1">Configura cuándo está abierta tu tienda.</p>
        </div>
      </div>

      {/* Toolbar / Presets */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant={showPresets ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="flex-1 sm:flex-none flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Plantillas
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAllSchedules}
            className="flex-1 sm:flex-none flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </Button>
        </div>
        {selectedPreset && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
            Plantilla activa: {PRESET_SCHEDULES[selectedPreset as keyof typeof PRESET_SCHEDULES]?.name}
          </Badge>
        )}
      </div>

      {showPresets && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {Object.entries(PRESET_SCHEDULES).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={cn(
                "p-4 border rounded-xl text-left transition-all hover:border-blue-500 hover:shadow-sm bg-white",
                selectedPreset === key ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10" : ""
              )}
            >
              <h4 className="font-semibold text-sm text-gray-900">{preset.name}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </motion.div>
      )}

      {/* Main Days Grid */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Configuración por Día
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {DAYS_OF_WEEK.map((day) => {
              const daySchedule = schedule[day.key as keyof WeeklySchedule];
              const isClosed = daySchedule.closed;

              return (
                <div key={day.key} className={cn("p-5 transition-colors", isClosed ? "bg-gray-50/50" : "bg-white")}>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {/* Day Toggle */}
                    <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-48 shrink-0">
                      <Label className="font-bold text-sm text-gray-900 w-20">{day.label}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          {isClosed ? 'Cerrado' : 'Abierto'}
                        </span>
                        <Switch
                          checked={!isClosed}
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
                      </div>
                    </div>

                    {/* Time Periods */}
                    <div className="flex-1 space-y-3">
                      {!isClosed && (daySchedule.periods || []).map((period, periodIndex) => (
                        <div key={periodIndex} className="flex flex-wrap items-center gap-3 bg-gray-50 border rounded-lg p-2.5">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Select
                              value={period.open}
                              onValueChange={(value) => updatePeriod(day.key, periodIndex, 'open', value)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMON_HOURS.map((hour) => (
                                  <SelectItem key={hour} value={hour} className="text-xs">{hour}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-gray-400 font-medium">a</span>
                            <Select
                              value={period.close}
                              onValueChange={(value) => updatePeriod(day.key, periodIndex, 'close', value)}
                            >
                              <SelectTrigger className="w-24 h-8 text-xs bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COMMON_HOURS.map((hour) => (
                                  <SelectItem key={hour} value={hour} className="text-xs">{hour}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between w-full sm:w-auto sm:ml-auto gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={period.nextDay}
                                onCheckedChange={(checked) => updatePeriod(day.key, periodIndex, 'nextDay', checked)}
                                className="scale-75 data-[state=checked]:bg-indigo-500"
                              />
                              <Label className="text-xs text-gray-600 leading-none">Día sig.</Label>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePeriod(day.key, periodIndex)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {!isClosed && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addPeriod(day.key)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 h-8"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Añadir horario
                        </Button>
                      )}
                      
                      {isClosed && (
                        <div className="text-sm text-gray-400 italic py-1">
                          Sin horarios para este día.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {formState.errors?.schedule && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-bold text-red-900">Error</h4>
          </div>
          <p className="text-sm text-red-800">{formState.errors.schedule}</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving || !formState.isDirty}
          className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[160px] bg-indigo-600 hover:bg-indigo-700"
        >
          {isSectionSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>
    </div>
  );
}

export default ScheduleSection;
