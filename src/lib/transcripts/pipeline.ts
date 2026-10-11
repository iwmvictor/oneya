import { describeAiError, type AiProvider, type AudioFormat } from "@/lib/ai/provider";
import { assertTransition, type JobStatus } from "./contract";
import type { TranscriptRepository, TranscriptPatch } from "./repository";

/**
 * Stream → audio window → job → AI provider → validated transcript → storage.
 * Pure orchestration with injected dependencies, so it is unit-testable and
 * can later run from a scheduled server job without any listener's browser.
 */
export interface CaptureFn {
  (
    url: string,
    seconds: number,
  ): Promise<{
    bytes: Uint8Array;
    format: AudioFormat;
    durationSeconds: number;
    startedAt: Date;
    endedAt: Date;
  }>;
}

export interface JobRequest {
  stationId: string;
  streamUrl: string;
  seconds: number;
  sessionId?: string | undefined;
  program: string | null;
  presenter: string | null;
  expectedLanguages: string[];
  requestedBy: string | null;
}

export type JobResult =
  | { kind: "not_configured" }
  | { kind: "available"; transcriptId: string; sessionId: string; segments: number }
  | { kind: "failed"; transcriptId: string; sessionId: string; error: string; errorKind: string };

export async function runTranscriptionJob(
  req: JobRequest,
  deps: { repo: TranscriptRepository; provider: AiProvider | null; capture: CaptureFn },
): Promise<JobResult> {
  const { repo, provider, capture } = deps;
  if (!provider) return { kind: "not_configured" };

  const sessionId =
    req.sessionId ??
    (await repo.createSession({
      stationId: req.stationId,
      program: req.program,
      presenter: req.presenter,
    }));
  const sequence = await repo.nextSequence(sessionId);
  const id = await repo.createTranscript({
    sessionId,
    stationId: req.stationId,
    program: req.program,
    presenter: req.presenter,
    sequence,
    provider: provider.id,
    model: provider.model,
    requestedBy: req.requestedBy,
  });

  let status: JobStatus = "queued";
  const move = async (to: JobStatus, patch: TranscriptPatch = {}) => {
    assertTransition(status, to);
    await repo.updateTranscript(id, { ...patch, status: to });
    status = to;
  };

  try {
    await move("capturing");
    const win = await capture(req.streamUrl, req.seconds);
    await move("processing", {
      windowStart: win.startedAt.toISOString(),
      windowEnd: win.endedAt.toISOString(),
      durationSeconds: win.durationSeconds,
      audioFormat: win.format,
      audioBytes: win.bytes.length,
    });
    const result = await provider.transcription.transcribe({
      bytes: win.bytes,
      format: win.format,
      durationSeconds: win.durationSeconds,
      expectedLanguages: req.expectedLanguages,
    });
    await repo.replaceSegments(id, result.segments);
    await move("available", {
      language: result.language,
      languages: result.languages,
      text: result.text,
      quality: result.quality,
      error: null,
    });
    return { kind: "available", transcriptId: id, sessionId, segments: result.segments.length };
  } catch (e) {
    const err = describeAiError(e);
    try {
      await repo.replaceSegments(id, []);
      await move("failed", { error: err.message });
    } catch {
      /* status already terminal or storage unavailable */
    }
    return { kind: "failed", transcriptId: id, sessionId, error: err.message, errorKind: err.kind };
  }
}
