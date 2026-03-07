'use client'
import { Play, Pause, SkipForward, SkipBack, Volume2, ListMusic } from 'lucide-react';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useRef, useEffect } from 'react';


export default function Player({ listMusic }: any) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const trackUrl = `/audio/${listMusic[currentTrackIndex]}`
    const nameTrack = listMusic[currentTrackIndex]

    useEffect(() => {
        if (audioRef.current && isPlaying) {
            audioRef.current.play().catch(() => { });
            setCurrentTime(0);
        }
    }, [currentTrackIndex]);

    const togglePlay = () => {

        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
        setIsSpinning(!isSpinning)
    };

    const handleNextTrack = () => {
        setCurrentTrackIndex((prev) => {
            const nextIndex = prev + 1;
            return nextIndex < listMusic.length ? nextIndex : 0; // по кругу
        });

    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    // Загрузка метаданных (длительность)
    const onLoadedMetadata = () => {
        if (audioRef.current) {
            const dur = audioRef.current.duration;
            if (!isNaN(dur)) {
                setDuration(dur);
            }
        }
    };

    // Перемотка
    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };


    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className=''>
            {/* Скрытый элемент аудио */}
            <audio
                key={trackUrl}
                ref={audioRef}
                src={trackUrl}
                crossOrigin="anonymous"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={handleNextTrack}

            />
            <div className='flex justify-between'>
                <Menu
                    size={50}
                />
                <ListMusic
                    size={50}
                />
            </div>
            <div className='flex justify-center py-4'>
                <Image
                    src='/images/back.png'
                    alt='images'
                    width={250}
                    height={250}
                    loading="eager"
                    className={`rounded-full ${isSpinning ? 'animate-spin [animation-duration:5s]' : ''}`}
                />
            </div>
            <div className='py-2 text-center'>
                <p>{nameTrack}</p>
            </div>
            <div>
                {/* Управление */}
                <div className="flex flex-col items-center w-full md:w-1/3 gap-2">
                    <div className="flex items-center gap-6 py-6">
                        <button className="text-zinc-400 hover:text-white transition"><SkipBack fill="currentColor" size={50} /></button>
                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition"
                        >
                            {isPlaying ? <Pause size={50} fill="black" /> : <Play size={50} fill="black" className="ml-1" />}
                        </button>
                        <button
                            className="text-zinc-400 hover:text-white transition"
                            onClick={handleNextTrack}
                        >
                            <SkipForward fill="currentColor" size={50} />
                        </button>
                    </div>

                    {/* Ползунок прогресса */}
                    <div className="flex items-center gap-3 w-full group">
                        <span className="text-[20px] text-zinc-500 w-8 text-right">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleProgressChange}
                            className="flex-1 h-1.5 accent-amber-400  bg-zinc-700 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
                        />
                        <span className="text-[20px] text-zinc-500 w-8">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

        </div>

    )
}
