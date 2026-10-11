// The only place a service worker is registered (pwa/sw.js, served as /sw.js).
// Never in dev, iframes, or Lovable preview hosts.
import { toast } from "sonner";

const SW_URL = "/sw.js";
const UPDATE_CHECK_MS = 60 * 60 * 1000;

function isRefusedContext() {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  const blocked = ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"];
  if (blocked.some((d) => h === d || h.endsWith(`.${d}`))) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL)))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    unregisterAppWorkers().catch(() => {});
    return;
  }

  let refreshRequested = false;

  const offerUpdate = (worker: ServiceWorker) => {
    toast("A new version of ONEYA is ready", {
      id: "sw-update",
      duration: Infinity,
      description: "Refresh to update. Anything playing will stop.",
      action: {
        label: "Refresh",
        onClick: () => {
          refreshRequested = true;
          worker.postMessage({ type: "SKIP_WAITING" });
        },
      },
    });
  };

  // Hydration usually finishes after the window's "load" event, so a bare load listener would
  // never fire. Register immediately when the page is already loaded.
  const onReady = async () => {
    try {
      const reg = await navigator.serviceWorker.register(SW_URL, {
        scope: "/",
        updateViaCache: "none",
      });

      // A worker may already be waiting from an earlier visit.
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => {
          // "installed" with an existing controller = an update, not the first install.
          if (worker.state === "installed" && navigator.serviceWorker.controller)
            offerUpdate(worker);
        });
      });

      // Reload only when the user asked for the update, never mid-playback on our own.
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshRequested) window.location.reload();
      });

      // Look for a new version when the app comes back to the foreground (at most hourly).
      let lastCheck = Date.now();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && Date.now() - lastCheck > UPDATE_CHECK_MS) {
          lastCheck = Date.now();
          reg.update().catch(() => {});
        }
      });
    } catch (err) {
      console.warn("[oneya:pwa] service worker registration failed", err);
    }
  };
  if (document.readyState === "complete") void onReady();
  else window.addEventListener("load", () => void onReady(), { once: true });
}
