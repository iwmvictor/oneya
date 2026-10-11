import type { Transcript } from "@/types/transcript";
import { formatTimestamp } from "@/services/transcriptService";

const STATUS_COPY = {
  unavailable: "No transcript is available for this program.",
  queued: "Transcript is queued.",
  capturing: "Capturing audio for transcription.",
  processing: "Transcript is being prepared.",
  failed: "Transcript could not be produced.",
} as const;

/** Display-only; not mounted until programs with transcripts exist. */
export function TranscriptView({ transcript }: { transcript: Transcript }) {
  if (transcript.status !== "available")
    return <p className="text-sm text-muted-foreground">{STATUS_COPY[transcript.status]}</p>;
  return (
    <ol className="space-y-3">
      {transcript.segments.map((seg) => (
        <li
          key={`${seg.start}-${seg.text.slice(0, 8)}`}
          className="grid grid-cols-[4rem_1fr] gap-3 text-sm"
        >
          <span className="font-mono text-muted-foreground">{formatTimestamp(seg.start)}</span>
          <span>
            {seg.speaker && <strong className="mr-1 font-semibold">{seg.speaker}:</strong>}
            {seg.text}
          </span>
        </li>
      ))}
    </ol>
  );
}
