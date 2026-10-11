import { describe, expect, it } from "vitest";
import registry from "@/data/registry.json";
import { detectStreamKind, failureFromHttp, failureFromMediaError } from "@/lib/tvStream";
import {
  getCatalogChannels,
  getChannelBySlug,
  getPublicChannels,
  getRadioCounterpart,
  searchChannels,
} from "./channelService";

describe("TV channels", () => {
  it("are built from every registry record that has a tv block, none invented", () => {
    const withTv = (registry as { id: string; tv?: unknown }[])
      .filter((r) => r.tv)
      .map((r) => r.id);
    expect(
      getCatalogChannels()
        .map((c) => c.brandId)
        .sort(),
    ).toEqual(withTv.sort());
  });
  it("have unique stable ids and slugs", () => {
    const slugs = getCatalogChannels().map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(getCatalogChannels().every((c) => c.id.startsWith("tv-"))).toBe(true);
  });
  it("lists only eligible channels publicly, and keeps the excluded record", () => {
    const flash = getChannelBySlug("flash-fm-tv");
    expect(flash).toBeDefined();
    expect(flash?.streamUrl).toBeTruthy();
    expect(flash?.stream.state).toBe("session_bound");
    expect(getPublicChannels().some((c) => c.id === "tv-flash")).toBe(false);
    expect(getPublicChannels().every((c) => c.stream.eligible)).toBe(true);
  });
  it("does not fabricate logos or descriptions", () => {
    for (const c of getCatalogChannels()) {
      expect(c.logo).toBeUndefined();
      expect(c.description).toBeUndefined();
    }
  });
  it("detects HLS from the declared format or the file extension", () => {
    expect(getCatalogChannels().every((c) => c.streamKind === "hls")).toBe(true);
    expect(detectStreamKind("https://x.com/a/index.m3u8", null)).toBe("hls");
    expect(detectStreamKind("https://x.com/a.mp4", undefined)).toBe("mp4");
    expect(detectStreamKind("https://x.com/a", "HLS")).toBe("hls");
    expect(detectStreamKind("https://x.com/a", null)).toBe("unknown");
  });
  it("links to the radio sibling only when it is itself playable", () => {
    expect(getRadioCounterpart(getChannelBySlug("radio10-tv")!)?.id).toBe("radio10");
    expect(getRadioCounterpart(getChannelBySlug("kc2-tv")!)).toBeUndefined(); // KC2 has no radio stream
  });
  it("is searchable and excludes unavailable channels", () => {
    expect(searchChannels("radio10").map((c) => c.id)).toEqual(["tv-radio10"]);
    expect(searchChannels("flash")).toHaveLength(0);
  });
  it("classifies playback failures instead of calling everything 'error'", () => {
    expect(failureFromHttp(0)).toBe("unreachable");
    expect(failureFromHttp(403)).toBe("rejected");
    expect(failureFromHttp(404)).toBe("not_found");
    expect(failureFromHttp(503)).toBe("server");
    expect(failureFromMediaError(2)).toBe("unreachable");
    expect(failureFromMediaError(4)).toBe("unsupported");
  });
});
