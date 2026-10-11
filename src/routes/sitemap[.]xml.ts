import { createFileRoute } from "@tanstack/react-router";
import { buildSitemapXml } from "@/lib/sitemap";

// Generated from the same public station/channel lists the site renders, so it can't drift.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemapXml(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        }),
    },
  },
});
