import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RadioStation } from "@/types/station";
import { isPlayable } from "@/services/stationService";
import { addRecentlyPlayed } from "@/hooks/useLibrary";
import { createLocalStore } from "@/lib/storage";
import {
  ERROR_MESSAGES,
  classifyError,
  isValidStreamUrl,
  logPlaybackIssue,
  type PlaybackErrorKind,
} from "@/lib/audio";
import { buildMediaMetadata, type NowPlayingInfo } from "@/lib/mediaSession";
import { getNowPlaying } from "@/services/scheduleService";
import { claimMediaFocus, registerMediaPauser } from "@/lib/mediaFocus";
import { recordPlay } from "@/lib/engagement";

export type PlayerStatus =
  "idle" | "connecting" | "playing" | "paused" | "reconnecting" | "error" | "offline";

interface PlayerState {
  station: RadioStation | null;
  status: PlayerStatus;
  error: PlaybackErrorKind | null;
  errorMessage: string | null;
  volume: number;
  muted: boolean;
}

interface PlayerApi extends PlayerState {
  play: (station?: RadioStation) => void;
  pause: () => void;
  toggle: (station?: RadioStation) => void;
  stop: () => void;
  retry: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  isCurrent: (id: string) => boolean;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  /** Re-register the OS/lock-screen controls for radio (e.g. after TV had them). */
  reclaimMediaSession: () => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);
const volumeStore = createLocalStore<number>("rr:volume", 0.9);

const CONNECT_TIMEOUT_MS = 15000;
const RECONNECT_BASE_MS = 3000;
const MAX_RECONNECTS = 4;
/** Exponential backoff with jitter: ~3s, 6s, 12s, 24s. Bounded so a dead station never loops forever. */
export function reconnectDelay(attempt: number, rand = Math.random) {
  return Math.round(RECONNECT_BASE_MS * 2 ** Math.max(0, attempt - 1) * (0.8 + rand() * 0.4));
}

/** Single playback engine: one HTMLAudioElement for the whole app. */
export function RadioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const reconnectRef = useRef<{ timer?: number; attempts: number }>({ attempts: 0 });
  const stationRef = useRef<RadioStation | null>(null);
  const statusRef = useRef<PlayerStatus>("idle");
  /** True only while the user wants audio. Cleared by pause/stop so nothing ever auto-resumes against their wish. */
  const wantPlayRef = useRef(false);
  /** Increments on every load so late events from a superseded stream are ignored. */
  const loadIdRef = useRef(0);
  /** Counts at most one engagement play per user-initiated start. */
  const countedPlayRef = useRef(true);

  const [station, setStation] = useState<RadioStation | null>(null);
  const [status, setStatusState] = useState<PlayerStatus>("idle");
  const [error, setError] = useState<PlaybackErrorKind | null>(null);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);

  const setStatus = (s: PlayerStatus) => {
    statusRef.current = s;
    setStatusState(s);
  };

  const clearTimers = () => {
    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(reconnectRef.current.timer);
  };

  const fail = useCallback((kind: PlaybackErrorKind, detail?: unknown) => {
    clearTimers();
    logPlaybackIssue(kind, detail);
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    setError(kind);
    setStatus(kind === "offline" ? "offline" : "error");
  }, []);

  const startStream = useCallback(
    (s: RadioStation, mode: "connecting" | "reconnecting" = "connecting") => {
      const a = audioRef.current;
      if (!a) return;
      clearTimers();
      setError(null);
      if (!navigator.onLine) return fail("offline");
      if (!isValidStreamUrl(s.streamUrl)) return fail("invalid", s.streamUrl);

      setStatus(mode);
      const loadId = ++loadIdRef.current;
      a.pause();
      a.src = s.streamUrl; // fresh load each time = live edge, never two streams
      a.load();
      timeoutRef.current = window.setTimeout(() => {
        if (loadId !== loadIdRef.current) return;
        if (statusRef.current === "connecting" || statusRef.current === "reconnecting")
          fail("timeout");
      }, CONNECT_TIMEOUT_MS);
      a.play().catch((err) => {
        if (loadId !== loadIdRef.current) return; // superseded by a newer load or a pause
        if (err instanceof DOMException && err.name === "AbortError") return;
        fail(classifyError(err, a), err);
      });
    },
    [fail],
  );

  // Create the engine once on the client.
  useEffect(() => {
    const a = new Audio();
    a.preload = "none";
    audioRef.current = a;
    const v = volumeStore.get();
    a.volume = v;
    setVolumeState(v);

    const onPlaying = () => {
      window.clearTimeout(timeoutRef.current);
      reconnectRef.current.attempts = 0;
      setError(null);
      setStatus("playing");
      if (!countedPlayRef.current) {
        countedPlayRef.current = true;
        recordPlay();
      }
    };
    // OS/headset/another app paused us: respect it as a user pause.
    const onPause = () => {
      if (statusRef.current === "playing") {
        wantPlayRef.current = false;
        setStatus("paused");
      }
    };
    const scheduleReconnect = () => {
      const s = stationRef.current;
      if (!s) return;
      if (!wantPlayRef.current) return;
      if (reconnectRef.current.attempts >= MAX_RECONNECTS) return fail("network");
      reconnectRef.current.attempts += 1;
      logPlaybackIssue("reconnect", { station: s.id, attempt: reconnectRef.current.attempts });
      setStatus("reconnecting");
      window.clearTimeout(reconnectRef.current.timer);
      reconnectRef.current.timer = window.setTimeout(() => {
        if (wantPlayRef.current && stationRef.current?.id === s.id) startStream(s, "reconnecting");
      }, reconnectDelay(reconnectRef.current.attempts));
    };
    const onError = () => {
      if (!a.getAttribute("src")) return;
      if (statusRef.current === "playing" || statusRef.current === "reconnecting")
        scheduleReconnect();
      else fail(classifyError(null, a), a.error);
    };
    const onEnded = () => statusRef.current === "playing" && scheduleReconnect();
    const onStalled = () => {
      if (statusRef.current !== "playing") return;
      window.clearTimeout(reconnectRef.current.timer);
      reconnectRef.current.timer = window.setTimeout(() => {
        if (a.readyState < 3 && statusRef.current === "playing") scheduleReconnect();
      }, 8000);
    };
    const onOffline = () => {
      if (["playing", "connecting", "reconnecting"].includes(statusRef.current)) fail("offline");
    };
    // Network came back (e.g. Wi-Fi → mobile data): resume once, only if the user still wants audio.
    const onOnline = () => {
      const s = stationRef.current;
      if (s && wantPlayRef.current && statusRef.current === "offline") {
        reconnectRef.current.attempts = 0;
        startStream(s, "reconnecting");
      }
    };
    // Returning from background/lock: make the UI match what the audio element is really doing.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (statusRef.current === "playing" && a.paused) {
        if (wantPlayRef.current) scheduleReconnect();
        else setStatus("paused");
      }
    };

    a.addEventListener("playing", onPlaying);
    a.addEventListener("pause", onPause);
    a.addEventListener("error", onError);
    a.addEventListener("ended", onEnded);
    a.addEventListener("waiting", onStalled);
    a.addEventListener("stalled", onStalled);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimers();
      a.pause();
      a.removeAttribute("src");
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      audioRef.current = null;
    };
  }, [fail, startStream]);

  const play = useCallback(
    (s?: RadioStation) => {
      const target = s ?? stationRef.current;
      if (!target || !isPlayable(target)) return;
      reconnectRef.current.attempts = 0;
      wantPlayRef.current = true;
      countedPlayRef.current = false;
      claimMediaFocus("radio"); // pauses TV if it was playing
      if (stationRef.current?.id !== target.id) {
        stationRef.current = target;
        setStation(target);
      }
      addRecentlyPlayed(target.id);
      startStream(target);
    },
    [startStream],
  );

  // Live radio has nothing to resume from, so pausing drops the connection: no
  // background data use while paused, and Play rejoins at the live edge.
  const pause = useCallback(() => {
    clearTimers();
    wantPlayRef.current = false;
    loadIdRef.current++;
    setStatus(stationRef.current ? "paused" : "idle");
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    wantPlayRef.current = false;
    loadIdRef.current++;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.removeAttribute("src");
      a.load();
    }
    stationRef.current = null;
    setStation(null);
    setError(null);
    setStatus("idle");
    setExpanded(false);
  }, []);

  const toggle = useCallback(
    (s?: RadioStation) => {
      const same = !s || s.id === stationRef.current?.id;
      const active = ["playing", "connecting", "reconnecting"].includes(statusRef.current);
      if (same && active) pause();
      else play(s);
    },
    [pause, play],
  );

  const retry = useCallback(() => play(), [play]);

  const setVolume = useCallback((v: number) => {
    const val = Math.min(1, Math.max(0, v));
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = false;
    }
    setMuted(false);
    setVolumeState(val);
    volumeStore.set(val);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }, []);

  // Lock screen / headset controls. Live radio: only play, pause, stop. Seek/track
  // actions are explicitly cleared so the OS never shows fake controls.
  const reclaimMediaSession = useCallback(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* action unsupported by this browser */
      }
    };
    set("play", () => play());
    set("pause", () => pause());
    set("stop", () => stop());
    for (const a of [
      "seekbackward",
      "seekforward",
      "seekto",
      "previoustrack",
      "nexttrack",
    ] as MediaSessionAction[])
      set(a, null);
  }, [play, pause, stop]);

  useEffect(() => {
    reclaimMediaSession();
  }, [reclaimMediaSession]);

  // Let the TV player pause radio when it takes over.
  useEffect(() => registerMediaPauser("radio", pause), [pause]);

  // Current program/presenter from the station schedule. Re-checked on station
  // change and once a minute so lock-screen metadata rolls over with the schedule.
  useEffect(() => {
    if (!station) {
      setNowPlaying(null);
      return;
    }
    const update = () => setNowPlaying(getNowPlaying(station));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [station]);

  // Metadata only; never touches the audio element, so updates can't restart playback.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!station) {
      navigator.mediaSession.metadata = null;
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata(buildMediaMetadata(station, nowPlaying));
    } catch {
      /* MediaMetadata unsupported */
    }
  }, [station, nowPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState =
      status === "playing" ? "playing" : status === "idle" ? "none" : "paused";
  }, [status]);

  const value = useMemo<PlayerApi>(
    () => ({
      station,
      status,
      error,
      errorMessage: error ? ERROR_MESSAGES[error] : null,
      volume,
      muted,
      play,
      pause,
      toggle,
      stop,
      retry,
      setVolume,
      toggleMute,
      isCurrent: (id) => station?.id === id,
      expanded,
      setExpanded,
      reclaimMediaSession,
    }),
    [
      station,
      status,
      error,
      volume,
      muted,
      play,
      pause,
      toggle,
      stop,
      retry,
      setVolume,
      toggleMute,
      expanded,
      reclaimMediaSession,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function useRadioPlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("useRadioPlayer must be used inside RadioPlayerProvider");
  return ctx;
}

export const STATUS_TEXT: Record<PlayerStatus, string> = {
  idle: "Not playing",
  connecting: "Connecting…",
  playing: "Live",
  paused: "Paused",
  reconnecting: "Reconnecting…",
  error: "Unable to connect",
  offline: "You're offline",
};
