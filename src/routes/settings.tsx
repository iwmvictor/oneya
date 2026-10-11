import { createFileRoute } from "@tanstack/react-router";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { Link } from "@tanstack/react-router";
import { useInstall } from "@/components/install/InstallProvider";
import {
  clearRecentChannels,
  clearRecentlyPlayed,
  useTheme,
  type ThemePref,
} from "@/hooks/useLibrary";
import { seo } from "@/lib/site";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/settings")({
  head: () =>
    seo({
      title: "Settings",
      description: "Theme, installation, privacy and data usage for ONEYA.",
      path: "/settings",
      noindex: true, // utility page
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
  const { guide, standalone, installed, hasNativePrompt, install, openDialog } = useInstall();
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

        <Group title="Install ONEYA">
          {standalone || installed ? (
            <p className="px-4 py-3 text-muted-foreground">ONEYA is installed on this device.</p>
          ) : (
            <>
              <p className="px-4 py-3 text-muted-foreground">
                {hasNativePrompt || guide.canInstall
                  ? "Open ONEYA from your home screen or desktop, in its own window."
                  : (guide.note ?? "This browser can't install ONEYA.")}
              </p>
              {(hasNativePrompt || guide.canInstall) && (
                <button
                  type="button"
                  onClick={() => (hasNativePrompt ? void install() : openDialog())}
                  className="w-full px-4 py-3 text-left font-medium text-primary hover:bg-accent"
                >
                  {hasNativePrompt ? "Install ONEYA" : "How to install"}
                </button>
              )}
            </>
          )}
        </Group>

        <Group title="Data usage">
          <p className="px-4 py-3 text-muted-foreground">
            Live radio uses roughly 30–60 MB per hour depending on the station. Live TV uses
            considerably more, depending on the channel's quality. Nothing streams until you press
            play. Pages you've opened work offline, but live radio and TV always need an internet
            connection.
          </p>
        </Group>

        <Group title="Privacy">
          <p className="px-4 py-3 text-muted-foreground">
            No account needed. Favorites, recently played items and your volume are stored only on
            this device. Streams play directly from each broadcaster's servers. ONEYA uses Google
            Analytics to measure which pages are visited. See the privacy notice for details.
          </p>
          <button
            type="button"
            onClick={() => {
              clearRecentlyPlayed();
              clearRecentChannels();
              toast.success("Recently played cleared");
            }}
            className="w-full px-4 py-3 text-left font-medium text-primary hover:bg-accent"
          >
            Clear recently played
          </button>
          <Link to="/privacy" className="block px-4 py-3 font-medium text-primary hover:bg-accent">
            Privacy notice
          </Link>
        </Group>

        <Group title="About">
          <p className="px-4 py-3 text-muted-foreground">
            ONEYA brings live radio and TV from Rwanda together in one place. Some stations are
            listed before their online stream is available; they stay out of the playable lists
            until it is.
          </p>
          <Link to="/about" className="block px-4 py-3 font-medium text-primary hover:bg-accent">
            About ONEYA
          </Link>
        </Group>
      </PageBody>
    </>
  );
}
