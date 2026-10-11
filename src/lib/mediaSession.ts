import type { RadioStation } from "@/types/station";

/** Program info for the live broadcast. No source exists yet; never fabricate it. */
export interface NowPlayingInfo {
  program?: string | undefined;
  presenter?: string | undefined;
  artwork?: string | undefined;
}

export interface MediaMetadataFields {
  title: string;
  artist: string;
  album: string;
  artwork: MediaImage[];
}

/** Pure mapping so it can be tested without a browser. */
export function buildMediaMetadata(
  station: RadioStation,
  now: NowPlayingInfo | null,
): MediaMetadataFields {
  const art = now?.artwork ?? station.logo;
  return {
    title: now?.program ?? station.name,
    artist:
      now?.presenter ??
      ([station.frequency, now?.program ? station.name : undefined].filter(Boolean).join(" · ") ||
        "Live radio"),
    album: "ONEYA · Rwanda Radio",
    artwork: art
      ? [{ src: art }]
      : [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
  };
}
