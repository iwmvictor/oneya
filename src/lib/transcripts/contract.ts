import { z } from "zod";

/**
 * Provider-neutral transcript contract. Any AI provider (Gemini today) must
 * return output that passes `parseModelTranscript` before it is stored.
 * Pure module: safe to import from tests, server and client.
 */

export type JobStatus = "queued" | "capturing" | "processing" | "available" | "failed";

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  queued: ["capturing", "failed"],
  capturing: ["processing", "failed"],
  processing: ["available", "failed"],
  available: [],
  failed: ["queued"],
};

export function canTransition(from: JobStatus, to: JobStatus) {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: JobStatus, to: JobStatus) {
  if (!canTransition(from, to)) throw new Error(`Invalid transcript status change ${from} → ${to}`);
}

/** BCP-47-ish language tag (rw, en, fr, sw, en-GB) or "und" when undeterminable. */
const LANG = /^(?:[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?|und)$/;
const lang = z
  .string()
  .trim()
  .transform((s) => s.toLowerCase())
  .refine((s) => LANG.test(s), "invalid language tag");

const UNKNOWN_SPEAKERS = new Set(["", "unknown", "speaker", "n/a", "none"]);

const rawSegment = z.object({
  start: z.number().finite().min(0),
  end: z.number().finite().min(0),
  speaker: z.string().max(80).nullable().optional(),
  language: lang.nullable().optional(),
  text: z.string().trim().min(1).max(4000),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

const rawTranscript = z.object({
  language: lang,
  languages: z.array(lang).max(6).optional(),
  quality: z.enum(["good", "fair", "poor"]).nullable().optional(),
  segments: z.array(rawSegment).max(500),
});

export interface ValidSegment {
  start: number;
  end: number;
  speaker: string | null;
  language: string | null;
  text: string;
  confidence: number | null;
}

export interface ValidTranscript {
  language: string;
  languages: string[];
  quality: "good" | "fair" | "poor" | null;
  segments: ValidSegment[];
  text: string;
}

export class InvalidTranscriptOutput extends Error {
  readonly kind = "malformed_output" as const;
}

function stripFences(s: string) {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m?.[1] ?? t;
}

/**
 * Validate raw model text against the contract. Rejects anything that isn't
 * a well-formed transcript — never persist unvalidated model output.
 * `durationSeconds` bounds timestamps to the captured audio window.
 */
export function parseModelTranscript(raw: string, durationSeconds: number): ValidTranscript {
  let json: unknown;
  try {
    json = JSON.parse(stripFences(raw));
  } catch {
    throw new InvalidTranscriptOutput("Model output was not valid JSON");
  }
  const parsed = rawTranscript.safeParse(json);
  if (!parsed.success) {
    throw new InvalidTranscriptOutput(
      `Model output failed validation: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`,
    );
  }
  const limit = durationSeconds + 2; // small tolerance for rounding
  const segments = parsed.data.segments
    .map((s) => {
      if (s.end < s.start) throw new InvalidTranscriptOutput("Segment ends before it starts");
      if (s.start > limit) throw new InvalidTranscriptOutput("Segment is outside the audio window");
      const speaker = s.speaker?.trim() ?? "";
      return {
        start: round(s.start),
        end: round(Math.min(s.end, limit)),
        speaker: UNKNOWN_SPEAKERS.has(speaker.toLowerCase()) ? null : speaker,
        language: s.language ?? null,
        text: s.text,
        confidence: s.confidence ?? null,
      };
    })
    .sort((a, b) => a.start - b.start)
    // Models sometimes repeat a line; drop exact repeats that overlap in time.
    .filter((s, i, arr) => !arr.slice(0, i).some((p) => p.text === s.text && s.start < p.end + 1));

  const languages = Array.from(
    new Set([
      parsed.data.language,
      ...(parsed.data.languages ?? []),
      ...segments.flatMap((s) => (s.language ? [s.language] : [])),
    ]),
  );
  return {
    language: parsed.data.language,
    languages,
    quality: parsed.data.quality ?? null,
    segments,
    text: segments.map((s) => s.text).join(" "),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
