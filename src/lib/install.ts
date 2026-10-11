/**
 * Install-prompt policy and platform guidance. Pure functions so the rules are testable
 * and the UI stays dumb. Principles: no prompt on a first visit, only after real use,
 * respect dismissal with growing cooldowns, never when already installed, and never
 * claim a browser can install ONEYA when it can't.
 */

export type InstallPlatform =
  | "ios" // Safari, Chrome, Edge, Firefox on iPhone/iPad: all use Share → Add to Home Screen
  | "android" // Chromium-family browsers on Android
  | "desktop-chromium" // Chrome, Edge, Brave, Opera on desktop
  | "safari-mac" // Safari 17+ on macOS: File → Add to Dock
  | "firefox-desktop" // no PWA install on desktop
  | "other";

export function detectPlatform(ua: string, maxTouchPoints = 0): InstallPlatform {
  const iPadOs = /Macintosh/.test(ua) && maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOs) return "ios";
  if (/Android/.test(ua)) return /Firefox\//.test(ua) ? "other" : "android";
  if (/Firefox\//.test(ua)) return "firefox-desktop";
  if (/Edg\/|Chrome\/|CriOS|OPR\//.test(ua)) return "desktop-chromium";
  if (/Safari\//.test(ua) && /Macintosh/.test(ua)) return "safari-mac";
  return "other";
}

export interface InstallGuide {
  /** Whether this browser can install ONEYA at all. */
  canInstall: boolean;
  steps: string[];
  note?: string;
}

export function getInstallGuide(platform: InstallPlatform): InstallGuide {
  switch (platform) {
    case "ios":
      return {
        canInstall: true,
        steps: [
          "Tap the Share button in your browser's toolbar.",
          "Scroll down and tap “Add to Home Screen”.",
          "Tap “Add”. ONEYA now opens from your home screen.",
        ],
        note: "If you don't see “Add to Home Screen”, open this page in Safari and try again.",
      };
    case "android":
      return {
        canInstall: true,
        steps: [
          "Open your browser's menu (⋮).",
          "Tap “Install app” or “Add to Home screen”.",
          "Confirm. ONEYA appears with your other apps.",
        ],
      };
    case "desktop-chromium":
      return {
        canInstall: true,
        steps: [
          "Look for the install icon at the right end of the address bar, or open the browser menu.",
          "Choose “Install ONEYA”.",
          "Confirm. ONEYA opens in its own window.",
        ],
      };
    case "safari-mac":
      return {
        canInstall: true,
        steps: [
          "In Safari's menu bar choose File → Add to Dock.",
          "Confirm. ONEYA appears in your Dock.",
        ],
        note: "Requires Safari 17 or later.",
      };
    case "firefox-desktop":
      return {
        canInstall: false,
        steps: [],
        note: "Firefox on desktop can't install web apps. Open ONEYA in Chrome, Edge or Safari to install it, or keep using it here.",
      };
    default:
      return {
        canInstall: false,
        steps: [],
        note: "This browser doesn't offer a way to install web apps. Try Chrome, Edge or Safari to install ONEYA.",
      };
  }
}

export interface InstallState {
  dismissedAt?: number | undefined;
  dismissCount: number;
  installed: boolean;
}

/** Wait after the 1st dismissal, then after the 2nd. After the 3rd the banner never returns on its own. */
export const COOLDOWN_DAYS = [7, 30] as const;
export const MAX_AUTO_DISMISSALS = 3;
const DAY = 86_400_000;

export function shouldShowInstallBanner(a: {
  now: number;
  state: InstallState;
  standalone: boolean;
  /** A native prompt is ready, or this platform has manual steps. */
  installPossible: boolean;
  engagement: { visits: number; plays: number };
}): boolean {
  if (a.standalone || a.state.installed || !a.installPossible) return false;
  if (a.state.dismissCount >= MAX_AUTO_DISMISSALS) return false;
  // A meaningful milestone: they actually played something, or they keep coming back.
  const engaged = a.engagement.plays >= 1 || a.engagement.visits >= 3;
  if (!engaged) return false;
  if (a.state.dismissedAt !== undefined) {
    const wait = COOLDOWN_DAYS[Math.min(a.state.dismissCount, COOLDOWN_DAYS.length) - 1] ?? 30;
    if (a.now - a.state.dismissedAt < wait * DAY) return false;
  }
  return true;
}
