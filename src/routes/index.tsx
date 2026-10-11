import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { StationCategory } from "@/types/station";
import { PageBody, PageHeader, Section } from "@/components/layout/AppShell";
import { FeaturedStrip } from "@/components/stations/FeaturedStrip";
import { StationList } from "@/components/stations/StationList";
import { CategoryFilter } from "@/components/stations/CategoryFilter";
import { ChannelList } from "@/components/tv/ChannelList";
import { useRecentChannels, useRecentlyPlayed } from "@/hooks/useLibrary";
import {
  GOOGLE_SITE_VERIFICATION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  organizationLd,
  seo,
  websiteLd,
} from "@/lib/site";
import { getChannelById, getPublicChannels, isWatchable } from "@/services/channelService";
import {
  getFeaturedStations,
  getStationById,
  isPlayable,
  searchStations,
} from "@/services/stationService";

export const Route = createFileRoute("/")({
  head: () => {
    const h = seo({
      title: `${SITE_NAME} · ${SITE_TAGLINE}`,
      rawTitle: true,
      description: SITE_DESCRIPTION,
      path: "/",
      jsonLd: [organizationLd(), websiteLd()],
    });
    return {
      ...h,
      meta: [...h.meta, { name: "google-site-verification", content: GOOGLE_SITE_VERIFICATION }],
    };
  },
  component: Home,
});

function Home() {
  const [category, setCategory] = useState<StationCategory | "all">("all");
  const recentIds = useRecentlyPlayed();
  const recentChannelIds = useRecentChannels();
  const recent = useMemo(
    () =>
      recentIds
        .map(getStationById)
        .filter((s): s is NonNullable<typeof s> => !!s && isPlayable(s))
        .slice(0, 5),
    [recentIds],
  );
  const recentChannels = useMemo(
    () =>
      recentChannelIds
        .map(getChannelById)
        .filter((c): c is NonNullable<typeof c> => !!c && isWatchable(c))
        .slice(0, 3),
    [recentChannelIds],
  );
  const featured = getFeaturedStations();
  const channels = getPublicChannels();
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
            Search radio, TV, frequency or city
          </Link>
        </div>

        {(recent.length > 0 || recentChannels.length > 0) && (
          <Section title="Pick up where you left off">
            {recentChannels.length > 0 && (
              <ChannelList channels={recentChannels} label="Recently watched channels" />
            )}
            {recent.length > 0 && (
              <div className={recentChannels.length > 0 ? "mt-3" : undefined}>
                <StationList stations={recent} label="Recently played stations" />
              </div>
            )}
          </Section>
        )}

        {channels.length > 0 && (
          <Section
            title="Live TV"
            action={
              <Link
                to="/tv"
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                See all <ChevronRight className="size-4" aria-hidden />
              </Link>
            }
          >
            <ChannelList channels={channels.slice(0, 3)} label="Live TV channels" />
          </Section>
        )}

        {featured.length > 0 && (
          <Section title="Featured radio">
            <FeaturedStrip stations={featured} />
          </Section>
        )}

        <Section
          title="Radio stations"
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
            <StationList stations={list.slice(0, 12)} label="Radio stations" />
          </div>
        </Section>
      </PageBody>
    </>
  );
}
