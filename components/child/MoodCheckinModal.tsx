'use client';

import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, HeartHandshake, Loader2, MessageCircle } from 'lucide-react';
import {
  MoodType,
  PROMPT_STARTERS,
  recordMoodEntry,
  MoodEntryData,
} from '@/lib/mood';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import { generateCompanionResponse, CompanionResponseResult } from '@/lib/companion';
import { getContextualLifeSkills, LifeSkillCard } from '@/lib/learningAndSkills';
import { awardChildPoints } from '@/lib/gamification';
import NestlingBlob from './NestlingBlob';

interface MoodCheckinModalProps {
  profile: ChildProfileData;
  onComplete: (entry: MoodEntryData) => void;
  onOpenChat?: () => void;
}

export default function MoodCheckinModal({ profile, onComplete, onOpenChat }: MoodCheckinModalProps) {
  const isYounger = profile.ageGroup === 'SIX_TO_TEN';
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[vibe];

  // Stage: 'SELECT' | 'FOLLOW_UP' | 'THANK_YOU'
  const [stage, setStage] = useState<'SELECT' | 'FOLLOW_UP' | 'THANK_YOU'>('SELECT');
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedPromptStarter, setSelectedPromptStarter] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [recordedEntry, setRecordedEntry] = useState<MoodEntryData | null>(null);

  // Live Companion Response State
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [companionAiReply, setCompanionAiReply] = useState<string | null>(null);
  const [aiSeverity, setAiSeverity] = useState<string>('NONE');

  /**
   * Generates live AI response tailored to this mood check-in
   */
  const triggerAiResponse = async (entry: MoodEntryData) => {
    setIsGeneratingAi(true);
    try {
      const promptText = entry.promptStarter || entry.note
        ? `I am checking in today feeling ${entry.mood}. ${entry.promptStarter ? `"${entry.promptStarter}"` : ''} ${entry.note ? `Note: ${entry.note}` : ''}`
        : `I'm checking in with mood: ${entry.mood}.`;

      const res: CompanionResponseResult = await generateCompanionResponse({
        childId: profile.userId,
        userMessage: promptText,
        moodEntry: entry,
      });

      setCompanionAiReply(res.reply);
      setAiSeverity(res.severity);
    } catch (err) {
      console.error('Mood checkin companion generation failed:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  /**
   * Step 1: Initial Selection
   * HAPPY -> save & proceed directly to thank you / home
   * MILD or SAD -> route to follow up prompt screen
   */
  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);

    if (mood === 'HAPPY') {
      // Direct pass-through without interrogation
      const entry = recordMoodEntry(profile.userId, 'HAPPY', {
        note: isYounger ? undefined : noteText.trim() || undefined,
      });
      setRecordedEntry(entry);
      setStage('THANK_YOU');
      awardChildPoints(profile.userId, 'mood_checkin');
      triggerAiResponse(entry);
    } else {
      // MILD or SAD -> open the lightweight prompt starter screen
      setStage('FOLLOW_UP');
    }
  };

  /**
   * Step 2: Follow up submission (for MILD & SAD)
   */
  const handleFollowUpSubmit = async () => {
    if (!selectedMood) return;

    const entry = recordMoodEntry(profile.userId, selectedMood, {
      promptStarter: selectedPromptStarter || undefined,
      note: noteText.trim() || undefined,
    });
    setRecordedEntry(entry);
    setStage('THANK_YOU');
    awardChildPoints(profile.userId, 'mood_checkin');
    triggerAiResponse(entry);
  };


  /**
   * Step 3: Finish and hand off to parent container
   */
  const handleFinish = () => {
    if (recordedEntry) {
      onComplete(recordedEntry);
    } else if (selectedMood) {
      const fallback = recordMoodEntry(profile.userId, selectedMood);
      onComplete(fallback);
    }
  };

  return (
    <div
      id="mood-checkin-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        id="mood-checkin-modal"
        className={`w-full max-w-lg bg-white border shadow-2xl p-6 sm:p-8 relative overflow-hidden animate-scaleUp ${
          isYounger
            ? 'rounded-[2rem] border-purple-100'
            : 'rounded-2xl border-indigo-100'
        }`}
      >
        {/* Subtle background ambient blob */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-purple-200/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-emerald-100/40 blur-2xl pointer-events-none" />

        {/* -------------------------------------------------------------
            STAGE 1: INITIAL MOOD SELECTION
            ------------------------------------------------------------- */}
        {stage === 'SELECT' && (
          <div id="mood-stage-select" className="relative z-10 space-y-6">
            {isYounger ? (
              /* ================= 6-10 EXPERIENCE ================= */
              <div className="text-center space-y-6">
                {/* Companion illustration */}
                <div className="flex justify-center">
                  <div className="p-2 rounded-3xl bg-purple-50/70 border border-purple-100 shadow-xs inline-block">
                    <NestlingBlob vibe={vibe} size="md" interactive={false} showAura={true} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-black text-purple-700 tracking-wider uppercase">
                    Daily Hello
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                    How are you feeling today, {nickname}?
                  </h2>
                  <p className="text-sm font-semibold text-stone-600">
                    Tap the face that feels most like you right now.
                  </p>
                </div>

                {/* 3 Big Emoji-Style Buttons */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
                  <button
                    id="mood-btn-happy-young"
                    type="button"
                    onClick={() => handleMoodSelect('HAPPY')}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 text-emerald-900 transition-all hover:scale-105 active:scale-95 shadow-sm group cursor-pointer"
                  >
                    <span className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">
                      😊
                    </span>
                    <span className="text-base sm:text-lg font-black tracking-tight">
                      Happy
                    </span>
                  </button>

                  <button
                    id="mood-btn-mild-young"
                    type="button"
                    onClick={() => handleMoodSelect('MILD')}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400 text-amber-900 transition-all hover:scale-105 active:scale-95 shadow-sm group cursor-pointer"
                  >
                    <span className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">
                      😐
                    </span>
                    <span className="text-base sm:text-lg font-black tracking-tight">
                      Okay
                    </span>
                  </button>

                  <button
                    id="mood-btn-sad-young"
                    type="button"
                    onClick={() => handleMoodSelect('SAD')}
                    className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-400 text-rose-900 transition-all hover:scale-105 active:scale-95 shadow-sm group cursor-pointer"
                  >
                    <span className="text-5xl sm:text-6xl mb-2 group-hover:scale-110 transition-transform">
                      😢
                    </span>
                    <span className="text-base sm:text-lg font-black tracking-tight">
                      Sad
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* ================= 10-14 EXPERIENCE ================= */
              <div className="space-y-6">
                {/* Chat Bubble from companion */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl flex-shrink-0">
                    {vibeInfo.emoji}
                  </div>
                  <div className="flex-1 p-4 rounded-2xl rounded-tl-sm bg-indigo-50/70 border border-indigo-100 text-slate-800 shadow-xs">
                    <p className="text-xs font-bold text-indigo-800 mb-0.5">
                      {companionName} ({vibeInfo.name})
                    </p>
                    <p className="text-base font-semibold text-slate-900 leading-snug">
                      Hey {nickname} — how's today feeling?
                    </p>
                  </div>
                </div>

                {/* Tappable Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Select your current vibe:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      id="mood-chip-happy-teen"
                      type="button"
                      onClick={() => handleMoodSelect('HAPPY')}
                      className="py-3 px-3 rounded-xl bg-white hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-400 text-slate-800 hover:text-emerald-900 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs cursor-pointer"
                    >
                      <span className="text-xl">😊</span>
                      <span>Good</span>
                    </button>

                    <button
                      id="mood-chip-mild-teen"
                      type="button"
                      onClick={() => handleMoodSelect('MILD')}
                      className="py-3 px-3 rounded-xl bg-white hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400 text-slate-800 hover:text-amber-900 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs cursor-pointer"
                    >
                      <span className="text-xl">😐</span>
                      <span>Okay</span>
                    </button>

                    <button
                      id="mood-chip-sad-teen"
                      type="button"
                      onClick={() => handleMoodSelect('SAD')}
                      className="py-3 px-3 rounded-xl bg-white hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-400 text-slate-800 hover:text-rose-900 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xs cursor-pointer"
                    >
                      <span className="text-xl">😢</span>
                      <span>Tough</span>
                    </button>
                  </div>
                </div>

                {/* Optional One-Line Text Box */}
                <div className="space-y-1.5 pt-1">
                  <label htmlFor="teen-quick-note" className="text-xs font-medium text-slate-500">
                    Anything on your mind? (optional)
                  </label>
                  <input
                    id="teen-quick-note"
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Just a quick thought..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 2: LIGHTWEIGHT "WHAT'S GOING ON?" FOLLOW-UP (MILD / SAD)
            ------------------------------------------------------------- */}
        {stage === 'FOLLOW_UP' && selectedMood && (
          <div id="mood-stage-followup" className="relative z-10 space-y-5 animate-fadeIn">
            {/* Header / Companion Context */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
                  selectedMood === 'SAD'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selectedMood === 'SAD' ? '😢' : '😐'}
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
                  {selectedMood === 'SAD'
                    ? `I'm right here with you, ${nickname}.`
                    : `Thanks for telling me, ${nickname}.`}
                </h3>
                <p className="text-xs font-semibold text-stone-500">
                  {selectedMood === 'SAD'
                    ? 'Take your time. What feels a bit heavy today?'
                    : 'What feels like it’s going on?'}
                </p>
              </div>
            </div>

            {/* 3-4 Tappable Open-Ended Prompt Starters */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Tap something that resonates, or write your own below:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_STARTERS.map((starter) => {
                  const isSelected = selectedPromptStarter === starter.text;
                  return (
                    <button
                      key={starter.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedPromptStarter(null);
                        } else {
                          setSelectedPromptStarter(starter.text);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-start gap-2.5 active:scale-98 ${
                        isSelected
                          ? 'bg-purple-100 border-purple-400 text-purple-950 shadow-xs ring-2 ring-purple-300'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{starter.icon}</span>
                      <span className="flex-1 leading-snug">{starter.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free-Text Input Box */}
            <div className="space-y-1.5">
              <label htmlFor="mood-note-input" className="text-xs font-bold text-stone-700">
                Want to write a few words? (optional)
              </label>
              <textarea
                id="mood-note-input"
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type anything you want your companion to know..."
                className="w-full p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all resize-none"
              />
            </div>

            {/* Priority notice indication for SAD */}
            {selectedMood === 'SAD' && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>
                  <strong>Safe Space:</strong> Your comfort comes first. We will keep our space calm and supportive today.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleFollowUpSubmit();
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Skip for now
              </button>

              <button
                id="mood-followup-submit-btn"
                type="button"
                onClick={handleFollowUpSubmit}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            STAGE 3: LIVE COMPANION AI RESPONSE & REFLECTION
            ------------------------------------------------------------- */}
        {stage === 'THANK_YOU' && (
          <div id="mood-stage-thankyou" className="relative z-10 space-y-5 py-2 animate-fadeIn">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center text-lg shadow-xs">
                {vibeInfo.emoji}
              </div>
              <div className="text-left">
                <h3 className="text-base font-black text-stone-900 leading-tight">
                  {companionName} heard you, {nickname} 💛
                </h3>
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                  {vibeInfo.name} Vibe • Safe Space
                </span>
              </div>
            </div>

            {/* Live AI Response Bubble */}
            <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/80 border border-purple-100 shadow-xs relative">
              {isGeneratingAi ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs font-medium text-purple-800">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span>{companionName} is listening and reflecting...</span>
                </div>
              ) : companionAiReply ? (
                <div className="space-y-2 text-left">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed">
                    "{companionAiReply}"
                  </p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {selectedMood === 'HAPPY' &&
                    `Awesome! Let's make today full of bright discoveries with ${companionName}.`}
                  {selectedMood === 'MILD' &&
                    `I've got your back. We'll take things at a gentle pace today.`}
                  {selectedMood === 'SAD' &&
                    `Thank you for trusting me. Remember you can take quiet breaks anytime.`}
                </p>
              )}
            </div>

            {/* Contextual Life Skills Cards for MILD or SAD Check-ins (Prompt Spec Requirement) */}
            {(selectedMood === 'MILD' || selectedMood === 'SAD') && (
              <div className="space-y-2 text-left animate-fadeIn">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Gentle Supplementary Reading:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {getContextualLifeSkills(selectedMood).map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 rounded-2xl bg-white border border-purple-100 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{skill.emoji}</span>
                        <span className="text-xs font-black text-slate-800">{skill.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {skill.headline}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="mood-thankyou-continue-btn"
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Enter Nest Home ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
