'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Heart,
  Shield,
  Lightbulb,
  ArrowRight,
  Smile,
  Compass,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { ChildProfileData } from '@/lib/childProfile';
import { LIFE_SKILLS_LIBRARY, LifeSkillCard } from '@/lib/learningAndSkills';
import { getMoodEntries } from '@/lib/mood';

interface GrowLifeSkillsViewProps {
  profile: ChildProfileData;
  onBackToHome?: () => void;
  onOpenCompanionChat?: () => void;
}

export default function GrowLifeSkillsView({
  profile,
  onBackToHome,
  onOpenCompanionChat,
}: GrowLifeSkillsViewProps) {
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const moodEntries = getMoodEntries(profile.userId);
  const latestMood = moodEntries[0]?.mood || 'MILD';

  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [completedSkills, setCompletedSkills] = useState<Record<string, boolean>>({});

  const topics = [
    { id: 'all', label: 'All Life Skills' },
    { id: 'emotions', label: 'Naming Emotions' },
    { id: 'confidence', label: 'Confidence' },
    { id: 'conflict', label: 'Conflict & Pauses' },
    { id: 'boundaries', label: 'Boundaries' },
    { id: 'focus', label: 'Calm & Reset' },
  ];

  const filteredCards = LIFE_SKILLS_LIBRARY.filter((card) => {
    if (selectedTopic === 'all') return true;
    return card.topic === selectedTopic;
  });

  const toggleComplete = (id: string) => {
    setCompletedSkills((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div id="grow-lifeskills-view" className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <section
        id="grow-header-banner"
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-3 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-purple-200 text-[11px] font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Self-Navigation & Mindset</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Encouragement & Life Skills
            </h2>
            <p className="text-xs text-purple-200 max-w-md">
              Evidence-based mental toolkits for navigating friendships, stress, boundaries, and emotional clarity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              Guidance from {companionName}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Contextual Mood Recommendation Card */}
      <section
        id="contextual-skill-banner"
        className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl flex-shrink-0">
            🌱
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md">
              Recommended for your current rhythm
            </span>
            <h3 className="text-xs sm:text-sm font-black text-amber-950 mt-1">
              "Name It to Tame It" & "The 10-Second Friction Pause"
            </h3>
            <p className="text-xs text-amber-800">
              Gentle mental frameworks to help decompress when things feel intense.
            </p>
          </div>
        </div>

        {onOpenCompanionChat && (
          <button
            type="button"
            onClick={onOpenCompanionChat}
            className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
          >
            <span>Unpack with {companionName}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </section>

      {/* 3. Category Filter Chips */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {topics.map((top) => {
            const isSelected = selectedTopic === top.id;
            return (
              <button
                key={top.id}
                type="button"
                onClick={() => setSelectedTopic(top.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-purple-50/60'
                }`}
              >
                {top.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Life Skill Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredCards.map((card) => {
          const isDone = !!completedSkills[card.id];
          return (
            <div
              key={card.id}
              className={`p-5 sm:p-6 rounded-3xl bg-white border-2 transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-purple-100 hover:border-purple-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{card.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {card.topic}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleComplete(card.id)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isDone
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                    title={isDone ? 'Practiced!' : 'Mark as practiced'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isDone ? 'Practiced' : 'Try it'}</span>
                  </button>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug">
                  {card.title}
                </h3>

                <p className="text-xs font-bold text-purple-950 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100/80">
                  "{card.headline}"
                </p>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {card.keyInsight}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  🎯 Try This Action:
                </span>
                <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl">
                  {card.actionableStep}
                </p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
