import { describe, expect, it } from "vitest";
import { detectPlatform, getInstallGuide, shouldShowInstallBanner } from "./install";

const DAY = 86_400_000;
const base = {
  now: 100 * DAY,
  state: { dismissCount: 0, installed: false },
  standalone: false,
  installPossible: true,
  engagement: { visits: 1, plays: 1 },
};

describe("install banner policy", () => {
  it("does not interrupt a first-time visitor who has done nothing yet", () => {
    expect(shouldShowInstallBanner({ ...base, engagement: { visits: 1, plays: 0 } })).toBe(false);
  });
  it("appears after a successful play, or after repeat visits", () => {
    expect(shouldShowInstallBanner(base)).toBe(true);
    expect(shouldShowInstallBanner({ ...base, engagement: { visits: 3, plays: 0 } })).toBe(true);
  });
  it("never shows when installed, standalone, or install is impossible", () => {
    expect(shouldShowInstallBanner({ ...base, standalone: true })).toBe(false);
    expect(shouldShowInstallBanner({ ...base, state: { dismissCount: 0, installed: true } })).toBe(
      false,
    );
    expect(shouldShowInstallBanner({ ...base, installPossible: false })).toBe(false);
  });
  it("respects dismissal with growing cooldowns, then stops for good", () => {
    const once = { dismissCount: 1, installed: false, dismissedAt: base.now - 3 * DAY };
    expect(shouldShowInstallBanner({ ...base, state: once })).toBe(false);
    expect(
      shouldShowInstallBanner({ ...base, state: { ...once, dismissedAt: base.now - 8 * DAY } }),
    ).toBe(true);
    const twice = { dismissCount: 2, installed: false, dismissedAt: base.now - 10 * DAY };
    expect(shouldShowInstallBanner({ ...base, state: twice })).toBe(false);
    expect(
      shouldShowInstallBanner({ ...base, state: { ...twice, dismissedAt: base.now - 31 * DAY } }),
    ).toBe(true);
    expect(
      shouldShowInstallBanner({
        ...base,
        state: { dismissCount: 3, installed: false, dismissedAt: 0 },
      }),
    ).toBe(false);
  });
});

describe("platform guidance", () => {
  const ua = {
    iphone:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
    android:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
    chrome:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
    firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
    safariMac:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.4 Safari/605.1.15",
  };
  it("detects platforms", () => {
    expect(detectPlatform(ua.iphone)).toBe("ios");
    expect(detectPlatform(ua.android)).toBe("android");
    expect(detectPlatform(ua.chrome)).toBe("desktop-chromium");
    expect(detectPlatform(ua.firefox)).toBe("firefox-desktop");
    expect(detectPlatform(ua.safariMac)).toBe("safari-mac");
    expect(detectPlatform(ua.safariMac, 5)).toBe("ios"); // iPadOS reports as Mac
  });
  it("tells iOS users to use Add to Home Screen", () => {
    expect(getInstallGuide("ios").steps.join(" ")).toMatch(/Add to Home Screen/);
  });
  it("is honest when a browser cannot install", () => {
    for (const p of ["firefox-desktop", "other"] as const) {
      const g = getInstallGuide(p);
      expect(g.canInstall).toBe(false);
      expect(g.steps).toHaveLength(0);
      expect(g.note).toBeTruthy();
    }
  });
});
