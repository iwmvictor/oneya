import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { z } from "zod";
import type { StationCategory } from "@/types/station";
import { HeaderIconLink, PageBody, PageHeader } from "@/components/layout/AppShell";
import { CategoryFilter } from "@/components/stations/CategoryFilter";
import { StationList } from "@/components/stations/StationList";
import { searchStations } from "@/services/stationService";

const schema = z.object({
  category: z
    .enum(["all", "music", "news", "talk", "sports", "religious", "community"])
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/stations")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "All stations — ONEYA · Rwanda Radio" },
      {
        name: "description",
        content:
          "Browse radio stations broadcasting from Rwanda by category: music, news, religious and community radio.",
      },
      { property: "og:title", content: "All stations — ONEYA · Rwanda Radio" },
      { property: "og:description", content: "Browse radio stations broadcasting from Rwanda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Stations,
});

function Stations() {
  const { category = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/stations" });
  const list = searchStations("", category);
  const playable = list.filter((s) => s.status === "online").length;

  return (
    <>
      <PageHeader
        title="Stations"
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
            {list.length} stations · {playable} with an online stream
          </p>
        </div>
        <StationList stations={list} label="Stations" />
      </PageBody>
    </>
  );
}
