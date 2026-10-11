import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, Heart, Share2, Square } from "lucide-react";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { useFavorites } from "@/hooks/useLibrary";
import { StationLogo } from "@/components/stations/StationLogo";
import { MainToggle, StatusLine, VolumeControl } from "./PlayerBar";
import { shareStation } from "@/lib/share";
import { stationSubtitle } from "@/services/stationService";
import { cn } from "@/lib/utils";

export function FullPlayer() {
  const p = useRadioPlayer();
  const { isFavorite, toggle } = useFavorites();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!p.expanded) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && p.setExpanded(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [p.expanded, p]);

  if (!p.expanded || !p.station) return null;
  const s = p.station;
  const fav = isFavorite(s.id);
  const iconBtn =
    "flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Now playing: ${s.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <button
          ref={closeRef}
          type="button"
          onClick={() => p.setExpanded(false)}
          aria-label="Close player"
          className="grid size-11 place-items-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown className="size-6" />
        </button>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Now playing
        </span>
        <span className="size-11" />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 pb-10">
        <StationLogo station={s} size="xl" />
        <div className="w-full text-center">
          <h2 className="text-2xl font-semibold tracking-tight">{s.name}</h2>
          <p className="mt-1 font-mono text-sm text-muted-foreground">{stationSubtitle(s)}</p>
          <div className="mt-3 flex justify-center">
            <StatusLine className="text-sm" />
          </div>
        </div>

        <MainToggle big />

        <VolumeControl className="w-full max-w-xs" />

        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => toggle(s.id)} aria-pressed={fav} className={iconBtn}>
            <Heart className={cn("size-5", fav && "fill-primary text-primary")} />
            {fav ? "Saved" : "Favorite"}
          </button>
          <button type="button" onClick={() => shareStation(s)} className={iconBtn}>
            <Share2 className="size-5" />
            Share
          </button>
          {s.website && (
            <a href={s.website} target="_blank" rel="noopener noreferrer" className={iconBtn}>
              <ExternalLink className="size-5" />
              Website
            </a>
          )}
          <button type="button" onClick={p.stop} className={iconBtn}>
            <Square className="size-5" />
            Stop
          </button>
        </div>

        <Link
          to="/station/$stationId"
          params={{ stationId: s.slug }}
          onClick={() => p.setExpanded(false)}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Station details
        </Link>
      </div>
    </div>
  );
}
