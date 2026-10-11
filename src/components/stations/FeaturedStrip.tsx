import { Link } from "@tanstack/react-router";
import type { RadioStation } from "@/types/station";
import { StationLogo } from "./StationLogo";
import { PlayButton } from "@/components/player/PlayButton";
import { stationSubtitle } from "@/services/stationService";

export function FeaturedStrip({ stations }: { stations: RadioStation[] }) {
  return (
    <ul className="flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
      {stations.map((s) => (
        <li
          key={s.id}
          className="relative w-40 shrink-0 snap-start rounded-lg border border-border bg-card p-3 sm:w-auto"
        >
          <StationLogo station={s} size="lg" className="w-full h-auto aspect-square" />
          <div className="mt-3 flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Link
                to="/station/$stationId"
                params={{ stationId: s.slug }}
                className="block truncate text-sm font-semibold after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
              >
                {s.name}
              </Link>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {stationSubtitle(s)}
              </p>
            </div>
            <div className="relative z-10">
              <PlayButton station={s} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
