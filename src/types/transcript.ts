/** Transcripts attach to captured audio windows / programs, never to the live player. */
export type TranscriptStatus =
  "unavailable" | "queued" | "capturing" | "processing" | "available" | "failed";

export interface TranscriptSegment {
  /** Seconds from start of the audio window. */
  start: number;
  end: number;
  text: string;
  /** Only set when identifiable from the audio; never guessed. */
  speaker?: string | null | undefined;
  /** Spoken language of this segment (rw, en, fr, sw, und). */
  language?: string | null | undefined;
  confidence?: number | null | undefined;
}

export interface Transcript {
  /** Id of the audio item / transcript row. */
  audioItemId: string;
  status: TranscriptStatus;
  stationId?: string | undefined;
  sessionId?: string | null | undefined;
  program?: string | null | undefined;
  presenter?: string | null | undefined;
  /** Dominant original language; transcripts are never auto-translated. */
  language?: string | null | undefined;
  languages?: string[] | undefined;
  segments: TranscriptSegment[];
  text?: string | null | undefined;
  quality?: string | null | undefined;
  /** Which pipeline produced it (e.g. "gemini"); informational only. */
  provider?: string | null | undefined;
  model?: string | null | undefined;
  error?: string | null | undefined;
  windowStart?: string | null | undefined;
  windowEnd?: string | null | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface AudioItem {
  id: string;
  stationId: string;
  title: string;
  presenter?: string | undefined;
  audioUrl?: string | undefined;
  airedAt?: string | undefined;
  transcriptStatus: TranscriptStatus;
}
