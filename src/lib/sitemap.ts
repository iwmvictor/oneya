import { absoluteUrl } from "@/lib/site";
import { getPublicChannels } from "@/services/channelService";
import { getPublicStations } from "@/services/stationService";

/**
 * Canonical, publicly useful URLs only: no utility/personal pages (search, favorites, settings),
 * no query-string variants, and no station or channel without an eligible stream.
 */
export function sitemapPaths(): string[] {
  return [
    "/",
    "/stations",
    "/tv",
    "/about",
    "/privacy",
    ...getPublicStations().map((s) => `/station/${s.slug}`),
    ...getPublicChannels().map((c) => `/tv/${c.slug}`),
  ];
}

export function buildSitemapXml(): string {
  const urls = sitemapPaths()
    .map((p) => `  <url><loc>${absoluteUrl(p)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
