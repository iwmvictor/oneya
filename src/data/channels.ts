/**
 * TV channel catalog, derived from the `tv` blocks of ./registry.json.
 * Channels are built here (not hard-coded in pages) so radio and TV share one
 * source of truth while staying separate in the model and the UI.
 *
 * Nothing is invented: when the registry has no channel name, the broadcaster name
 * is used with a "TV" suffix; logos and descriptions appear only if the data has them.
 */
import { registry } from "./registry";
import { slugify } from "./stations";
import { assessStream, isHttpUrl } from "@/lib/streamEligibility";
import { detectStreamKind } from "@/lib/tvStream";
import type { TvChannel } from "@/types/channel";

function channelName(brandName: string, explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  return /\btv\b/i.test(brandName) ? brandName.replace(/\btv\b/i, "TV") : `${brandName} TV`;
}

export const channels: TvChannel[] = registry
  .filter((r) => !!r.tv)
  .map((r, i) => {
    const tv = r.tv!;
    const name = channelName(r.name, tv.name);
    const stream = assessStream({ url: tv.url, declaredStatus: tv.status });
    const streamUrl = isHttpUrl(tv.url ?? undefined) ? (tv.url ?? undefined) : undefined;
    return {
      id: `tv-${r.id}`,
      slug: slugify(name),
      name,
      brandId: r.id,
      badge: {
        monogram: r.badge.monogram,
        background: r.badge.background,
        textColor: r.badge.textColor,
      },
      logo: tv.logo || undefined,
      description: tv.description || undefined,
      website: tv.website || undefined,
      streamUrl,
      streamFormat: tv.format ?? undefined,
      streamKind: detectStreamKind(streamUrl, tv.format),
      stream,
      order: i,
    };
  });
