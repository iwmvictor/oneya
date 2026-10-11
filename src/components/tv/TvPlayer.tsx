import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { addRecentChannel } from "@/hooks/useLibrary";
import { recordPlay } from "@/lib/engagement";
import { claimMediaFocus, registerMediaPauser } from "@/lib/mediaFocus";
import {
  TV_FAILURE_COPY,
  failureFromHttp,
  failureFromMediaError,
  type TvFailureKind,
} from "@/lib/tvStream";
import { cn } from "@/lib/utils";
import type { TvChannel } from "@/types/channel";

type Phase = "idle" | "loading" | "playing" | "paused" | "error";

const START_TIMEOUT_MS = 20_000;
const STALL_TIMEOUT_MS = 25_000;
const MAX_NETWORK_RETRIES = 2;

type FsDoc = Document & { webkitFullscreenElement?: Element | null };
type FsVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitSupportsFullscreen?: boolean;
};

const ctrlBtn =
  "grid size-11 shrink-0 place-items-center rounded-full text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * Live TV player. One <video> element per channel page.
 *  - Never autoplays: playback starts only from a user tap, so browsers never surprise
 *    the viewer with sound.
 *  - HLS: native where the browser supports it (Safari/iOS), otherwise hls.js, loaded on demand.
 *  - Pause drops the connection, like the radio engine: Play rejoins the live edge.
 *  - Every failure is classified (offline, unreachable/CORS, rejected, not found, …) and offers a retry.
 */
export function TvPlayer({ channel }: { channel: TvChannel }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const loadIdRef = useRef(0);
  const netRetriesRef = useRef(0);
  const mediaRecoveredRef = useRef(false);
  const countedRef = useRef(true);
  const phaseRef = useRef<Phase>("idle");

  const radio = useRadioPlayer();
  const { reclaimMediaSession } = radio;

  const [phase, setPhaseState] = useState<Phase>("idle");
  const [buffering, setBuffering] = useState(false);
  const [failure, setFailure] = useState<TvFailureKind | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  const teardown = useCallback(() => {
    window.clearTimeout(timerRef.current);
    loadIdRef.current++;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
  }, []);

  const fail = useCallback(
    (kind: TvFailureKind, detail?: unknown) => {
      console.warn(
        "[oneya:tv]",
        channel.id,
        kind,
        detail instanceof Error ? detail.message : detail,
      );
      teardown();
      setFailure(kind);
      setBuffering(false);
      setPhase("error");
    },
    [channel.id, teardown],
  );

  const arm = useCallback(
    (ms: number, loadId: number, kind: TvFailureKind) => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (loadId === loadIdRef.current) fail(kind);
      }, ms);
    },
    [fail],
  );

  const pausePlayback = useCallback(() => {
    if (phaseRef.current === "idle" || phaseRef.current === "error") return;
    teardown();
    setBuffering(false);
    setPhase("paused");
  }, [teardown]);

  const start = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !channel.stream.eligible || !channel.streamUrl) return;
    if (!navigator.onLine) return fail("offline");

    claimMediaFocus("tv"); // pauses radio if it was playing
    teardown();
    setFailure(null);
    setPhase("loading");
    setBuffering(true);
    netRetriesRef.current = 0;
    mediaRecoveredRef.current = false;
    countedRef.current = false;
    const loadId = ++loadIdRef.current;
    arm(START_TIMEOUT_MS, loadId, "timeout");
    const url = channel.streamUrl;

    const onPlayRejected = (err: unknown) => {
      if (loadId !== loadIdRef.current) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      fail(
        err instanceof DOMException && err.name === "NotAllowedError" ? "blocked" : "unknown",
        err,
      );
    };

    try {
      const nativeHls = v.canPlayType("application/vnd.apple.mpegurl") !== "";
      if (channel.streamKind === "hls" && !nativeHls) {
        const { default: HlsLib } = await import("hls.js");
        if (loadId !== loadIdRef.current) return; // superseded while the library loaded
        if (!HlsLib.isSupported()) return fail("unsupported");
        const hls = new HlsLib({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 30,
          maxBufferLength: 20,
          // Fail fast when a channel never starts, so viewers get a reason in seconds, not a long spinner.
          manifestLoadingTimeOut: 8_000,
          manifestLoadingMaxRetry: 1,
          manifestLoadingRetryDelay: 500,
          manifestLoadingMaxRetryTimeout: 2_000,
          levelLoadingMaxRetry: 2,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 3,
          fragLoadingRetryDelay: 500,
        });
        hlsRef.current = hls;
        hls.on(HlsLib.Events.ERROR, (_e, data) => {
          if (loadId !== loadIdRef.current || !data.fatal) return;
          if (data.type === HlsLib.ErrorTypes.NETWORK_ERROR) {
            const code = data.response?.code;
            // Reconnect attempts are for a stream that was already playing and dropped.
            // A channel that never started has already had hls.js's own retries: report it now.
            const wasPlaying = countedRef.current;
            if (
              wasPlaying &&
              netRetriesRef.current < MAX_NETWORK_RETRIES &&
              (!code || code >= 500)
            ) {
              netRetriesRef.current += 1;
              window.setTimeout(() => {
                if (loadId === loadIdRef.current) hls.startLoad();
              }, 1500 * netRetriesRef.current);
              return;
            }
            return fail(failureFromHttp(code), data.details);
          }
          if (data.type === HlsLib.ErrorTypes.MEDIA_ERROR && !mediaRecoveredRef.current) {
            mediaRecoveredRef.current = true;
            hls.recoverMediaError();
            return;
          }
          fail(
            data.type === HlsLib.ErrorTypes.MEDIA_ERROR ? "unsupported" : "unknown",
            data.details,
          );
        });
        hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
          v.play().catch(onPlayRejected);
        });
        hls.loadSource(url);
        hls.attachMedia(v);
      } else {
        v.src = url;
        v.load();
        await v.play();
      }
    } catch (err) {
      onPlayRejected(err);
    }
  }, [arm, channel, fail, teardown]);

  // Media element events.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => {
      window.clearTimeout(timerRef.current);
      setBuffering(false);
      setPhase("playing");
      if (!countedRef.current) {
        countedRef.current = true;
        recordPlay();
        addRecentChannel(channel.id);
      }
    };
    const onWaiting = () => {
      if (phaseRef.current === "playing") {
        setBuffering(true);
        arm(STALL_TIMEOUT_MS, loadIdRef.current, "timeout");
      }
    };
    const onPause = () => {
      // The OS or a headset paused us while playing: treat as a normal pause.
      if (phaseRef.current === "playing") pausePlayback();
    };
    const onError = () => {
      if (!v.getAttribute("src")) return; // we cleared it ourselves
      const nativeHls = channel.streamKind === "hls";
      const code = v.error?.code;
      fail(nativeHls && code !== 3 ? "unreachable" : failureFromMediaError(code), v.error);
    };
    const onEnded = () => fail("ended");
    v.addEventListener("playing", onPlaying);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onError);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onError);
      v.removeEventListener("ended", onEnded);
    };
  }, [arm, channel.id, channel.streamKind, fail, pausePlayback]);

  // Radio takes over: pause TV. Cleanup on leaving the page or changing channel.
  useEffect(() => registerMediaPauser("tv", pausePlayback), [pausePlayback]);
  useEffect(() => {
    return () => {
      teardown();
      reclaimMediaSession();
    };
  }, [teardown, reclaimMediaSession]);

  // Lock-screen / headset controls while this page is mounted.
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    try {
      ms.metadata = new MediaMetadata({
        title: channel.name,
        artist: "Live TV",
        album: "ONEYA",
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
      ms.setActionHandler("play", () => void start());
      ms.setActionHandler("pause", () => pausePlayback());
      ms.setActionHandler("stop", () => pausePlayback());
    } catch {
      /* Media Session unsupported */
    }
  }, [channel.name, start, pausePlayback]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = phase === "playing" ? "playing" : "paused";
  }, [phase]);

  // Fullscreen capability + state.
  useEffect(() => {
    const v = videoRef.current as FsVideo | null;
    setCanFullscreen(
      !!document.fullscreenEnabled || !!v?.webkitSupportsFullscreen || !!v?.webkitEnterFullscreen,
    );
    const onChange = () =>
      setFullscreen(!!(document.fullscreenElement ?? (document as FsDoc).webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Network drops while watching: say so instead of spinning.
  useEffect(() => {
    const onOffline = () => {
      if (phaseRef.current === "loading" || phaseRef.current === "playing") fail("offline");
    };
    window.addEventListener("offline", onOffline);
    return () => window.removeEventListener("offline", onOffline);
  }, [fail]);

  const toggleFullscreen = () => {
    const c = containerRef.current;
    const v = videoRef.current as FsVideo | null;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (c?.requestFullscreen) void c.requestFullscreen().catch(() => undefined);
    else v?.webkitEnterFullscreen?.(); // iPhone Safari: only the video element can go fullscreen
  };

  const active = phase === "loading" || phase === "playing";
  const togglePlay = () => (active ? pausePlayback() : void start());

  const setVol = (val: number) => {
    const v = videoRef.current;
    setVolumeState(val);
    if (v) {
      v.volume = val;
      v.muted = false;
    }
    setMuted(false);
  };
  const toggleMute = () => {
    const v = videoRef.current;
    const next = !muted;
    if (v) v.muted = next;
    setMuted(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return; // let focused buttons/sliders handle their own keys
    if (e.key === " " || e.key.toLowerCase() === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key.toLowerCase() === "m") toggleMute();
    else if (e.key.toLowerCase() === "f" && canFullscreen) toggleFullscreen();
  };

  const copy = failure ? TV_FAILURE_COPY[failure] : null;
  const showSpinner = phase === "loading" || (phase === "playing" && buffering);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label={`Video player for ${channel.name}. Space plays or pauses, M mutes, F toggles fullscreen.`}
      onKeyDown={onKeyDown}
      className={cn(
        "group/player relative flex flex-col overflow-hidden bg-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-lg",
        fullscreen && "h-dvh w-screen rounded-none",
      )}
    >
      <div
        className={cn("relative bg-black", fullscreen ? "min-h-0 flex-1" : "aspect-video w-full")}
      >
        <video
          ref={videoRef}
          playsInline
          preload="none"
          aria-label={`${channel.name} live video`}
          className="size-full bg-black object-contain"
        />

        {/* Poster / state overlay */}
        {(phase === "idle" || phase === "paused" || phase === "error" || showSpinner) && (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center",
              phase === "idle" ? "bg-neutral-950" : "bg-black/70",
            )}
          >
            {phase === "idle" && (
              <span
                aria-hidden
                className="grid size-20 place-items-center rounded-xl border border-white/15 font-mono text-xl font-semibold"
                style={{ background: channel.badge.background, color: channel.badge.textColor }}
              >
                {channel.badge.monogram}
              </span>
            )}

            {showSpinner && (
              <div role="status" aria-live="polite" className="flex flex-col items-center gap-2">
                <Loader2 className="size-9 animate-spin motion-reduce:animate-none" aria-hidden />
                <span className="text-sm">
                  {phase === "loading" ? "Connecting…" : "Buffering…"}
                </span>
              </div>
            )}

            {phase === "error" && copy && (
              <div role="alert" className="flex max-w-md flex-col items-center gap-2">
                <AlertCircle className="size-8 text-white" aria-hidden />
                <p className="text-base font-semibold">{copy.title}</p>
                <p className="text-sm text-white/80">{copy.detail}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void start()}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <RefreshCw className="size-4" aria-hidden /> Try again
                  </button>
                  <Link
                    to="/tv"
                    className="inline-flex h-11 items-center rounded-md border border-white/30 px-5 text-sm font-medium hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Choose another channel
                  </Link>
                </div>
              </div>
            )}

            {(phase === "idle" || phase === "paused") && (
              <>
                <button
                  type="button"
                  onClick={() => void start()}
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Play className="size-5" fill="currentColor" aria-hidden />
                  {phase === "idle" ? "Watch live" : "Resume live"}
                </button>
                {phase === "idle" && (
                  <p className="max-w-xs text-xs text-white/70">
                    Streams from the broadcaster's own server. Nothing loads until you press play.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        className={cn(
          "flex items-center gap-1 bg-neutral-900 px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]",
          fullscreen &&
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pt-6",
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={active ? "Pause" : phase === "error" ? "Try again" : "Play live"}
          className={ctrlBtn}
        >
          {phase === "error" ? (
            <RefreshCw className="size-5" />
          ) : active ? (
            <Pause className="size-5" fill="currentColor" />
          ) : (
            <Play className="size-5 translate-x-px" fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={muted}
          className={ctrlBtn}
        >
          {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
        {/* Phones control volume with hardware keys and ignore script volume, so the slider is for mouse/trackpad. */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => setVol(Number(e.target.value))}
          aria-label="Volume"
          className="hidden h-1 w-24 cursor-pointer accent-white pointer-fine:block"
        />
        <span className="flex-1" />
        {phase === "playing" && !buffering && (
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
            <span aria-hidden className="size-2 rounded-full bg-red-500" />
            Live
          </span>
        )}
        {canFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            className={ctrlBtn}
          >
            {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
