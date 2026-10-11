/* ONEYA service worker. Emitted at /sw.js by pwa/vite-plugin.ts, which stamps BUILD_ID.
 *
 * Strategy
 *  - Navigations: network first (4s), fall back to the last cached copy of that page,
 *    then to /offline.html. Users always get fresh HTML when online.
 *  - /assets/* (content-hashed, immutable): cache first, bounded.
 *  - Icons, brand art, manifest: stale-while-revalidate.
 *  - Everything else, and ALL cross-origin requests (live radio/TV streams, fonts, images
 *    hosted by broadcasters): untouched, straight to the network. Live media is never cached.
 *  - Updates: a new worker waits until the page asks it to take over (SKIP_WAITING), so a
 *    running session is never swapped under the user.
 */
const BUILD_ID = "__BUILD_ID__";
const SHELL_CACHE = `oneya-shell-${BUILD_ID}`;
const PAGES_CACHE = `oneya-pages-${BUILD_ID}`;
const ASSETS_CACHE = "oneya-assets-v1"; // hashed filenames never collide across builds
const STATIC_CACHE = "oneya-static-v1";
const MAX_ASSETS = 150;
const MAX_PAGES = 40;
const NAV_TIMEOUT_MS = 4000;

const PRECACHE = [
  "/offline.html",
  "/brand/logo-96.png",
  "/brand/logo-light-96.png",
  "/icons/icon-192.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, PAGES_CACHE, ASSETS_CACHE, STATIC_CACHE]);
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("oneya-") && !keep.has(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function navigate(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await Promise.race([fetch(request), timeout(NAV_TIMEOUT_MS)]);
    // Cache only successful, non-redirected HTML pages.
    if (
      res.ok &&
      !res.redirected &&
      (res.headers.get("content-type") || "").includes("text/html")
    ) {
      cache.put(request, res.clone()).then(() => trim(PAGES_CACHE, MAX_PAGES));
    }
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match("/offline.html");
    if (offline) return offline;
    throw err;
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone()).then(() => trim(cacheName, max));
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  return hit || (await refresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch streams or third-party hosts
  if (request.headers.has("range")) return; // media range requests go to the network
  const p = url.pathname;
  if (
    p === "/sw.js" ||
    p.startsWith("/_serverFn") ||
    p.startsWith("/api/") ||
    p.startsWith("/~oauth")
  )
    return;
  if (url.searchParams.get("sw") === "off") return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
  } else if (p.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE, MAX_ASSETS));
  } else if (
    p.startsWith("/icons/") ||
    p.startsWith("/brand/") ||
    p === "/manifest.webmanifest" ||
    p === "/favicon.ico"
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
