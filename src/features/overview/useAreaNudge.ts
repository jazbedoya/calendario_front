/**
 * useAreaNudge — detecta si un área lleva ≥7 días sin eventos
 * y gestiona el estado de "Ahora no" por área.
 * Persiste el dismiss en expo-secure-store.
 */
import { useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { differenceInDays, parseISO } from "date-fns";
import type { Layer, CalendarEvent } from "./types";

const DAYS_THRESHOLD = 7;

function storageKey(layer: Layer) {
  return `area_nudge_dismissed_${layer}`;
}

export function useAreaNudge(layer: Layer, events: CalendarEvent[]) {
  // null = cargando, true = descartado recientemente, false = mostrar
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(storageKey(layer))
      .then((val) => {
        if (cancelled) return;
        if (!val) { setDismissed(false); return; }
        const ts = parseInt(val, 10);
        const daysSince = differenceInDays(Date.now(), ts);
        setDismissed(daysSince < DAYS_THRESHOLD);
      })
      .catch(() => setDismissed(false));
    return () => { cancelled = true; };
  }, [layer]);

  const dismiss = useCallback(async () => {
    setDismissed(true);
    await SecureStore.setItemAsync(storageKey(layer), String(Date.now()));
  }, [layer]);

  // Último evento del área (por fecha de inicio, descendente)
  const layerEvents = events.filter((e) => e.layer === layer);
  let daysWithoutEvent: number;
  if (layerEvents.length === 0) {
    daysWithoutEvent = 999;
  } else {
    const latest = layerEvents.reduce((best, e) =>
      parseISO(e.startAt) > parseISO(best.startAt) ? e : best
    );
    daysWithoutEvent = differenceInDays(new Date(), parseISO(latest.startAt));
  }

  const hasInactivity = daysWithoutEvent >= DAYS_THRESHOLD;
  const shouldShow    = dismissed === false && hasInactivity;

  return { shouldShow, dismiss };
}
