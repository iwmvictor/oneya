import { channels } from "@/data/channels";
import { getStationById } from "./stationService";
import type { TvChannel } from "@/types/channel";
import type { RadioStation } from "@/types/station";

/** Same rule as radio: only channels with an eligible stream are public. Records are never removed. */
export function isWatchable(c: TvChannel) {
  return c.stream.eligible;
}

const publicChannels = channels.filter(isWatchable).sort((a, b) => a.name.localeCompare(b.name));

/** Every channel record, watchable or not. Not for public lists. */
export function getCatalogChannels() {
  return channels;
}

export function getPublicChannels() {
  return publicChannels;
}

export function getChannelBySlug(slug: string) {
  return channels.find((c) => c.slug === slug || c.id === slug);
}

export function getChannelById(id: string) {
  return channels.find((c) => c.id === id);
}

/** Other public channels, for "keep watching" suggestions. Real list, no ranking claims. */
export function getOtherChannels(id: string) {
  return publicChannels.filter((c) => c.id !== id);
}

/**
 * The radio station from the same broadcaster record, only if it is itself playable.
 * The link is real because the registry stores both under one broadcaster entry.
 */
export function getRadioCounterpart(c: TvChannel): RadioStation | undefined {
  const s = getStationById(c.brandId);
  return s?.stream.eligible ? s : undefined;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function searchChannels(query: string) {
  const q = norm(query.trim());
  if (!q) return publicChannels;
  const compactQ = q.replace(/[^a-z0-9]/g, "");
  return publicChannels.filter((c) => {
    const n = norm(c.name);
    return n.includes(q) || (compactQ.length > 0 && n.replace(/[^a-z0-9]/g, "").includes(compactQ));
  });
}
