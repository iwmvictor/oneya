import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Transcript } from "@/types/transcript";
import type { JobStatus } from "./contract";
import type { TranscriptRepository } from "./repository";

type Row = Database["public"]["Tables"]["transcripts"]["Row"];
type SegRow = Database["public"]["Tables"]["transcript_segments"]["Row"];

function toTranscript(r: Row, segs: SegRow[] = []): Transcript {
  return {
    audioItemId: r.id,
    status: r.status,
    stationId: r.station_id,
    sessionId: r.session_id,
    program: r.program,
    presenter: r.presenter,
    language: r.language,
    languages: r.languages,
    text: r.full_text,
    quality: r.quality,
    provider: r.provider,
    model: r.model,
    error: r.error,
    windowStart: r.window_start,
    windowEnd: r.window_end,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    segments: segs
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        start: Number(s.start_time),
        end: Number(s.end_time),
        text: s.text,
        speaker: s.speaker,
        language: s.language,
        confidence: s.confidence == null ? null : Number(s.confidence),
      })),
  };
}

/** Reads work with the public client (RLS); writes require the server admin client. */
export function createSupabaseRepository(db: SupabaseClient<Database>): TranscriptRepository {
  const must = <T>(r: { data: T; error: { message: string } | null }): NonNullable<T> => {
    if (r.error) throw new Error(r.error.message);
    return r.data as NonNullable<T>;
  };
  return {
    async createSession(s) {
      const row = must(
        await db
          .from("transcription_sessions")
          .insert({ station_id: s.stationId, program: s.program, presenter: s.presenter })
          .select("id")
          .single(),
      );
      return row.id;
    },
    async nextSequence(sessionId) {
      const { count, error } = await db
        .from("transcripts")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    async createTranscript(t) {
      const row = must(
        await db
          .from("transcripts")
          .insert({
            session_id: t.sessionId,
            station_id: t.stationId,
            program: t.program,
            presenter: t.presenter,
            sequence: t.sequence,
            provider: t.provider,
            model: t.model,
            requested_by: t.requestedBy,
          })
          .select("id")
          .single(),
      );
      return row.id;
    },
    async getStatus(id) {
      const { data: row } = await db
        .from("transcripts")
        .select("status")
        .eq("id", id)
        .maybeSingle();
      return (row?.status as JobStatus | undefined) ?? null;
    },
    async updateTranscript(id, p) {
      must(
        await db
          .from("transcripts")
          .update(
            Object.fromEntries(
              Object.entries({
                status: p.status,
                window_start: p.windowStart,
                window_end: p.windowEnd,
                duration_seconds: p.durationSeconds,
                audio_format: p.audioFormat,
                audio_bytes: p.audioBytes,
                language: p.language,
                languages: p.languages,
                full_text: p.text,
                quality: p.quality,
                error: p.error,
              }).filter(([, v]) => v !== undefined),
            ) as Database["public"]["Tables"]["transcripts"]["Update"],
          )
          .eq("id", id),
      );
    },
    async replaceSegments(id, segments) {
      must(await db.from("transcript_segments").delete().eq("transcript_id", id));
      if (!segments.length) return;
      must(
        await db.from("transcript_segments").insert(
          segments.map((s, i) => ({
            transcript_id: id,
            position: i,
            start_time: s.start,
            end_time: s.end,
            speaker: s.speaker,
            language: s.language,
            text: s.text,
            confidence: s.confidence,
          })),
        ),
      );
    },
    async getTranscript(id) {
      const { data: row } = await db.from("transcripts").select("*").eq("id", id).maybeSingle();
      if (!row) return null;
      const segs = must(await db.from("transcript_segments").select("*").eq("transcript_id", id));
      return toTranscript(row, segs);
    },
    async listStationTranscripts(stationId, limit) {
      const rows = must(
        await db
          .from("transcripts")
          .select("*")
          .eq("station_id", stationId)
          .order("created_at", { ascending: false })
          .limit(limit),
      );
      const ids = rows.filter((r) => r.status === "available").map((r) => r.id);
      const segs = ids.length
        ? must(await db.from("transcript_segments").select("*").in("transcript_id", ids))
        : [];
      return rows.map((r) =>
        toTranscript(
          r,
          segs.filter((s) => s.transcript_id === r.id),
        ),
      );
    },
  };
}
