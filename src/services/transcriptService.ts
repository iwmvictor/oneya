import type { Transcript } from "@/types/transcript";

/**
 * Integration boundary for transcription. A future Gemini (or other) provider
 * implements this interface server-side; UI only talks to transcriptService.
 */
export interface TranscriptProvider {
  readonly id: string;
  getTranscript(audioItemId: string): Promise<Transcript>;
}

/** Default: no pipeline configured, so every item is honestly "unavailable". */
export const noTranscriptProvider: TranscriptProvider = {
  id: "none",
  async getTranscript(audioItemId) {
    return { audioItemId, status: "unavailable", segments: [] };
  },
};

let provider: TranscriptProvider = noTranscriptProvider;

export function setTranscriptProvider(p: TranscriptProvider) {
  provider = p;
}

export function getTranscript(audioItemId: string) {
  return provider.getTranscript(audioItemId);
}

export function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
