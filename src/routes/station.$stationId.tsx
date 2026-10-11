import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Heart,
  Languages,
  MapPin,
  Radio,
  Share2,
} from "lucide-react";
import type { ReactNode } from "react";
import { StationLogo } from "@/components/stations/StationLogo";
import { StationStatusLabel } from "@/components/stations/StationStatus";
import { useRadioPlayer, STATUS_TEXT } from "@/context/RadioPlayerContext";
import { useFavorites } from "@/hooks/useLibrary";
import { shareStation } from "@/lib/share";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  getStationBySlug,
  isPlayable,
} from "@/services/stationService";
import { cn } from "@/lib/utils";
import { Loader2, Pause, Play, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/station/$stationId")({
  loader: ({ params }) => {
    const station = getStationBySlug(params.stationId);
    if (!station) throw notFound();
    return { station };
  },
  head: ({ loaderData }) => {
    const s = loaderData?.station;
    const title = s
      ? `${s.name}${s.frequency ? ` ${s.frequency}` : ""} — ONEYA · Rwanda Radio`
      : "Station — ONEYA · Rwanda Radio";
    const desc = s
      ? `Listen to ${s.name}${s.frequency ? ` on ${s.frequency}` : ""}${s.location ? `, ${s.location.split("/")[0]?.trim()}` : ""}. Rwanda radio online.`
      : "Rwanda radio station";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "music.radio_station" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: StationDetail,
  notFoundComponent: () => (
    <div className="px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Station not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">This station link may be out of date.</p>
      <Link
        to="/stations"
        className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
      >
        Browse all stations
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">This station didn't load</h1>
      <Link
        to="/stations"
        className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
      >
        Browse all stations
      </Link>
    </div>
  ),
});

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <span className="mt-0.5 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm">{children}</dd>
      </div>
    </div>
  );
}

function StationDetail() {
  const { station: s } = Route.useLoaderData();
  const router = useRouter();
  const p = useRadioPlayer();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(s.id);
  const playable = isPlayable(s);
  const current = p.isCurrent(s.id);
  const busy = current && (p.status === "connecting" || p.status === "reconnecting");
  const playing = current && p.status === "playing";
  const failed = current && (p.status === "error" || p.status === "offline");

  const secondaryBtn =
    "inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="mx-auto w-full max-w-3xl pb-10">
      <div className="flex items-center px-2 py-2 md:px-6 md:pt-6">
        <button
          type="button"
          onClick={() =>
            window.history.length > 1 ? router.history.back() : router.navigate({ to: "/stations" })
          }
          aria-label="Back"
          className="grid size-11 place-items-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-4 sm:flex-row sm:items-end md:px-8">
        <StationLogo station={s} size="lg" className="size-28 text-xl sm:size-36" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{s.name}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {[s.frequency ?? "Online only", s.location].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-2">
            {current && p.status !== "idle" ? (
              <span
                role="status"
                className={cn(
                  "text-sm font-medium",
                  playing ? "text-live" : failed ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {failed && p.errorMessage ? p.errorMessage : STATUS_TEXT[p.status]}
              </span>
            ) : (
              <StationStatusLabel station={s} className="text-sm" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 px-4 md:px-8">
        {playable ? (
          <button
            type="button"
            onClick={() => (failed ? p.retry() : p.toggle(s))}
            className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {failed ? (
              <RefreshCw className="size-5" />
            ) : busy ? (
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" />
            ) : playing ? (
              <Pause className="size-5" fill="currentColor" />
            ) : (
              <Play className="size-5" fill="currentColor" />
            )}
            {failed ? "Try again" : busy ? "Connecting…" : playing ? "Pause" : "Listen live"}
          </button>
        ) : (
          <div
            role="note"
            className="flex h-12 items-center gap-2 rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground"
          >
            <Radio className="size-4" aria-hidden />
            {s.status === "offline"
              ? "Online stream is currently offline"
              : STATUS_LABELS[s.status]}
          </div>
        )}
        <button
          type="button"
          onClick={() => toggle(s.id)}
          aria-pressed={fav}
          className={secondaryBtn}
        >
          <Heart className={cn("size-4", fav && "fill-primary text-primary")} />
          {fav ? "Saved" : "Favorite"}
        </button>
        <button type="button" onClick={() => shareStation(s)} className={secondaryBtn}>
          <Share2 className="size-4" />
          Share
        </button>
      </div>

      <section className="mt-8 px-4 md:px-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          About
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {s.description ?? "A verified station description hasn't been added yet."}
        </p>
        <dl className="mt-4 grid divide-y divide-border rounded-lg border border-border bg-card sm:grid-cols-2 sm:divide-y-0">
          <Fact icon={<Radio className="size-4" />} label="Frequency">
            {s.frequency ?? "Online only"}
          </Fact>
          <Fact icon={<MapPin className="size-4" />} label="Location">
            {[s.location, s.reach && `${s.reach} reach`].filter(Boolean).join(" · ") ||
              "Not verified"}
          </Fact>
          <Fact icon={<Globe className="size-4" />} label="Category">
            {s.categories.map((c) => CATEGORY_LABELS[c]).join(", ") || "Not set"}
          </Fact>
          {s.languages.length > 0 && (
            <Fact icon={<Languages className="size-4" />} label="Languages">
              {s.languages.join(", ")}
            </Fact>
          )}
          <Fact icon={<Radio className="size-4" />} label="Online stream">
            {STATUS_LABELS[s.status]}
            {s.isVerified && " · verified"}
          </Fact>
          {s.website && (
            <Fact icon={<ExternalLink className="size-4" />} label="Website">
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-primary hover:underline"
              >
                {s.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </Fact>
          )}
        </dl>
      </section>
    </div>
  );
}
