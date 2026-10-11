import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search as SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { PageBody, PageHeader } from "@/components/layout/AppShell";
import { StationList } from "@/components/stations/StationList";
import { searchStations } from "@/services/stationService";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Search stations — ONEYA · Rwanda Radio" },
      {
        name: "description",
        content: "Search Rwanda radio stations by name, frequency, city or category.",
      },
      { property: "og:title", content: "Search stations — ONEYA · Rwanda Radio" },
      {
        property: "og:description",
        content: "Find a Rwanda radio station by name, frequency or city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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

  return (
    <>
      <PageHeader title="Search" />
      <PageBody>
        <div className="px-4 pt-3 sm:px-0">
          <label htmlFor="station-search" className="sr-only">
            Search stations
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
              placeholder="Station, frequency, city or category"
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
              ? `${results.length} ${results.length === 1 ? "result" : "results"}`
              : "All stations"}
          </p>
        </div>
        {results.length === 0 ? (
          <div className="mt-8 flex flex-col items-center px-4 text-center">
            <h2 className="font-semibold">No stations found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a station name like "KISS" or a frequency like "102.3".
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
          <StationList stations={results} label="Search results" />
        )}
      </PageBody>
    </>
  );
}
