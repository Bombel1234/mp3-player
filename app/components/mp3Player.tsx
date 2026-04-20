'use client';

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ListMusic,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Menu,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SavedTrack } from "@/lib/tracks";

type PlayerTrack = SavedTrack & {
  cover: string;
  colors: {
    accent: string;
    glow: string;
    overlay: string;
  };
};

type Mp3PlayerProps = {
  tracks: SavedTrack[];
};

const palette = [
  { accent: "#fb7185", glow: "rgba(251,113,133,0.38)", overlay: "from-rose-400/42 via-fuchsia-500/18 to-violet-700/58" },
  { accent: "#2dd4bf", glow: "rgba(45,212,191,0.34)", overlay: "from-teal-300/40 via-cyan-500/16 to-blue-700/56" },
  { accent: "#f59e0b", glow: "rgba(245,158,11,0.34)", overlay: "from-amber-300/38 via-orange-500/14 to-orange-700/58" },
  { accent: "#60a5fa", glow: "rgba(96,165,250,0.34)", overlay: "from-sky-300/38 via-blue-500/18 to-indigo-700/58" },
];

function createCoverDataUri(title: string, artist: string, start: string, end: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
      </defs>
      <rect width="720" height="720" rx="72" fill="url(#bg)" />
      <circle cx="540" cy="180" r="130" fill="rgba(255,255,255,0.18)" />
      <circle cx="180" cy="560" r="170" fill="rgba(255,255,255,0.14)" />
      <text x="60" y="518" fill="white" font-size="62" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
      <text x="60" y="586" fill="rgba(255,255,255,0.82)" font-size="32" font-family="Arial, Helvetica, sans-serif">${artist}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;

  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function buildPlayerTracks(tracks: SavedTrack[]): PlayerTrack[] {
  return tracks.map((track, index) => {
    const colors = palette[index % palette.length];

    return {
      ...track,
      colors,
      cover: createCoverDataUri(track.title, track.artist, colors.accent, "#111827"),
    };
  });
}

export default function Mp3Player({ tracks }: Mp3PlayerProps) {
  const playerTracks = useMemo(() => buildPlayerTracks(tracks), [tracks]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const skipPauseSyncRef = useRef(false);
  const shouldAutoplayRef = useRef(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isOpenMenu, setIsOpenMenu] = useState(false)

  const hasTracks = playerTracks.length > 0;
  const safeTrackIndex =
    hasTracks && trackIndex >= playerTracks.length ? 0 : trackIndex;
  const currentTrack = hasTracks ? playerTracks[safeTrackIndex] : null;

  useEffect(() => {
    if (!isPlaylistOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPlaylistOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaylistOpen]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    audio.load();

    if (!shouldAutoplayRef.current) {
      return;
    }

    const playPromise = audio.play();
    playPromise?.catch(() => {
      shouldAutoplayRef.current = false;
      setIsPlaying(false);
    });
  }, [currentTrack]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function handleTogglePlay() {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    if (audio.paused) {
      shouldAutoplayRef.current = true;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          shouldAutoplayRef.current = false;
          setIsPlaying(false);
        });
      return;
    }

    shouldAutoplayRef.current = false;
    audio.pause();
    setIsPlaying(false);
  }

  function handleSeek(nextTime: number) {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleSkip(seconds: number) {
    const audio = audioRef.current;

    if (!audio || !currentTrack) {
      return;
    }

    const nextTime = Math.min(
      Math.max(audio.currentTime + seconds, 0),
      duration || audio.duration || 0,
    );
    handleSeek(nextTime);
  }

  function handleNextTrack() {
    if (!currentTrack || playerTracks.length <= 1) {
      return;
    }

    skipPauseSyncRef.current = true;
    shouldAutoplayRef.current = true;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setTrackIndex((index) => (index + 1) % playerTracks.length);
  }

  function handlePreviousTrack() {
    if (!currentTrack || playerTracks.length <= 1) {
      return;
    }

    skipPauseSyncRef.current = true;
    shouldAutoplayRef.current = true;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    setTrackIndex((index) => (index - 1 + playerTracks.length) % playerTracks.length);
  }

  function handleSelectTrack(index: number) {
    if (!playerTracks[index]) {
      return;
    }

    if (index === safeTrackIndex) {
      handleTogglePlay();
      setIsPlaylistOpen(false);
      return;
    }

    skipPauseSyncRef.current = true;
    shouldAutoplayRef.current = true;
    setCurrentTime(0);
    setDuration(0);
    setTrackIndex(index);
    setIsPlaying(true);
    setIsPlaylistOpen(false);
  }

  const topBarLabel = hasTracks
    ? `${safeTrackIndex + 1} / ${playerTracks.length}`
    : "0 / 0";

  const handleClickMenu = ()=>{
    setIsOpenMenu(true)
  }

  return (
    <section className="relative isolate w-full max-w-sm overflow-hidden border border-white/15 bg-slate-950 text-white shadow-[0_40px_120px_-24px_rgba(15,23,42,0.75)]">
      {currentTrack ? (
        <audio
          key={currentTrack.id}
          ref={audioRef}
          preload="metadata"
          onLoadedMetadata={(event) => {
            setDuration(
              Number.isFinite(event.currentTarget.duration)
                ? event.currentTarget.duration
                : 0,
            );
          }}
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
          }}
          onPlay={() => {
            shouldAutoplayRef.current = true;
            setIsPlaying(true);
          }}
          onPause={() => {
            if (skipPauseSyncRef.current) {
              skipPauseSyncRef.current = false;
              return;
            }

            shouldAutoplayRef.current = false;
            setIsPlaying(false);
          }}
          onEnded={handleNextTrack}
        >
          <source src={currentTrack.audio_url} type="audio/mpeg" />
        </audio>
      ) : null}

      <div className="absolute inset-0">
        {currentTrack ? (
          <>
            <Image
              src={currentTrack.cover}
              alt={`${currentTrack.title} cover`}
              fill
              sizes="100vw"
              unoptimized
              className="scale-125 object-cover blur-3xl"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-b ${currentTrack.colors.overlay}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_30%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.82)_48%,rgba(2,6,23,0.97)_100%)]" />
      </div>

      <div className="relative flex min-h-[820px] flex-col p-5 sm:p-6">
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleClickMenu}
            // disabled={!hasTracks || playerTracks.length <= 1}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="РџСЂРµРґС‹РґСѓС‰РёР№ С‚СЂРµРє"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.42em] text-white/60">
              Now Playing
            </p>
            <p className="mt-1 text-sm font-medium text-white/90">{topBarLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaylistOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/15"
            aria-label="РЎРїРёСЃРѕРє С‚СЂРµРєРѕРІ"
          >
            <ListMusic className="h-5 w-5" />
          </button>
        </header>

        

        <div className="mt-8">
          <div
            className="relative mx-auto aspect-square w-full max-w-[290px] overflow-hidden rounded-[2.25rem] border border-white/10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.65)]"
            style={{
              boxShadow: currentTrack
                ? `0 28px 90px -24px ${currentTrack.colors.glow}`
                : "0 24px 80px -12px rgba(0,0,0,0.65)",
            }}
          >
            {currentTrack ? (
              <Image
                src={currentTrack.cover}
                alt={`${currentTrack.title} by ${currentTrack.artist}`}
                fill
                sizes="(max-width: 640px) 80vw, 290px"
                preload
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-white/10 p-8 text-center text-sm text-white/70">
                
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm uppercase tracking-[0.34em] text-white/55">
            {currentTrack?.artist ?? "No tracks yet"}
          </p>
          <h1 className="mt-3 text-1xl font-semibold tracking-tight text-white ">
            {currentTrack?.title ?? "No title"}
          </h1>
        </div>

        <div className="mt-10">
          <label className="sr-only" htmlFor="track-progress">
            РџСЂРѕРіСЂРµСЃСЃ С‚СЂРµРєР°
          </label>
          <input
            id="track-progress"
            type="range"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => handleSeek(Number(event.target.value))}
            disabled={!currentTrack}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: currentTrack
                ? `linear-gradient(to right, ${currentTrack.colors.accent} 0%, ${currentTrack.colors.accent} ${progress}%, rgba(255,255,255,0.16) ${progress}%, rgba(255,255,255,0.16) 100%)`
                : "rgba(255,255,255,0.16)",
            }}
          />

          <div className="mt-3 flex items-center justify-between text-sm text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handlePreviousTrack}
            disabled={!hasTracks || playerTracks.length <= 1}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label=""
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => handleSkip(-10)}
            disabled={!currentTrack}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!currentTrack}
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_18px_40px_-16px_rgba(255,255,255,0.7)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isPlaying ? "РџР°СѓР·Р°" : "Р’РѕСЃРїСЂРѕРёР·РІРµСЃС‚Рё"}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="ml-1 h-7 w-7" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(10)}
            disabled={!currentTrack}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="РџРµСЂРµРјРѕС‚Р°С‚СЊ РІРїРµСЂРµРґ РЅР° 10 СЃРµРєСѓРЅРґ"
          >
            <RotateCw className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleNextTrack}
            disabled={!hasTracks || playerTracks.length <= 1}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="РЎР»РµРґСѓСЋС‰РёР№ С‚СЂРµРє"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isPlaylistOpen ? (
        <div
          className="absolute py-8 inset-0 z-40 items-center justify-center bg-state-950/72 px-4 backdrop-blur-sm"
          onClick={() => setIsPlaylistOpen(false)}
        >
          <div
            className="h-[90vh] w-full max-w-[22rem] overflow-hidden rounded-[2rem] border border-white/12 bg-state-950/92 shadow-[0_32px_120px_-32px_rgba(0,0,0,0.88)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex  items-center justify-between border-b border-white/10 px-5 py-4">
              <div >
                <p className="text-[11px] uppercase tracking-[0.32em] text-white/50">
                  ListMusic
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {playerTracks.length} tracks
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPlaylistOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-white/8 px-4 text-sm text-white/80 transition hover:bg-white/14"
              >
                Close
              </button>
            </div>

            <div className="max-h-[calc(72vh-5.5rem)] overflow-y-auto p-4">
              {hasTracks ? (
                <ul className="space-y-2">
                  {playerTracks.map((track, index) => {
                    const isCurrent = index === safeTrackIndex;

                    return (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(index)}
                          className={`flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left transition ${
                            isCurrent
                              ? "bg-white/16"
                              : "bg-white/6 hover:bg-white/10"
                          }`}
                        >
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950">
                            {isCurrent && isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="ml-0.5 h-4 w-4" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-white">
                              {track.title}
                            </span>
                            <span className="block truncate text-xs text-white/55">
                              {track.artist}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-[1rem] bg-white/6 px-3 py-4 text-sm text-white/60">
                  Najpierw zaladuj muzyke z komputera albo telefona w chmure Cloudinare
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isOpenMenu && (
        <div className="absolute text-left w-56 mt-2 top-10 bg-gray-500 rounded-2xl left-10">
        {/* Kontener menu */}
          <div className="py-2">
            <div className=" flex flex-col p-4 gap-4">
              <Link
                href="/loadFiles"
                className="group flex items-center border rounded-2xl text-green-600 bg-white  px-4 py-2 text-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <span className="flex-1 font-medium">Pobierz MP3</span>
                <kbd className="ml-3 text-[22px]  group-hover:text-indigo-400">↓</kbd>
              </Link>
              
              <Link
                href="/deleteFiles"
                className="group flex items-center px-4 py-2 border rounded-2xl text-xl bg-white text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="flex-1 font-medium">Usuń pliki MP3</span>
              </Link>

              <button
                onClick={()=>setIsOpenMenu(false)}
                className="group flex items-center px-4 py-3 text-xl border rounded-2xl text-green-600 bg-white hover:bg-gray-50 transition-colors border-t border-gray-100"
              >
                <span className="flex-1">Zamknij</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
