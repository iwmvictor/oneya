import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { clearRecentlyPlayed, useTheme, type ThemePref } from "@/hooks/useLibrary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ONEYA · Rwanda Radio" },
      {
        name: "description",
        content: "Theme, installation, privacy and data usage for ONEYA · Rwanda Radio.",
      },
      { property: "og:title", content: "Settings — ONEYA · Rwanda Radio" },
      {
        property: "og:description",
        content: "Theme, installation, privacy and data usage for ONEYA · Rwanda Radio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:px-0">
        {title}
      </h2>
      <div className="divide-y divide-border border-y border-border bg-card text-sm sm:rounded-lg sm:border">
        {children}
      </div>
    </section>
  );
}

function SettingsPage() {
  const { pref, setPref } = useTheme();
  const opts: { v: ThemePref; label: string }[] = [
    { v: "system", label: "System" },
    { v: "light", label: "Light" },
    { v: "dark", label: "Dark" },
  ];
  return (
    <>
      <PageHeader title="Settings" />
      <PageBody>
        <Group title="Appearance">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span id="theme-label">Theme</span>
            <div
              role="radiogroup"
              aria-labelledby="theme-label"
              className="flex rounded-md border border-border p-0.5"
            >
              {opts.map((o) => (
                <button
                  key={o.v}
                  role="radio"
                  aria-checked={pref === o.v}
                  onClick={() => setPref(o.v)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm",
                    pref === o.v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Install the app">
          <p className="px-4 py-3 text-muted-foreground">
            <strong className="font-medium text-foreground">Android / Chrome:</strong> open the
            browser menu and choose "Install app" or "Add to Home screen".
          </p>
          <p className="px-4 py-3 text-muted-foreground">
            <strong className="font-medium text-foreground">iPhone / iPad:</strong> in Safari, tap
            Share, then "Add to Home Screen".
          </p>
          <p className="px-4 py-3 text-muted-foreground">
            <strong className="font-medium text-foreground">Desktop:</strong> use the install icon
            in the address bar.
          </p>
        </Group>

        <Group title="Data usage">
          <p className="px-4 py-3 text-muted-foreground">
            Live radio uses roughly 30–60 MB per hour depending on the station. Audio only streams
            while you're listening. The app itself works offline, but live radio always needs an
            internet connection.
          </p>
        </Group>

        <Group title="Privacy">
          <p className="px-4 py-3 text-muted-foreground">
            No account needed. Favorites, recently played stations and your volume are stored only
            on this device. Streams are played directly from each station's servers.
          </p>
          <button
            type="button"
            onClick={() => {
              clearRecentlyPlayed();
              toast.success("Recently played cleared");
            }}
            className="w-full px-4 py-3 text-left font-medium text-primary hover:bg-accent"
          >
            Clear recently played
          </button>
        </Group>

        <Group title="About">
          <p className="px-4 py-3 text-muted-foreground">
            ONEYA · Rwanda Radio — listen to Rwanda, wherever you are. Station information is still
            being verified; some stations are listed before their online stream is available.
          </p>
        </Group>
      </PageBody>
    </>
  );
}
