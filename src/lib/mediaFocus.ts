/**
 * One media element at a time. Radio (audio) and TV (video) register how to pause
 * themselves; when either starts, whoever held focus is paused. Keeps the two
 * players decoupled: neither imports the other.
 */
type Kind = "radio" | "tv";
const pausers = new Map<Kind, () => void>();
let holder: Kind | null = null;

export function registerMediaPauser(kind: Kind, pause: () => void) {
  pausers.set(kind, pause);
  return () => {
    if (pausers.get(kind) === pause) pausers.delete(kind);
    if (holder === kind) holder = null;
  };
}

/** Call right before starting playback. Pauses the other kind if it was playing. */
export function claimMediaFocus(kind: Kind) {
  if (holder && holder !== kind) pausers.get(holder)?.();
  holder = kind;
}
