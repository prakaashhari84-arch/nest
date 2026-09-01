'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Settings,
  Sparkles,
  BookOpen,
  TrendingUp,
  Feather,
  Compass,
  MapPin,
  MessageCircle,
  GraduationCap,
  ArrowRight,
  Send,
  HelpCircle,
  Clock,
  HeartHandshake,
  CheckCircle2,
  Trophy,
  User,
} from 'lucide-react';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import { PlaceType, getMoodEntries } from '@/lib/mood';
import { getDailyExpressionPrompt } from '@/lib/expressionPrompts';
import { getActivityLogs } from '@/lib/activityLog';
import { getContextualLifeSkills } from '@/lib/learningAndSkills';
import {
  getChildPointsBalance,
  getStreakRecord,
  recordChildActivity,
  awardChildPoints,
  Badge,
} from '@/lib/gamification';
import NestlingBlob from './NestlingBlob';
import ChildSettingsModal from './ChildSettingsModal';
import YourPlacesCheckin from './YourPlacesCheckin';
import CompanionChatView from './CompanionChatView';
import ActivityLogView from './ActivityLogView';
import LearnExplainerView from './LearnExplainerView';
import GrowLifeSkillsView from './GrowLifeSkillsView';
import ChildProfileView from './ChildProfileView';
import StreakMilestoneModal from './StreakMilestoneModal';
import MoodSparkline from '../mood-sparkline';

interface TenToFourteenShellProps {
  profile: ChildProfileData;
  onLogout: () => void;
  onTriggerMoodCheckin?: () => void;
}

export type TenToFourteenTabKey = 'home' | 'log' | 'learn' | 'grow' | 'places' | 'chat' | 'profile';

export default function TenToFourteenShell({
  profile,
  onLogout,
  onTriggerMoodCheckin,
}: TenToFourteenShellProps) {
  const [activeTab, setActiveTab] = useState<TenToFourteenTabKey>('home');
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

  // Check activity streak on load or tab change
  useEffect(() => {
    const res = recordChildActivity(profile.userId);
    setStreakRecord(res.streakRecord);
    setPointsBalance(getChildPointsBalance(profile.userId));
    if (res.newMilestone) {
      setMilestoneCelebration(res.newMilestone);
    }
  }, [profile.userId, activeTab]);

  // Daily Expression Prompt State
  const dailyPrompt = getDailyExpressionPrompt(profile.userId);
  const [promptAnswer, setPromptAnswer] = useState<string>('');
  const [isPromptAnswered, setIsPromptAnswered] = useState<boolean>(false);

  // Companion Chat context from "Your Places" or Daily Prompt
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
  const latestMood = moodEntries[0]?.mood || 'MILD';
  const activityLogs = getActivityLogs(profile.userId);
  const contextualSkills = getContextualLifeSkills(latestMood);

  const handleCompanionPoke = () => {
    const dialogues: Record<typeof vibe, string[]> = {
      CHILL: [
        `"Take a slow breath. You're doing great pacing yourself." 🌿`,
        `"A quiet moment can make all the difference today." ☁️`,
        `"Steady and balanced wins the day, ${nickname}." 🍃`,
      ],
      HYPE: [
        `"You've got real momentum today! Let's crush our goals!" ⚡`,
        `"Looking sharp, ${nickname}! What big idea are we tackling?" 🚀`,
        `"Confidence is key — high five!" 🌟`,
      ],
      COZY: [
        `"Remember to take things easy on yourself today." 🧸`,
        `"Always here in your corner whenever you need to reflect." 🌸`,
        `"You're doing better than you think, ${nickname}." 💛`,
      ],
      COOL: [
        `"Did you know? Learning something new creates fresh neural pathways." 🔭✨`,
        `"Stay curious and observant today, ${nickname}." 🌌`,
        `"Sharp focus leads to incredible breakthroughs." 💡`,
      ],
    };
    const options = dialogues[vibe] || dialogues.CHILL;
    const picked = options[Math.floor(Math.random() * options.length)];
    setCompanionDialogue(picked);
  };

  const handleOpenChatWithContext = (context: {
    place?: PlaceType;
    label?: string;
    note?: string;
  }) => {
    setChatContext(context);
    setActiveTab('chat');
  };

  const handleSendPromptToCompanion = () => {
    if (!promptAnswer.trim()) return;
    setIsPromptAnswered(true);

    // Award +10 points for completing daily expression reflection
    const res = awardChildPoints(profile.userId, 'daily_prompt_reflection');
    setPointsBalance(res.newBalance);

    handleOpenChatWithContext({
      label: 'Daily Reflection Question',
      note: `Prompt: "${dailyPrompt.prompt}" — Answer: "${promptAnswer.trim()}"`,
    });
  };

  const navTabs: Array<{ key: TenToFourteenTabKey; label: string; icon: React.ReactNode }> = [
    { key: 'home', label: 'Home', icon: <Compass className="w-4 h-4" /> },
    { key: 'log', label: 'Log', icon: <Clock className="w-4 h-4" /> },
    { key: 'learn', label: 'Learn', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'grow', label: 'Grow', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'places', label: 'Places', icon: <MapPin className="w-4 h-4" /> },
    { key: 'chat', label: 'Companion', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'profile', label: 'Profile & Rewards', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div
      id="ten-to-fourteen-shell"
      className="min-h-screen flex flex-col bg-[#F8F7FC] text-slate-900 selection:bg-indigo-100"
    >
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#F8F7FC]/90 backdrop-blur-md border-b border-indigo-100/70 px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Identity & Companion Tag */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-base cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              onClick={handleCompanionPoke}
              title={`Tap ${companionName}!`}
            >
              {vibeInfo.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {nickname}
                </span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded-md">
                  Navigator
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Companion: {companionName} ({vibeInfo.name})
              </span>
            </div>
          </div>

          {/* Right: Points, Streak & Settings Button */}
          <div className="flex items-center gap-2.5">
            {/* Points Badge */}
            <div
              id="ten-to-fourteen-points-badge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={() => setActiveTab('profile')}
              title="Your Sparkle Points (click to visit rewards shop)"
            >
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="font-extrabold text-xs tracking-tight">{pointsBalance} pts</span>
            </div>

            {/* Streak Indicator Pill (Top Right) */}
            <div
              id="ten-to-fourteen-streak-badge"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 shadow-xs cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={onTriggerMoodCheckin}
              title="Your daily streak & check-in!"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-orange-400 animate-pulse" />
              <span className="font-extrabold text-xs tracking-tight">{streakRecord.currentStreak} Days</span>
            </div>

            {/* Settings Button */}
            <button
              id="ten-to-fourteen-settings-btn"
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Text-Based Navigation Bar */}
      <nav
        id="ten-to-fourteen-nav-bar"
        className="bg-white/80 border-b border-indigo-100/60 px-4 sm:px-8 py-2 sticky top-[57px] z-20 backdrop-blur-md"
      >
        <div className="max-w-4xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                id={`ten-to-fourteen-nav-${tab.key}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-indigo-50/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Screen Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20 space-y-6">
        {/* =============================================================
            TAB 1: HOME DASHBOARD
            ============================================================= */}
        {activeTab === 'home' && (
          <div id="ten-to-fourteen-home-view" className="space-y-6 animate-fadeIn">
            {/* 1. GREETING CARD */}
            <section
              id="ten-to-fourteen-greeting-card"
              className="rounded-3xl bg-white border border-indigo-100/90 p-5 sm:p-6 shadow-xs relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
                  onClick={handleCompanionPoke}
                  title={`Tap ${companionName} to check in`}
                >
                  <div className="p-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center">
                    <NestlingBlob
                      vibe={vibe}
                      size="md"
                      interactive={true}
                      showAura={false}
                    />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                      {companionName} • {vibeInfo.name} Vibe
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Day 3 Streak
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Hey, {nickname}
                  </h1>

                  <p className="text-sm font-semibold text-slate-600">
                    What do you want to do today?
                  </p>

                  {companionDialogue ? (
                    <div className="mt-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-950 animate-fadeIn">
                      {companionDialogue}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Tap {companionName} for a quick thought or reflection.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. DAILY EXPRESSION PROMPT (Feature 1) */}
            <section
              id="ten-to-fourteen-daily-prompt-card"
              className="rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 border-2 border-indigo-100 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💭</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100/90 px-2.5 py-0.5 rounded-full">
                    Daily Expression Prompt
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  Question #{dailyPrompt.id}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  "{dailyPrompt.prompt}"
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  A private thought for the day. You can jot down a thought or talk about it with {companionName}.
                </p>
              </div>

              {isPromptAnswered ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Shared with {companionName}!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="underline text-emerald-800 hover:text-emerald-950"
                  >
                    View in Chat →
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="relative">
                    <textarea
                      value={promptAnswer}
                      onChange={(e) => setPromptAnswer(e.target.value)}
                      placeholder={dailyPrompt.suggestedStarter || 'Type your reflection here...'}
                      rows={2}
                      className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 italic">
                      Private between you and {companionName}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendPromptToCompanion}
                        disabled={!promptAnswer.trim()}
                        className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send to {companionName}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 3. 2-COLUMN SECTION: LEARN DISCOVERY & RECENT ACTIVITY RECAP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Syllabus Learning */}
              <div
                id="home-card-learn-preview"
                onClick={() => setActiveTab('learn')}
                className="p-5 rounded-3xl bg-white border-2 border-indigo-100 hover:border-indigo-300 shadow-xs flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:scale-[1.01] group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Syllabus Discovery
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {profile.grade || '7th Grade'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                    🔬 Neuroplasticity & Quantum Atoms
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Bite-sized science, cosmos, and math explainer cards powered by your grade level.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Open Subject Explorer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Life Skills & Encouragement */}
              <div
                id="home-card-grow-preview"
                onClick={() => setActiveTab('grow')}
                className="p-5 rounded-3xl bg-white border-2 border-purple-100 hover:border-purple-300 shadow-xs flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:scale-[1.01] group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                      Life Skills Toolkit
                    </span>
                    <span className="text-xs">🌱</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                    🛡️ Boundaries & Friction Pauses
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    Practical tools for naming emotions, handling conflict, and protecting energy.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>Explore Life Skills</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* 4. ACTIVITY LOG & SPARKLINE ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className="cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => setActiveTab('log')}
              >
                <MoodSparkline entries={moodEntries} maxDays={14} />
              </div>

              <div
                id="ten-to-fourteen-places-quickcard"
                onClick={() => setActiveTab('places')}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-indigo-100 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-300 transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-xl">
                    📍
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Your Places
                    </h3>
                    <p className="text-xs text-slate-500">
                      Check in how home, school, and transit feel.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl">
                  Open →
                </span>
              </div>
            </div>

            {/* 5. RECENT ACTIVITY SNIPPET */}
            <section
              id="home-activity-snippet"
              onClick={() => setActiveTab('log')}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:border-indigo-200 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Recent Activity Recap with {companionName}
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-600 hover:underline">
                  View Full Log →
                </span>
              </div>

              {activityLogs.length > 0 ? (
                <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 flex items-center gap-2.5">
                  <span className="text-base">{activityLogs[0].emoji}</span>
                  <span className="font-medium flex-1">{activityLogs[0].topicSummary}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(activityLogs[0].createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No conversation logs yet. Chat with {companionName} to build your weekly log!
                </p>
              )}
            </section>
          </div>
        )}

        {/* =============================================================
            TAB 2: DAILY ACTIVITY LOG ("Here's what we talked about this week")
            ============================================================= */}
        {activeTab === 'log' && (
          <ActivityLogView
            profile={profile}
            onOpenCompanionChat={() => setActiveTab('chat')}
            onTriggerMoodCheckin={onTriggerMoodCheckin}
          />
        )}

        {/* =============================================================
            TAB 3: FUN LEARNING ALIGNED WITH SYLLABUS
            ============================================================= */}
        {activeTab === 'learn' && (
          <LearnExplainerView
            profile={profile}
            onBackToHome={() => setActiveTab('home')}
          />
        )}

        {/* =============================================================
            TAB 4: ENCOURAGEMENT & LIFE SKILLS
            ============================================================= */}
        {activeTab === 'grow' && (
          <GrowLifeSkillsView
            profile={profile}
            onBackToHome={() => setActiveTab('home')}
            onOpenCompanionChat={() => setActiveTab('chat')}
          />
        )}

        {/* =============================================================
            TAB 5: YOUR PLACES CHECK-IN
            ============================================================= */}
        {activeTab === 'places' && (
          <div id="ten-to-fourteen-places-view" className="space-y-4 animate-fadeIn">
            <YourPlacesCheckin
              profile={profile}
              onOpenCompanionChatWithContext={handleOpenChatWithContext}
            />
          </div>
        )}

        {/* =============================================================
            TAB 6: COMPANION CHAT
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
            TAB 7: PROFILE & COSMETIC REWARDS SHOP
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
