import { toast } from "sonner";
import type { RadioStation } from "@/types/station";

export async function shareStation(station: RadioStation) {
  const url = `${window.location.origin}/station/${station.slug}`;
  const data = {
    title: `${station.name} on Rwanda Radio`,
    text: `Listen to ${station.name}${station.frequency ? ` (${station.frequency})` : ""} on Rwanda Radio`,
    url,
  };
  if (navigator.share) {
    try {
      await navigator.share(data);
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Station link copied");
  } catch {
    toast(url);
  }
}
