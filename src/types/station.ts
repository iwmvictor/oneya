export type StationCategory = "music" | "news" | "talk" | "sports" | "religious" | "community";

/**
 * online       – a stream URL exists and is believed to be playable
 * offline      – a stream URL is known but currently not working
 * unavailable  – the station is known not to offer a public stream
 * coming_soon  – listed in the catalog, stream not yet verified
 * unknown      – no information
 */
export type StationStatus = "online" | "offline" | "unavailable" | "coming_soon" | "unknown";

export interface StationBadge {
  monogram: string;
  background: string;
  textColor: string;
}

/** One scheduled program slot. Times are minutes from midnight, Kigali time (UTC+2). */
export interface ScheduleSlot {
  /** Inclusive start, minutes from midnight (0–1439). */
  start: number;
  /** Exclusive end, minutes from midnight (0–1440). end < start means the slot crosses midnight. */
  end: number;
  program: string;
  presenter?: string | undefined;
}

export interface RadioStation {
  id: string;
  /** URL slug, used in /station/$stationId */
  slug: string;
  name: string;
  frequency?: string | undefined;
  location?: string | undefined;
  province?: string | undefined;
  reach?: string | undefined;
  categories: StationCategory[];
  languages: string[];
  /** Path to a real station logo, e.g. /stations/kiss-fm.webp. Leave undefined until a real asset exists. */
  logo?: string | undefined;
  badge: StationBadge;
  /** Only set when verified by a human. */
  description?: string | undefined;
  /** Program schedule supplied by the station. Undefined until real data exists. */
  schedule?: ScheduleSlot[] | undefined;
  /** ISO date the schedule was last confirmed. Stale schedules are not shown. */
  scheduleUpdatedAt?: string | undefined;
  streamUrl?: string | undefined;
  streamFormat?: string | undefined;
  website?: string | undefined;
  isFeatured?: boolean | undefined;
  /** Stream manually verified to play in browsers. */
  isVerified?: boolean | undefined;
  status: StationStatus;
  order: number;
}
