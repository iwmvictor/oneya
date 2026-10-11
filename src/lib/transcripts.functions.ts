import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { getStationById, isPlayable } from "@/services/stationService";
import { getNowPlaying } from "@/services/scheduleService";

function publicDb() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Whether AI transcription is configured on the server. Never returns the key. */
export const getTranscriptionConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { GEMINI_TRANSCRIPTION_MODEL } = await import("@/lib/ai/gatewayGemini.server");
  return { configured: Boolean(process.env["LOVABLE_API_KEY"]), model: GEMINI_TRANSCRIPTION_MODEL };
});

export const listStationTranscripts = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        stationId: z.string().min(1).max(64),
        limit: z.number().int().min(1).max(20).default(5),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { createSupabaseRepository } = await import("@/lib/transcripts/repository.server");
    return createSupabaseRepository(publicDb()).listStationTranscripts(data.stationId, data.limit);
  });

export const getTranscriptById = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createSupabaseRepository } = await import("@/lib/transcripts/repository.server");
    return createSupabaseRepository(publicDb()).getTranscript(data.id);
  });

/** Signed-in user's admin status (for showing admin controls; the server re-checks on every write). */
export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
  });

/**
 * Admin-only: capture a live window from a station stream on the server and
 * transcribe it. Listeners can never trigger AI requests.
 */
export const requestTranscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        stationId: z.string().min(1).max(64),
        seconds: z.number().int().min(5).max(60).default(30),
        sessionId: z.string().uuid().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Response("Forbidden", { status: 403 });

    const station = getStationById(data.stationId);
    if (!station || !isPlayable(station) || !station.streamUrl)
      return { kind: "invalid_station" as const };

    const [
      { createGeminiProvider },
      { captureStreamWindow },
      { runTranscriptionJob },
      { createSupabaseRepository },
      { supabaseAdmin },
    ] = await Promise.all([
      import("@/lib/ai/gatewayGemini.server"),
      import("@/lib/transcripts/ingest.server"),
      import("@/lib/transcripts/pipeline"),
      import("@/lib/transcripts/repository.server"),
      import("@/integrations/supabase/client.server"),
    ]);
    // Abuse/duplicate guard: one in-flight job per station. Jobs stuck longer than
    // the worker can possibly run (killed mid-request) are closed as failed first.
    const STALE_MS = 10 * 60_000;
    const staleBefore = new Date(Date.now() - STALE_MS).toISOString();
    await supabaseAdmin
      .from("transcripts")
      .update({ status: "failed", error: "Processing was interrupted." })
      .in("status", ["queued", "capturing", "processing"])
      .lt("created_at", staleBefore);
    const { count: inFlight } = await supabaseAdmin
      .from("transcripts")
      .select("id", { count: "exact", head: true })
      .eq("station_id", station.id)
      .in("status", ["queued", "capturing", "processing"]);
    if ((inFlight ?? 0) > 0) return { kind: "busy" as const };

    const now = getNowPlaying(station);
    const started = Date.now();
    const result = await runTranscriptionJob(
      {
        stationId: station.id,
        streamUrl: station.streamUrl,
        seconds: data.seconds,
        sessionId: data.sessionId,
        program: now?.program ?? null,
        presenter: now?.presenter ?? null,
        expectedLanguages: station.languages,
        requestedBy: context.userId,
      },
      {
        repo: createSupabaseRepository(supabaseAdmin),
        provider: createGeminiProvider(process.env["LOVABLE_API_KEY"]),
        capture: captureStreamWindow,
      },
    );
    // Structured log: ids, kinds and latency only — never keys, audio or transcript text.
    console.info(
      "[oneya:transcribe]",
      JSON.stringify({
        station: station.id,
        kind: result.kind,
        errorKind: result.kind === "failed" ? result.errorKind : undefined,
        ms: Date.now() - started,
      }),
    );
    return result;
  });
