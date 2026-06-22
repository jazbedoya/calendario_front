import { addDays, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, format } from "date-fns";
import type { Layer } from "@/features/overview/types";

export interface ParsedTask {
  title: string;
  dayName: string | null;    // "Lunes", "Martes", etc.
  date: string | null;       // "yyyy-MM-dd"
  hour: number | null;
  minute: number | null;
  layer: Layer | null;
}

// ── Day extraction ─────────────────────────────────────────────────────────

const DAY_MAP: Record<string, (ref: Date) => Date> = {
  lunes:     (r) => nextMonday(r),
  martes:    (r) => nextTuesday(r),
  "miercoles": (r) => nextWednesday(r),
  "miércoles": (r) => nextWednesday(r),
  jueves:    (r) => nextThursday(r),
  viernes:   (r) => nextFriday(r),
  "sabado":  (r) => nextSaturday(r),
  "sábado":  (r) => nextSaturday(r),
  domingo:   (r) => nextSunday(r),
  // English
  monday:    (r) => nextMonday(r),
  tuesday:   (r) => nextTuesday(r),
  wednesday: (r) => nextWednesday(r),
  thursday:  (r) => nextThursday(r),
  friday:    (r) => nextFriday(r),
  saturday:  (r) => nextSaturday(r),
  sunday:    (r) => nextSunday(r),
};

const DAY_DISPLAY: Record<string, string> = {
  lunes: "Lunes", martes: "Martes", "miercoles": "Miércoles", "miércoles": "Miércoles",
  jueves: "Jueves", viernes: "Viernes", "sabado": "Sábado", "sábado": "Sábado", domingo: "Domingo",
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
};

const RELATIVE_ES: Record<string, (r: Date) => Date> = {
  hoy:     (r) => r,
  "mañana": (r) => addDays(r, 1),
  manana:  (r) => addDays(r, 1),
};

const RELATIVE_DISPLAY: Record<string, string> = {
  hoy: "Hoy", "mañana": "Mañana", manana: "Mañana",
  today: "Today", tomorrow: "Tomorrow",
};

// ── Time extraction ────────────────────────────────────────────────────────

// Matches: "9:00", "09:00", "14:30", "a las 9", "a las 9:30"
const TIME_RE = /(?:a\s+las?\s+)?(\d{1,2})(?::(\d{2}))?(?:\s*(?:h|hs|hrs))?\b/i;

// ── Layer suggestion ───────────────────────────────────────────────────────

const LAYER_KEYWORDS: Record<Layer, string[]> = {
  work: [
    "reunión", "reunion", "meeting", "equipo", "oficina", "trabajo", "jefe",
    "proyecto", "cliente", "presentación", "presentacion", "deadline", "sprint",
    "standup", "call", "llamada", "informe", "reporte",
  ],
  family: [
    "familia", "hijos", "hijo", "hija", "niños", "colegio", "escuela",
    "padres", "mamá", "papá", "mama", "papa", "hermano", "hermana",
    "cena familiar", "parque", "pediatra",
  ],
  personal: [
    "gym", "yoga", "médico", "medico", "dentista", "correr", "leer",
    "compras", "terapia", "meditación", "meditacion", "ejercicio",
    "paseo", "cine", "serie", "hobby",
  ],
};

// ── Main parser ────────────────────────────────────────────────────────────

export function parseTaskInput(input: string): ParsedTask {
  const trimmed = input.trim();
  if (!trimmed) return { title: "", dayName: null, date: null, hour: null, minute: null, layer: null };

  const now = new Date();
  let remaining = trimmed;
  let dayName: string | null = null;
  let date: string | null = null;
  let hour: number | null = null;
  let minute: number | null = null;
  let layer: Layer | null = null;

  const lower = remaining.toLowerCase();

  // Extract relative day (hoy, mañana)
  for (const [key, fn] of Object.entries(RELATIVE_ES)) {
    const re = new RegExp(`\\b${key}\\b`, "i");
    if (re.test(lower)) {
      const d = fn(now);
      date = format(d, "yyyy-MM-dd");
      dayName = RELATIVE_DISPLAY[key] ?? key;
      remaining = remaining.replace(re, "").trim();
      break;
    }
  }

  // Extract day name (lunes, martes, etc.)
  if (!date) {
    for (const [key, fn] of Object.entries(DAY_MAP)) {
      const re = new RegExp(`\\b(?:el\\s+)?${key}\\b`, "i");
      if (re.test(lower)) {
        // Check if today IS that day
        const todayDayIdx = now.getDay(); // 0=Sun
        const dayIdx = ["domingo","lunes","martes","miércoles","miercoles","jueves","viernes","sábado","sabado",
                        "sunday","monday","tuesday","wednesday","thursday","friday","saturday"]
          .indexOf(key.toLowerCase());
        // Use nextX which gives next occurrence (could be today if using startOfDay comparison)
        const d = fn(addDays(now, -1)); // nextMonday from yesterday = today if today is Monday
        date = format(d, "yyyy-MM-dd");
        dayName = DAY_DISPLAY[key] ?? key;
        remaining = remaining.replace(re, "").trim();
        break;
      }
    }
  }

  // Extract time
  const timeMatch = remaining.match(TIME_RE);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      hour = h;
      minute = m;
      remaining = remaining.replace(timeMatch[0], "").trim();
    }
  }

  // Suggest layer
  const lowerRemaining = remaining.toLowerCase();
  let maxScore = 0;
  for (const [l, keywords] of Object.entries(LAYER_KEYWORDS) as [Layer, string[]][]) {
    const score = keywords.filter((kw) => lowerRemaining.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      layer = l;
    }
  }

  // Clean up title
  let title = remaining
    .replace(/\s{2,}/g, " ")
    .replace(/^[,.\-–—]\s*/, "")
    .replace(/\s*[,.\-–—]$/, "")
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return { title: title || trimmed, dayName, date, hour, minute, layer };
}
