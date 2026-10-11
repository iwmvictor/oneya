import { createLocalStore } from "@/lib/storage";

/**
 * Local, on-device engagement signals used only to time the install prompt.
 * Nothing here leaves the device. Counts are plain numbers; no content is recorded.
 */
export interface Engagement {
  /** Distinct browsing sessions (tabs/launches), counted once per session. */
  visits: number;
  /** Times playback actually started (radio or TV) after a user action. */
  plays: number;
}

const store = createLocalStore<Engagement>("oneya:engagement", { visits: 0, plays: 0 });

export const useEngagement = store.useValue;
export const getEngagement = store.get;

export function recordVisit() {
  try {
    if (sessionStorage.getItem("oneya:visit-counted")) return;
    sessionStorage.setItem("oneya:visit-counted", "1");
  } catch {
    return;
  }
  store.set((e) => ({ ...e, visits: e.visits + 1 }));
}

export function recordPlay() {
  store.set((e) => ({ ...e, plays: e.plays + 1 }));
}
