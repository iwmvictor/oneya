import { useState } from "react";
import type { TvChannel } from "@/types/channel";
import { cn } from "@/lib/utils";

/** Real channel logo when the data has one; otherwise the broadcaster's own monogram tile. Never a fabricated logo. */
export function ChannelLogo({ channel, className }: { channel: TvChannel; className?: string }) {
  const [broken, setBroken] = useState<string>();
  if (channel.logo && channel.logo !== broken) {
    return (
      <img
        src={channel.logo}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setBroken(channel.logo)}
        className={cn("shrink-0 rounded-md border border-border bg-card object-contain", className)}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-md border border-border font-mono text-sm font-semibold",
        className,
      )}
      style={{ background: channel.badge.background, color: channel.badge.textColor }}
    >
      {channel.badge.monogram}
    </div>
  );
}
