import { toast } from "sonner";
import { absoluteUrl } from "@/lib/site";
import type { RadioStation } from "@/types/station";
import type { TvChannel } from "@/types/channel";

async function shareLink(
  data: { title: string; text: string; url: string },
  copiedMessage: string,
) {
  const url = data.url;
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success(copiedMessage);
  } catch {
    toast(url);
  }
}

/** Shares the canonical production URL, not whatever origin the page was opened from. */
export function shareStation(station: RadioStation) {
  return shareLink(
    {
      title: `${station.name} on ONEYA`,
      text: `Listen to ${station.name}${station.frequency ? ` (${station.frequency})` : ""} live on ONEYA`,
      url: absoluteUrl(`/station/${station.slug}`),
    },
    "Station link copied",
  );
}

export function shareChannel(channel: TvChannel) {
  return shareLink(
    {
      title: `${channel.name} on ONEYA`,
      text: `Watch ${channel.name} live on ONEYA`,
      url: absoluteUrl(`/tv/${channel.slug}`),
    },
    "Channel link copied",
  );
}
