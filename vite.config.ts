// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { oneyaServiceWorker } from "./pwa/vite-plugin";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Production is hosted on Vercel. Pin the preset there; elsewhere Nitro's own auto-detection
  // (NITRO_PRESET, Netlify, Cloudflare Pages) still applies.
  ...(process.env["VERCEL"] ? { nitro: { preset: "vercel" } } : {}),
  vite: {
    // The only service worker: pwa/sw.js, emitted as /sw.js. See src/lib/pwa.ts for registration.
    plugins: [oneyaServiceWorker()],
  },
});
