import { Link, Outlet } from "@tanstack/react-router";
import {
  Download,
  Heart,
  Home,
  Moon,
  Radio,
  Search,
  Settings,
  Sun,
  Tv,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PlayerBar } from "@/components/player/PlayerBar";
import { FullPlayer } from "@/components/player/FullPlayer";
import { useOnline, useTheme } from "@/hooks/useLibrary";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { InstallBanner, InstallDialog } from "@/components/install/InstallUi";
import { useInstall } from "@/components/install/InstallProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/stations", label: "Radio", icon: Radio },
  { to: "/tv", label: "TV", icon: Tv },
  { to: "/favorites", label: "Favorites", icon: Heart },
] as const;

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      {/* Colour mark on light, the supplied light mark on dark. */}
      <img
        src="/brand/logo-96.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 dark:hidden"
      />
      <img
        src="/brand/logo-light-96.png"
        alt=""
        width={32}
        height={32}
        className="hidden size-8 shrink-0 dark:block"
      />
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="text-xl font-bold">ONEYA</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">· Radio &amp; TV</span>
      </span>
    </span>
  );
}

function TopNav() {
  const { pref, setPref } = useTheme();
  const { canOfferInstall, install } = useInstall();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [pref]);
  const links = [
    ...NAV,
    { to: "/search", label: "Search", icon: Search },
    { to: "/settings", label: "Settings", icon: Settings },
  ] as const;
  return (
    <header className="shrink-0 border-b border-border bg-card">
      <div className="mx-auto grid h-16 w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:px-8">
        <Link to="/" aria-label="ONEYA home">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden min-w-0 items-center justify-end gap-1 md:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="flex h-11 items-center border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeProps={{ className: "border-primary text-primary", "aria-current": "page" }}
              activeOptions={{ exact: true }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center">
          {canOfferInstall && (
            <button
              type="button"
              onClick={() => void install()}
              className="mr-1 hidden h-10 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
            >
              <Download className="size-4" aria-hidden /> Install
            </button>
          )}
          <HeaderIconLink to="/search" label="Search radio and TV">
            <Search className="size-5" />
          </HeaderIconLink>
          <HeaderIconLink to="/settings" label="Settings">
            <Settings className="size-5" />
          </HeaderIconLink>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setPref(dark ? "light" : "dark")}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {NAV.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              activeProps={{ className: "text-primary", "aria-current": "page" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-xs font-medium text-background"
    >
      <WifiOff className="size-3.5" aria-hidden />
      You're offline. Pages you've opened still work; live radio and TV need a connection.
    </div>
  );
}

export function AppShell() {
  useTheme();
  const { station } = useRadioPlayer();
  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <OfflineBanner />
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <main id="main" className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
          <SiteFooter />
        </main>
      </div>
      <div className={cn(station && "shadow-[0_-1px_0_var(--color-border)]")}>
        <InstallBanner />
        <PlayerBar />
        <BottomNav />
      </div>
      <FullPlayer />
      <InstallDialog />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl border-t border-border px-4 py-6 text-xs text-muted-foreground md:px-8">
      <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <Link
          to="/about"
          className="inline-flex h-9 items-center hover:text-foreground hover:underline"
        >
          About ONEYA
        </Link>
        <Link
          to="/privacy"
          className="inline-flex h-9 items-center hover:text-foreground hover:underline"
        >
          Privacy
        </Link>
      </nav>
      <p className="mt-1 max-w-xl">
        Streams belong to their broadcasters and play directly from their servers. ONEYA is not
        affiliated with any station or channel.
      </p>
    </footer>
  );
}

/** Page header: compact on mobile, with an optional trailing action. */
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
  brand?: boolean;
}) {
  return (
    <header className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-6 pb-2 md:px-8 md:pt-8">
      <h1 className="truncate text-2xl font-semibold md:text-3xl">{title}</h1>
      <div className="flex items-center gap-1">{action}</div>
    </header>
  );
}

export function HeaderIconLink({
  to,
  label,
  children,
}: {
  to: "/search" | "/settings";
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
    >
      {children}
    </Link>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-4">
      <div className="mb-2 flex items-baseline justify-between px-4 sm:px-0">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl pb-8 sm:px-4 md:px-8">{children}</div>;
}
