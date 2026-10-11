import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft, Heart, Radio, Share2, Tv } from "lucide-react";
import { ChannelLogo } from "@/components/tv/ChannelLogo";
import { ChannelList } from "@/components/tv/ChannelList";
import { TvPlayer } from "@/components/tv/TvPlayer";
import { useFavorites } from "@/hooks/useLibrary";
import { shareChannel } from "@/lib/share";
import { breadcrumbLd, seo } from "@/lib/site";
import { cn } from "@/lib/utils";
import { getChannelBySlug, getOtherChannels, getRadioCounterpart } from "@/services/channelService";

export const Route = createFileRoute("/tv/$channelSlug")({
  loader: ({ params }) => {
    const channel = getChannelBySlug(params.channelSlug);
    if (!channel) throw notFound();
    // One URL per channel: ids and old spellings redirect to the canonical slug.
    if (params.channelSlug !== channel.slug)
      throw redirect({
        to: "/tv/$channelSlug",
        params: { channelSlug: channel.slug },
        statusCode: 301,
      });
    return { channel };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.channel;
    if (!c)
      return seo({
        title: "Channel not found",
        description: "This TV channel link is out of date.",
        path: "/tv",
        noindex: true,
      });
    const path = `/tv/${c.slug}`;
    return seo({
      title: `Watch ${c.name} live`,
      description: c.stream.eligible
        ? `Watch ${c.name} live in your browser on ONEYA. Streams directly from the broadcaster; availability can change.`
        : `${c.name} has no live stream available on ONEYA right now.`,
      path,
      type: "video.other",
      // Channels without a working stream are placeholders: keep them out of the index.
      noindex: !c.stream.eligible,
      jsonLd: [
        breadcrumbLd([
          { name: "ONEYA", path: "/" },
          { name: "Live TV", path: "/tv" },
          { name: c.name, path },
        ]),
      ],
    });
  },
  component: ChannelPage,
  notFoundComponent: () => (
    <div className="px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Channel not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">This channel link may be out of date.</p>
      <Link to="/tv" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Browse live TV
      </Link>
    </div>
  ),
});

function ChannelPage() {
  const { channel: c } = Route.useLoaderData();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(c.id);
  const radio = getRadioCounterpart(c);
  const others = getOtherChannels(c.id);
  const secondaryBtn =
    "inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="mx-auto w-full max-w-4xl pb-10">
      <nav aria-label="Breadcrumb" className="flex items-center px-2 py-2 md:px-6 md:pt-6">
        <Link
          to="/tv"
          aria-label="Back to Live TV"
          className="grid size-11 place-items-center rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <span className="text-sm text-muted-foreground">Live TV</span>
      </nav>

      <div className="flex items-center gap-3 px-4 pb-3 md:px-8">
        <ChannelLogo channel={c} className="size-14" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{c.name}</h1>
          <p
            className={cn(
              "text-sm",
              c.stream.eligible ? "text-muted-foreground" : "text-muted-foreground",
            )}
          >
            {c.stream.eligible ? "Live stream" : "No live stream available"}
          </p>
        </div>
      </div>

      {c.stream.eligible ? (
        <TvPlayer key={c.id} channel={c} />
      ) : (
        <div
          role="note"
          className="mx-4 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center md:mx-8"
        >
          <Tv className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-semibold">This channel can't be watched right now</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            We don't have a working public stream for {c.name}. It will return once one is
            available.
          </p>
          <Link to="/tv" className="mt-2 text-sm font-medium text-primary hover:underline">
            Browse available channels
          </Link>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 px-4 md:px-8">
        <button
          type="button"
          onClick={() => toggle(c.id)}
          aria-pressed={fav}
          className={secondaryBtn}
        >
          <Heart className={cn("size-4", fav && "fill-primary text-primary")} />
          {fav ? "Saved" : "Favorite"}
        </button>
        <button type="button" onClick={() => shareChannel(c)} className={secondaryBtn}>
          <Share2 className="size-4" />
          Share
        </button>
        {radio && (
          <Link
            to="/station/$stationId"
            params={{ stationId: radio.slug }}
            className={secondaryBtn}
          >
            <Radio className="size-4" aria-hidden />
            Listen on radio{radio.frequency ? ` · ${radio.frequency}` : ""}
          </Link>
        )}
      </div>

      <section className="mt-8 px-4 md:px-8" aria-labelledby="about-heading">
        <h2
          id="about-heading"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          About this stream
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {c.description ??
            `${c.name} is played live from the broadcaster's own stream. ONEYA does not host or re-broadcast it, and availability depends on the broadcaster.`}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          If the picture doesn't start, press Try again. If it still fails, the broadcaster's stream
          may be offline or may not allow viewing from other websites.
        </p>
      </section>

      {others.length > 0 && (
        <section className="mt-8" aria-labelledby="more-heading">
          <h2
            id="more-heading"
            className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:px-8"
          >
            More channels
          </h2>
          <div className="md:px-8">
            <ChannelList channels={others} label="More live TV channels" />
          </div>
        </section>
      )}
    </div>
  );
}
