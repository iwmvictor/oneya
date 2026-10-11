import type { Transcript } from "@/types/transcript";
import type { JobStatus, ValidSegment } from "./contract";

/** Persistence boundary for transcripts. Database and in-memory implementations share it. */
export interface TranscriptPatch {
  status?: JobStatus;
  windowStart?: string;
  windowEnd?: string;
  durationSeconds?: number;
  audioFormat?: string;
  audioBytes?: number;
  language?: string;
  languages?: string[];
  text?: string;
  quality?: string | null;
  error?: string | null;
}

export interface NewTranscript {
  sessionId: string;
  stationId: string;
  program: string | null;
  presenter: string | null;
  sequence: number;
  provider: string;
  model: string;
  requestedBy: string | null;
}

export interface TranscriptRepository {
  createSession(s: {
    stationId: string;
    program: string | null;
    presenter: string | null;
  }): Promise<string>;
  nextSequence(sessionId: string): Promise<number>;
  createTranscript(t: NewTranscript): Promise<string>;
  getStatus(id: string): Promise<JobStatus | null>;
  updateTranscript(id: string, patch: TranscriptPatch): Promise<void>;
  replaceSegments(id: string, segments: ValidSegment[]): Promise<void>;
  getTranscript(id: string): Promise<Transcript | null>;
  listStationTranscripts(stationId: string, limit: number): Promise<Transcript[]>;
}

/** In-memory implementation for tests and local experiments. */
export function createMemoryRepository(): TranscriptRepository & { rows: Map<string, Transcript> } {
  const rows = new Map<string, Transcript>();
  const seqs = new Map<string, number>();
  let n = 0;
  return {
    rows,
    async createSession() {
      const id = `s${++n}`;
      seqs.set(id, 0);
      return id;
    },
    async nextSequence(sessionId) {
      return seqs.get(sessionId) ?? 0;
    },
    async createTranscript(t) {
      const id = `t${++n}`;
      seqs.set(t.sessionId, t.sequence + 1);
      const now = new Date().toISOString();
      rows.set(id, {
        audioItemId: id,
        status: "queued",
        stationId: t.stationId,
        sessionId: t.sessionId,
        program: t.program,
        presenter: t.presenter,
        provider: t.provider,
        model: t.model,
        segments: [],
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },
    async getStatus(id) {
      const s = rows.get(id)?.status;
      return s && s !== "unavailable" ? s : null;
    },
    async updateTranscript(id, p) {
      const r = rows.get(id);
      if (!r) throw new Error("not found");
      rows.set(id, {
        ...r,
        ...(p.status && { status: p.status }),
        ...(p.windowStart && { windowStart: p.windowStart }),
        ...(p.windowEnd && { windowEnd: p.windowEnd }),
        ...(p.language && { language: p.language }),
        ...(p.languages && { languages: p.languages }),
        ...(p.text !== undefined && { text: p.text }),
        ...(p.quality !== undefined && { quality: p.quality }),
        ...(p.error !== undefined && { error: p.error }),
        updatedAt: new Date().toISOString(),
      });
    },
    async replaceSegments(id, segments) {
      const r = rows.get(id);
      if (r) rows.set(id, { ...r, segments: segments.map((s) => ({ ...s })) });
    },
    async getTranscript(id) {
      return rows.get(id) ?? null;
    },
    async listStationTranscripts(stationId, limit) {
      return [...rows.values()]
        .filter((r) => r.stationId === stationId)
        .slice(-limit)
        .reverse();
    },
  };
}
