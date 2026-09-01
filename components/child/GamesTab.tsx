'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Trophy,
  Lightbulb,
  Heart,
  Flame,
  Volume2,
} from 'lucide-react';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import {
  getTodayScramble,
  ScrambleChallenge,
  MEMORY_CARDS_DECK,
  MemoryCard,
  getChildPoints,
  addPoints,
} from '@/lib/games';
import NestlingBlob from './NestlingBlob';

interface GamesTabProps {
  profile: ChildProfileData;
  onBackToHome: () => void;
}

type ActiveGame = 'scramble' | 'memory' | 'breathing';

export default function GamesTab({ profile, onBackToHome }: GamesTabProps) {
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[vibe];

  const [points, setPoints] = useState<number>(() => getChildPoints(profile.userId));
  const [selectedGame, setSelectedGame] = useState<ActiveGame>('scramble');

  // -----------------------------------------------------------------
  // 1. DAILY WORD SCRAMBLE STATE
  // -----------------------------------------------------------------
  const todayChallenge: ScrambleChallenge = getTodayScramble();
  const [scrambleTiles, setScrambleTiles] = useState<Array<{ id: number; char: string; used: boolean }>>(() =>
    todayChallenge.scrambled.map((char, idx) => ({ id: idx, char, used: false }))
  );
  const [answerSlots, setAnswerSlots] = useState<Array<{ tileId: number; char: string } | null>>(() =>
    Array(todayChallenge.word.length).fill(null)
  );
  const [isScrambleSolved, setIsScrambleSolved] = useState<boolean>(false);
  const [scrambleRewardClaimed, setScrambleRewardClaimed] = useState<boolean>(false);

  // -----------------------------------------------------------------
  // 2. MEMORY MATCH STATE
  // -----------------------------------------------------------------
  const [memoryCards, setMemoryCards] = useState<
    Array<{ id: number; pairId: string; emoji: string; label: string; flipped: boolean; matched: boolean }>
  >(() => {
    const doubleDeck = [...MEMORY_CARDS_DECK, ...MEMORY_CARDS_DECK]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        id: idx,
        pairId: item.pairId,
        emoji: item.emoji,
        label: item.label,
        flipped: false,
        matched: false,
      }));
    return doubleDeck;
  });
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [isMemorySolved, setIsMemorySolved] = useState<boolean>(false);
  const [memoryRewardClaimed, setMemoryRewardClaimed] = useState<boolean>(false);

  // -----------------------------------------------------------------
  // CELEBRATION OVERLAY STATE (+20 PTS)
  // -----------------------------------------------------------------
  const [celebration, setCelebration] = useState<{
    show: boolean;
    pointsAdded: number;
    factText: string;
    gameTitle: string;
  } | null>(null);

  // Handle tile click in scramble
  const handleTileClick = (tile: { id: number; char: string; used: boolean }) => {
    if (tile.used || isScrambleSolved) return;

    const firstEmptyIndex = answerSlots.findIndex((slot) => slot === null);
    if (firstEmptyIndex === -1) return;

    // Place tile into slot
    const updatedSlots = [...answerSlots];
    updatedSlots[firstEmptyIndex] = { tileId: tile.id, char: tile.char };
    setAnswerSlots(updatedSlots);

    // Mark tile as used
    setScrambleTiles((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t))
    );

    // Check if fully placed
    const placedWord = updatedSlots
      .map((s) => s?.char || '')
      .join('');

    if (placedWord.length === todayChallenge.word.length) {
      if (placedWord.toUpperCase() === todayChallenge.word.toUpperCase()) {
        setIsScrambleSolved(true);
        if (!scrambleRewardClaimed) {
          const newPts = addPoints(profile.userId, 20);
          setPoints(newPts);
          setScrambleRewardClaimed(true);
          setCelebration({
            show: true,
            pointsAdded: 20,
            factText: todayChallenge.fact,
            gameTitle: `${todayChallenge.day} Word Scramble: ${todayChallenge.word}!`,
          });
        }
      }
    }
  };

  // Handle removing a placed slot in scramble
  const handleSlotClick = (index: number) => {
    if (isScrambleSolved) return;
    const slot = answerSlots[index];
    if (!slot) return;

    const updatedSlots = [...answerSlots];
    updatedSlots[index] = null;
    setAnswerSlots(updatedSlots);

    setScrambleTiles((prev) =>
      prev.map((t) => (t.id === slot.tileId ? { ...t, used: false } : t))
    );
  };

  const handleResetScramble = () => {
    setScrambleTiles(todayChallenge.scrambled.map((char, idx) => ({ id: idx, char, used: false })));
    setAnswerSlots(Array(todayChallenge.word.length).fill(null));
    setIsScrambleSolved(false);
  };

  // Handle memory card flip
  const handleCardClick = (index: number) => {
    if (
      memoryCards[index].flipped ||
      memoryCards[index].matched ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    const updated = [...memoryCards];
    updated[index].flipped = true;
    setMemoryCards(updated);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      if (memoryCards[firstIdx].pairId === memoryCards[secondIdx].pairId) {
        // Matched!
        setTimeout(() => {
          setMemoryCards((prev) => {
            const matchedCards = prev.map((card, i) =>
              i === firstIdx || i === secondIdx ? { ...card, matched: true } : card
            );
            const allDone = matchedCards.every((c) => c.matched);
            if (allDone && !memoryRewardClaimed) {
              setIsMemorySolved(true);
              const newPts = addPoints(profile.userId, 20);
              setPoints(newPts);
              setMemoryRewardClaimed(true);
              setCelebration({
                show: true,
                pointsAdded: 20,
                factText: 'Exercising your memory helps your brain build strong superpower pathways!',
                gameTitle: 'Cosmic Memory Match Master!',
              });
            }
            return matchedCards;
          });
          setFlippedIndices([]);
        }, 400);
      } else {
        // Not matched, flip back
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((card, i) =>
              i === firstIdx || i === secondIdx ? { ...card, flipped: false } : card
            )
          );
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleResetMemory = () => {
    const doubleDeck = [...MEMORY_CARDS_DECK, ...MEMORY_CARDS_DECK]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        id: idx,
        pairId: item.pairId,
        emoji: item.emoji,
        label: item.label,
        flipped: false,
        matched: false,
      }));
    setMemoryCards(doubleDeck);
    setFlippedIndices([]);
    setIsMemorySolved(false);
  };

  return (
    <div id="games-tab-container" className="space-y-6 max-w-2xl mx-auto animate-fadeIn select-none">
      {/* -------------------------------------------------------------
          HEADER: "Daily Game" + Day/Game Type + Points Balance
          ------------------------------------------------------------- */}
      <div className="p-5 sm:p-6 rounded-[2rem] bg-white border-2 border-purple-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-all cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">
              Daily Game
            </span>
            <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              {todayChallenge.day} · Word Scramble
            </h2>
          </div>
        </div>

        {/* Top-Right Points Balance */}
        <div
          id="child-points-badge"
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/90 border-2 border-amber-300 text-amber-950 shadow-xs"
        >
          <Trophy className="w-4 h-4 text-amber-600 fill-amber-400" />
          <span className="font-black text-sm tracking-tight">{points} pts</span>
        </div>
      </div>

      {/* Mini-Game Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100/90 border border-stone-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setSelectedGame('scramble')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedGame === 'scramble'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>🦁</span>
          <span>Word Scramble</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedGame('memory')}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            selectedGame === 'memory'
              ? 'bg-white text-purple-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>🃏</span>
          <span>Memory Match</span>
        </button>
      </div>

      {/* -------------------------------------------------------------
          GAME 1: DAILY WORD SCRAMBLE
          ------------------------------------------------------------- */}
      {selectedGame === 'scramble' && (
        <div
          id="game-word-scramble"
          className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-purple-50/70 via-white to-purple-50/30 border-2 border-purple-200/90 shadow-sm space-y-6 text-center"
        >
          {/* Theme & Hint */}
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold">
              <span>{todayChallenge.emoji}</span>
              <span>Theme: {todayChallenge.theme}</span>
            </span>
            <p className="text-xs sm:text-sm font-semibold text-stone-600 max-w-md mx-auto">
              💡 Hint: "{todayChallenge.hint}"
            </p>
          </div>

          {/* Scrambled Letter Tiles at Top */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Tap letters to build the word:
            </span>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {scrambleTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={tile.used || isScrambleSolved}
                  onClick={() => handleTileClick(tile)}
                  className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-black text-xl sm:text-2xl transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95 ${
                    tile.used
                      ? 'bg-stone-100 text-stone-300 border-2 border-stone-200 opacity-40'
                      : 'bg-white hover:bg-purple-50 text-purple-900 border-2 border-purple-300 hover:border-purple-500 hover:scale-105'
                  }`}
                >
                  {tile.char}
                </button>
              ))}
            </div>
          </div>

          {/* Empty Answer Slots Below */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Your Answer:
            </span>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {answerSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isScrambleSolved || !slot}
                  onClick={() => handleSlotClick(idx)}
                  className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-black text-xl sm:text-2xl transition-all flex items-center justify-center shadow-xs cursor-pointer ${
                    isScrambleSolved
                      ? 'bg-emerald-500 text-white border-2 border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse'
                      : slot
                      ? 'bg-purple-600 text-white border-2 border-purple-700 hover:bg-purple-700'
                      : 'bg-stone-50 border-2 border-dashed border-stone-300 text-stone-400'
                  }`}
                >
                  {slot?.char || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetScramble}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Tiles</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          GAME 2: COSMIC MEMORY MATCH
          ------------------------------------------------------------- */}
      {selectedGame === 'memory' && (
        <div
          id="game-memory-match"
          className="p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 border-2 border-indigo-200/90 shadow-sm space-y-5 text-center"
        >
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black text-indigo-950">
              Cosmic Memory Match ✨
            </h3>
            <p className="text-xs font-semibold text-stone-500">
              Find matching pairs of magical star symbols!
            </p>
          </div>

          {/* 4x3 Grid of Cards */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-md mx-auto">
            {memoryCards.map((card, idx) => {
              const isVisible = card.flipped || card.matched;

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={card.matched || card.flipped}
                  onClick={() => handleCardClick(idx)}
                  className={`h-16 sm:h-20 rounded-2xl font-black text-2xl transition-all duration-300 flex items-center justify-center shadow-xs cursor-pointer ${
                    card.matched
                      ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-900 scale-95 opacity-80'
                      : isVisible
                      ? 'bg-white border-2 border-indigo-400 text-indigo-900 scale-105'
                      : 'bg-indigo-900 hover:bg-indigo-800 border-2 border-indigo-700 text-indigo-300'
                  }`}
                >
                  {isVisible ? card.emoji : '⭐'}
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetMemory}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Shuffle Cards</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          CELEBRATORY REWARD OVERLAY (+20 PTS)
          ------------------------------------------------------------- */}
      {celebration?.show && (
        <div
          id="game-celebration-overlay"
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white border-2 border-amber-300 p-6 sm:p-8 text-center space-y-4 shadow-2xl relative animate-scaleUp">
            {/* Mascot Blob reacting joyfully */}
            <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
              {vibeInfo.emoji}
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-sm animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>+20 Sparkle Points!</span>
              </div>
              <h3 className="text-xl font-black text-stone-900">
                You Did It, {nickname}! 🌟
              </h3>
            </div>

            {/* Short one-line fun fact related to answer */}
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200/80 text-xs font-semibold text-purple-900 leading-relaxed text-left flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-purple-950">Fun Fact:</span>
                <span>{celebration.factText}</span>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setCelebration(null)}
                className="flex-1 px-4 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all cursor-pointer"
              >
                Keep Playing 🎮
              </button>
              <button
                type="button"
                onClick={onBackToHome}
                className="flex-1 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Back to Home ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
