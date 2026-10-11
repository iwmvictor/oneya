/**
 * Typed view over ./registry.json (the supplied registry). The JSON file is the
 * source of truth and is never rewritten by code; this module only describes it.
 */
import raw from "./registry.json";

export interface RegistryStream {
  status?: string | null;
  url?: string | null;
  format?: string | null;
  statusLabel?: string | null;
}

/** A television feed attached to a broadcaster record. Optional fields let the data owner supply real channel metadata. */
export interface RegistryTv extends RegistryStream {
  /** Real channel name, when known. Otherwise the broadcaster name is used. */
  name?: string;
  logo?: string;
  description?: string;
  website?: string;
}

export interface RegistryEntry {
  id: string;
  name: string;
  dial: { display: string };
  badge: { monogram: string; background: string; textColor: string };
  coverage: { location: string; region: string; reach: string };
  categories: string[];
  languages: string[];
  stream: RegistryStream;
  tv?: RegistryTv;
  links: { website?: string; logo?: string };
}

export const registry = raw as unknown as RegistryEntry[];
