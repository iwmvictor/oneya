import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin } from "vite";

/**
 * Emits /sw.js into the CLIENT bundle so it lands in the same public directory as the app's
 * assets on every deploy target (Vercel, Cloudflare, Node). Replaces the previous generated
 * worker, which was written outside the served directory and precached nothing.
 * The build id changes every deploy, so the browser sees a byte-different worker and offers the update.
 */
export function oneyaServiceWorker(): Plugin {
  const buildId =
    process.env["VERCEL_GIT_COMMIT_SHA"]?.slice(0, 12) ??
    process.env["GITHUB_SHA"]?.slice(0, 12) ??
    Date.now().toString(36);
  return {
    name: "oneya-service-worker",
    apply: "build",
    applyToEnvironment: (env) => env.name === "client",
    generateBundle() {
      const source = readFileSync(resolve(process.cwd(), "pwa/sw.js"), "utf8").replace(
        /__BUILD_ID__/g,
        buildId,
      );
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}
