import { useCallback, useEffect, useState } from "react";
import { createLocalStore } from "@/lib/storage";

// Favorites & recents are stored as station ids. Shape kept simple so it can sync to an account later.
const favoritesStore = createLocalStore<string[]>("rr:favorites", []);
const recentStore = createLocalStore<string[]>("rr:recent", []);
const recentChannelStore = createLocalStore<string[]>("rr:recent-tv", []);
const RECENT_LIMIT = 8;

export function useFavorites() {
  const ids = favoritesStore.useValue();
  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => {
    favoritesStore.set((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
    );
  }, []);
  return { ids, isFavorite, toggle };
}

export function useRecentlyPlayed() {
  return recentStore.useValue();
}

export function addRecentlyPlayed(id: string) {
  recentStore.set((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_LIMIT));
}

export function clearRecentlyPlayed() {
  recentStore.set([]);
}

export function useRecentChannels() {
  return recentChannelStore.useValue();
}

export function addRecentChannel(id: string) {
  recentChannelStore.set((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, RECENT_LIMIT));
}

export function clearRecentChannels() {
  recentChannelStore.set([]);
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

export type ThemePref = "system" | "light" | "dark";
const themeStore = createLocalStore<ThemePref>("rr:theme", "system");

export function applyTheme(pref: ThemePref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const pref = themeStore.useValue();
  useEffect(() => {
    applyTheme(pref);
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => applyTheme("system");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [pref]);
  return { pref, setPref: (p: ThemePref) => themeStore.set(p) };
}

/** Inline in <head> so the right theme paints before hydration. */
export const THEME_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("rr:theme")||'"system"');if(p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
