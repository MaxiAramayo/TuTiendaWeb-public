/**
 * Servicio para gestión de horarios y estado de tienda
 * 
 * @module features/store/api/scheduleService
 */

import { WeeklySchedule, DailySchedule, StoreStatus } from '../types/store.types';

/**
 * Servicio para cálculos de horarios y estado de tienda
 */
export class ScheduleService {
  /**
   * Calcula el estado actual de la tienda
   * @param schedule Horarios semanales
   * @param timezone Zona horaria (opcional, por defecto America/Argentina/Buenos_Aires)
   * @returns Estado actual de la tienda
   */
  static calculateStoreStatus(
    schedule: WeeklySchedule, 
    timezone: string = 'America/Argentina/Buenos_Aires'
  ): StoreStatus {
    try {
      const now = new Date();
      const currentDay = this.getCurrentDayName(now);
      const todaySchedule = schedule[currentDay];
      
      // Si la tienda no abre hoy o no es un objeto válido
      if (!todaySchedule || typeof todaySchedule === 'string' || !todaySchedule.isOpen) {
        const nextOpenDay = this.getNextOpenDay(schedule, now);
        return {
          isOpen: false,
          nextChange: nextOpenDay ? {
            dateTime: nextOpenDay.date,
            type: 'open',
            message: `Abre ${this.formatNextOpenMessage(nextOpenDay.date)}`
          } : undefined
        };
      }
      
      // Verificar que tenga horarios válidos
      if (!todaySchedule.openTime || !todaySchedule.closeTime) {
        const nextOpenDay = this.getNextOpenDay(schedule, now);
        return {
          isOpen: false,
          nextChange: nextOpenDay ? {
            dateTime: nextOpenDay.date,
            type: 'open',
            message: `Abre ${this.formatNextOpenMessage(nextOpenDay.date)}`
          } : undefined
        };
      }
      
      const currentTime = this.getCurrentTimeString(now);
      const isCurrentlyOpen = this.isTimeInRange(
        currentTime, 
        todaySchedule.openTime, 
        todaySchedule.closeTime
      );
      
      // Verificar si está en un break
      const isInBreak = this.isInBreakTime(currentTime, todaySchedule.breaks);
      
      if (isCurrentlyOpen && !isInBreak) {
        // Tienda abierta - calcular próximo cierre
        const nextClose = this.getNextCloseTime(todaySchedule, currentTime);
        return {
          isOpen: true,
          nextChange: {
            dateTime: this.createDateFromTime(now, nextClose),
            type: 'close',
            message: `Cierra a las ${nextClose}`
          }
        };
      } else {
        // Tienda cerrada - calcular próxima apertura
        const nextOpen = this.getNextOpenTime(schedule, now);
        return {
          isOpen: false,
          nextChange: nextOpen ? {
            dateTime: nextOpen.date,
            type: 'open',
            message: nextOpen.isToday ? 
              `Abre a las ${nextOpen.time}` : 
              `Abre ${this.formatNextOpenMessage(nextOpen.date)}`
          } : undefined
        };
      }
    } catch (error) {
      console.error('Error calculando estado de tienda:', error);
      // Estado por defecto en caso de error
      return {
        isOpen: false,
        nextChange: undefined
      };
    }
  }

  /**
   * Obtiene el próximo cambio de estado
   * @param schedule Horarios semanales
   * @param timezone Zona horaria
   * @returns Información del próximo cambio
   */
  static getNextStatusChange(
    schedule: WeeklySchedule, 
    timezone: string = 'America/Argentina/Buenos_Aires'
  ): StoreStatus['nextChange'] {
    const status = this.calculateStoreStatus(schedule, timezone);
    return status.nextChange;
  }

  /**
   * Verifica si la tienda está abierta en un momento específico
   * @param schedule Horarios semanales
   * @param date Fecha y hora a verificar
   * @returns true si está abierta
   */
  static isStoreOpen(schedule: WeeklySchedule, date: Date = new Date()): boolean {
    const dayName = this.getCurrentDayName(date);
    const daySchedule = schedule[dayName];
    
    if (!daySchedule || typeof daySchedule === 'string' || !daySchedule.isOpen) return false;
    
    const timeString = this.getCurrentTimeString(date);
    
    if (!daySchedule.openTime || !daySchedule.closeTime) return false;
    
    const isInRange = this.isTimeInRange(
      timeString, 
      daySchedule.openTime, 
      daySchedule.closeTime
    );
    
    const isInBreak = this.isInBreakTime(timeString, daySchedule.breaks);
    
    return isInRange && !isInBreak;
  }

  /**
   * Obtiene el nombre del día actual
   * @param date Fecha
   * @returns Nombre del día en inglés (monday, tuesday, etc.)
   */
  private static getCurrentDayName(date: Date): keyof Omit<WeeklySchedule, 'timezone'> {
    const days: (keyof Omit<WeeklySchedule, 'timezone'>)[] = [
      'sunday', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday'
    ];
    return days[date.getDay()];
  }

  /**
   * Obtiene la hora actual como string HH:mm
   * @param date Fecha
   * @returns Hora en formato HH:mm
   */
  private static getCurrentTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Verifica si una hora está dentro de un rango
   * @param time Hora a verificar (HH:mm)
   * @param start Hora de inicio (HH:mm)
   * @param end Hora de fin (HH:mm)
   * @returns true si está en el rango
   */
  private static isTimeInRange(time: string, start: string, end: string): boolean {
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(start);
    let endMinutes = this.timeToMinutes(end);
    
    // Manejar horarios que cruzan medianoche
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
      if (timeMinutes < startMinutes) {
        return timeMinutes + 24 * 60 <= endMinutes;
      }
    }
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  /**
   * Convierte tiempo HH:mm a minutos desde medianoche
   * @param time Tiempo en formato HH:mm
   * @returns Minutos desde medianoche
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Verifica si está en horario de break
   * @param time Hora actual
   * @param breaks Array de breaks
   * @returns true si está en break
   */
  private static isInBreakTime(
    time: string, 
    breaks?: DailySchedule['breaks']
  ): boolean {
    if (!breaks || breaks.length === 0) return false;
    
    return breaks.some(breakTime => 
      this.isTimeInRange(time, breakTime.startTime, breakTime.endTime)
    );
  }

  /**
   * Obtiene el próximo día que abre la tienda
   * @param schedule Horarios semanales
   * @param currentDate Fecha actual
   * @returns Información del próximo día de apertura
   */
  private static getNextOpenDay(
    schedule: WeeklySchedule, 
    currentDate: Date
  ): { date: Date; dayName: keyof Omit<WeeklySchedule, 'timezone'> } | null {
    const days: (keyof Omit<WeeklySchedule, 'timezone'>)[] = [
      'sunday', 'monday', 'tuesday', 'wednesday', 
      'thursday', 'friday', 'saturday'
    ];
    
    let checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + 1);
    
    // Buscar hasta 7 días adelante
    for (let i = 0; i < 7; i++) {
      const dayName = this.getCurrentDayName(checkDate);
      const daySchedule = schedule[dayName];
      
      if (daySchedule && typeof daySchedule === 'object' && daySchedule.isOpen && daySchedule.openTime) {
        const openDate = this.createDateFromTime(checkDate, daySchedule.openTime);
        return { date: openDate, dayName };
      }
      
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return null;
  }

  /**
   * Obtiene la próxima hora de cierre
   * @param daySchedule Horario del día
   * @param currentTime Hora actual
   * @returns Hora de cierre
   */
  private static getNextCloseTime(
    daySchedule: DailySchedule, 
    currentTime: string
  ): string {
    // Verificar si hay breaks después de la hora actual
    if (daySchedule.breaks) {
      for (const breakTime of daySchedule.breaks) {
        if (this.timeToMinutes(breakTime.startTime) > this.timeToMinutes(currentTime)) {
          return breakTime.startTime;
        }
      }
    }
    
    return daySchedule.closeTime || '22:00';
  }

  /**
   * Obtiene la próxima hora de apertura
   * @param schedule Horarios semanales
   * @param currentDate Fecha actual
   * @returns Información de próxima apertura
   */
  private static getNextOpenTime(
    schedule: WeeklySchedule, 
    currentDate: Date
  ): { date: Date; time: string; isToday: boolean } | null {
    const currentTime = this.getCurrentTimeString(currentDate);
    const currentDay = this.getCurrentDayName(currentDate);
    const todaySchedule = schedule[currentDay];
    
    // Verificar si aún puede abrir hoy
    if (todaySchedule && typeof todaySchedule === 'object' && todaySchedule.isOpen && todaySchedule.openTime) {
      if (this.timeToMinutes(todaySchedule.openTime) > this.timeToMinutes(currentTime)) {
        return {
          date: this.createDateFromTime(currentDate, todaySchedule.openTime),
          time: todaySchedule.openTime,
          isToday: true
        };
      }
      
      // Verificar si hay breaks que terminen hoy
      if (todaySchedule.breaks) {
        for (const breakTime of todaySchedule.breaks) {
          if (this.timeToMinutes(breakTime.endTime) > this.timeToMinutes(currentTime)) {
            return {
              date: this.createDateFromTime(currentDate, breakTime.endTime),
              time: breakTime.endTime,
              isToday: true
            };
          }
        }
      }
    }
    
    // Buscar próximo día de apertura
    const nextOpenDay = this.getNextOpenDay(schedule, currentDate);
    if (nextOpenDay) {
      const daySchedule = schedule[nextOpenDay.dayName];
      if (daySchedule && typeof daySchedule === 'object' && daySchedule.openTime) {
        return {
          date: this.createDateFromTime(nextOpenDay.date, daySchedule.openTime),
          time: daySchedule.openTime,
          isToday: false
        };
      }
    }
    
    return null;
  }

  /**
   * Crea una fecha con una hora específica
   * @param date Fecha base
   * @param time Hora en formato HH:mm
   * @returns Nueva fecha con la hora especificada
   */
  private static createDateFromTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  /**
   * Formatea el mensaje de próxima apertura
   * @param date Fecha de apertura
   * @returns Mensaje formateado
   */
  private static formatNextOpenMessage(date: Date): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return `mañana a las ${this.getCurrentTimeString(date)}`;
    }
    
    const dayNames: Record<keyof Omit<WeeklySchedule, 'timezone'>, string> = {
      'sunday': 'domingo',
      'monday': 'lunes',
      'tuesday': 'martes',
      'wednesday': 'miércoles',
      'thursday': 'jueves',
      'friday': 'viernes',
      'saturday': 'sábado'
    };
    
    const dayName = this.getCurrentDayName(date);
    const spanishDayName = dayNames[dayName];
    
    return `el ${spanishDayName} a las ${this.getCurrentTimeString(date)}`;
  }

  /**
   * Crea un horario por defecto
   * @returns Horario semanal por defecto
   */
  static createDefaultSchedule(): WeeklySchedule {
    const defaultDay: DailySchedule = {
      isOpen: true,
      openTime: '09:00',
      closeTime: '22:00'
    };
    
    return {
      monday: defaultDay,
      tuesday: defaultDay,
      wednesday: defaultDay,
      thursday: defaultDay,
      friday: defaultDay,
      saturday: defaultDay,
      sunday: { isOpen: false },
      timezone: 'America/Argentina/Buenos_Aires'
    };
  }

  /**
   * Valida un horario semanal
   * @param schedule Horario a validar
   * @returns true si es válido
   */
  static validateSchedule(schedule: WeeklySchedule): boolean {
    const days: (keyof Omit<WeeklySchedule, 'timezone'>)[] = [
      'monday', 'tuesday', 'wednesday', 'thursday', 
      'friday', 'saturday', 'sunday'
    ];
    
    for (const day of days) {
      const daySchedule = schedule[day];
      
      if (!daySchedule || typeof daySchedule === 'string') {
        continue;
      }
      
      if (daySchedule.isOpen) {
        if (!daySchedule.openTime || !daySchedule.closeTime) {
          return false;
        }
        
        if (!this.isValidTimeFormat(daySchedule.openTime) || 
            !this.isValidTimeFormat(daySchedule.closeTime)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Valida el formato de hora HH:mm
   * @param time Hora a validar
   * @returns true si es válida
   */
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}