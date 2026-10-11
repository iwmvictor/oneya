import { Loader2, Pause, Play } from "lucide-react";
import type { RadioStation } from "@/types/station";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { isPlayable } from "@/services/stationService";
import { cn } from "@/lib/utils";

export function PlayButton({
  station,
  size = "md",
  className,
}: {
  station: RadioStation;
  size?: "md" | "lg";
  className?: string;
}) {
  const p = useRadioPlayer();
  const current = p.isCurrent(station.id);
  const loading = current && (p.status === "connecting" || p.status === "reconnecting");
  const playing = current && p.status === "playing";
  const playable = isPlayable(station);
  const dims = size === "lg" ? "size-14" : "size-11";
  const icon = size === "lg" ? "size-6" : "size-[18px]";

  if (!playable) return null;

  const label = loading
    ? `Stop connecting to ${station.name}`
    : playing
      ? `Pause ${station.name}`
      : `Play ${station.name}`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        p.toggle(station);
      }}
      aria-label={label}
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        current
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-card text-foreground hover:border-primary hover:text-primary",
        dims,
        className,
      )}
    >
      {loading ? (
        <Loader2 className={cn(icon, "animate-spin motion-reduce:animate-none")} />
      ) : playing ? (
        <Pause className={icon} fill="currentColor" />
      ) : (
        <Play className={cn(icon, "translate-x-px")} fill="currentColor" />
      )}
    </button>
  );
}
