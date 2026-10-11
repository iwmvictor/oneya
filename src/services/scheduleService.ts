import type { NowPlayingInfo } from "@/lib/mediaSession";
import type { RadioStation, ScheduleSlot } from "@/types/station";

/**
 * Current-program lookup from a station's schedule. No station in the catalog
 * has supplied schedule data yet, so this returns null until real slots exist —
 * never fabricate programs or presenters here.
 *
 * Confidence rule: when the data is uncertain (malformed, overlapping, stale)
 * return null so the UI falls back to "Station · Live" instead of guessing.
 */

/** Schedules are station-local: Rwanda is UTC+2 all year (no DST). */
const KIGALI_OFFSET_MIN = 120;
/** Schedule data older than this is treated as unknown rather than shown confidently. */
export const SCHEDULE_MAX_AGE_DAYS = 90;

export function kigaliMinutes(at: Date) {
  return (((at.getUTCHours() * 60 + at.getUTCMinutes() + KIGALI_OFFSET_MIN) % 1440) + 1440) % 1440;
}

function isValidSlot(s: ScheduleSlot) {
  return (
    Number.isInteger(s.start) &&
    Number.isInteger(s.end) &&
    s.start >= 0 &&
    s.start < 1440 &&
    s.end >= 0 &&
    s.end <= 1440 &&
    s.start !== s.end &&
    typeof s.program === "string" &&
    s.program.trim().length > 0
  );
}

function inSlot(minutes: number, slot: ScheduleSlot) {
  return slot.end > slot.start
    ? minutes >= slot.start && minutes < slot.end
    : minutes >= slot.start || minutes < slot.end; // crosses midnight
}

/** The program on air right now (Kigali time), or null when unknown or uncertain. */
export function getNowPlaying(station: RadioStation, at: Date = new Date()): NowPlayingInfo | null {
  const slots = station.schedule?.filter(isValidSlot);
  if (!slots?.length) return null;
  if (station.scheduleUpdatedAt) {
    const updated = Date.parse(station.scheduleUpdatedAt);
    if (Number.isNaN(updated) || at.getTime() - updated > SCHEDULE_MAX_AGE_DAYS * 86_400_000)
      return null;
  }
  const minutes = kigaliMinutes(at);
  const matches = slots.filter((s) => inSlot(minutes, s));
  const programs = new Set(matches.map((s) => `${s.program.trim()}|${s.presenter?.trim() ?? ""}`));
  if (programs.size !== 1) return null; // nothing on, or conflicting entries
  const slot = matches[0]!;
  const presenter = slot.presenter?.trim();
  return { program: slot.program.trim(), presenter: presenter || undefined };
}
