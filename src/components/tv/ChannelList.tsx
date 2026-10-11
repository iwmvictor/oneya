import { Link } from "@tanstack/react-router";
import { Heart, Tv } from "lucide-react";
import type { TvChannel } from "@/types/channel";
import { useFavorites } from "@/hooks/useLibrary";
import { cn } from "@/lib/utils";
import { ChannelLogo } from "./ChannelLogo";

export function ChannelCard({ channel }: { channel: TvChannel }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(channel.id);
  return (
    <li className="relative flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/60">
      <ChannelLogo channel={channel} className="size-16" />
      <div className="min-w-0 flex-1">
        <Link
          to="/tv/$channelSlug"
          params={{ channelSlug: channel.slug }}
          className="block truncate font-semibold text-foreground after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {channel.name}
        </Link>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-live">
          <span aria-hidden className="size-1.5 rounded-full bg-live" />
          Live stream
        </p>
        {channel.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{channel.description}</p>
        )}
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Tv className="size-4" aria-hidden /> Watch live
        </p>
      </div>
      <button
        type="button"
        onClick={() => toggle(channel.id)}
        aria-pressed={fav}
        aria-label={
          fav ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`
        }
        className="relative z-10 grid size-11 shrink-0 place-items-center self-start rounded-full text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Heart className={cn("size-4.5", fav && "fill-primary text-primary")} />
      </button>
    </li>
  );
}

export function ChannelList({ channels, label }: { channels: TvChannel[]; label?: string }) {
  return (
    <ul aria-label={label} className="grid gap-3 px-4 sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
      {channels.map((c) => (
        <ChannelCard key={c.id} channel={c} />
      ))}
    </ul>
  );
}
