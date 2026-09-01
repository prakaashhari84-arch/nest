'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { TimestampedNote, InsightReport } from '@/lib/therapySubmissions';

interface TherapyVideoPlayerProps {
  videoUrl?: string;
  title?: string;
  initialSeekSeconds?: number;
  report?: InsightReport;
  compact?: boolean;
  onMomentClick?: (seconds: number) => void;
}

const PRACTICE_SCRIPT = [
  { start: 0, end: 3, speaker: 'Parent', text: '“Alright Leo, let’s tell Dr. Vance what we saw on our space adventure!”', emotion: 'warm' },
  { start: 3, end: 6, speaker: 'Leo', text: '“We flew past the giant Space Station!” (/s/ sound produced clearly)', emotion: 'focused', phoneme: '/s/' },
  { start: 6, end: 10, speaker: 'Parent', text: '“Wonderful clear /s/ sound! What was shining right next to it?”', emotion: 'praising' },
  { start: 10, end: 14, speaker: 'Leo', text: '“So many bright starzzz! ...I mean stars!” (Self-corrected)', emotion: 'happy', phoneme: '/z/ → /s/' },
  { start: 14, end: 16, speaker: 'Parent', text: '“Fantastic self-correction, Leo! High five!”', emotion: 'celebrating' },
];

export default function TherapyVideoPlayer({
  videoUrl,
  title = 'Recorded Home Practice Session',
  initialSeekSeconds = 0,
  report,
  compact = false,
  onMomentClick,
}: TherapyVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(initialSeekSeconds);
  const [duration, setDuration] = useState<number>(15);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [activePhonemeHighlight, setActivePhonemeHighlight] = useState<string | null>(null);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<any>(null);

  // Sync initial seek seconds when prop changes
  useEffect(() => {
    if (typeof initialSeekSeconds === 'number') {
      setCurrentTime(initialSeekSeconds);
      if (videoElementRef.current) {
        try {
          videoElementRef.current.currentTime = initialSeekSeconds;
        } catch (e) {}
      }
    }
  }, [initialSeekSeconds]);

  // Fallback interactive animation timer if video tag fails or is in simulator mode
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(duration, +(prev + 0.1).toFixed(1));
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration]);

  // Update current subtitle line & active phoneme
  const currentLine = PRACTICE_SCRIPT.find(
    (line) => currentTime >= line.start && currentTime <= line.end
  ) || PRACTICE_SCRIPT[0];

  const handleTogglePlay = () => {
    if (videoElementRef.current && !videoError) {
      if (isPlaying) {
        videoElementRef.current.pause();
        setIsPlaying(false);
      } else {
        videoElementRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // If browser blocks video play, seamlessly use the live visual simulator
            setVideoError(true);
            setIsPlaying(true);
          });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (videoElementRef.current && !videoError) {
      try {
        videoElementRef.current.currentTime = seconds;
      } catch (e) {}
    }
    if (onMomentClick) onMomentClick(seconds);
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));

  return (
    <div className={`rounded-2xl overflow-hidden bg-slate-950 text-white border border-slate-800 flex flex-col shadow-2xl ${compact ? 'max-w-md' : 'w-full'}`}>
      {/* Viewport Area */}
      <div className="relative aspect-video bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 flex flex-col items-center justify-center overflow-hidden select-none">
        
        {/* Real Video Element (if URL is valid) */}
        {videoUrl && !videoError && (
          <video
            ref={videoElementRef}
            src={videoUrl}
            playsInline
            preload="auto"
            muted={isMuted}
            className="absolute inset-0 w-full h-full object-contain z-10"
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
              if (e.currentTarget.duration) setDuration(e.currentTarget.duration);
            }}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              console.warn('Video source failed to load, switching to high-fidelity practice visualizer.');
              setVideoError(true);
            }}
          />
        )}

        {/* Live Practice Stage & Speech Articulation Visualizer */}
        <div className="absolute inset-0 flex flex-col items-center justify-between p-4 z-0 pointer-events-none">
          {/* Header Status Bar */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono opacity-80">
            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
              🔴 REC • HOME SESSION (15s)
            </span>
            <span className="bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700 font-bold">
              Target: /s/ & /z/ Articulation
            </span>
          </div>

          {/* Animated Characters Stage */}
          <div className="flex items-center justify-center gap-8 sm:gap-14 my-auto">
            {/* Parent Avatar */}
            <div className={`flex flex-col items-center gap-1.5 transition-transform duration-300 ${currentLine.speaker === 'Parent' ? 'scale-110' : 'opacity-70 scale-95'}`}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center text-2xl shadow-lg relative">
                👩
                {currentLine.speaker === 'Parent' && isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                Caregiver
              </span>
            </div>

            {/* Soundwave Bridge */}
            <div className="flex items-center gap-1">
              {[4, 10, 16, 8, 14, 6, 12, 18, 8, 4].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying
                      ? 'bg-indigo-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(4, (h * (Math.sin(currentTime * 4 + i) + 1.2)))}px` : '4px',
                  }}
                />
              ))}
            </div>

            {/* Leo (Child) Avatar */}
            <div className={`flex flex-col items-center gap-1.5 transition-transform duration-300 ${currentLine.speaker === 'Leo' ? 'scale-115' : 'opacity-70 scale-95'}`}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-600/40 border-2 border-indigo-400 flex items-center justify-center text-2xl shadow-xl relative">
                👦
                {currentLine.speaker === 'Leo' && (
                  <span className="absolute -bottom-2 bg-indigo-500 text-white font-mono text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md">
                    /s/ Target
                  </span>
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                Leo (9 yrs)
              </span>
            </div>
          </div>

          {/* Synchronized Real-Time Speech Subtitles */}
          <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 text-center space-y-1 shadow-lg pointer-events-auto">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-300">
              <span>{currentLine.speaker === 'Leo' ? '👦 Leo speaking' : '👩 Caregiver speaking'}</span>
              {currentLine.phoneme && (
                <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded text-[9px]">
                  {currentLine.phoneme}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-100 font-medium leading-relaxed">
              {currentLine.text}
            </p>
          </div>
        </div>

        {/* Big Center Play Overlay when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="absolute z-20 w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer active:scale-95"
            title="Play Video"
          >
            <Play className="w-7 h-7 ml-1" />
          </button>
        )}
      </div>

      {/* Video Control Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
        {/* Scrubber Bar */}
        <div
          className="relative w-full h-2 bg-slate-800 hover:h-3 rounded-full overflow-hidden cursor-pointer transition-all"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            handleSeek(clickPos * duration);
          }}
        >
          <div
            className="absolute top-0 left-0 bottom-0 bg-indigo-500 rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls and Timestamp Pills */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(0)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              title="Replay from start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <span className="font-mono text-slate-300 text-[11px]">
              00:{Math.floor(currentTime).toString().padStart(2, '0')} / 00:{Math.floor(duration).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Clickable Moment Markers Toolbar */}
      {report?.timestampedNotes && report.timestampedNotes.length > 0 && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Jump to Moment & Play:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {report.timestampedNotes.map((ts) => {
              const isCurrent = Math.abs(currentTime - ts.seconds) < 2;

              return (
                <button
                  key={ts.id}
                  type="button"
                  onClick={() => {
                    handleSeek(ts.seconds);
                    if (!isPlaying) handleTogglePlay();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md border border-indigo-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <Play className={`w-3 h-3 ${isCurrent ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="font-mono font-bold">{ts.timestamp}</span>
                  <span className="text-[10px] opacity-80">({ts.tag})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
