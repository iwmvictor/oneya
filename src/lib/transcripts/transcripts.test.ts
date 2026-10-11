import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { canTransition, parseModelTranscript } from "./contract";
import { createMemoryRepository } from "./repository";
import { runTranscriptionJob, type CaptureFn } from "./pipeline";
import { AiProviderError, type AiProvider } from "@/lib/ai/provider";
import { createGeminiProvider } from "@/lib/ai/gatewayGemini.server";

const capture: CaptureFn = async () => ({
  bytes: new Uint8Array([1, 2, 3]),
  format: "mp3",
  durationSeconds: 30,
  startedAt: new Date(0),
  endedAt: new Date(30000),
});
const req = {
  stationId: "kissfm",
  streamUrl: "https://x",
  seconds: 30,
  program: null,
  presenter: null,
  expectedLanguages: [],
  requestedBy: null,
};
const fake = (fn: AiProvider["transcription"]["transcribe"]): AiProvider => ({
  id: "test",
  model: "m",
  transcription: { transcribe: fn },
});

describe("transcript contract", () => {
  it("accepts valid mixed-language output and nulls unknown speakers", () => {
    const t = parseModelTranscript(
      '```json\n{"language":"rw","segments":[{"start":0,"end":8.4,"speaker":"unknown","language":"rw","text":"Muraho"},{"start":8.4,"end":12,"speaker":null,"language":"en","text":"Good morning"}]}\n```',
      30,
    );
    expect(t.segments[0]?.speaker).toBeNull();
    expect(t.languages).toEqual(["rw", "en"]);
  });
  it("rejects malformed output", () => {
    expect(() => parseModelTranscript("Sure! Here is the transcript", 30)).toThrow();
    expect(() =>
      parseModelTranscript('{"language":"rw","segments":[{"start":5,"end":2,"text":"x"}]}', 30),
    ).toThrow();
    expect(() =>
      parseModelTranscript('{"language":"rw","segments":[{"start":90,"end":95,"text":"x"}]}', 30),
    ).toThrow();
  });
  it("enforces status transitions", () => {
    expect(canTransition("queued", "capturing")).toBe(true);
    expect(canTransition("queued", "available")).toBe(false);
    expect(canTransition("available", "failed")).toBe(false);
  });
});

describe("pipeline", () => {
  it("reports not configured without a key and stores nothing", async () => {
    expect(createGeminiProvider(undefined)).toBeNull();
    const repo = createMemoryRepository();
    expect(await runTranscriptionJob(req, { repo, provider: null, capture })).toEqual({
      kind: "not_configured",
    });
    expect(repo.rows.size).toBe(0);
  });
  it("persists and retrieves validated segments", async () => {
    const repo = createMemoryRepository();
    const r = await runTranscriptionJob(req, {
      repo,
      capture,
      provider: fake(async () =>
        parseModelTranscript(
          '{"language":"fr","segments":[{"start":0,"end":3,"text":"Bonjour"}]}',
          30,
        ),
      ),
    });
    expect(r.kind).toBe("available");
    const t = await repo.getTranscript((r as { transcriptId: string }).transcriptId);
    expect(t?.status).toBe("available");
    expect(t?.segments[0]?.text).toBe("Bonjour");
  });
  it("marks the job failed on AI errors without throwing", async () => {
    const repo = createMemoryRepository();
    const r = await runTranscriptionJob(req, {
      repo,
      capture,
      provider: fake(async () => {
        throw new AiProviderError("rate_limited", "Too many AI requests");
      }),
    });
    expect(r.kind).toBe("failed");
    expect([...repo.rows.values()][0]?.status).toBe("failed");
  });
});

describe("client safety", () => {
  it("no browser code imports the AI provider or reads the key", () => {
    const files: string[] = [];
    const walk = (d: string) =>
      readdirSync(d).forEach((f) => {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (
          /\.tsx$/.test(p) ||
          (/\.ts$/.test(p) &&
            !/\.(server|test|functions)\.ts$/.test(p) &&
            !p.includes("integrations"))
        )
          files.push(p);
      });
    walk("src/components");
    walk("src/routes");
    walk("src/context");
    for (const f of files) {
      const s = readFileSync(f, "utf8");
      expect(s, f).not.toMatch(/gatewayGemini|LOVABLE_API_KEY|GEMINI_API_KEY/);
    }
  });
});

describe("duplicate model segments", () => {
  it("drops repeated overlapping lines but keeps genuine repeats later", async () => {
    const { parseModelTranscript } = await import("./contract");
    const raw = JSON.stringify({
      language: "rw",
      segments: [
        { start: 0, end: 4, text: "Muraho" },
        { start: 0.5, end: 4, text: "Muraho" },
        { start: 20, end: 22, text: "Muraho" },
      ],
    });
    expect(parseModelTranscript(raw, 30).segments.map((s) => s.start)).toEqual([0, 20]);
  });
});
