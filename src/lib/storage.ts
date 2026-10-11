import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store with cross-tab sync. SSR-safe: the server snapshot
 * is always the fallback value, so first client render matches the server.
 */
export function createLocalStore<T>(key: string, fallback: T) {
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  let cacheRaw: string | null | undefined;

  const read = (): T => {
    if (typeof window === "undefined") return fallback;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }
    if (raw === cacheRaw && cache !== undefined) return cache;
    cacheRaw = raw;
    try {
      cache = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cache = fallback;
    }
    return cache;
  };

  const set = (value: T | ((prev: T) => T)) => {
    const next = typeof value === "function" ? (value as (p: T) => T)(read()) : value;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage full or blocked — keep in-memory only */
      cache = next;
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    const onStorage = (e: StorageEvent) => e.key === key && l();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  };

  const useValue = () => useSyncExternalStore(subscribe, read, () => fallback);

  return { get: read, set, useValue };
}
