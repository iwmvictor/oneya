import type { StationBadge } from "./station";
import type { StreamAssessment } from "@/lib/streamEligibility";

export type TvStreamKind = "hls" | "mp4" | "unknown";

export interface TvChannel {
  /** Stable id, `tv-<registry id>`. */
  id: string;
  /** URL slug, used in /tv/$channelSlug. */
  slug: string;
  name: string;
  /** Registry id of the broadcaster record this channel belongs to. */
  brandId: string;
  badge: StationBadge;
  /** Only when the data supplies a real channel logo. */
  logo?: string | undefined;
  /** Only when verified by a person. */
  description?: string | undefined;
  website?: string | undefined;
  /** Raw stream address as stored. */
  streamUrl?: string | undefined;
  streamFormat?: string | undefined;
  streamKind: TvStreamKind;
  stream: StreamAssessment;
  order: number;
}
