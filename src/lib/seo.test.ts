import { describe, expect, it } from "vitest";
import { buildSitemapXml, sitemapPaths } from "./sitemap";
import { SITE_URL, absoluteUrl, seo, serializeJsonLd, broadcastServiceLd } from "./site";

describe("canonical URLs", () => {
  it("use the production origin with no trailing slash or query", () => {
    expect(SITE_URL).toBe("https://oneya.vercel.app");
    expect(absoluteUrl("/")).toBe("https://oneya.vercel.app");
    expect(absoluteUrl("/tv/")).toBe("https://oneya.vercel.app/tv");
    const head = seo({ title: "T", description: "d", path: "/stations" });
    expect(head.links).toEqual([{ rel: "canonical", href: "https://oneya.vercel.app/stations" }]);
  });
  it("marks utility pages noindex and public pages indexable", () => {
    const robots = (noindex: boolean) =>
      seo({ title: "T", description: "d", path: "/x", noindex }).meta.find(
        (m) => m["name"] === "robots",
      )?.["content"];
    expect(robots(true)).toMatch(/^noindex/);
    expect(robots(false)).toMatch(/^index/);
  });
  it("never lets JSON-LD break out of its script tag", () => {
    expect(serializeJsonLd({ n: "</script><script>alert(1)" })).not.toContain("</script>");
  });
  it("emits FM frequency structurally and omits it when there is none", () => {
    const withFm = broadcastServiceLd({
      name: "A",
      path: "/station/a",
      frequency: "102.3 FM",
    }) as Record<string, unknown>;
    expect(JSON.stringify(withFm)).toContain('"broadcastFrequencyValue":"102.3"');
    const none = broadcastServiceLd({ name: "A", path: "/station/a" }) as Record<string, unknown>;
    expect(none["broadcastFrequency"]).toBeUndefined();
  });
});

describe("sitemap", () => {
  const xml = buildSitemapXml();
  it("lists only canonical production URLs", () => {
    for (const p of sitemapPaths()) expect(xml).toContain(`<loc>${absoluteUrl(p)}</loc>`);
    expect(xml).not.toMatch(/localhost|vercel\.app\/\?|\?q=|vercel\.app\/\//);
  });
  it("excludes utility pages and ineligible stations/channels", () => {
    for (const p of ["/search", "/favorites", "/settings"]) expect(sitemapPaths()).not.toContain(p);
    expect(sitemapPaths()).not.toContain("/station/authentic-radio"); // no stream
    expect(sitemapPaths()).not.toContain("/tv/flash-fm-tv"); // session-bound stream
    expect(sitemapPaths()).toContain("/tv/radio10-tv");
    expect(sitemapPaths()).toContain("/station/kiss-fm");
  });
  it("has no duplicates", () => {
    expect(new Set(sitemapPaths()).size).toBe(sitemapPaths().length);
  });
});
