'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Gamepad2,
  MessageCircle,
  User,
  Settings,
  Flame,
  MapPin,
  TrendingUp,
  Smile,
  Lightbulb,
  ArrowRight,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import { PlaceType, getMoodEntries } from '@/lib/mood';
import {
  getTodayScramble,
  JOKES_COLLECTION,
  FUN_FACTS_COLLECTION,
  getChildPoints,
} from '@/lib/games';
import {
  getChildPointsBalance,
  getStreakRecord,
  recordChildActivity,
  Badge,
} from '@/lib/gamification';
import { getActiveStoryState } from '@/lib/story';
import NestlingBlob from './NestlingBlob';
import ChildSettingsModal from './ChildSettingsModal';
import ChildProfileView from './ChildProfileView';
import CompanionChatView from './CompanionChatView';
import AnimatedStoryView from './AnimatedStoryView';
import GamesTab from './GamesTab';
import MoodSparkline from '../mood-sparkline';
import StreakMilestoneModal from './StreakMilestoneModal';

interface SixToTenShellProps {
  profile: ChildProfileData;
  onLogout: () => void;
  onTriggerMoodCheckin?: () => void;
}

type TabKey = 'home' | 'story' | 'games' | 'chat' | 'profile';

export default function SixToTenShell({
  profile,
  onLogout,
  onTriggerMoodCheckin,
}: SixToTenShellProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [companionDialogue, setCompanionDialogue] = useState<string | null>(null);

  // Gamification states
  const [streakRecord, setStreakRecord] = useState(() => getStreakRecord(profile.userId));
  const [pointsBalance, setPointsBalance] = useState<number>(() =>
    getChildPointsBalance(profile.userId)
  );
  const [milestoneCelebration, setMilestoneCelebration] = useState<{
    days: number;
    badge?: Badge | null;
  } | null>(null);

  // Check activity streak on load
  React.useEffect(() => {
    const res = recordChildActivity(profile.userId);
    setStreakRecord(res.streakRecord);
    setPointsBalance(getChildPointsBalance(profile.userId));
    if (res.newMilestone) {
      setMilestoneCelebration(res.newMilestone);
    }
  }, [profile.userId, activeTab]);

  // Home Card interactive states for Joke and Fact
  const [jokeIndex, setJokeIndex] = useState<number>(0);
  const [showPunchline, setShowPunchline] = useState<boolean>(false);
  const [factIndex, setFactIndex] = useState<number>(0);


  // Companion Chat context passed from "Your Places" Not Great -> "Talk about it"
  const [chatContext, setChatContext] = useState<{
    place?: PlaceType;
    label?: string;
    note?: string;
  } | null>(null);

  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[vibe];
  const moodEntries = getMoodEntries(profile.userId);

  // Dynamic Data for Home Screen Cards
  const todayScramble = getTodayScramble();
  const storyProgress = getActiveStoryState(profile.userId);
  const currentPoints = getChildPoints(profile.userId);
  const activeJoke = JOKES_COLLECTION[jokeIndex % JOKES_COLLECTION.length];
  const activeFact = FUN_FACTS_COLLECTION[factIndex % FUN_FACTS_COLLECTION.length];

  const handleCompanionPoke = () => {
    const dialogues: Record<typeof vibe, string[]> = {
      CHILL: [
        `"Breathe in slow... and out! You are doing wonderful." 🌿`,
        `"No hurry, ${nickname}! We have all the time in the world." ☁️`,
        `"Just chilling here with you is my favorite thing!" 🍃`,
      ],
      HYPE: [
        `"WOOHOO! Let's make today super exciting! ⚡"`,
        `"High five, ${nickname}! You've got magic inside you! 🌟"`,
        `"Ready for an epic quest?! Let's go!" 🚀`,
      ],
      COZY: [
        `"Sending you the biggest, warmest soft hug! 🧸💛"`,
        `"You are safe, loved, and wonderful just as you are." 🌸`,
        `"I'm right beside you, ${nickname}." ☕`,
      ],
      COOL: [
        `"Did you know? Octopuses have three hearts! Cool, right? 🐙✨"`,
        `"Looking sharp today, ${nickname}! What shall we explore?" 🔭`,
        `"Curiosity is your superpower." 💡`,
      ],
    };
    const options = dialogues[vibe] || dialogues.CHILL;
    const picked = options[Math.floor(Math.random() * options.length)];
    setCompanionDialogue(picked);
  };

  const handleOpenChatWithContext = (context: {
    place: PlaceType;
    label: string;
    note?: string;
  }) => {
    setChatContext(context);
    setActiveTab('chat');
  };

  const navTabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'home', label: 'Home', icon: <Sparkles className="w-7 h-7" /> },
    { key: 'story', label: 'Story', icon: <BookOpen className="w-7 h-7" /> },
    { key: 'games', label: 'Games', icon: <Gamepad2 className="w-7 h-7" /> },
    { key: 'chat', label: 'Chat', icon: <MessageCircle className="w-7 h-7" /> },
    { key: 'profile', label: 'Profile', icon: <User className="w-7 h-7" /> },
  ];

  return (
    <div
      id="six-to-ten-shell"
      className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 selection:bg-purple-200"
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-purple-100/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Companion & Child Mini Chip */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl bg-purple-100 border-2 border-purple-200/80 flex items-center justify-center text-lg shadow-xs cursor-pointer active:scale-95 transition-transform"
              onClick={handleCompanionPoke}
              title={`Tap ${companionName}!`}
            >
              {vibeInfo.emoji}
            </div>
            <div className="leading-tight">
              <span className="text-xs font-black text-purple-900 block tracking-tight">
                {nickname} & {companionName}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full inline-block">
                Explorer
              </span>
            </div>
          </div>

          {/* Right: Points, Streak Indicator & Settings Button */}
          <div className="flex items-center gap-2.5">
            {/* Points Badge */}
            <div
              id="six-to-ten-points-badge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-900 shadow-xs cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={() => setActiveTab('profile')}
              title="Your Sparkle Points! (Click to visit rewards shop)"
            >
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="font-black text-xs sm:text-sm">{pointsBalance} pts</span>
            </div>

            {/* Streak Indicator */}
            <div
              id="six-to-ten-streak-badge"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-orange-50 border-2 border-orange-200 text-orange-950 shadow-xs cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={onTriggerMoodCheckin}
              title="Your daily streak & check-in!"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 fill-orange-400 animate-pulse" />
              <span className="font-black text-xs sm:text-sm tracking-tight">{streakRecord.currentStreak}</span>
            </div>

            {/* Settings Button */}
            <button
              id="six-to-ten-settings-btn"
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-2xl bg-white border-2 border-stone-200/80 hover:border-purple-300 text-stone-600 hover:text-purple-700 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-28 space-y-6">
        {/* =============================================================
            TAB 1: SIX_TO_TEN HOME VIEW (Matched to Reference Layout)
            ============================================================= */}
        {activeTab === 'home' && (
          <div id="six-to-ten-home-view" className="space-y-6 animate-fadeIn">
            {/* 1. GREETING CARD AT TOP */}
            <section
              id="six-to-ten-greeting-card"
              className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-50 via-white to-amber-50/40 border-2 border-purple-100/90 p-6 sm:p-8 shadow-sm"
            >
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-200/30 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-amber-200/30 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                {/* Companion illustration */}
                <div
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                  onClick={handleCompanionPoke}
                  title={`Tap ${companionName} to play!`}
                >
                  <div className="p-4 rounded-3xl bg-white/90 border border-purple-100 shadow-sm flex items-center justify-center">
                    <NestlingBlob
                      vibe={vibe}
                      size="lg"
                      interactive={true}
                      showAura={true}
                    />
                  </div>
                </div>

                {/* Greeting text + Prompt */}
                <div className="flex-1 text-center md:text-left space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                    <span>Day 3 Streak!</span>
                    <span>•</span>
                    <span>{companionName} is smiling</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-tight">
                    Hey, {nickname}! 👋
                  </h1>

                  <p className="text-base sm:text-lg font-black text-purple-950">
                    What do you want to do?
                  </p>

                  {companionDialogue && (
                    <div className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-xs text-xs sm:text-sm font-semibold text-stone-800 animate-fadeIn">
                      {companionDialogue}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 2. HORIZONTAL ROW OF MODE CHIPS (Game / Story / Joke / Fact / Chat) */}
            <section id="six-to-ten-mode-chips" className="space-y-1">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setActiveTab('games')}
                  className="flex-1 min-w-[100px] py-3 px-4 rounded-2xl bg-white hover:bg-purple-50 text-stone-800 border-2 border-purple-100 hover:border-purple-300 font-black text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="text-lg">🎮</span>
                  <span>Game</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('story')}
                  className="flex-1 min-w-[100px] py-3 px-4 rounded-2xl bg-white hover:bg-purple-50 text-stone-800 border-2 border-purple-100 hover:border-purple-300 font-black text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="text-lg">📖</span>
                  <span>Story</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setJokeIndex((prev) => prev + 1);
                    setShowPunchline(false);
                  }}
                  className="flex-1 min-w-[100px] py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 text-stone-800 border-2 border-amber-100 hover:border-amber-300 font-black text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="text-lg">😂</span>
                  <span>Joke</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFactIndex((prev) => prev + 1)}
                  className="flex-1 min-w-[100px] py-3 px-4 rounded-2xl bg-white hover:bg-emerald-50 text-stone-800 border-2 border-emerald-100 hover:border-emerald-300 font-black text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="text-lg">💡</span>
                  <span>Fact</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className="flex-1 min-w-[100px] py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  <span className="text-lg">💬</span>
                  <span>Chat</span>
                </button>
              </div>
            </section>

            {/* 3. 2-COLUMN CARD GRID: TODAY'S GAME, STORY, JOKE, AND DID YOU KNOW */}
            <section id="six-to-ten-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Today's Specific Game */}
              <div
                id="home-card-daily-game"
                className="p-5 rounded-[2rem] bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all hover:scale-[1.01]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full">
                      Daily Game
                    </span>
                    <span className="text-xs font-black text-amber-700">
                      +20 pts
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-stone-900">
                    {todayScramble.day} · Word Scramble
                  </h3>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed">
                    Unscramble today's magic letters with {companionName}!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('games')}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play Today's Game</span>
                </button>
              </div>

              {/* Card 2: Story-in-Progress */}
              <div
                id="home-card-story-progress"
                className="p-5 rounded-[2rem] bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40 border-2 border-indigo-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all hover:scale-[1.01]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100/90 px-2.5 py-0.5 rounded-full">
                      Cosmic Story
                    </span>
                    <span className="text-xs font-black text-indigo-700">
                      Chapter {storyProgress.currentChapterIndex + 1} of {storyProgress.totalChapters}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-stone-900">
                    {storyProgress.title}
                  </h3>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed">
                    Choose what happens next on your starlight adventure!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('story')}
                  className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Continue Adventure</span>
                </button>
              </div>

              {/* Card 3: Joke of the Day */}
              <div
                id="home-card-joke-of-day"
                className="p-5 rounded-[2rem] bg-white border-2 border-rose-100 shadow-sm flex flex-col justify-between space-y-3 hover:border-rose-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                      Joke of the Day 😂
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setJokeIndex((prev) => prev + 1);
                        setShowPunchline(false);
                      }}
                      className="text-[10px] font-bold text-stone-400 hover:text-stone-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Next
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-stone-800">
                    "{activeJoke.setup}"
                  </p>
                  {showPunchline ? (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900 animate-fadeIn">
                      {activeJoke.punchline}
                    </div>
                  ) : null}
                </div>

                {!showPunchline && (
                  <button
                    type="button"
                    onClick={() => setShowPunchline(true)}
                    className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-all cursor-pointer"
                  >
                    Tap to see punchline! ✨
                  </button>
                )}
              </div>

              {/* Card 4: Did You Know? */}
              <div
                id="home-card-did-you-know"
                className="p-5 rounded-[2rem] bg-white border-2 border-emerald-100 shadow-sm flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Did you know? 💡
                    </span>
                    <button
                      type="button"
                      onClick={() => setFactIndex((prev) => prev + 1)}
                      className="text-[10px] font-bold text-stone-400 hover:text-stone-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Next
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-stone-700 leading-relaxed">
                    {activeFact.fact}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700">
                  Topic: {activeFact.topic}
                </span>
              </div>
            </section>

            {/* 4. FINAL FULL-WIDTH PROMPT CARD AT THE BOTTOM */}
            <section
              id="six-to-ten-talk-prompt-card"
              onClick={() => setActiveTab('chat')}
              className="p-5 sm:p-6 rounded-[2.5rem] bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 text-white shadow-md flex items-center justify-between gap-4 cursor-pointer hover:shadow-lg hover:scale-[1.008] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl flex-shrink-0">
                  💬
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    Want to talk about your day? No pressure.
                  </h3>
                  <p className="text-xs text-purple-200 font-medium">
                    {companionName} is right here to listen anytime.
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-white text-purple-900 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ArrowRight className="w-5 h-5" />
              </div>
            </section>
          </div>
        )}

        {/* =============================================================
            TAB 2: ANIMATED STORY ADVENTURE (Dark Cosmic Register)
            ============================================================= */}
        {activeTab === 'story' && (
          <AnimatedStoryView
            profile={profile}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* =============================================================
            TAB 3: GAMES & FUN LEARNING TAB
            ============================================================= */}
        {activeTab === 'games' && (
          <GamesTab
            profile={profile}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* =============================================================
            TAB 4: CHAT WITH COMPANION
            ============================================================= */}
        {activeTab === 'chat' && (
          <CompanionChatView
            profile={profile}
            initialContext={chatContext}
            onBackToHome={() => {
              setChatContext(null);
              setActiveTab('home');
            }}
          />
        )}

        {/* =============================================================
            TAB 5: PROFILE & PLACES CHECK-IN
            ============================================================= */}
        {activeTab === 'profile' && (
          <ChildProfileView
            profile={profile}
            onOpenCompanionChatWithContext={handleOpenChatWithContext}
            onTriggerMoodCheckin={onTriggerMoodCheckin}
            onBackToHome={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Large Icon-Based Bottom Nav with Active-Tab Indicator Dot */}
      <nav
        id="six-to-ten-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t-2 border-purple-100 px-4 py-2.5 shadow-lg"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`six-to-ten-nav-${tab.key}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-purple-700 font-black scale-110'
                    : 'text-stone-400 hover:text-purple-600 hover:scale-105'
                }`}
                aria-label={tab.label}
              >
                {tab.icon}

                <span className="text-[10px] font-bold mt-0.5 tracking-tight">
                  {tab.label}
                </span>

                {isActive ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1 animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings Modal (Logout Only) */}
      <ChildSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={onLogout}
        nickname={nickname}
        companionName={companionName}
      />

      {/* Streak Milestone Celebration Modal */}
      {milestoneCelebration && (
        <StreakMilestoneModal
          isOpen={!!milestoneCelebration}
          onClose={() => setMilestoneCelebration(null)}
          days={milestoneCelebration.days}
          badge={milestoneCelebration.badge}
          companionVibe={vibe}
          companionName={companionName}
          nickname={nickname}
        />
      )}
    </div>
  );
}
