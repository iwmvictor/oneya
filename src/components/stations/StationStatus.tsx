import type { RadioStation } from "@/types/station";
import { STATUS_LABELS, isPlayable } from "@/services/stationService";
import { cn } from "@/lib/utils";

/** Status shown with text + dot, never color alone. */
export function StationStatusLabel({
  station,
  className,
}: {
  station: RadioStation;
  className?: string;
}) {
  const live = isPlayable(station);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        live ? "text-live" : "text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", live ? "bg-live" : "bg-muted-foreground/60")}
      />
      {live ? "Stream available" : STATUS_LABELS[station.status]}
    </span>
  );
}
