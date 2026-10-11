import { stations } from "@/data/stations";
import type { RadioStation, StationCategory, StationStatus } from "@/types/station";

// Synchronous today; keep call sites going through this module so it can become async/API-backed.

export const CATEGORY_LABELS: Record<StationCategory, string> = {
  music: "Music",
  news: "News",
  talk: "Talk",
  sports: "Sports",
  religious: "Religious",
  community: "Community",
};

export const STATUS_LABELS: Record<StationStatus, string> = {
  online: "Live",
  offline: "Stream offline",
  unavailable: "Stream unavailable",
  coming_soon: "Online stream coming soon",
  unknown: "Status unknown",
};

/**
 * Two deliberately separate views of the same data:
 *  - catalog  : every record, including those with no eligible stream. For internal use,
 *               tests and detail pages reached by direct link. Never render as playable lists.
 *  - public   : only records whose stream is eligible. Everything user-facing lists, searches
 *               and features come from here.
 * Records are never removed from the data to achieve this.
 */
export function isPlayable(s: RadioStation) {
  return s.stream.eligible;
}

const byPlayableThenName = (a: RadioStation, b: RadioStation) => a.name.localeCompare(b.name);

const publicSorted = stations.filter(isPlayable).sort(byPlayableThenName);

/** Every station record, playable or not. Not for public lists. */
export function getCatalogStations() {
  return stations;
}

/** Stations with an eligible stream, A–Z. Use this for every public list. */
export function getPublicStations() {
  return publicSorted;
}

/** Any record by slug or id (detail pages may explain why a station has no stream). */
export function getStationBySlug(slug: string) {
  return stations.find((s) => s.slug === slug || s.id === slug);
}

export function getStationById(id: string) {
  return stations.find((s) => s.id === id);
}

export function getFeaturedStations() {
  return publicSorted.filter((s) => s.isFeatured).sort((a, b) => a.order - b.order);
}

export function getLiveStations() {
  return publicSorted;
}

/** Categories that actually have stations, in canonical order. */
export function getAvailableCategories(): StationCategory[] {
  const set = new Set(publicSorted.flatMap((s) => s.categories));
  return (Object.keys(CATEGORY_LABELS) as StationCategory[]).filter((c) => set.has(c));
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const compact = (s: string) => norm(s).replace(/[^a-z0-9.]/g, "");

/** Levenshtein distance capped at 2 (enough for one-typo tolerance). */
function closeEnough(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++)
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    prev = cur;
  }
  return prev[b.length]! <= 1;
}

export function searchStations(query: string, category?: StationCategory | "all") {
  const q = norm(query.trim());
  return publicSorted.filter((s) => {
    if (category && category !== "all" && !s.categories.includes(category)) return false;
    if (!q) return true;
    // "kissfm", "radio10", "102.3" match regardless of spacing
    if (compact(s.name).includes(compact(q)) && compact(q).length > 0) return true;
    // one typo per word for longer words ("kis fm" no, "kisss" yes, "isanga" yes)
    const words = norm(s.name)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const qWords = q.split(/\s+/).filter(Boolean);
    if (
      qWords.every((w) => w.length >= 4 && words.some((n) => n.startsWith(w) || closeEnough(w, n)))
    )
      return true;
    const hay = [
      s.name,
      s.frequency,
      s.frequency?.replace(/\s*FM/i, ""),
      s.location,
      s.province,
      ...s.categories.map((c) => CATEGORY_LABELS[c]),
    ]
      .filter(Boolean)
      .join(" ");
    return norm(hay).includes(q);
  });
}
export function stationSubtitle(s: RadioStation) {
  const place = s.location?.split("/")[0]?.trim();
  return [s.frequency ?? "Online", place].filter(Boolean).join(" · ");
}
