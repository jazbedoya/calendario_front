import { parseISO, addDays, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { CalendarEvent, Conflict, Layer } from './types';

/**
 * Devuelve un Map donde la clave es 'yyyy-MM-dd' (en la zona horaria del
 * usuario) y el valor es el conjunto de capas que tienen al menos un evento
 * ese día. Un evento que cruza medianoche cuenta en todos los días que abarca.
 */
export function getLayersByDay(
  events: CalendarEvent[],
  _month: Date,
  timezone: string,
): Map<string, Set<Layer>> {
  const result = new Map<string, Set<Layer>>();

  for (const event of events) {
    const startUtc = parseISO(event.startAt);
    const endUtc   = parseISO(event.endAt);

    const startDateStr = formatInTimeZone(startUtc, timezone, 'yyyy-MM-dd');
    const endDateStr   = formatInTimeZone(endUtc,   timezone, 'yyyy-MM-dd');
    const endTimeStr   = formatInTimeZone(endUtc,   timezone, 'HH:mm');

    // Construye fechas locales puras para la iteración (sin desfase de TZ)
    const [sy, sm, sd] = startDateStr.split('-').map(Number);
    const [ey, em, ed] = endDateStr.split('-').map(Number);
    let current = new Date(sy, sm - 1, sd);
    let end     = new Date(ey, em - 1, ed);

    // Fin exacto a medianoche → ese día no cuenta
    if (endTimeStr === '00:00') {
      end = addDays(end, -1);
    }

    while (current <= end) {
      const key = format(current, 'yyyy-MM-dd');
      if (!result.has(key)) result.set(key, new Set());
      result.get(key)!.add(event.layer);
      current = addDays(current, 1);
    }
  }

  return result;
}

/**
 * Detecta conflictos ENTRE CAPAS DISTINTAS.
 * - 'overlap':      los intervalos se solapan (marginMinutes ≤ 0).
 * - 'tight_margin': hueco < options.minMarginMinutes (por defecto 15 min).
 *
 * eventA siempre es el que empieza antes; eventB el que empieza después.
 */
export function detectConflicts(
  events: CalendarEvent[],
  options?: { minMarginMinutes?: number },
): Conflict[] {
  const minMargin = options?.minMarginMinutes ?? 15;
  const conflicts: Conflict[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      if (a.layer === b.layer) continue;

      const startA = parseISO(a.startAt).getTime();
      const endA   = parseISO(a.endAt).getTime();
      const startB = parseISO(b.startAt).getTime();
      const endB   = parseISO(b.endAt).getTime();

      // ¿Se solapan? (condición estándar de intervalos)
      const overlaps = startA < endB && startB < endA;

      // Ordenar: evA empieza antes
      const [evA, evB, endFirst, startSecond] =
        startA <= startB
          ? [a, b, endA, startB]
          : [b, a, endB, startA];

      const marginMin = Math.round((startSecond - endFirst) / 60_000);

      if (overlaps) {
        conflicts.push({
          id: `${evA.id}::${evB.id}`,
          type: 'overlap',
          eventA: evA,
          eventB: evB,
          marginMinutes: marginMin, // ≤ 0
          layers: [evA.layer, evB.layer],
        });
      } else if (marginMin < minMargin) {
        conflicts.push({
          id: `${evA.id}::${evB.id}`,
          type: 'tight_margin',
          eventA: evA,
          eventB: evB,
          marginMinutes: marginMin, // > 0, < minMargin
          layers: [evA.layer, evB.layer],
        });
      }
    }
  }

  return conflicts;
}

// ─── Helpers usados en la pantalla ────────────────────────────────────────────

/**
 * Devuelve los eventos activos en un día concreto (incluyendo multi-día),
 * ordenados por hora de inicio.
 */
export function getEventsForDay(
  events: CalendarEvent[],
  dateKey: string,       // 'yyyy-MM-dd'
  timezone: string,
): CalendarEvent[] {
  return events
    .filter((e) => {
      const startKey = formatInTimeZone(parseISO(e.startAt), timezone, 'yyyy-MM-dd');
      const endUtc   = parseISO(e.endAt);
      const endKey   = formatInTimeZone(endUtc, timezone, 'yyyy-MM-dd');
      const endTime  = formatInTimeZone(endUtc, timezone, 'HH:mm');

      // Fin exacto a medianoche → el día del fin no cuenta
      const effectiveEndKey =
        endTime === '00:00' ? prevDateKey(endKey) : endKey;

      return dateKey >= startKey && dateKey <= effectiveEndKey;
    })
    .sort(
      (a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime(),
    );
}

function prevDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return format(new Date(y, m - 1, d - 1), 'yyyy-MM-dd');
}
