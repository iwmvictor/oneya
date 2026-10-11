import { describe, expect, it } from "vitest";
import { hasAccess, startCheckout } from "./entitlementService";
import { formatTimestamp, getTranscript } from "./transcriptService";
import { buildMediaMetadata } from "@/lib/mediaSession";
import { getNowPlaying } from "./scheduleService";
import type { RadioStation } from "@/types/station";

describe("entitlements", () => {
  it("live listening is free without any purchase", () => {
    expect(hasAccess("live_listening", [])).toBe(true);
    expect(hasAccess("discovery", [])).toBe(true);
  });
  it("transcripts require an entitlement", () => {
    expect(hasAccess("transcripts", [])).toBe(false);
    expect(hasAccess("transcripts", [{ feature: "transcripts", source: "purchase" }])).toBe(true);
    expect(
      hasAccess("transcripts", [
        { feature: "transcripts", source: "subscription", expiresAt: "2000-01-01" },
      ]),
    ).toBe(false);
  });
  it("checkout is not configured by default", async () => {
    expect(await startCheckout("x")).toEqual({ kind: "not_configured" });
  });
});

describe("transcripts", () => {
  it("default provider reports unavailable with no fabricated segments", async () => {
    expect(await getTranscript("a1")).toEqual({
      audioItemId: "a1",
      status: "unavailable",
      segments: [],
    });
  });
  it("formats timestamps", () => {
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(3725)).toBe("1:02:05");
  });
});

describe("media session metadata", () => {
  const s = { name: "KISS FM", frequency: "102.3 FM", logo: undefined } as RadioStation;
  it("uses station name and frequency without inventing a program", () => {
    const m = buildMediaMetadata(s, null);
    expect(m.title).toBe("KISS FM");
    expect(m.artist).toBe("102.3 FM");
  });
  it("shows program and presenter when provided", () => {
    const m = buildMediaMetadata(s, { program: "Morning", presenter: "Host" });
    expect(m.title).toBe("Morning");
    expect(m.artist).toBe("Host");
  });
});

describe("schedule service", () => {
  const withSchedule = {
    name: "Test FM",
    schedule: [
      { start: 360, end: 600, program: "Morning Show", presenter: "Host A" },
      { start: 1320, end: 120, program: "Late Night" }, // crosses midnight
    ],
  } as RadioStation;
  // Kigali wall-clock time (UTC+2), independent of the test machine's timezone.
  const at = (h: number, m: number) => new Date(Date.UTC(2026, 0, 1, h - 2, m));

  it("returns null when a station has no schedule data", () => {
    expect(getNowPlaying({ name: "KISS FM" } as RadioStation, at(9, 0))).toBeNull();
  });
  it("finds the program on air at the given time", () => {
    expect(getNowPlaying(withSchedule, at(8, 30))).toEqual({
      program: "Morning Show",
      presenter: "Host A",
    });
  });
  it("handles slots that cross midnight", () => {
    expect(getNowPlaying(withSchedule, at(23, 30))?.program).toBe("Late Night");
    expect(getNowPlaying(withSchedule, at(1, 0))?.program).toBe("Late Night");
  });
  it("returns null outside any scheduled slot", () => {
    expect(getNowPlaying(withSchedule, at(12, 0))).toBeNull();
  });
  it("refuses to guess when entries overlap with different programs", () => {
    const s = {
      name: "X",
      schedule: [
        { start: 360, end: 600, program: "A" },
        { start: 480, end: 720, program: "B" },
      ],
    } as RadioStation;
    expect(getNowPlaying(s, at(9, 0))).toBeNull();
    expect(getNowPlaying(s, at(7, 0))?.program).toBe("A");
  });
  it("tolerates exact duplicate entries", () => {
    const slot = { start: 360, end: 600, program: "A" };
    expect(
      getNowPlaying({ name: "X", schedule: [slot, slot] } as RadioStation, at(7, 0))?.program,
    ).toBe("A");
  });
  it("ignores malformed slots", () => {
    const s = {
      name: "X",
      schedule: [
        { start: -5, end: 9999, program: "Bad" },
        { start: 360, end: 360, program: "Zero" },
        { start: 360, end: 600, program: "  " },
      ],
    } as RadioStation;
    expect(getNowPlaying(s, at(7, 0))).toBeNull();
  });
  it("hides stale schedules", () => {
    const s = { ...withSchedule, scheduleUpdatedAt: "2025-01-01" } as RadioStation;
    expect(getNowPlaying(s, at(8, 30))).toBeNull();
    const fresh = { ...withSchedule, scheduleUpdatedAt: "2025-12-15" } as RadioStation;
    expect(getNowPlaying(fresh, at(8, 30))?.program).toBe("Morning Show");
  });
  it("uses Kigali time regardless of device timezone", () => {
    // 06:30 UTC = 08:30 in Kigali
    expect(getNowPlaying(withSchedule, new Date(Date.UTC(2026, 0, 1, 6, 30)))?.program).toBe(
      "Morning Show",
    );
  });
  it("blank presenter is omitted, not shown", () => {
    const s = {
      name: "X",
      schedule: [{ start: 0, end: 1440, program: "All day", presenter: " " }],
    } as RadioStation;
    expect(getNowPlaying(s, at(12, 0))).toEqual({ program: "All day", presenter: undefined });
  });
});

describe("reconnect backoff", () => {
  it("grows exponentially and stays bounded", async () => {
    const { reconnectDelay } = await import("@/context/RadioPlayerContext");
    const mid = () => 0.5;
    expect(reconnectDelay(1, mid)).toBe(3000);
    expect(reconnectDelay(2, mid)).toBe(6000);
    expect(reconnectDelay(4, mid)).toBe(24000);
  });
});
