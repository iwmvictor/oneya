import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Tv } from "lucide-react";
import { useMemo } from "react";
import { PageBody, PageHeader, Section } from "@/components/layout/AppShell";
import { ChannelList } from "@/components/tv/ChannelList";
import { useRecentChannels } from "@/hooks/useLibrary";
import { breadcrumbLd, itemListLd, seo } from "@/lib/site";
import { getChannelById, getPublicChannels, isWatchable } from "@/services/channelService";

export const Route = createFileRoute("/tv/")({
  head: () => {
    const channels = getPublicChannels();
    return seo({
      title: "Live TV from Rwanda",
      description: `Watch ${channels.length} live TV channels from Rwanda in your browser. Pick a channel and press play. Streams come directly from the broadcasters.`,
      path: "/tv",
      jsonLd: [
        itemListLd(
          "Live TV channels from Rwanda",
          "/tv",
          channels.map((c) => ({ name: c.name, path: `/tv/${c.slug}` })),
        ),
        breadcrumbLd([
          { name: "ONEYA", path: "/" },
          { name: "Live TV", path: "/tv" },
        ]),
      ],
    });
  },
  component: TvPage,
});

function TvPage() {
  const channels = getPublicChannels();
  const recentIds = useRecentChannels();
  const recent = useMemo(
    () =>
      recentIds
        .map(getChannelById)
        .filter((c): c is NonNullable<typeof c> => !!c && isWatchable(c))
        .slice(0, 3),
    [recentIds],
  );

  return (
    <>
      <PageHeader title="Live TV" />
      <PageBody>
        <p className="px-4 pt-1 text-sm text-muted-foreground sm:px-0">
          Watch live television channels from Rwanda. Each channel plays directly from its
          broadcaster, so availability can change.
        </p>

        {channels.length === 0 ? (
          <div className="mx-4 mt-10 flex flex-col items-center text-center sm:mx-0">
            <Tv className="size-8 text-muted-foreground" aria-hidden />
            <h2 className="mt-3 font-semibold">No TV channels are available right now</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Channels appear here once a working stream is listed for them. Radio is available in
              the meantime.
            </p>
            <Link
              to="/stations"
              className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse radio stations
            </Link>
          </div>
        ) : (
          <>
            {recent.length > 0 && (
              <Section title="Watch again">
                <ChannelList channels={recent} label="Recently watched channels" />
              </Section>
            )}
            <Section title={`All channels · ${channels.length}`}>
              <ChannelList channels={channels} label="Live TV channels" />
            </Section>
            <div className="mx-4 mt-8 flex items-center gap-3 rounded-lg border border-border bg-card p-4 sm:mx-0">
              <Radio className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <p className="flex-1 text-sm text-muted-foreground">
                Prefer to listen? Browse live radio stations from across Rwanda.
              </p>
              <Link
                to="/stations"
                className="shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Radio stations
              </Link>
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
