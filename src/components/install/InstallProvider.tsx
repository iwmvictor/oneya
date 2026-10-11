import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { recordVisit, useEngagement } from "@/lib/engagement";
import {
  detectPlatform,
  getInstallGuide,
  shouldShowInstallBanner,
  type InstallGuide,
  type InstallPlatform,
  type InstallState,
} from "@/lib/install";
import { createLocalStore } from "@/lib/storage";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const stateStore = createLocalStore<InstallState>("oneya:install", {
  dismissCount: 0,
  installed: false,
});

interface InstallApi {
  platform: InstallPlatform;
  guide: InstallGuide;
  /** Running as an installed app (standalone window). */
  standalone: boolean;
  /** Installed earlier on this device (we saw the install event). */
  installed: boolean;
  /** The browser handed us a one-tap install prompt. */
  hasNativePrompt: boolean;
  /** Show an "Install ONEYA" entry point: installable here and not already installed. */
  canOfferInstall: boolean;
  /** Show the dismissible banner (policy-driven). */
  bannerVisible: boolean;
  dialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
  /** One-tap install if the browser allows it, otherwise opens the guidance dialog. */
  install: () => Promise<void>;
  dismissBanner: () => void;
}

const InstallContext = createContext<InstallApi | null>(null);

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [standalone, setStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const state = stateStore.useValue();
  const engagement = useEngagement();

  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent, navigator.maxTouchPoints));
    setStandalone(isStandalone());
    setMounted(true);
    recordVisit();

    const onPrompt = (e: Event) => {
      e.preventDefault(); // we decide when to show it
      deferred.current = e as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
    };
    const onInstalled = () => {
      deferred.current = null;
      setHasNativePrompt(false);
      setStandalone(isStandalone());
      setDialogOpen(false);
      stateStore.set((s) => ({ ...s, installed: true }));
    };
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMode = () => setStandalone(isStandalone());
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    mq.addEventListener("change", onMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMode);
    };
  }, []);

  const guide = useMemo(() => getInstallGuide(platform), [platform]);
  const installPossible = hasNativePrompt || guide.canInstall;
  const canOfferInstall = mounted && !standalone && !state.installed && installPossible;

  const bannerVisible =
    mounted &&
    shouldShowInstallBanner({
      now: Date.now(),
      state,
      standalone,
      installPossible,
      engagement,
    });

  const recordDismissal = useCallback(() => {
    stateStore.set((s) => ({ ...s, dismissedAt: Date.now(), dismissCount: s.dismissCount + 1 }));
  }, []);

  const install = useCallback(async () => {
    const e = deferred.current;
    if (!e) {
      setDialogOpen(true);
      return;
    }
    deferred.current = null; // a prompt event can only be used once
    setHasNativePrompt(false);
    try {
      await e.prompt();
      const { outcome } = await e.userChoice;
      if (outcome === "dismissed") recordDismissal();
    } catch {
      setDialogOpen(true);
    }
  }, [recordDismissal]);

  const value = useMemo<InstallApi>(
    () => ({
      platform,
      guide,
      standalone,
      installed: state.installed,
      hasNativePrompt,
      canOfferInstall,
      bannerVisible,
      dialogOpen,
      openDialog: () => setDialogOpen(true),
      closeDialog: () => setDialogOpen(false),
      install,
      dismissBanner: recordDismissal,
    }),
    [
      platform,
      guide,
      standalone,
      state.installed,
      hasNativePrompt,
      canOfferInstall,
      bannerVisible,
      dialogOpen,
      install,
      recordDismissal,
    ],
  );

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}

export function useInstall() {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("useInstall must be used inside InstallProvider");
  return ctx;
}
