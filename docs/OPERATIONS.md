# ONEYA operations notes

Production origin: `https://oneya.vercel.app` (constant in `src/lib/site.ts`; nothing else hard-codes a domain).

## Stream data and visibility

`src/data/registry.json` is the single source of truth and is never rewritten by code.

- A radio station is **public/playable** only if `assessStream()` (`src/lib/streamEligibility.ts`) says so. Reasons a record is held back, all kept as data:
  `missing` (no URL), `invalid`, `insecure` (http://), `not_enabled` (`stream.status` is `catalog_only`/`disabled`/…),
  `expired` (token past expiry), `session_bound` (client-IP parameter or token living under 24 h).
- To publish a station that is currently `catalog_only`: verify its stream, then set `"status": "active"` in `registry.json`.
- Public lists use `getPublicStations()` / `getPublicChannels()`. `getCatalogStations()` / `getCatalogChannels()` return everything (internal use only).
- Runtime playback failures are shown to the viewer at that moment; they are never written back as "invalid".
- TV channels come from the optional `tv` block on a registry record. Optional fields: `tv.name` (real channel name), `tv.logo`, `tv.description`, `tv.website`. Without `tv.name`, the channel is named "<broadcaster> TV".
- Hidden stations/channels still resolve at their URL (noindex, no play control) and are excluded from lists, search and `sitemap.xml`.

## Station logos (action needed)

`src/assets/stations/*.asset.json` point at Lovable's asset store (`/__l5e/assets-v1/...`), which only resolves on Lovable hosting.
On Vercel, put real files at `public/stations/<station-id>.webp` (png/jpg/svg also work). They are picked up automatically.
Until then the UI shows each broadcaster's monogram tile. Set `VITE_USE_LOVABLE_ASSETS=1` only when building on Lovable.

## PWA

- Service worker source: `pwa/sw.js`, emitted as `/sw.js` by `pwa/vite-plugin.ts` (the only worker). Registration + update prompt: `src/lib/pwa.ts`.
- It never touches cross-origin requests, so live streams are never cached. Navigations are network-first with an offline fallback (`public/offline.html`).
- A new deploy changes the build id; users see "A new version of ONEYA is ready" and refresh on their own terms.
- Install prompt policy: `src/lib/install.ts` (after a successful play or 3 visits; 7-day then 30-day cooldown; stops after 3 dismissals; hidden when installed).

## Google tools

- GA4 tag (`G-73W4SD7YHF`): `src/lib/analytics.ts`, rendered once in the root shell, production builds only.
- Search Console verification meta: `src/lib/site.ts` (`GOOGLE_SITE_VERIFICATION`), emitted on `/` only.
- After deploy: verify the property in Search Console and submit `https://oneya.vercel.app/sitemap.xml`.

## Deploy

Vercel auto-detects the framework; `vite.config.ts` pins Nitro's `vercel` preset when `VERCEL` is set. `vercel.json` adds cache/security headers for `/sw.js` and the manifest.
Confirm in the deployed site that `/sw.js` returns `Cache-Control: no-cache`.
