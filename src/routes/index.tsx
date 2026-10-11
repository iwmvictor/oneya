import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { StationCategory } from "@/types/station";
import { PageBody, PageHeader, Section } from "@/components/layout/AppShell";
import { FeaturedStrip } from "@/components/stations/FeaturedStrip";
import { StationList } from "@/components/stations/StationList";
import { CategoryFilter } from "@/components/stations/CategoryFilter";
import { useRecentlyPlayed } from "@/hooks/useLibrary";
import {
  getFeaturedStations,
  getStationById,
  isPlayable,
  searchStations,
} from "@/services/stationService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "What's on? — ONEYA · Rwanda Radio" },
      {
        name: "description",
        content:
          "Live radio stations broadcasting from Rwanda. Find a station, tap play, keep listening while you browse.",
      },
      { property: "og:title", content: "What's on? — ONEYA · Rwanda Radio" },
      {
        property: "og:description",
        content:
          "Live radio stations broadcasting from Rwanda, in your browser or as an installable app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function Home() {
  const [category, setCategory] = useState<StationCategory | "all">("all");
  const recentIds = useRecentlyPlayed();
  const recent = useMemo(
    () =>
      recentIds
        .map(getStationById)
        .filter((s): s is NonNullable<typeof s> => !!s)
        .slice(0, 5),
    [recentIds],
  );
  const featured = getFeaturedStations().filter(isPlayable);
  const list = searchStations("", category);

  return (
    <>
      <PageHeader title="What's on?" />
      <PageBody>
        <div className="px-4 pt-3 sm:px-0 md:hidden">
          <Link
            to="/search"
            className="flex h-11 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="size-4" aria-hidden />
            Search stations, frequency, city
          </Link>
        </div>

        {recent.length > 0 && (
          <Section title="Recently played">
            <StationList stations={recent} label="Recently played" />
          </Section>
        )}

        <Section title="ON NOW">
          <FeaturedStrip stations={featured} />
        </Section>

        <Section
          title="Stations"
          action={
            <Link
              to="/stations"
              className="inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              See all <ChevronRight className="size-4" aria-hidden />
            </Link>
          }
        >
          <div className="px-4 sm:px-0">
            <CategoryFilter value={category} onChange={setCategory} />
          </div>
          <div className="mt-3">
            <StationList stations={list.slice(0, 12)} label="Stations" />
          </div>
        </Section>
      </PageBody>
    </>
  );
}
