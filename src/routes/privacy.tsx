import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { breadcrumbLd, seo } from "@/lib/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    seo({
      title: "Privacy",
      description:
        "What ONEYA stores on your device, what third parties see when you play a stream, and how to clear your data.",
      path: "/privacy",
      jsonLd: [
        breadcrumbLd([
          { name: "ONEYA", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ]),
      ],
    }),
  component: Privacy,
});

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 text-lg font-semibold">{children}</h2>;
}

function Privacy() {
  return (
    <>
      <PageHeader title="Privacy" />
      <PageBody>
        <div className="max-w-2xl px-4 text-sm leading-relaxed sm:px-0">
          <p className="text-base">
            ONEYA doesn't ask you to create an account and doesn't show advertising. It does use
            Google Analytics to understand how the site is used. This page explains what is stored
            on your device and what other parties can see when you use it.
          </p>

          <H2>Stored on your device</H2>
          <p className="mt-2">
            These items stay in your browser's local storage and are never sent to us:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Your favorite stations and channels.</li>
            <li>Which stations and channels you played recently, so you can pick up again.</li>
            <li>Your theme and volume choices.</li>
            <li>
              Simple counters (visits and plays) and your choices about install prompts. These only
              decide when ONEYA suggests installing it and never record what you listened to.
            </li>
            <li>
              Cached copies of ONEYA's pages and files, kept by the service worker so the app loads
              faster and opens offline.
            </li>
          </ul>

          <H2>What others can see</H2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Broadcasters and stream hosts.</strong> When you press play, your device
              connects directly to the server that carries the stream. That server sees your IP
              address and device details, under its own privacy policy. ONEYA doesn't relay or
              record streams.
            </li>
            <li>
              <strong>Google Analytics.</strong> ONEYA uses Google Analytics 4 to measure visits. It
              records usage such as the pages you open (including station and channel pages), your
              approximate location, and your device and browser type, and it uses cookies or similar
              identifiers to recognise returning visitors. This data is processed by Google under
              Google's privacy policy. ONEYA doesn't send what you listen to or watch, or the
              contents of your favorites, to Google beyond the pages you open.
            </li>
            <li>
              <strong>Google Fonts.</strong> ONEYA loads its typeface from Google Fonts, so Google
              receives your IP address when pages load.
            </li>
            <li>
              <strong>Hosting.</strong> ONEYA is hosted on Vercel, which may keep standard server
              logs of requests.
            </li>
          </ul>

          <H2>Clearing your data</H2>
          <p className="mt-2">
            You can clear recently played items in{" "}
            <Link
              to="/settings"
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              Settings
            </Link>
            . To remove everything ONEYA stores, including analytics cookies, clear this site's data
            in your browser's settings or uninstall the app. You can also block Google Analytics
            with a browser extension or your browser's tracking settings.
          </p>

          <p className="mt-8 text-xs text-muted-foreground">Last updated 11 October 2026.</p>
        </div>
      </PageBody>
    </>
  );
}
