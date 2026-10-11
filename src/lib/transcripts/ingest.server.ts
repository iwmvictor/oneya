import { AiProviderError, type AudioFormat } from "@/lib/ai/provider";

/**
 * Server-side ingestion: reads a short window from a live station stream.
 * Runs independently of any listener's browser. Bounded by time and bytes.
 */
export interface CapturedWindow {
  bytes: Uint8Array;
  format: AudioFormat;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
}

export const MAX_WINDOW_SECONDS = 60;
const MAX_BYTES = 2_500_000;

export function formatFromContentType(ct: string | null): AudioFormat | null {
  const t = (ct ?? "").toLowerCase();
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("aac")) return "aac";
  if (t.includes("ogg") || t.includes("opus")) return "ogg";
  if (t.includes("wav")) return "wav";
  if (t.includes("flac")) return "flac";
  if (t.includes("mp4") || t.includes("m4a")) return "m4a";
  return null;
}

export async function captureStreamWindow(url: string, seconds: number): Promise<CapturedWindow> {
  const secs = Math.max(5, Math.min(MAX_WINDOW_SECONDS, seconds));
  const ctrl = new AbortController();
  const startedAt = new Date();
  let res: Response;
  try {
    res = await fetch(url, { signal: ctrl.signal, headers: { "Icy-MetaData": "0" } });
  } catch {
    throw new AiProviderError("capture_failed", "Could not connect to the station stream.");
  }
  const format = formatFromContentType(res.headers.get("content-type"));
  if (!res.ok || !res.body) {
    ctrl.abort();
    throw new AiProviderError("capture_failed", `Station stream responded with ${res.status}.`);
  }
  if (!format) {
    ctrl.abort();
    throw new AiProviderError("capture_failed", "Station stream is not a supported audio format.");
  }
  // Stopping the capture window (not an AI timeout): the live stream never ends on its own.
  const stopAt = startedAt.getTime() + secs * 1000;
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = res.body.getReader();
  const timer = setTimeout(() => ctrl.abort(), secs * 1000 + 2000);
  try {
    while (Date.now() < stopAt && size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
  } catch {
    /* aborted at window end */
  } finally {
    clearTimeout(timer);
    ctrl.abort();
  }
  const endedAt = new Date();
  if (!size) throw new AiProviderError("capture_failed", "No audio was received from the station.");
  const bytes = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) {
    bytes.set(c, o);
    o += c.length;
  }
  return {
    bytes,
    format,
    durationSeconds: (endedAt.getTime() - startedAt.getTime()) / 1000,
    startedAt,
    endedAt,
  };
}
