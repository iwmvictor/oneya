/**
 * Local station catalog. Source of truth today is ./registry.json (supplied station registry).
 * This module is the only place that knows about that file — UI reads stations via
 * src/services/stationService.ts so this can later be swapped for an API/admin backend.
 */
import registry from "./registry.json";
import { isValidStreamUrl } from "@/lib/audio";
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

interface RegistryEntry {
  id: string;
  name: string;
  dial: { display: string };
  badge: { monogram: string; background: string; textColor: string };
  coverage: { location: string; region: string; reach: string };
  categories: string[];
  languages: string[];
  stream: { status: string; url: string | null; format: string | null };
  links: { website?: string };
}

/** Curated featured stations (by registry id), in display order. */
const FEATURED = ["kissfm", "radio10", "radiorwanda", "voicehope", "powerfm"];

/** Streams confirmed by a person to play in the browser. */
const VERIFIED = ["kissfm"];

/** Supplied real logos imported through the asset pipeline. */
const LOGOS: Record<string, string> = {
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

export const stations: RadioStation[] = (registry as RegistryEntry[]).map((r, i) => {
  const streamUrl = isValidStreamUrl(r.stream.url ?? undefined)
    ? (r.stream.url ?? undefined)
    : undefined;
  const status: StationStatus = streamUrl ? "online" : "coming_soon";
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
    logo: LOGOS[r.id],
    badge: {
      monogram: r.badge.monogram,
      background: r.badge.background,
      textColor: r.badge.textColor,
    },
    description: DESCRIPTIONS[r.id],
    streamUrl,
    streamFormat: r.stream.format ?? undefined,
    website: r.links.website || undefined,
    isFeatured: FEATURED.includes(r.id),
    isVerified: VERIFIED.includes(r.id),
    status,
    order: FEATURED.includes(r.id) ? FEATURED.indexOf(r.id) : 100 + i,
  };
});
