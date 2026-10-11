import { parseModelTranscript } from "@/lib/transcripts/contract";
import { AiProviderError, type AiProvider, type AudioWindow } from "./provider";

/**
 * Gemini transcription through Lovable's built-in AI access (server only).
 * The key is read from the server environment per call and never leaves the server.
 */
export const GEMINI_TRANSCRIPTION_MODEL = "google/gemini-3.8-flash";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const INSTRUCTIONS = `You transcribe Rwandan radio audio verbatim.
Rules:
- Transcribe in the language actually spoken. Speech may be Kinyarwanda (rw), English (en), French (fr), Swahili (sw) or a mix within one sentence. Never translate, never normalise code-switching into one language.
- Tag each segment's language with a short code (rw, en, fr, sw) or "und" if unsure.
- Speaker: use a name only if it is clearly stated in the audio; otherwise null. Never guess identities.
- Omit music-only or silent stretches. If nothing is spoken, return an empty segments array.
- Timestamps are seconds from the start of this clip.
- confidence is your 0-1 estimate or null. quality is "good", "fair" or "poor" for overall audio intelligibility.
Return ONLY a JSON object, no prose:
{"language":"rw","languages":["rw","en"],"quality":"good","segments":[{"start":0,"end":8.4,"speaker":null,"language":"rw","text":"...","confidence":0.8}]}
"language" is the dominant spoken language.`;

export function createGeminiProvider(apiKey: string | undefined): AiProvider | null {
  if (!apiKey) return null;
  return {
    id: "gemini",
    model: GEMINI_TRANSCRIPTION_MODEL,
    transcription: {
      async transcribe(audio: AudioWindow) {
        const text = await streamCompletion(apiKey, audio);
        return parseModelTranscript(text, audio.durationSeconds);
      },
    },
  };
}

function toBase64(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

async function streamCompletion(apiKey: string, audio: AudioWindow): Promise<string> {
  if (!audio.bytes.length) throw new AiProviderError("capture_failed", "No audio was captured.");
  const hint = audio.expectedLanguages?.length
    ? `Station is listed with languages: ${audio.expectedLanguages.join(", ")} (a hint only).`
    : "";
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: GEMINI_TRANSCRIPTION_MODEL,
      stream: true,
      messages: [
        { role: "system", content: INSTRUCTIONS },
        {
          role: "user",
          content: [
            { type: "text", text: `Transcribe this ${Math.round(audio.durationSeconds)}s clip. ${hint}` },
            { type: "input_audio", input_audio: { data: toBase64(audio.bytes), format: audio.format } },
          ],
        },
      ],
    }),
  });

  if (!res.ok || !res.body) throw await mapHttpError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let out = "";
  let finish: string | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const evt = JSON.parse(data) as {
          error?: { message?: string };
          choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
        };
        if (evt.error) throw new AiProviderError("upstream_error", evt.error.message ?? "AI error");
        const c = evt.choices?.[0];
        if (c?.delta?.content) out += c.delta.content;
        if (c?.finish_reason) finish = c.finish_reason;
      } catch (e) {
        if (e instanceof AiProviderError) throw e;
      }
    }
  }
  if (finish === "content_filter")
    throw new AiProviderError("refused", "The AI declined to transcribe this audio.");
  if (!out.trim()) throw new AiProviderError("malformed_output", "The AI returned no transcript.");
  return out;
}

async function mapHttpError(res: Response): Promise<AiProviderError> {
  let msg = "";
  try {
    const j = (await res.json()) as { error?: { message?: string } | string; message?: string };
    msg = typeof j.error === "string" ? j.error : (j.error?.message ?? j.message ?? "");
  } catch {
    /* ignore */
  }
  const s = res.status;
  if (s === 401) return new AiProviderError("not_configured", "AI transcription key is invalid.", s);
  if (s === 402) return new AiProviderError("credits_exhausted", msg || "AI credits are used up.", s);
  if (s === 403) return new AiProviderError("access_denied", msg || "AI access was denied.", s);
  if (s === 404) return new AiProviderError("model_unavailable", "The transcription model is unavailable.", s);
  if (s === 429) return new AiProviderError("rate_limited", "Too many AI requests; try again later.", s);
  if (s === 400) return new AiProviderError("invalid_request", msg || "The audio could not be processed.", s);
  return new AiProviderError("upstream_error", "The AI service had a problem; try again later.", s);
}
