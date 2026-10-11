import type { StationCategory } from "@/types/station";
import { CATEGORY_LABELS, getAvailableCategories } from "@/services/stationService";
import { cn } from "@/lib/utils";

export function CategoryFilter({
  value,
  onChange,
}: {
  value: StationCategory | "all";
  onChange: (v: StationCategory | "all") => void;
}) {
  const options: (StationCategory | "all")[] = ["all", ...getAvailableCategories()];
  return (
    <div
      role="radiogroup"
      aria-label="Filter by category"
      className="-mx-4 flex gap-5 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
    >
      {options.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c)}
            className={cn(
              "-mb-px shrink-0 border-b-2 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {c === "all" ? "All" : CATEGORY_LABELS[c]}
          </button>
        );
      })}
    </div>
  );
}
