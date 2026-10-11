import type { TvStreamKind } from "@/types/channel";

/** Decide how to play a stream from its declared format, falling back to the URL's file extension. */
export function detectStreamKind(url: string | undefined, format?: string | null): TvStreamKind {
  const f = format?.trim().toLowerCase();
  if (f === "hls" || f === "m3u8") return "hls";
  if (f === "mp4") return "mp4";
  if (!url) return "unknown";
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path.endsWith(".m3u8")) return "hls";
    if (path.endsWith(".mp4")) return "mp4";
  } catch {
    /* not a URL */
  }
  return "unknown";
}

export type TvFailureKind =
  | "offline"
  | "unreachable" // network error with no HTTP response: outage, DNS, or CORS block
  | "rejected" // HTTP 401/403: token expired or access refused
  | "not_found" // HTTP 404/410: address no longer exists
  | "server" // HTTP 5xx
  | "unsupported"
  | "timeout"
  | "blocked" // autoplay/permission refusal
  | "ended" // the live stream signalled its end
  | "unknown";

export const TV_FAILURE_COPY: Record<TvFailureKind, { title: string; detail: string }> = {
  offline: {
    title: "You're offline",
    detail: "Live TV needs an internet connection. Reconnect and try again.",
  },
  unreachable: {
    title: "Couldn't reach this channel's stream",
    detail:
      "The broadcaster's server didn't respond, or it doesn't allow playback from other websites. This is usually on the broadcaster's side, not your device.",
  },
  rejected: {
    title: "The broadcaster refused the connection",
    detail: "The stream address may have expired or may not be open for public viewing right now.",
  },
  not_found: {
    title: "This stream address no longer exists",
    detail: "The broadcaster may have moved or retired this stream.",
  },
  server: {
    title: "The broadcaster's server is having problems",
    detail: "It returned a server error. Try again in a few minutes.",
  },
  unsupported: {
    title: "This stream can't be played in your browser",
    detail: "Your browser doesn't support this video format. Another browser may work.",
  },
  timeout: {
    title: "The stream took too long to start",
    detail:
      "The channel didn't begin playing in time. It may be off air or your connection may be slow.",
  },
  blocked: {
    title: "Playback was blocked",
    detail: "Your browser stopped playback. Tap play to start the channel.",
  },
  ended: {
    title: "The stream ended",
    detail: "The channel stopped broadcasting. It may be off air; try again later.",
  },
  unknown: {
    title: "Couldn't play this channel",
    detail: "Something went wrong while starting the stream.",
  },
};

/** Map an HTTP status (0/undefined = no response) to a failure kind. */
export function failureFromHttp(code: number | undefined): TvFailureKind {
  if (!code) return "unreachable";
  if (code === 401 || code === 403) return "rejected";
  if (code === 404 || code === 410) return "not_found";
  if (code >= 500) return "server";
  return "unknown";
}

/** Map an HTMLMediaElement MediaError code to a failure kind. */
export function failureFromMediaError(code: number | undefined): TvFailureKind {
  if (code === 2) return "unreachable"; // MEDIA_ERR_NETWORK
  if (code === 3 || code === 4) return "unsupported"; // DECODE / SRC_NOT_SUPPORTED
  return "unknown";
}
