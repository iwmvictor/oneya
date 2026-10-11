import { describe, expect, it } from "vitest";
import { getAllStations, getStationById, isPlayable, searchStations } from "./stationService";

describe("supplied station catalog", () => {
  it("contains exactly all 38 supplied unique station identifiers", () => {
    const expected = [
      "radio10",
      "flash",
      "city",
      "radiorwanda",
      "isango",
      "kfms",
      "huguka",
      "radioone",
      "royalfm",
      "kissfm",
      "authentic",
      "voiceafrica",
      "voicehope",
      "umucyo",
      "voa",
      "rfi",
      "finefm",
      "adepr",
      "sana",
      "energy",
      "powerfm",
      "salus",
      "bbkigali",
      "radioo",
      "inkoramutima",
      "isangano",
      "ishingiro",
      "radioizuba",
      "isibofm",
      "magicfm",
      "radiohuye",
      "radiointeko",
      "thechoicelive",
      "ktradio",
      "capitalfm",
      "ikosora",
      "biryogo",
      "radionmaria",
    ];
    expect(
      getAllStations()
        .map((s) => s.id)
        .sort(),
    ).toEqual(expected.sort());
  });
  it("makes supplied HTTP streams active and playable, including the new Zeno stations", () => {
    expect(getStationById("thechoicelive")?.streamUrl).toBe("https://stream.zeno.fm/37uyt4kd468uv");
    expect(getStationById("ktradio")?.streamUrl).toBe("https://stream.zeno.fm/qxgrn2xdf18uv");
    expect(getStationById("isibofm")?.streamUrl).toBe("https://stream.zeno.fm/dsewultj9f1vv");
    expect(getAllStations().filter(isPlayable)).toHaveLength(18);
    for (const station of getAllStations().filter((s) => s.streamUrl)) {
      expect(station.status).toBe("online");
      expect(isPlayable(station)).toBe(true);
    }
  });
  it("keeps stations without streams coming soon and unplayable", () => {
    const flash = getStationById("flash");
    expect(flash?.status).toBe("coming_soon");
    expect(flash?.streamUrl).toBeUndefined();
    if (!flash) throw new Error("Missing supplied Flash FM");
    expect(isPlayable(flash)).toBe(false);
    expect(
      getAllStations()
        .filter((s) => !s.streamUrl)
        .every((s) => s.status === "coming_soon"),
    ).toBe(true);
  });
  it("preserves KISS FM as the only manually verified stream", () => {
    expect(
      getAllStations()
        .filter((s) => s.isVerified)
        .map((s) => s.id),
    ).toEqual(["kissfm"]);
    expect(getStationById("kissfm")?.streamUrl).toBe(
      "https://kissfm-atunwadigital.streamguys1.com/kissfm",
    );
  });
  it("finds KISS FM by the supplied name and frequency", () => {
    expect(searchStations("KISS").map((s) => s.id)).toEqual(["kissfm"]);
    expect(searchStations("102.3").map((s) => s.id)).toEqual(["kissfm"]);
  });
});

describe("search resilience", () => {
  it("tolerates spacing and one typo", async () => {
    const { searchStations } = await import("./stationService");
    expect(searchStations("kissfm").some((s) => s.id === "kissfm")).toBe(true);
    expect(searchStations("kisss").some((s) => s.id === "kissfm")).toBe(true);
    expect(searchStations("zzzzqq")).toHaveLength(0);
  });
});
