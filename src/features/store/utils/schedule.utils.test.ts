/**
 * Tests unit de ScheduleService (Fase 5 · lógica de negocio crítica).
 *
 * Esta lógica decide si el catálogo público está "abierto" y, por lo tanto, si
 * el cliente puede comprar. Por eso se cubren los bordes (apertura/cierre
 * exactos, cruce de medianoche, breaks, días cerrados).
 *
 * Determinismo: `calculateStoreStatus` lee `new Date()` internamente, así que se
 * congela el reloj con `vi.useFakeTimers()`. Las fechas se construyen por
 * componentes locales (`new Date(2024, 0, 1, 10, 30)`) para que el día/hora sean
 * estables sin importar la zona horaria del runner. `isStoreOpen(schedule, date)`
 * recibe la fecha por parámetro, así que no necesita timers.
 *
 * 2024-01-01 es lunes (getDay() === 1).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScheduleService } from './schedule.utils';
import type { WeeklySchedule, DailySchedule } from '../types/store.types';

/** Día cerrado por defecto; se sobreescribe el día que cada test necesita. */
const CLOSED: DailySchedule = { isOpen: false };

/** Construye una semana cerrada y abre solo los días provistos. */
function makeSchedule(overrides: Partial<WeeklySchedule> = {}): WeeklySchedule {
  return {
    monday: CLOSED,
    tuesday: CLOSED,
    wednesday: CLOSED,
    thursday: CLOSED,
    friday: CLOSED,
    saturday: CLOSED,
    sunday: CLOSED,
    timezone: 'America/Argentina/Buenos_Aires',
    ...overrides,
  };
}

// Fechas locales de referencia (lunes 2024-01-01).
const monday = (h: number, m: number) => new Date(2024, 0, 1, h, m);
const sunday = (h: number, m: number) => new Date(2024, 0, 7, h, m); // domingo

describe('ScheduleService.isStoreOpen', () => {
  const openMonday = makeSchedule({
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  });

  it('está abierta dentro del horario', () => {
    expect(ScheduleService.isStoreOpen(openMonday, monday(10, 30))).toBe(true);
  });

  it('está cerrada antes de la apertura', () => {
    expect(ScheduleService.isStoreOpen(openMonday, monday(8, 0))).toBe(false);
  });

  it('está cerrada después del cierre', () => {
    expect(ScheduleService.isStoreOpen(openMonday, monday(19, 0))).toBe(false);
  });

  it('está abierta exactamente en la hora de apertura (borde inclusivo)', () => {
    expect(ScheduleService.isStoreOpen(openMonday, monday(9, 0))).toBe(true);
  });

  it('está abierta exactamente en la hora de cierre (borde inclusivo)', () => {
    expect(ScheduleService.isStoreOpen(openMonday, monday(18, 0))).toBe(true);
  });

  it('está cerrada el día marcado como no abierto', () => {
    expect(ScheduleService.isStoreOpen(openMonday, sunday(10, 30))).toBe(false);
  });

  it('está cerrada si el día abre pero le falta openTime/closeTime', () => {
    const schedule = makeSchedule({ monday: { isOpen: true } });
    expect(ScheduleService.isStoreOpen(schedule, monday(10, 30))).toBe(false);
  });

  describe('breaks (pausas dentro del horario)', () => {
    const withBreak = makeSchedule({
      monday: {
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ startTime: '13:00', endTime: '14:00' }],
      },
    });

    it('está cerrada durante el break', () => {
      expect(ScheduleService.isStoreOpen(withBreak, monday(13, 30))).toBe(false);
    });

    it('está abierta justo antes del break', () => {
      expect(ScheduleService.isStoreOpen(withBreak, monday(12, 59))).toBe(true);
    });
  });

  describe('horario que cruza la medianoche (22:00 → 02:00)', () => {
    const overnight = makeSchedule({
      monday: { isOpen: true, openTime: '22:00', closeTime: '02:00' },
    });

    it('está abierta a las 23:00 (mismo día, después de abrir)', () => {
      expect(ScheduleService.isStoreOpen(overnight, monday(23, 0))).toBe(true);
    });

    it('está abierta a la 01:00 (madrugada, antes de cerrar)', () => {
      expect(ScheduleService.isStoreOpen(overnight, monday(1, 0))).toBe(true);
    });

    it('está cerrada a las 03:00 (después del cierre nocturno)', () => {
      expect(ScheduleService.isStoreOpen(overnight, monday(3, 0))).toBe(false);
    });
  });
});

describe('ScheduleService.calculateStoreStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function freezeAt(date: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  }

  it('reporta abierta y el próximo cambio es el cierre', () => {
    freezeAt(monday(10, 30));
    const schedule = makeSchedule({
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    });

    const status = ScheduleService.calculateStoreStatus(schedule);

    expect(status.isOpen).toBe(true);
    expect(status.nextChange?.type).toBe('close');
    expect(status.nextChange?.message).toBe('Cierra a las 18:00');
  });

  it('reporta cerrada antes de abrir y anuncia la apertura de hoy', () => {
    freezeAt(monday(8, 0));
    const schedule = makeSchedule({
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    });

    const status = ScheduleService.calculateStoreStatus(schedule);

    expect(status.isOpen).toBe(false);
    expect(status.nextChange?.type).toBe('open');
    expect(status.nextChange?.message).toBe('Abre a las 09:00');
  });

  it('reporta cerrada el día sin horario y apunta al próximo día abierto', () => {
    freezeAt(sunday(10, 0)); // domingo cerrado
    const schedule = makeSchedule({
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    });

    const status = ScheduleService.calculateStoreStatus(schedule);

    expect(status.isOpen).toBe(false);
    expect(status.nextChange?.type).toBe('open');
    // El próximo lunes a las 09:00.
    expect(status.nextChange?.message).toContain('Abre');
  });

  it('devuelve un estado cerrado seguro ante un schedule inválido (no lanza)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error: forzamos un input inválido para ejercitar el catch.
    const status = ScheduleService.calculateStoreStatus(null);

    expect(status.isOpen).toBe(false);
    expect(status.nextChange).toBeUndefined();
    spy.mockRestore();
  });
});

describe('ScheduleService.getNextStatusChange', () => {
  afterEach(() => vi.useRealTimers());

  it('delega en calculateStoreStatus y devuelve solo el próximo cambio', () => {
    vi.useFakeTimers();
    vi.setSystemTime(monday(10, 30));
    const schedule = makeSchedule({
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    });

    const next = ScheduleService.getNextStatusChange(schedule);

    expect(next?.type).toBe('close');
  });
});

describe('ScheduleService.createDefaultSchedule', () => {
  it('abre lunes a sábado 09:00–22:00 y cierra el domingo', () => {
    const schedule = ScheduleService.createDefaultSchedule();

    expect(schedule.monday).toEqual({ isOpen: true, openTime: '09:00', closeTime: '22:00' });
    expect(schedule.saturday.isOpen).toBe(true);
    expect(schedule.sunday.isOpen).toBe(false);
    expect(schedule.timezone).toBe('America/Argentina/Buenos_Aires');
  });

  it('el horario por defecto es válido', () => {
    expect(ScheduleService.validateSchedule(ScheduleService.createDefaultSchedule())).toBe(true);
  });
});

describe('ScheduleService.validateSchedule', () => {
  it('acepta un día abierto con horarios válidos', () => {
    const schedule = makeSchedule({
      monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    });
    expect(ScheduleService.validateSchedule(schedule)).toBe(true);
  });

  it('rechaza un día abierto sin openTime/closeTime', () => {
    const schedule = makeSchedule({ monday: { isOpen: true } });
    expect(ScheduleService.validateSchedule(schedule)).toBe(false);
  });

  it('rechaza un formato de hora inválido', () => {
    const schedule = makeSchedule({
      monday: { isOpen: true, openTime: '25:99', closeTime: '18:00' },
    });
    expect(ScheduleService.validateSchedule(schedule)).toBe(false);
  });

  it('ignora días cerrados (no exige horarios)', () => {
    const schedule = makeSchedule({ monday: { isOpen: false } });
    expect(ScheduleService.validateSchedule(schedule)).toBe(true);
  });

  it('ignora entradas legacy de tipo string', () => {
    const schedule = makeSchedule();
    // @ts-expect-error: dato legacy (string) que el validador debe saltear.
    schedule.monday = 'closed';
    expect(ScheduleService.validateSchedule(schedule)).toBe(true);
  });
});
