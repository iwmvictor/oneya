import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { StationList } from "@/components/stations/StationList";
import { useFavorites } from "@/hooks/useLibrary";
import { ChannelList } from "@/components/tv/ChannelList";
import { seo } from "@/lib/site";
import { getChannelById, isWatchable } from "@/services/channelService";
import { getStationById, isPlayable } from "@/services/stationService";

export const Route = createFileRoute("/favorites")({
  head: () =>
    seo({
      title: "Favorites",
      description: "Your saved radio stations and TV channels, stored on this device.",
      path: "/favorites",
      noindex: true, // personal, device-specific page
    }),
  component: Favorites,
});

function Favorites() {
  const { ids } = useFavorites();
  // Saved ids are kept even if a stream later becomes unavailable; they just aren't listed as playable.
  const stations = ids
    .map(getStationById)
    .filter((s): s is NonNullable<typeof s> => !!s && isPlayable(s));
  const channels = ids
    .map(getChannelById)
    .filter((c): c is NonNullable<typeof c> => !!c && isWatchable(c));

  return (
    <>
      <PageHeader title="Favorites" />
      <PageBody>
        {stations.length === 0 && channels.length === 0 ? (
          <div className="mx-4 mt-10 flex flex-col items-center text-center sm:mx-0">
            <Heart className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-3 font-semibold">No favorites yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Tap the heart on any station or channel to keep it here. Favorites are saved on this
              device.
            </p>
            <Link
              to="/stations"
              className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse radio
            </Link>
          </div>
        ) : (
          <div className="space-y-6 pt-3">
            {channels.length > 0 && (
              <section aria-labelledby="fav-tv">
                <h2
                  id="fav-tv"
                  className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:px-0"
                >
                  TV channels
                </h2>
                <ChannelList channels={channels} label="Favorite TV channels" />
              </section>
            )}
            {stations.length > 0 && (
              <section aria-labelledby="fav-radio">
                <h2
                  id="fav-radio"
                  className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:px-0"
                >
                  Radio stations
                </h2>
                <StationList stations={stations} label="Favorite stations" />
              </section>
            )}
          </div>
        )}
      </PageBody>
    </>
  );
}
