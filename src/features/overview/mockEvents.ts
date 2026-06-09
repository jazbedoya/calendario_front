import type { CalendarEvent } from './types';

/**
 * Mock estructurado EXACTAMENTE como responde GET /events?from=&to=.
 * Sustituir por TanStack Query cuando el backend esté conectado.
 * Offset +02:00 = Europe/Madrid en verano (CEST).
 */
export const mockEvents: CalendarEvent[] = [
  // ── Mayo 2026 ───────────────────────────────────────────────────
  {
    id: 'ev-01',
    title: 'Revisión trimestral',
    startAt: '2026-05-26T09:00:00+02:00',
    endAt:   '2026-05-26T11:00:00+02:00',
    isAllDay: false,
    layer: 'work',
    location: 'Sala Roja',
  },
  {
    id: 'ev-02',
    title: 'Cumpleaños de Pedro',
    startAt: '2026-05-27T00:00:00+02:00',
    endAt:   '2026-05-28T00:00:00+02:00',  // fin-medianoche → solo aparece el 27
    isAllDay: true,
    layer: 'family',
  },
  {
    id: 'ev-03',
    title: 'Yoga',
    startAt: '2026-05-28T07:30:00+02:00',
    endAt:   '2026-05-28T08:30:00+02:00',
    isAllDay: false,
    layer: 'personal',
  },

  // ── Junio 2026 — día 1 (tight margin trabajo → familia, 5 min) ──
  {
    id: 'ev-04',
    title: 'Daily standup',
    startAt: '2026-06-01T09:00:00+02:00',
    endAt:   '2026-06-01T09:30:00+02:00',
    isAllDay: false,
    layer: 'work',
  },
  {
    id: 'ev-05',
    title: 'Cierre de sprint',
    startAt: '2026-06-01T17:00:00+02:00',
    endAt:   '2026-06-01T17:25:00+02:00',
    isAllDay: false,
    layer: 'work',
    location: 'Google Meet',
  },
  {
    id: 'ev-06',
    title: 'Recoger a los niños',
    startAt: '2026-06-01T17:30:00+02:00',  // 5 min después de ev-05
    endAt:   '2026-06-01T18:00:00+02:00',
    isAllDay: false,
    layer: 'family',
    location: 'Colegio Montserrat',
  },
  {
    id: 'ev-07',
    title: 'Gimnasio',
    startAt: '2026-06-01T07:30:00+02:00',
    endAt:   '2026-06-01T08:30:00+02:00',
    isAllDay: false,
    layer: 'personal',
  },

  // ── Junio 3 — overlap trabajo ↔ familia ─────────────────────────
  {
    id: 'ev-08',
    title: 'Llamada con cliente',
    startAt: '2026-06-03T14:00:00+02:00',
    endAt:   '2026-06-03T15:30:00+02:00',
    isAllDay: false,
    layer: 'work',
  },
  {
    id: 'ev-09',
    title: 'Cena familiar en casa',
    startAt: '2026-06-03T14:30:00+02:00',  // 30 min después → se solapa con ev-08
    endAt:   '2026-06-03T16:00:00+02:00',
    isAllDay: false,
    layer: 'family',
    location: 'Casa',
  },
  {
    id: 'ev-10',
    title: 'Lectura nocturna',
    startAt: '2026-06-03T20:00:00+02:00',
    endAt:   '2026-06-03T21:00:00+02:00',
    isAllDay: false,
    layer: 'personal',
  },

  // ── Junio 5 — overlap trabajo ↔ familia ─────────────────────────
  {
    id: 'ev-11',
    title: 'Formación UX',
    startAt: '2026-06-05T10:00:00+02:00',
    endAt:   '2026-06-05T12:00:00+02:00',
    isAllDay: false,
    layer: 'work',
    location: 'Zoom',
  },
  {
    id: 'ev-12',
    title: 'Partido de Lucas',
    startAt: '2026-06-05T11:00:00+02:00',  // se solapa con ev-11
    endAt:   '2026-06-05T12:30:00+02:00',
    isAllDay: false,
    layer: 'family',
    location: 'Polideportivo Norte',
  },
  {
    id: 'ev-13',
    title: 'Meditación',
    startAt: '2026-06-05T07:00:00+02:00',
    endAt:   '2026-06-05T07:30:00+02:00',
    isAllDay: false,
    layer: 'personal',
  },

  // ── Junio 10 ─────────────────────────────────────────────────────
  {
    id: 'ev-14',
    title: 'Dentista',
    startAt: '2026-06-10T10:00:00+02:00',
    endAt:   '2026-06-10T11:00:00+02:00',
    isAllDay: false,
    layer: 'personal',
  },
  {
    id: 'ev-15',
    title: 'Presentación Q2',
    startAt: '2026-06-10T15:00:00+02:00',
    endAt:   '2026-06-10T16:30:00+02:00',
    isAllDay: false,
    layer: 'work',
  },

  // ── Junio 15 — tight margin trabajo → familia (30 min) ──────────
  {
    id: 'ev-16',
    title: 'Revisión OKRs',
    startAt: '2026-06-15T17:00:00+02:00',
    endAt:   '2026-06-15T18:30:00+02:00',
    isAllDay: false,
    layer: 'work',
  },
  {
    id: 'ev-17',
    title: 'Cena de aniversario',
    startAt: '2026-06-15T19:00:00+02:00',  // 30 min → margen ajustado
    endAt:   '2026-06-15T21:00:00+02:00',
    isAllDay: false,
    layer: 'family',
    location: 'Restaurante La Pepita',
  },

  // ── Evento multi-día (span 2 días) ───────────────────────────────
  {
    id: 'ev-18',
    title: 'Congreso de diseño',
    startAt: '2026-06-17T09:00:00+02:00',
    endAt:   '2026-06-18T18:00:00+02:00',
    isAllDay: false,
    layer: 'work',
    location: 'Centro de Convenciones',
  },
  {
    id: 'ev-19',
    title: 'Fin de semana en la sierra',
    startAt: '2026-06-20T08:00:00+02:00',
    endAt:   '2026-06-22T20:00:00+02:00',
    isAllDay: false,
    layer: 'family',
  },
];
