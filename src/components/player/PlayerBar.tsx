import {
  AlertCircle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { useRadioPlayer, STATUS_TEXT } from "@/context/RadioPlayerContext";
import { StationLogo } from "@/components/stations/StationLogo";
import { cn } from "@/lib/utils";

export function MainToggle({ big = false }: { big?: boolean }) {
  const p = useRadioPlayer();
  if (!p.station) return null;
  const busy = p.status === "connecting" || p.status === "reconnecting";
  const failed = p.status === "error" || p.status === "offline";
  const icon = big ? "size-7" : "size-5";
  return (
    <button
      type="button"
      onClick={() => (failed ? p.retry() : p.toggle())}
      aria-label={
        failed ? "Try again" : busy ? "Stop connecting" : p.status === "playing" ? "Pause" : "Play"
      }
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        big ? "size-16" : "size-11",
      )}
    >
      {failed ? (
        <RefreshCw className={icon} />
      ) : busy ? (
        <Loader2 className={cn(icon, "animate-spin motion-reduce:animate-none")} />
      ) : p.status === "playing" ? (
        <Pause className={icon} fill="currentColor" />
      ) : (
        <Play className={cn(icon, "translate-x-px")} fill="currentColor" />
      )}
    </button>
  );
}

export function StatusLine({ className }: { className?: string }) {
  const p = useRadioPlayer();
  const failed = p.status === "error" || p.status === "offline";
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        p.status === "playing"
          ? "text-live"
          : failed
            ? "text-destructive"
            : "text-muted-foreground",
        className,
      )}
    >
      {p.status === "playing" && <span aria-hidden className="size-1.5 rounded-full bg-live" />}
      {p.status === "offline" && <WifiOff aria-hidden className="size-3.5" />}
      {p.status === "error" && <AlertCircle aria-hidden className="size-3.5" />}
      {p.status === "error" && p.errorMessage ? p.errorMessage : STATUS_TEXT[p.status]}
    </span>
  );
}

export function VolumeControl({ className }: { className?: string }) {
  const p = useRadioPlayer();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={p.toggleMute}
        aria-label={p.muted ? "Unmute" : "Mute"}
        className="grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {p.muted || p.volume === 0 ? (
          <VolumeX className="size-5" />
        ) : (
          <Volume2 className="size-5" />
        )}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={p.muted ? 0 : p.volume}
        onChange={(e) => p.setVolume(Number(e.target.value))}
        aria-label="Volume"
        className="h-1 w-full cursor-pointer accent-primary"
      />
    </div>
  );
}

/** Persistent player: compact mini-player on mobile, full-width bar on desktop. */
export function PlayerBar() {
  const p = useRadioPlayer();
  if (!p.station) return null;
  const s = p.station;
  return (
    <section aria-label="Now playing" className="border-t border-border bg-card">
      <div className="mx-auto flex h-16 items-center gap-3 px-3 md:h-20 md:px-6">
        <button
          type="button"
          onClick={() => p.setExpanded(true)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-none md:w-80"
          aria-label={`Open player for ${s.name}`}
        >
          <StationLogo station={s} size="sm" className="md:size-12" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{s.name}</span>
            <span className="flex min-w-0 items-center gap-2">
              {s.frequency && (
                <span className="shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {s.frequency}
                </span>
              )}
              <StatusLine className="truncate" />
            </span>
          </span>
        </button>
        <div className="flex shrink-0 justify-end md:flex-1 md:justify-center">
          <MainToggle />
        </div>
        <div className="hidden items-center gap-2 md:flex md:w-80 md:justify-end">
          <VolumeControl className="w-40" />
          <button
            type="button"
            onClick={p.stop}
            aria-label="Stop and close player"
            className="grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
