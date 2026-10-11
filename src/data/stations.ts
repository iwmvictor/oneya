/**
 * Local station catalog. Source of truth today is ./registry.json (supplied station registry).
 * This module is the only place that knows about that file — UI reads stations via
 * src/services/stationService.ts so this can later be swapped for an API/admin backend.
 */
import { registry } from "./registry";
import { assessStream, isHttpUrl } from "@/lib/streamEligibility";
import authenticLogo from "@/assets/stations/authentic.asset.json";
import bbkigaliLogo from "@/assets/stations/bbkigali.asset.json";
import biryogoLogo from "@/assets/stations/biryogo.asset.json";
import capitalfmLogo from "@/assets/stations/capitalfm.asset.json";
import cityLogo from "@/assets/stations/city.asset.json";
import energyLogo from "@/assets/stations/energy.asset.json";
import flashLogo from "@/assets/stations/flash.asset.json";
import hugukaLogo from "@/assets/stations/huguka.asset.json";
import ikosoraLogo from "@/assets/stations/ikosora.asset.json";
import isanganoLogo from "@/assets/stations/isangano.asset.json";
import isangoLogo from "@/assets/stations/isango.asset.json";
import ishingiroLogo from "@/assets/stations/ishingiro.asset.json";
import isibofmLogo from "@/assets/stations/isibofm.asset.json";
import kfmsLogo from "@/assets/stations/kfms.asset.json";
import kissfmLogo from "@/assets/stations/kissfm.asset.json";
import ktradioLogo from "@/assets/stations/ktradio.asset.json";
import magicfmLogo from "@/assets/stations/magicfm.asset.json";
import powerfmLogo from "@/assets/stations/powerfm.asset.json";
import radio10Logo from "@/assets/stations/radio10.asset.json";
import radioizubaLogo from "@/assets/stations/radioizuba.asset.json";
import radionmariaLogo from "@/assets/stations/radionmaria.asset.json";
import radiooneLogo from "@/assets/stations/radioone.asset.json";
import radiorwandaLogo from "@/assets/stations/radiorwanda.asset.json";
import royalfmLogo from "@/assets/stations/royalfm.asset.json";
import salusLogo from "@/assets/stations/salus.asset.json";
import thechoiceliveLogo from "@/assets/stations/thechoicelive.asset.json";
import umucyoLogo from "@/assets/stations/umucyo.asset.json";
import voiceafricaLogo from "@/assets/stations/voiceafrica.asset.json";
import voicehopeLogo from "@/assets/stations/voicehope.asset.json";
import type { RadioStation, StationCategory, StationStatus } from "@/types/station";

/** Curated featured stations (by registry id), in display order. */
const FEATURED = ["kissfm", "radio10", "radiorwanda", "voicehope", "powerfm"];

/** Streams confirmed by a person to play in the browser. */
const VERIFIED = ["kissfm"];

/**
 * Logo sources, in order of preference:
 *  1. A real file in /public/stations/<id>.(webp|png|jpg|svg). Works on any host, including Vercel.
 *  2. The Lovable asset-store pointer in src/assets/stations/<id>.asset.json. Those URLs
 *     (/__l5e/assets-v1/…) only resolve on Lovable hosting, so they are used in development
 *     or when VITE_USE_LOVABLE_ASSETS=1. Elsewhere they would 404 on every list.
 * With neither, the UI shows the station's monogram tile (never a fabricated logo).
 */
const PUBLIC_LOGO_FILES = Object.keys(
  import.meta.glob("/public/stations/*.{webp,png,jpg,jpeg,svg}"),
);
const USE_LOVABLE_ASSETS =
  import.meta.env.DEV || import.meta.env["VITE_USE_LOVABLE_ASSETS"] === "1";

function publicLogoFor(id: string) {
  const hit = PUBLIC_LOGO_FILES.find(
    (f) => /\/public\/stations\/([^/]+)\.[a-z]+$/.exec(f)?.[1] === id,
  );
  return hit?.replace("/public", "");
}

const LOVABLE_LOGOS: Record<string, string> = {
  authentic: authenticLogo.url,
  bbkigali: bbkigaliLogo.url,
  biryogo: biryogoLogo.url,
  capitalfm: capitalfmLogo.url,
  city: cityLogo.url,
  energy: energyLogo.url,
  flash: flashLogo.url,
  huguka: hugukaLogo.url,
  ikosora: ikosoraLogo.url,
  isangano: isanganoLogo.url,
  isango: isangoLogo.url,
  ishingiro: ishingiroLogo.url,
  isibofm: isibofmLogo.url,
  kfms: kfmsLogo.url,
  kissfm: kissfmLogo.url,
  ktradio: ktradioLogo.url,
  magicfm: magicfmLogo.url,
  powerfm: powerfmLogo.url,
  radio10: radio10Logo.url,
  radioizuba: radioizubaLogo.url,
  radionmaria: radionmariaLogo.url,
  radioone: radiooneLogo.url,
  radiorwanda: radiorwandaLogo.url,
  royalfm: royalfmLogo.url,
  salus: salusLogo.url,
  thechoicelive: thechoiceliveLogo.url,
  umucyo: umucyoLogo.url,
  voiceafrica: voiceafricaLogo.url,
  voicehope: voicehopeLogo.url,
};

/** Verified descriptions only. Never invent copy here. */
const DESCRIPTIONS: Record<string, string> = {};

const CATEGORIES: StationCategory[] = ["music", "news", "talk", "sports", "religious", "community"];

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const stations: RadioStation[] = registry.map((r, i) => {
  const stream = assessStream({ url: r.stream.url, declaredStatus: r.stream.status });
  const streamUrl = isHttpUrl(r.stream.url ?? undefined) ? (r.stream.url ?? undefined) : undefined;
  // Presentation status is derived from the assessment, never from "a URL exists".
  const status: StationStatus = stream.eligible
    ? "online"
    : stream.state === "missing" || stream.state === "not_enabled"
      ? "coming_soon"
      : "unavailable";
  const freq = r.dial.display && r.dial.display !== "Online" ? r.dial.display : undefined;
  return {
    id: r.id,
    slug: slugify(r.name),
    name: r.name,
    frequency: freq,
    location: r.coverage.location || undefined,
    province: r.coverage.region || undefined,
    reach: r.coverage.reach || undefined,
    categories: r.categories.filter((c): c is StationCategory =>
      CATEGORIES.includes(c as StationCategory),
    ),
    languages: r.languages ?? [],
    logo: publicLogoFor(r.id) ?? (USE_LOVABLE_ASSETS ? LOVABLE_LOGOS[r.id] : undefined),
    badge: {
      monogram: r.badge.monogram,
      background: r.badge.background,
      textColor: r.badge.textColor,
    },
    description: DESCRIPTIONS[r.id],
    streamUrl,
    streamFormat: r.stream.format ?? undefined,
    stream,
    website: r.links.website || undefined,
    isFeatured: FEATURED.includes(r.id),
    isVerified: VERIFIED.includes(r.id),
    status,
    order: FEATURED.includes(r.id) ? FEATURED.indexOf(r.id) : 100 + i,
  };
});
