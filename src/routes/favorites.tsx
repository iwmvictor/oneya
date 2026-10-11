import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { StationList } from "@/components/stations/StationList";
import { useFavorites } from "@/hooks/useLibrary";
import { getStationById } from "@/services/stationService";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favorites — ONEYA · Rwanda Radio" },
      { name: "description", content: "Your saved Rwanda radio stations, stored on this device." },
      { property: "og:title", content: "Favorites — ONEYA · Rwanda Radio" },
      { property: "og:description", content: "Your saved Rwanda radio stations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const { ids } = useFavorites();
  const stations = ids.map(getStationById).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <>
      <PageHeader title="Favorites" />
      <PageBody>
        {stations.length === 0 ? (
          <div className="mx-4 mt-10 flex flex-col items-center text-center sm:mx-0">
            <Heart className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-3 font-semibold">No favorites yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Tap the heart on any station to keep it here. Favorites are saved on this device.
            </p>
            <Link
              to="/stations"
              className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse stations
            </Link>
          </div>
        ) : (
          <div className="pt-3">
            <StationList stations={stations} label="Favorite stations" />
          </div>
        )}
      </PageBody>
    </>
  );
}
