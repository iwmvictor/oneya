import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";
import type { StationCategory } from "@/types/station";
import { HeaderIconLink, PageBody, PageHeader } from "@/components/layout/AppShell";
import { CategoryFilter } from "@/components/stations/CategoryFilter";
import { StationList } from "@/components/stations/StationList";
import { breadcrumbLd, itemListLd, seo } from "@/lib/site";
import { getPublicStations, searchStations } from "@/services/stationService";

const schema = z.object({
  category: z
    .enum(["all", "music", "news", "talk", "sports", "religious", "community"])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/stations")({
  validateSearch: schema,
  head: () => {
    const list = getPublicStations();
    return seo({
      title: "Live radio stations from Rwanda",
      description: `Listen to ${list.length} live radio stations from Rwanda in your browser: music, news, religious and community radio. Press play on any station.`,
      path: "/stations", // filtered views (?category=) canonicalise to the main list
      jsonLd: [
        itemListLd(
          "Live radio stations from Rwanda",
          "/stations",
          list.map((s) => ({ name: s.name, path: `/station/${s.slug}` })),
        ),
        breadcrumbLd([
          { name: "ONEYA", path: "/" },
          { name: "Radio", path: "/stations" },
        ]),
      ],
    });
  },
  component: Stations,
});

function Stations() {
  const { category = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/stations" });
  const list = searchStations("", category);

  return (
    <>
      <PageHeader
        title="Radio"
        action={
          <HeaderIconLink to="/search" label="Search stations">
            <Search className="size-5" />
          </HeaderIconLink>
        }
      />
      <PageBody>
        <div className="px-4 pt-2 sm:px-0">
          <CategoryFilter
            value={category}
            onChange={(c: StationCategory | "all") =>
              navigate({ search: c === "all" ? {} : { category: c }, replace: true })
            }
          />
          <p className="py-3 text-xs text-muted-foreground">
            {list.length} {list.length === 1 ? "station" : "stations"} you can listen to live
          </p>
        </div>
        <StationList stations={list} label="Stations" />
      </PageBody>
    </>
  );
}
