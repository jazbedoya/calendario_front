import { isSameDay, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { UpcomingEvent } from "./useHomeSummary";

export type NextEventResult =
  | { type: "ongoing"; event: UpcomingEvent }
  | { type: "next";    event: UpcomingEvent }
  | { type: "done" }
  | { type: "empty" };

/**
 * Returns the next relevant event for today in the user's timezone.
 * Pure function — safe to call in render.
 *
 * - "ongoing": an event is currently in progress
 * - "next":    the nearest future event today
 * - "done":    today had events but they've all ended
 * - "empty":   no events scheduled for today
 */
export function getNextEvent(
  events: UpcomingEvent[],
  now: Date,
  timezone: string,
): NextEventResult {
  const nowLocal = toZonedTime(now, timezone);
  const nowMs    = now.getTime();

  // Keep only today's events sorted by start time
  const todayEvents = events
    .filter((e) => {
      const startLocal = toZonedTime(parseISO(e.start_at), timezone);
      return isSameDay(startLocal, nowLocal);
    })
    .sort((a, b) => parseISO(a.start_at).getTime() - parseISO(b.start_at).getTime());

  if (todayEvents.length === 0) return { type: "empty" };

  // Ongoing: started but not yet ended (all-day events are never "ongoing")
  for (const e of todayEvents) {
    if (e.is_all_day) continue;
    const start = parseISO(e.start_at).getTime();
    const end   = parseISO(e.end_at).getTime();
    if (start <= nowMs && nowMs < end) {
      return { type: "ongoing", event: e };
    }
  }

  // Next: first event that starts in the future
  const next = todayEvents.find((e) => parseISO(e.start_at).getTime() > nowMs);
  if (next) return { type: "next", event: next };

  return { type: "done" };
}
