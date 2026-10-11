import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { useInstall } from "@/components/install/InstallProvider";
import { breadcrumbLd, faqLd, organizationLd, seo, websiteLd } from "@/lib/site";
import { getPublicChannels } from "@/services/channelService";
import { getPublicStations } from "@/services/stationService";

const faqs = () => [
  {
    q: "What is ONEYA?",
    a: "ONEYA is a free web app that brings live radio stations and live TV channels from Rwanda together in one place. You find a station or channel, press play in your browser, and can install ONEYA on your phone or computer.",
  },
  {
    q: "Which stations and channels are on ONEYA?",
    a: `ONEYA currently lists ${getPublicStations().length} radio stations and ${getPublicChannels().length} TV channels that have a stream address available. The Radio and TV pages always show the current list.`,
  },
  {
    q: "Why can't I find a station I know?",
    a: "Some stations are in ONEYA's catalog but don't have a working public stream yet. They stay out of the playable lists until a stream is available, so you never see a play button that does nothing.",
  },
  {
    q: "Do I need an account or to pay?",
    a: "No. Listening and watching on ONEYA don't require an account or a payment.",
  },
  {
    q: "Why does a stream sometimes not play?",
    a: "Every station and channel plays straight from its broadcaster's own server. If that server is offline, has changed its stream address, or doesn't allow other websites to play it, the stream can't start. ONEYA shows what went wrong and lets you try again.",
  },
  {
    q: "How do I install ONEYA?",
    a: "In Chrome, Edge or Safari, use the Install ONEYA button if your browser offers it. On iPhone and iPad, tap Share and then Add to Home Screen. Firefox on desktop can't install web apps.",
  },
  {
    q: "Does ONEYA work offline?",
    a: "Pages you've already opened can load without a connection, but live radio and TV always need the internet.",
  },
  {
    q: "Is ONEYA affiliated with the stations and channels?",
    a: "No. ONEYA is independent. Streams belong to their broadcasters and are played directly from the broadcasters' servers. ONEYA does not host, record or re-broadcast them.",
  },
];

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "About ONEYA",
      description:
        "ONEYA is a free web app for live radio and TV from Rwanda. Learn what it offers, where streams come from, and how to install it on your phone or computer.",
      path: "/about",
      jsonLd: [
        organizationLd(),
        websiteLd(),
        faqLd(faqs()),
        breadcrumbLd([
          { name: "ONEYA", path: "/" },
          { name: "About", path: "/about" },
        ]),
      ],
    }),
  component: About,
});

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 text-lg font-semibold">{children}</h2>;
}

function About() {
  const { canOfferInstall, install, standalone, installed } = useInstall();
  const items = faqs();
  return (
    <>
      <PageHeader title="About ONEYA" />
      <PageBody>
        <div className="max-w-2xl px-4 text-sm leading-relaxed sm:px-0">
          <p className="text-base">
            ONEYA is a free web app that brings live radio stations and live TV channels from Rwanda
            together in one place. Find a station or channel, press play in your browser, and
            install ONEYA on your phone or computer for one-tap access.
          </p>

          <H2>What you can do</H2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <Link
                to="/stations"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Listen to live radio
              </Link>{" "}
              from {getPublicStations().length} stations.
            </li>
            <li>
              <Link
                to="/tv"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Watch live TV
              </Link>{" "}
              on {getPublicChannels().length} channels.
            </li>
            <li>
              <Link
                to="/search"
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Search
              </Link>{" "}
              by name, frequency or city.
            </li>
            <li>Save favorites and pick up where you left off, stored on your device.</li>
          </ul>

          <H2>Where the streams come from</H2>
          <p className="mt-2">
            Each station and channel plays directly from its broadcaster's own server. ONEYA doesn't
            host, record or re-broadcast anything, and it isn't affiliated with any broadcaster. A
            station or channel appears as playable only when a stream address is available for it;
            availability still depends on the broadcaster, so a stream can occasionally be offline.
          </p>

          {canOfferInstall && (
            <div className="mt-8 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <p className="flex-1">
                Add ONEYA to your device for faster access to live radio and TV.
              </p>
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="size-4" aria-hidden /> Install ONEYA
              </button>
            </div>
          )}
          {(standalone || installed) && (
            <p className="mt-8 rounded-lg border border-border bg-card p-4">
              ONEYA is installed on this device.
            </p>
          )}

          <H2>Common questions</H2>
          <dl className="mt-2 divide-y divide-border">
            {items.map((f) => (
              <div key={f.q} className="py-3">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-1 text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-muted-foreground">
            Read how ONEYA handles your data in the{" "}
            <Link
              to="/privacy"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              privacy notice
            </Link>
            .
          </p>
        </div>
      </PageBody>
    </>
  );
}
