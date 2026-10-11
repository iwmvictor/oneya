/** Production origin. Every canonical URL, sitemap entry and structured-data URL derives from this. */
export const SITE_URL = "https://oneya.vercel.app";
export const SITE_NAME = "ONEYA";
export const SITE_TAGLINE = "Live radio and TV from Rwanda";
export const SITE_DESCRIPTION =
  "ONEYA brings Rwanda's live radio stations and TV channels together in one place. Find something to listen to or watch, play it in your browser, and install ONEYA on your phone or computer.";

export const OG_IMAGE = {
  url: `${SITE_URL}/brand/og-image.png`,
  width: 1200,
  height: 630,
  alt: "ONEYA logo, a microphone and headphone mark, with the tagline Rwanda's radio and TV, live and in one place.",
};

/** Absolute canonical URL for a site path. Always root-relative input, never a trailing slash except "/". */
export function absoluteUrl(path: string) {
  const clean = path === "/" ? "" : path.replace(/\/+$/, "");
  return `${SITE_URL}${clean}`;
}

type Meta = Record<string, string>;
export interface SeoInput {
  /** Page title. `· ONEYA` is appended unless `rawTitle` is set. */
  title: string;
  rawTitle?: boolean;
  description: string;
  /** Canonical path, e.g. "/tv/radio10-tv". Query strings are never part of it. */
  path: string;
  type?: "website" | "article" | "video.other" | "music.radio_station";
  /** Keep the page out of search indexes (utility, personal or placeholder pages). */
  noindex?: boolean;
  jsonLd?: object[];
}

/** JSON-LD must not be able to close its own <script> tag. */
export function serializeJsonLd(data: object) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** Builds a complete TanStack `head()` result for a page. */
export function seo(input: SeoInput) {
  const title = input.rawTitle ? input.title : `${input.title} · ${SITE_NAME}`;
  const url = absoluteUrl(input.path);
  const meta: Meta[] = [
    { title },
    { name: "description", content: input.description },
    {
      name: "robots",
      content: input.noindex ? "noindex, follow" : "index, follow, max-image-preview:large",
    },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en" },
    { property: "og:type", content: input.type ?? "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: input.description },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE.url },
    { property: "og:image:width", content: String(OG_IMAGE.width) },
    { property: "og:image:height", content: String(OG_IMAGE.height) },
    { property: "og:image:alt", content: OG_IMAGE.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: input.description },
    { name: "twitter:image", content: OG_IMAGE.url },
    { name: "twitter:image:alt", content: OG_IMAGE.alt },
  ];
  return {
    meta,
    links: [{ rel: "canonical", href: url }],
    scripts: (input.jsonLd ?? []).map((d) => ({
      type: "application/ld+json",
      children: serializeJsonLd(d),
    })),
  };
}

/* ---------- Structured data builders (only used where the visible page matches) ---------- */

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.png`,
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: absoluteUrl(it.path),
  })),
});

export const itemListLd = (
  name: string,
  path: string,
  items: { name: string; path: string }[],
) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  url: absoluteUrl(path),
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: absoluteUrl(it.path),
    })),
  },
});

export const broadcastServiceLd = (o: {
  name: string;
  path: string;
  /** e.g. "100.7 FM". Only for radio stations that have a real frequency. */
  frequency?: string | undefined;
  languages?: string[] | undefined;
}) => {
  const fm = o.frequency?.match(/^(\d{2,3}(?:\.\d)?)\s*FM$/i);
  return {
    "@context": "https://schema.org",
    "@type": "BroadcastService",
    name: o.name,
    broadcastDisplayName: o.name,
    url: absoluteUrl(o.path),
    ...(fm
      ? {
          broadcastFrequency: {
            "@type": "BroadcastFrequencySpecification",
            broadcastFrequencyValue: fm[1],
            broadcastSignalModulation: "FM",
          },
        }
      : {}),
    ...(o.languages?.length ? { inLanguage: o.languages } : {}),
  };
};

export const faqLd = (qas: { q: string; a: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: qas.map((x) => ({
    "@type": "Question",
    name: x.q,
    acceptedAnswer: { "@type": "Answer", text: x.a },
  })),
});

/** Google Search Console ownership token. Emitted on the home page only, as Google's docs advise (top-level page). */
export const GOOGLE_SITE_VERIFICATION = "qMgTE7D5CftPGK4IqIbLrtoj-v1p2nBx0rv2vJnV348";
