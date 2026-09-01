'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Flame,
  Coins,
  BookOpen,
  Lock,
  CheckCircle2,
  Trophy,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import YourPlacesCheckin from './YourPlacesCheckin';
import MoodSparkline from '../mood-sparkline';
import { getMoodEntries, PlaceType } from '@/lib/mood';
import NestlingBlob from './NestlingBlob';
import {
  BADGES_CATALOG,
  COSMETICS_CATALOG,
  getChildPointsBalance,
  getStreakRecord,
  getChildBadges,
  getChildPurchases,
  getWeeklyStreakDays,
  purchaseCosmeticItem,
  getEquippedTheme,
  setEquippedTheme,
  getPointsLedger,
  CosmeticItem,
  Badge,
} from '@/lib/gamification';

interface ChildProfileViewProps {
  profile: ChildProfileData;
  onOpenCompanionChatWithContext?: (placeContext: {
    place: PlaceType;
    label: string;
    note?: string;
  }) => void;
  onTriggerMoodCheckin?: () => void;
  onBackToHome?: () => void;
}

export default function ChildProfileView({
  profile,
  onOpenCompanionChatWithContext,
  onTriggerMoodCheckin,
  onBackToHome,
}: ChildProfileViewProps) {
  const isYounger = profile.ageGroup === 'SIX_TO_TEN';
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[vibe];

  // Gamification state
  const [pointsBalance, setPointsBalance] = useState<number>(() =>
    getChildPointsBalance(profile.userId)
  );
  const [streakRecord, setStreakRecord] = useState(() => getStreakRecord(profile.userId));
  const [childBadges, setChildBadges] = useState(() => getChildBadges(profile.userId));
  const [purchases, setPurchases] = useState(() => getChildPurchases(profile.userId));
  const [equippedTheme, setLocalEquippedTheme] = useState<string>(() =>
    getEquippedTheme(profile.userId)
  );
  const [shopFeedback, setShopFeedback] = useState<{ msg: string; success: boolean } | null>(null);
  const [showAllBadgesModal, setShowAllBadgesModal] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'PLACES' | 'MOOD_HISTORY'>('OVERVIEW');

  const moodEntries = getMoodEntries(profile.userId);
  const ledger = getPointsLedger(profile.userId);
  const chaptersReadCount = ledger.filter((e) => e.reason === 'story_chapter_complete').length || 1;
  const weeklyDays = getWeeklyStreakDays(profile.userId);

  const earnedBadgeKeys = new Set(childBadges.map((b) => b.badgeKey));
  const ownedItemIds = new Set(purchases.map((p) => p.cosmeticItemId));

  const handlePurchase = (item: CosmeticItem) => {
    const result = purchaseCosmeticItem(profile.userId, item.id);
    setShopFeedback({ msg: result.message, success: result.success });
    if (result.success) {
      setPointsBalance(result.newBalance);
      setPurchases(getChildPurchases(profile.userId));
      setLocalEquippedTheme(item.themeValue);
    }
    setTimeout(() => {
      setShopFeedback(null);
    }, 4000);
  };

  const handleEquipTheme = (themeValue: string) => {
    setEquippedTheme(profile.userId, themeValue);
    setLocalEquippedTheme(themeValue);
  };

  return (
    <div id="child-profile-view-container" className="space-y-6 animate-fadeIn pb-12">
      {/* 1. HEADER CARD (Companion avatar, Nickname, Streak / Points / Chapters-read stats row) */}
      <section
        id="child-profile-hero"
        className={`p-6 sm:p-7 bg-white border shadow-xs relative overflow-hidden ${
          isYounger ? 'rounded-[2rem] border-purple-100' : 'rounded-3xl border-indigo-100'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center relative">
              <NestlingBlob vibe={vibe} size="md" interactive={true} showAura={true} />
              {equippedTheme !== 'default' && (
                <span className="absolute -top-1 -right-1 text-base animate-bounce">👑</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {nickname}
                </h1>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800">
                  {profile.age} yrs • {profile.grade || 'Explorer'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Companion: <strong className="text-slate-800">{companionName}</strong> ({vibeInfo.name} Vibe {vibeInfo.emoji})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onTriggerMoodCheckin && (
              <button
                type="button"
                onClick={onTriggerMoodCheckin}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Daily Check-In</span>
              </button>
            )}
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            )}
          </div>
        </div>

        {/* STATS ROW: Streak / Points / Chapters Read */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          {/* Stat 1: Streak */}
          <div
            id="profile-stat-streak"
            className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col items-center sm:items-start"
          >
            <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Current Streak</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
              {streakRecord.currentStreak} Days
            </span>
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
              Longest: {streakRecord.longestStreak} days
            </span>
          </div>

          {/* Stat 2: Points Balance */}
          <div
            id="profile-stat-points"
            className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col items-center sm:items-start"
          >
            <div className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold">
              <Coins className="w-4 h-4 text-indigo-600" />
              <span>Points Balance</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1">
              {pointsBalance} pts
            </span>
            <span className="text-[10px] text-indigo-700 font-semibold mt-0.5">
              Available to spend
            </span>
          </div>

          {/* Stat 3: Chapters Read */}
          <div
            id="profile-stat-chapters"
            className="p-3.5 sm:p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex flex-col items-center sm:items-start"
          >
            <div className="flex items-center gap-1.5 text-purple-900 text-xs font-bold">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Stories Read</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-purple-950 mt-1">
              {chaptersReadCount}
            </span>
            <span className="text-[10px] text-purple-700 font-semibold mt-0.5">
              Adventures finished
            </span>
          </div>
        </div>

        {/* Nav Sub-tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'OVERVIEW'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Badges & Rewards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('PLACES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'PLACES'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>📍</span>
            <span>Your Places</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('MOOD_HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'MOOD_HISTORY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>📈</span>
            <span>Mood History</span>
          </button>
        </div>
      </section>

      {/* OVERVIEW: GAMIFICATION HIGHLIGHTS */}
      {activeSection === 'OVERVIEW' && (
        <div className="space-y-6 animate-fadeIn">
          {/* 2. WEEKLY STREAK PROGRESS BAR WITH CHECKMARKS */}
          <section
            id="child-profile-weekly-streak"
            className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  This Week's Activity Progress
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {streakRecord.currentStreak}-Day Streak Active
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Check in with {companionName} or play a daily game to keep your flame burning strong!
            </p>

            {/* 7-Day Visual Tracker Row */}
            <div className="grid grid-cols-7 gap-2 pt-2">
              {weeklyDays.map((day) => (
                <div
                  key={day.dayLabel}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between gap-1 transition-all ${
                    day.isCompleted
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                      : day.isToday
                      ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">{day.dayLabel}</span>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center">
                    {day.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : day.isToday ? (
                      <Flame className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. BADGES SECTION (Horizontal scroll, locked grayed out with lock icon, "See all" link) */}
          <section
            id="child-profile-badges-section"
            className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Your Badges ({childBadges.length}/{BADGES_CATALOG.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllBadgesModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>See all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Horizontal Scroll of Badges */}
            <div className="flex items-center gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
              {BADGES_CATALOG.map((badge) => {
                const isEarned = earnedBadgeKeys.has(badge.key);
                return (
                  <div
                    key={badge.id}
                    className={`flex-shrink-0 w-36 sm:w-40 p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all ${
                      isEarned
                        ? 'bg-gradient-to-b from-amber-50/60 to-white border-amber-200 shadow-2xs hover:scale-105'
                        : 'bg-slate-50/80 border-slate-200/80 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl relative shadow-xs ${
                        isEarned
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white border border-amber-300'
                          : 'bg-slate-200 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isEarned ? (
                        badge.iconEmoji
                      ) : (
                        <Lock className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <span className="font-extrabold text-xs text-slate-900 block line-clamp-1">
                        {badge.name}
                      </span>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                        {badge.description}
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isEarned
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isEarned ? 'Unlocked ✨' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. SPEND POINTS: COSMETIC REWARDS SHOP (Horizontal scroll of CosmeticItem cards) */}
          <section
            id="child-profile-cosmetics-shop"
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-2 border-indigo-100 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Spend Points • Cosmetic Rewards Shop
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-extrabold text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                <Coins className="w-3.5 h-3.5" />
                <span>{pointsBalance} pts</span>
              </div>
            </div>

            {shopFeedback && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                  shopFeedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {shopFeedback.success ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Info className="w-4 h-4 text-rose-600" />
                )}
                <span>{shopFeedback.msg}</span>
              </div>
            )}

            <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-thin">
              {COSMETICS_CATALOG.map((item) => {
                const isOwned = ownedItemIds.has(item.id);
                const isEquipped = equippedTheme === item.themeValue;
                const canAfford = pointsBalance >= item.costPoints;

                return (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-44 sm:w-48 p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-2xl">
                        {item.iconEmoji}
                      </div>

                      <div>
                        <span className="font-black text-xs text-slate-900 block">
                          {item.name}
                        </span>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400 capitalize">{item.category}</span>
                        <span className="text-indigo-600 flex items-center gap-0.5">
                          <Coins className="w-3 h-3" />
                          <span>{item.costPoints} pts</span>
                        </span>
                      </div>

                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => handleEquipTheme(item.themeValue)}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isEquipped
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                        >
                          {isEquipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Equipped</span>
                            </>
                          ) : (
                            <span>Equip</span>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford}
                          className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            canAfford
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs active:scale-95'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{canAfford ? 'Unlock Item' : 'Need Points'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* PLACES CHECKIN TAB */}
      {activeSection === 'PLACES' && (
        <YourPlacesCheckin
          profile={profile}
          onOpenCompanionChatWithContext={onOpenCompanionChatWithContext}
        />
      )}

      {/* MOOD HISTORY TAB */}
      {activeSection === 'MOOD_HISTORY' && (
        <div className="space-y-4 animate-fadeIn">
          <MoodSparkline entries={moodEntries} maxDays={14} />

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Recent Session Records
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {moodEntries
                .slice()
                .reverse()
                .slice(0, 5)
                .map((entry) => (
                  <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {entry.mood === 'HAPPY' ? '😊' : entry.mood === 'MILD' ? '😐' : '😢'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 capitalize">
                            {entry.mood.toLowerCase()}
                          </span>
                          {entry.priorityFlag && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold text-[9px]">
                              Priority Flag
                            </span>
                          )}
                        </div>
                        {(entry.promptStarter || entry.note) && (
                          <p className="text-slate-500 italic text-[11px]">
                            {entry.promptStarter ? `"${entry.promptStarter}"` : ''}{' '}
                            {entry.note ? `— ${entry.note}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* "SEE ALL BADGES" MODAL */}
      {showAllBadgesModal && (
        <div
          id="see-all-badges-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-slate-900">
                  All Badges Catalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllBadgesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BADGES_CATALOG.map((badge) => {
                const isEarned = earnedBadgeKeys.has(badge.key);
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                      isEarned
                        ? 'bg-amber-50/50 border-amber-200 text-slate-900'
                        : 'bg-slate-50 border-slate-200/80 opacity-60 text-slate-500'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        isEarned
                          ? 'bg-amber-400 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isEarned ? badge.iconEmoji : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs block text-slate-900">
                        {badge.name}
                      </span>
                      <p className="text-[10px] leading-tight text-slate-500">
                        {badge.description}
                      </p>
                      <span
                        className={`inline-block text-[9px] font-bold mt-1 px-2 py-0.2 rounded-full ${
                          isEarned
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isEarned ? 'Earned' : 'Locked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
