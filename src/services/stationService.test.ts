import { describe, expect, it } from "vitest";
import registry from "@/data/registry.json";
import {
  getCatalogStations,
  getPublicStations,
  getStationById,
  getStationBySlug,
  isPlayable,
  searchStations,
} from "./stationService";

describe("station catalog is preserved", () => {
  it("keeps every registry record, whether or not it has a stream", () => {
    const catalogIds = getCatalogStations()
      .map((s) => s.id)
      .sort();
    const registryIds = (registry as { id: string }[]).map((r) => r.id).sort();
    expect(catalogIds).toEqual(registryIds);
  });
  it("keeps ids and slugs unique and stable", () => {
    const ids = getCatalogStations().map((s) => s.id);
    const slugs = getCatalogStations().map((s) => s.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(getStationBySlug("kiss-fm")?.id).toBe("kissfm");
  });
});

describe("only stations with an eligible stream are public", () => {
  it("excludes stations with no stream from every public list but keeps the record", () => {
    const authentic = getStationById("authentic");
    expect(authentic).toBeDefined(); // record kept
    expect(authentic?.stream.state).toBe("missing");
    expect(isPlayable(authentic!)).toBe(false);
    expect(getPublicStations().some((s) => s.id === "authentic")).toBe(false);
    expect(searchStations("authentic").some((s) => s.id === "authentic")).toBe(false);
  });
  it("honours records the owner marked catalog_only even when a URL is stored", () => {
    const flash = getStationById("flash");
    expect(flash?.streamUrl).toBeDefined(); // URL preserved
    expect(flash?.stream.state).toBe("not_enabled");
    expect(isPlayable(flash!)).toBe(false);
    expect(getPublicStations().some((s) => s.id === "flash")).toBe(false);
  });
  it("every public station is eligible and has a URL; nothing ineligible leaks in", () => {
    for (const s of getPublicStations()) {
      expect(s.stream.eligible).toBe(true);
      expect(s.streamUrl).toBeTruthy();
      expect(s.status).toBe("online");
    }
    expect(getPublicStations().length).toBeLessThan(getCatalogStations().length);
  });
  it("search only returns public stations", () => {
    const all = searchStations("");
    expect(all.every(isPlayable)).toBe(true);
    expect(all).toHaveLength(getPublicStations().length);
  });
});

describe("known stations", () => {
  it("KISS FM is public, found by name and frequency, and the only manually verified stream", () => {
    expect(searchStations("KISS").map((s) => s.id)).toEqual(["kissfm"]);
    expect(searchStations("102.3").map((s) => s.id)).toEqual(["kissfm"]);
    expect(
      getCatalogStations()
        .filter((s) => s.isVerified)
        .map((s) => s.id),
    ).toEqual(["kissfm"]);
  });
  it("tolerates spacing and one typo", () => {
    expect(searchStations("kissfm").some((s) => s.id === "kissfm")).toBe(true);
    expect(searchStations("kisss").some((s) => s.id === "kissfm")).toBe(true);
    expect(searchStations("zzzzqq")).toHaveLength(0);
  });
});
