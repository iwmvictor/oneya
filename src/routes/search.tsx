import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { StationList } from "@/components/stations/StationList";
import { ChannelList } from "@/components/tv/ChannelList";
import { seo } from "@/lib/site";
import { searchChannels } from "@/services/channelService";
import { searchStations } from "@/services/stationService";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional().catch(undefined) }),
  head: () =>
    seo({
      title: "Search radio and TV",
      description:
        "Search Rwanda's live radio stations and TV channels by name, frequency, city or category.",
      path: "/search",
      noindex: true, // result pages are infinite query variations; the page itself stays crawlable
    }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [value, setValue] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => navigate({ search: value ? { q: value } : {}, replace: true }), 200);
    return () => clearTimeout(t);
  }, [value, navigate]);

  const results = searchStations(value);
  const channelResults = searchChannels(value);
  const total = results.length + channelResults.length;

  return (
    <>
      <PageHeader title="Search" />
      <PageBody>
        <div className="px-4 pt-3 sm:px-0">
          <label htmlFor="station-search" className="sr-only">
            Search radio and TV
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              ref={inputRef}
              id="station-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Station, channel, frequency or city"
              className="h-12 w-full rounded-md border border-input bg-card pl-9 pr-11 text-base placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <p aria-live="polite" className="py-3 text-xs text-muted-foreground">
            {value
              ? `${total} ${total === 1 ? "result" : "results"}`
              : "All radio stations and TV channels"}
          </p>
        </div>
        {total === 0 ? (
          <div className="mt-8 flex flex-col items-center px-4 text-center">
            <h2 className="font-semibold">Nothing found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a station name like "KISS", a channel like "Radio10 TV" or a frequency like
              "102.3".
            </p>
            <button
              type="button"
              onClick={() => setValue("")}
              className="mt-4 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            {channelResults.length > 0 && (
              <section aria-labelledby="tv-results" className="mb-4">
                <h2
                  id="tv-results"
                  className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:px-0"
                >
                  TV channels
                </h2>
                <ChannelList channels={channelResults} label="TV channel results" />
              </section>
            )}
            {results.length > 0 && (
              <section aria-labelledby="radio-results">
                <h2
                  id="radio-results"
                  className="mb-2 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:px-0"
                >
                  Radio stations
                </h2>
                <StationList stations={results} label="Radio search results" />
              </section>
            )}
          </>
        )}
      </PageBody>
    </>
  );
}
