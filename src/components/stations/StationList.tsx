import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { RadioStation } from "@/types/station";
import { StationLogo } from "./StationLogo";
import { PlayButton } from "@/components/player/PlayButton";
import { useFavorites } from "@/hooks/useLibrary";
import { useRadioPlayer, STATUS_TEXT } from "@/context/RadioPlayerContext";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  isPlayable,
  stationSubtitle,
} from "@/services/stationService";
import { cn } from "@/lib/utils";

export function StationRow({ station }: { station: RadioStation }) {
  const { isFavorite, toggle } = useFavorites();
  const p = useRadioPlayer();
  const fav = isFavorite(station.id);
  const current = p.isCurrent(station.id) && p.status !== "idle";
  const playable = isPlayable(station);

  return (
    <li className="group relative flex items-center gap-3 px-3 py-2.5 sm:px-4 hover:bg-accent/60">
      <StationLogo station={station} />
      <div className="min-w-0 flex-1">
        <Link
          to="/station/$stationId"
          params={{ stationId: station.slug }}
          className="block truncate font-semibold text-foreground after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
        >
          {station.name}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          <span className="font-mono text-[13px]">{stationSubtitle(station)}</span>
          {station.categories[0] && (
            <span className="hidden sm:inline"> · {CATEGORY_LABELS[station.categories[0]]}</span>
          )}
        </p>
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1.5 text-xs",
            current || playable ? "text-live" : "text-muted-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn("size-1.5 rounded-full", playable ? "bg-live" : "bg-muted-foreground/50")}
          />
          {current
            ? STATUS_TEXT[p.status]
            : playable
              ? "Live stream"
              : STATUS_LABELS[station.status]}
        </p>
      </div>
      <button
        type="button"
        onClick={() => toggle(station.id)}
        aria-pressed={fav}
        aria-label={
          fav ? `Remove ${station.name} from favorites` : `Add ${station.name} to favorites`
        }
        className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Heart className={cn("size-4.5", fav && "fill-primary text-primary")} />
      </button>
      <div className="relative z-10 w-11 shrink-0">
        <PlayButton station={station} />
      </div>
    </li>
  );
}

export function StationList({ stations, label }: { stations: RadioStation[]; label?: string }) {
  return (
    <ul
      aria-label={label}
      className="divide-y divide-border border-y border-border bg-card sm:rounded-lg sm:border"
    >
      {stations.map((s) => (
        <StationRow key={s.id} station={s} />
      ))}
    </ul>
  );
}
