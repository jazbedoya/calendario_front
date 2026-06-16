/**
 * getHolidays — festivos oficiales no laborables para ES y PY.
 *
 * Enfoque: algoritmo puro (sin librería, sin tabla hardcodeada por año).
 * - Fechas fijas: cálculo directo.
 * - Semana Santa: algoritmo Meeus/Jones/Butcher — correcto para cualquier año.
 * - Cache en memoria por (country, year) — no recalcula en cambios de mes.
 */

export type HolidayCountry = "ES" | "PY";

export interface Holiday {
  date:    string;   // "YYYY-MM-DD"
  nameKey: string;   // clave i18n → holidays.*
  type:    "national";
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const _cache = new Map<string, Holiday[]>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function p2(n: number): string { return n < 10 ? `0${n}` : String(n); }
function ymd(y: number, m: number, d: number): string { return `${y}-${p2(m)}-${p2(d)}`; }

/**
 * Meeus/Jones/Butcher — Domingo de Pascua para cualquier año gregoriano.
 * Verificado: 2025-04-20, 2026-04-05, 2027-03-28, 2028-04-16.
 */
function easterSunday(year: number): { m: number; d: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const D = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - D - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const mm = Math.floor((a + 11 * h + 22 * l) / 451);
  const m = Math.floor((h + l - 7 * mm + 114) / 31);
  const d = ((h + l - 7 * mm + 114) % 31) + 1;
  return { m, d };
}

function shift(year: number, month: number, day: number, delta: number): string {
  const dt = new Date(year, month - 1, day + delta);
  return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

// ─── Cómputo por país ─────────────────────────────────────────────────────────

function computeES(year: number): Holiday[] {
  const { m, d } = easterSunday(year);
  return [
    { date: ymd(year,  1,  1),       nameKey: "holidays.newYear",              type: "national" },
    { date: ymd(year,  1,  6),       nameKey: "holidays.epiphany",             type: "national" },
    { date: shift(year, m, d, -2),   nameKey: "holidays.goodFriday",           type: "national" },
    { date: ymd(year,  5,  1),       nameKey: "holidays.laborDay",             type: "national" },
    { date: ymd(year,  8, 15),       nameKey: "holidays.assumption",           type: "national" },
    { date: ymd(year, 10, 12),       nameKey: "holidays.hispanicDay",          type: "national" },
    { date: ymd(year, 11,  1),       nameKey: "holidays.allSaints",            type: "national" },
    { date: ymd(year, 12,  6),       nameKey: "holidays.constitutionDay",      type: "national" },
    { date: ymd(year, 12,  8),       nameKey: "holidays.immaculateConception", type: "national" },
    { date: ymd(year, 12, 25),       nameKey: "holidays.christmas",            type: "national" },
  ];
}

function computePY(year: number): Holiday[] {
  const { m, d } = easterSunday(year);
  return [
    { date: ymd(year,  1,  1),       nameKey: "holidays.newYear",        type: "national" },
    { date: ymd(year,  3,  1),       nameKey: "holidays.heroesDay",      type: "national" },
    { date: shift(year, m, d, -3),   nameKey: "holidays.holyThursday",   type: "national" },
    { date: shift(year, m, d, -2),   nameKey: "holidays.goodFriday",     type: "national" },
    { date: ymd(year,  5,  1),       nameKey: "holidays.laborDay",       type: "national" },
    { date: ymd(year,  5, 14),       nameKey: "holidays.independenceEve",type: "national" },
    { date: ymd(year,  5, 15),       nameKey: "holidays.independenceDay",type: "national" },
    { date: ymd(year,  6, 12),       nameKey: "holidays.chacoPeace",     type: "national" },
    { date: ymd(year,  8, 15),       nameKey: "holidays.asuncionDay",    type: "national" },
    { date: ymd(year,  9, 29),       nameKey: "holidays.boqueron",       type: "national" },
    { date: ymd(year, 12,  8),       nameKey: "holidays.caacupe",        type: "national" },
    { date: ymd(year, 12, 25),       nameKey: "holidays.christmas",      type: "national" },
  ];
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Devuelve los festivos de un país y año. Cacheado en memoria. */
export function getHolidays(country: HolidayCountry, year: number): Holiday[] {
  const key = `${country}-${year}`;
  if (_cache.has(key)) return _cache.get(key)!;
  const result = country === "ES" ? computeES(year) : computePY(year);
  _cache.set(key, result);
  return result;
}

/**
 * Devuelve un Map<"YYYY-MM-DD", Holiday> para el mes visible + días del mes
 * adyacente que pueden aparecer en la cuadrícula (inicio/fin del mes).
 */
export function getHolidayMapForMonth(
  country: HolidayCountry,
  year: number,
  month: number,    // 0-based (como Date.getMonth())
): Map<string, Holiday> {
  const all = [
    ...getHolidays(country, year),
    ...(month === 0  ? getHolidays(country, year - 1) : []),
    ...(month === 11 ? getHolidays(country, year + 1) : []),
  ];
  return new Map(all.map((h) => [h.date, h]));
}
