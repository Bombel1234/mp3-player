"use client";

import { useEffect, useRef, useState } from "react";
import {ChevronLeft} from "lucide-react"
import Link from 'next/link'

type Track = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cloudinary_public_id: string | null;
};

export default function DeleteFilesPage() {
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function loadTracks() {
    const res = await fetch("/api/tracks");
    const data = await res.json();
    setTracks(data);
  }

  useEffect(() => {
    loadTracks();
  }, []);

  // ▶️ PLAY / PAUSE
  function togglePlay(track: Track) {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.audio_url);
    }

    const audio = audioRef.current;

    if (playingId === track.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.src = track.audio_url;
    audio.play();
    setPlayingId(track.id);
  }

  // 🗑 удалить один
  
  async function deleteOne(track: Track) {
  
    setLoadingId(track.id);

    await fetch("/api/delete-track", {
      method: "DELETE",
      body: JSON.stringify({
        id: track.id,
        public_id: track.cloudinary_public_id,
      }),
    });

    setTracks((prev) => prev.filter((t) => t.id !== track.id));

    if (playingId === track.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }

    setLoadingId(null);
  }

  // 🔥 удалить все
  async function deleteAll() {
    if (!confirm("Удалить ВСЕ треки?")) return;

    setLoadingAll(true);

    await fetch("/api/delete-all", {
      method: "DELETE",
    });

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setTracks([]);
    setPlayingId(null);
    setLoadingAll(false);
  }

  return (
    <div className="min-h-screen bg-slate-900  text-white p-6">
      {/* HEADER */}
      <div className="py-2">
        <Link href='/'>  
          <ChevronLeft size={24}/>
        </Link>
      </div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">🎵 Управление треками</h1>

        <button
          onClick={deleteAll}
          disabled={loadingAll || tracks.length === 0}
          className="bg-red-500 hover:bg-red-600 transition px-2 py-1 rounded-xl font-semibold disabled:opacity-50"
        >
          {loadingAll ? "Удаление..." : "🗑 Удалить всё"}
        </button>
      </div>
      <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
          {tracks.length === 0 && (
          <p className="text-slate-400">Нет треков</p>
        )}

        {/* LIST */}
        <div className="grid gap-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl shadow-lg"
            >
              {/* PLAY BUTTON */}
              <button
                onClick={() => togglePlay(track)}
                className="bg-blue-500 hover:bg-blue-600 w-12 h-12 flex items-center justify-center rounded-full text-xl"
              >
                {playingId === track.id ? "⏸" : "▶️"}
              </button>

              {/* INFO */}
              <div className="flex-1">
                <p className="font-semibold">
                  {track.artist} — {track.title}
                </p>
              </div>

              {/* DELETE */}
              <button
                onClick={() => deleteOne(track)}
                disabled={loadingId === track.id}
                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-xl disabled:opacity-50"
              >
                {loadingId === track.id ? "..." : "🗑"}
              </button>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}