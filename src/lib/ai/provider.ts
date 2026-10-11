import type { ValidTranscript } from "@/lib/transcripts/contract";

/**
 * Vendor-neutral AI provider boundary. Only transcription is implemented;
 * the other capabilities are future extension points and stay unimplemented
 * until a real feature needs them.
 */

export type AudioFormat = "mp3" | "aac" | "ogg" | "wav" | "flac" | "m4a" | "webm";

export interface AudioWindow {
  bytes: Uint8Array;
  format: AudioFormat;
  durationSeconds: number;
  /** Optional hint (e.g. station languages); never forces a language. */
  expectedLanguages?: string[];
}

export interface TranscriptionCapability {
  transcribe(audio: AudioWindow): Promise<ValidTranscript>;
}

export interface AiProvider {
  readonly id: string;
  readonly model: string;
  readonly transcription: TranscriptionCapability;
  // Future, not implemented: summarization, topics, showNotes, searchEnrichment, translation.
}

export type AiErrorKind =
  | "not_configured"
  | "rate_limited"
  | "credits_exhausted"
  | "access_denied"
  | "model_unavailable"
  | "invalid_request"
  | "upstream_error"
  | "refused"
  | "malformed_output"
  | "capture_failed";

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** Plain-language message safe to store and show. */
export function describeAiError(e: unknown): { kind: AiErrorKind; message: string } {
  if (e instanceof AiProviderError) return { kind: e.kind, message: e.message };
  if (e && typeof e === "object" && "kind" in e && (e as { kind: unknown }).kind === "malformed_output")
    return { kind: "malformed_output", message: String((e as unknown as Error).message) };
  return { kind: "upstream_error", message: "Transcription failed unexpectedly." };
}
