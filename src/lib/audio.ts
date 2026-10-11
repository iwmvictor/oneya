export type PlaybackErrorKind =
  "blocked" | "unsupported" | "network" | "timeout" | "offline" | "invalid" | "unknown";

export const ERROR_MESSAGES: Record<PlaybackErrorKind, string> = {
  blocked: "Tap play to start listening.",
  unsupported: "This stream format isn't supported by your browser.",
  network: "Unable to connect to the station.",
  timeout: "The station took too long to respond.",
  offline: "You're offline. Live radio needs an internet connection.",
  invalid: "This station's stream address is not valid.",
  unknown: "Unable to connect.",
};

export function isValidStreamUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Translate an HTMLMediaElement error / play() rejection into a user-facing kind. */
export function classifyError(err: unknown, audio?: HTMLAudioElement | null): PlaybackErrorKind {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") return "blocked";
    if (err.name === "NotSupportedError") return "unsupported";
  }
  const code = audio?.error?.code;
  if (code === 2) return "network";
  if (code === 3 || code === 4) return "unsupported";
  return "unknown";
}

export function logPlaybackIssue(context: string, detail: unknown) {
  // Structured, developer-facing. Station ids and error kinds only; never user data.
  console.warn("[oneya:player]", context, detail instanceof Error ? detail.message : detail);
}
