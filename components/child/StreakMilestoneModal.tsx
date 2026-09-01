'use client';

import React from 'react';
import { Flame, Sparkles, Trophy, ArrowRight, X } from 'lucide-react';
import { Badge } from '@/lib/gamification';
import { CompanionVibe, VIBE_DEFINITIONS } from '@/lib/childProfile';
import NestlingBlob from './NestlingBlob';

interface StreakMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: number;
  badge?: Badge | null;
  companionVibe?: CompanionVibe;
  companionName?: string;
  nickname?: string;
}

export default function StreakMilestoneModal({
  isOpen,
  onClose,
  days,
  badge,
  companionVibe = 'CHILL',
  companionName = 'Pip',
  nickname = 'Explorer',
}: StreakMilestoneModalProps) {
  if (!isOpen) return null;

  const vibeInfo = VIBE_DEFINITIONS[companionVibe];

  return (
    <div
      id="streak-milestone-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0C1E]/95 backdrop-blur-xl animate-fadeIn text-white select-none overflow-y-auto"
    >
      {/* Background Cosmic Star Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/5 w-72 h-72 rounded-full bg-indigo-600/30 blur-[90px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full bg-purple-600/30 blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/20 blur-[120px]" />
      </div>

      <div
        id="streak-milestone-modal-card"
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900/90 via-[#13152C] to-[#0D0F22] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6 animate-scaleUp z-10"
      >
        {/* Top Flame Glow Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-amber-500/30 blur-md animate-ping" />
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg border border-amber-300/40 relative">
              <Flame className="w-8 h-8 fill-white text-white drop-shadow" />
            </div>
          </div>
        </div>

        {/* Big Headline */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Streak Milestone Reached!</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 tracking-tight pt-2">
            {days} days.
          </h1>

          <p className="text-sm font-semibold text-slate-300">
            {badge ? `You earned the ${badge.name} badge.` : `Incredible dedication, ${nickname}!`}
          </p>
        </div>

        {/* Glowing Companion Illustration */}
        <div className="py-2 flex justify-center">
          <div className="relative p-4 rounded-3xl bg-indigo-950/60 border border-indigo-500/30 shadow-inner flex flex-col items-center gap-2">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-lg animate-pulse" />
              <NestlingBlob vibe={companionVibe} size="lg" interactive={true} showAura={true} />
            </div>
            <span className="text-xs font-bold text-indigo-300">
              {companionName} is super proud of you! ✨
            </span>
          </div>
        </div>

        {/* Badge Unlocked Subcard (if badge earned) */}
        {badge && (
          <div
            id="streak-milestone-badge-box"
            className="p-4 rounded-2xl bg-white/5 border border-indigo-400/30 backdrop-blur-sm flex items-center gap-3.5 text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl shadow-md border border-amber-300 flex-shrink-0">
              {badge.iconEmoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  New Badge Unlocked
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {badge.name}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-1">
                {badge.description}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            id="streak-milestone-dismiss-btn"
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm sm:text-base transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Keep going →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
