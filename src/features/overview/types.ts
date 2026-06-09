export type Layer = 'family' | 'work' | 'personal';

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;   // ISO 8601 con offset
  endAt: string;
  isAllDay: boolean;
  layer: Layer;
  location?: string;
  description?: string;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  recurrenceParentId?: string;
}

export const LAYER_COLORS: Record<Layer, string> = {
  family:   '#E89B53',
  work:     '#3D6B5F',
  personal: '#5B5193',
};

export const LAYER_LABELS: Record<Layer, string> = {
  family:   'Familia',
  work:     'Trabajo',
  personal: 'Personal',
};

export interface Conflict {
  id: string;
  type: 'overlap' | 'tight_margin';
  eventA: CalendarEvent;   // evento que empieza antes
  eventB: CalendarEvent;   // evento que empieza después
  marginMinutes: number;   // negativo o 0 = solapan; positivo = margen real
  layers: [Layer, Layer];
}
