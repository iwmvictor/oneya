import { describe, expect, it } from "vitest";
import { assessStream } from "./streamEligibility";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const jwt = (claims: object) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;

describe("assessStream", () => {
  it("accepts a plain https stream", () => {
    const a = assessStream({ url: "https://example.com/live.mp3", declaredStatus: "active" }, NOW);
    expect(a).toMatchObject({ state: "available", eligible: true });
  });
  it("accepts a stream with no declared status", () => {
    expect(assessStream({ url: "https://example.com/live" }, NOW).eligible).toBe(true);
  });
  it("distinguishes a missing URL", () => {
    for (const url of [undefined, null, "", "   "])
      expect(assessStream({ url }, NOW)).toMatchObject({ state: "missing", eligible: false });
  });
  it("distinguishes an invalid URL", () => {
    expect(assessStream({ url: "not a url" }, NOW).state).toBe("invalid");
    expect(assessStream({ url: "rtmp://example.com/live" }, NOW).state).toBe("invalid");
  });
  it("distinguishes a disabled/catalog-only record from a missing one, keeping the reason", () => {
    const a = assessStream({ url: "https://example.com/x", declaredStatus: "catalog_only" }, NOW);
    expect(a).toMatchObject({ state: "not_enabled", eligible: false });
    expect(a.reason).toMatch(/catalog_only/);
  });
  it("rejects http streams that browsers block on an https page", () => {
    expect(assessStream({ url: "http://example.com/live" }, NOW).state).toBe("insecure");
  });
  it("flags an expired tokenised URL", () => {
    const url = `https://e.com/s?zt=${jwt({ iat: NOW / 1000 - 7200, exp: NOW / 1000 - 3600 })}`;
    expect(assessStream({ url }, NOW).state).toBe("expired");
  });
  it("flags a short-lived token as session-bound, not durable", () => {
    const url = `https://e.com/s?zt=${jwt({ iat: NOW / 1000, exp: NOW / 1000 + 60 })}`;
    expect(assessStream({ url }, NOW).state).toBe("session_bound");
  });
  it("accepts a long-lived token", () => {
    const url = `https://e.com/s?zt=${jwt({ iat: NOW / 1000, exp: NOW / 1000 + 90 * 86400 })}`;
    expect(assessStream({ url }, NOW).eligible).toBe(true);
  });
  it("flags a URL bound to one client IP", () => {
    expect(assessStream({ url: "https://e.com/hls/a.m3u8?ip=197.157.155.20" }, NOW).state).toBe(
      "session_bound",
    );
  });
  it("never treats a temporary runtime failure as data: eligibility depends only on the record", () => {
    // Same input, same answer: there is no mutable 'failed' flag to poison the record.
    const input = { url: "https://example.com/live", declaredStatus: "active" };
    expect(assessStream(input, NOW)).toEqual(assessStream(input, NOW + 86_400_000));
  });
});
