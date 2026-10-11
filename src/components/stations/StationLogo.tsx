import { useState } from "react";
import type { RadioStation } from "@/types/station";
import { cn } from "@/lib/utils";

/** Real logo when provided in data; otherwise a neutral monogram tile (never a fabricated logo). */
export function StationLogo({
  station,
  size = "md",
  className,
}: {
  station: RadioStation;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [brokenUrl, setBrokenUrl] = useState<string>();
  const dims = {
    sm: "size-10 text-[10px] rounded-md",
    md: "size-12 text-[11px] rounded-md",
    lg: "size-24 text-lg rounded-lg",
    xl: "size-56 sm:size-64 text-4xl rounded-xl",
  }[size];

  if (station.logo && station.logo !== brokenUrl) {
    return (
      <img
        src={station?.logo}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setBrokenUrl(station.logo)}
        className={cn("shrink-0 border border-border bg-card object-contain", dims, className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center border border-border bg-muted font-mono font-semibold text-foreground",
        dims,
        className,
      )}
    >
      {station.badge.monogram}
    </div>
  );
}
