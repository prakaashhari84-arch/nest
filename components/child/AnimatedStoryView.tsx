'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Menu,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Compass,
  Star,
  Moon,
  Volume2,
} from 'lucide-react';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import {
  StoryChapter,
  ActiveStoryState,
  getActiveStoryState,
  advanceStoryChapter,
  resetStory,
  DEFAULT_COSMIC_STORY,
} from '@/lib/story';
import { awardChildPoints } from '@/lib/gamification';

interface AnimatedStoryViewProps {
  profile: ChildProfileData;
  onBackToHome: () => void;
}

export default function AnimatedStoryView({ profile, onBackToHome }: AnimatedStoryViewProps) {
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[vibe];

  const [storyState, setStoryState] = useState<ActiveStoryState>(() =>
    getActiveStoryState(profile.userId)
  );
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [pointsToast, setPointsToast] = useState<string | null>(null);

  const currentChapter: StoryChapter =
    storyState.history[storyState.currentChapterIndex]?.chapter ||
    DEFAULT_COSMIC_STORY[storyState.currentChapterIndex] ||
    DEFAULT_COSMIC_STORY[0];

  const progressPercent = Math.round(
    ((storyState.currentChapterIndex + 1) / storyState.totalChapters) * 100
  );

  const handleSelectChoice = async (choiceLabel: string) => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    try {
      const { state } = await advanceStoryChapter(profile.userId, choiceLabel);
      setStoryState({ ...state });

      // Award points for completing a story chapter (+15)
      const res = awardChildPoints(profile.userId, 'story_chapter_complete');
      setPointsToast(`+${res.awarded} pts • Story Chapter Complete!`);
      setTimeout(() => setPointsToast(null), 3000);
    } catch (err) {
      console.error('Failed to advance story:', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleResetStory = () => {
    const fresh = resetStory(profile.userId);
    setStoryState(fresh);
    setShowMenu(false);
  };


  return (
    <div
      id="animated-story-view"
      className="min-h-[620px] max-w-2xl mx-auto rounded-[2.5rem] bg-[#0B0E17] text-white border border-indigo-900/60 shadow-2xl overflow-hidden flex flex-col relative animate-fadeIn select-none"
    >
      {/* Background Cosmic Starfield & Nebula Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0B0E17] to-[#05070D] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* -------------------------------------------------------------
          TOP BAR: Back Arrow (Left), Progress Bar + Counter, Hamburger Menu
          ------------------------------------------------------------- */}
      <header className="relative z-20 px-5 py-4 border-b border-indigo-950/80 bg-[#0B0E17]/80 backdrop-blur-md flex items-center justify-between gap-3">
        {/* Left: Back Arrow */}
        <button
          id="story-back-btn"
          type="button"
          onClick={onBackToHome}
          className="p-2 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-200 hover:text-white transition-all cursor-pointer"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Center/Right: Thin Horizontal Progress Bar + "n / total" Counter */}
        <div className="flex-1 max-w-xs mx-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-indigo-950 border border-indigo-800/40 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-sky-300 whitespace-nowrap">
            {storyState.currentChapterIndex + 1} / {storyState.totalChapters}
          </span>
        </div>

        {/* Far Right: Hamburger / Menu Icon */}
        <div className="relative flex items-center gap-2">
          {pointsToast && (
            <div className="absolute right-12 top-0 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-lg whitespace-nowrap animate-bounce z-30">
              {pointsToast}
            </div>
          )}
          <button
            id="story-menu-btn"
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 text-indigo-200 hover:text-white transition-all cursor-pointer"
            title="Story Options"
          >
            <Menu className="w-4 h-4" />
          </button>


          {/* Menu Dropdown */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#13172B] border border-indigo-800 shadow-xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
              <button
                type="button"
                onClick={handleResetStory}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-900/60 text-indigo-200 hover:text-white flex items-center gap-2 font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Start from Chapter 1</span>
              </button>
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-900/60 text-indigo-200 hover:text-white flex items-center gap-2 font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit to Home</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* -------------------------------------------------------------
          MAIN STORY BODY
          ------------------------------------------------------------- */}
      <div className="relative z-10 flex-1 p-5 sm:p-7 flex flex-col justify-between space-y-5 overflow-y-auto">
        <div className="space-y-4">
          {/* Chapter Label & Bold Title */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 font-mono">
              Chapter {currentChapter.chapterNumber}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {currentChapter.title}
            </h2>
          </div>

          {/* Large Illustrated Cosmic Panel */}
          <div
            id="story-illustrated-panel"
            className="relative h-44 sm:h-52 w-full rounded-3xl overflow-hidden border border-indigo-700/60 shadow-lg flex items-center justify-center p-6 bg-gradient-to-br from-indigo-950 via-[#161B33] to-[#0A0D1A]"
          >
            {/* Animated Background Rings & Star Specks */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent animate-pulse" />
            <div className="absolute top-3 left-4 text-xs opacity-60">✨</div>
            <div className="absolute bottom-4 right-6 text-sm opacity-60">⭐</div>
            <div className="absolute top-6 right-10 text-xs opacity-40">🌌</div>

            {/* Central Animated Illustration Scene */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-900/80 border-2 border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.5)] flex items-center justify-center text-3xl animate-bounce">
                {currentChapter.illustration.ambientEmoji}
              </div>
              <div className="flex items-center gap-2 bg-indigo-950/90 border border-indigo-700/80 px-3.5 py-1 rounded-full text-xs font-bold text-sky-200">
                <span>{vibeInfo.emoji} {companionName}</span>
                <span>•</span>
                <span>{nickname}</span>
              </div>
            </div>
          </div>

          {/* 2-4 Sentences of Narrative Text */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/50 border border-indigo-900/80 backdrop-blur-xs">
            <p className="text-sm sm:text-base font-medium text-indigo-100 leading-relaxed">
              {currentChapter.narrative}
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------
            CHOICE POINT: "What happens next?" + Stacked Buttons with Glow
            ------------------------------------------------------------- */}
        <div className="space-y-3 pt-2">
          {!currentChapter.isCompleted ? (
            <>
              <h3 className="text-xs sm:text-sm font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400 animate-spin" />
                <span>What happens next?</span>
              </h3>

              <div className="space-y-2.5">
                {currentChapter.choices.map((choice) => {
                  const isSuggested = choice.isSuggested;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={isAdvancing}
                      onClick={() => handleSelectChoice(choice.label)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between gap-3 group active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                        isSuggested
                          ? 'bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-indigo-900/90 text-white border-2 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:border-sky-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'
                          : 'bg-[#12162B] hover:bg-[#1A203B] text-indigo-200 hover:text-white border border-indigo-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg p-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center">
                          {choice.icon}
                        </span>
                        <span>{choice.label}</span>
                      </div>

                      {isSuggested && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-400 text-indigo-950 whitespace-nowrap shadow-xs">
                          ⭐ Suggested
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Story Completion Victory Card */
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-indigo-950 to-emerald-950/80 border border-emerald-500/60 text-center space-y-3 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400 flex items-center justify-center mx-auto text-2xl">
                🌟
              </div>
              <h3 className="text-base font-black text-white">
                Quest Completed! +20 Sparkle Points Earned!
              </h3>
              <p className="text-xs text-emerald-200">
                You and {companionName} completed today's brave adventure!
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetStory}
                  className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-indigo-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Play Again 🔄
                </button>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-indigo-950 text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Return Home ✨
                </button>
              </div>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------------
            DOT PAGINATION AT THE VERY BOTTOM
            ------------------------------------------------------------- */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-indigo-950">
          {Array.from({ length: storyState.totalChapters }).map((_, idx) => {
            const isCurrent = idx === storyState.currentChapterIndex;
            const isPassed = idx < storyState.currentChapterIndex;

            return (
              <span
                key={idx}
                className={`transition-all rounded-full ${
                  isCurrent
                    ? 'w-6 h-2 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                    : isPassed
                    ? 'w-2 h-2 bg-indigo-400'
                    : 'w-2 h-2 bg-indigo-950 border border-indigo-800'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
