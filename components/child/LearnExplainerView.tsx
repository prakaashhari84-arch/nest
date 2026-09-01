'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Loader2,
  CheckCircle,
  Lightbulb,
  GraduationCap,
  Bookmark,
  Share2,
} from 'lucide-react';
import { ChildProfileData } from '@/lib/childProfile';
import {
  SYLLABUS_SUBJECTS,
  LearningSubject,
  generateSubjectExplainer,
  ExplainerContent,
} from '@/lib/learningAndSkills';

interface LearnExplainerViewProps {
  profile: ChildProfileData;
  onBackToHome?: () => void;
}

export default function LearnExplainerView({
  profile,
  onBackToHome,
}: LearnExplainerViewProps) {
  const grade = profile.grade || '7th Grade';
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('science');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('neuroscience');
  const [explainer, setExplainer] = useState<ExplainerContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const currentSubject =
    SYLLABUS_SUBJECTS.find((s) => s.id === selectedSubjectId) || SYLLABUS_SUBJECTS[0];
  const currentTopic =
    currentSubject.topics.find((t) => t.id === selectedTopicId) || currentSubject.topics[0];

  const handleFetchExplainer = async (subject: LearningSubject, topicTitle: string) => {
    setIsLoading(true);
    setIsSaved(false);
    try {
      const data = await generateSubjectExplainer(subject.name, topicTitle, grade);
      setExplainer(data);
    } catch (err) {
      console.error('Failed to load explainer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchExplainer(currentSubject, currentTopic.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubjectId, selectedTopicId]);

  return (
    <div id="learn-explainer-view" className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <section
        id="learn-header-banner"
        className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-md space-y-3 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-[11px] font-bold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Aligned with {grade} Syllabus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Bite-Sized Discovery Cards
            </h2>
            <p className="text-xs text-indigo-200 max-w-md">
              Short, high-signal deep dives into science, history, cosmos, and math designed for curious minds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-300 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              Mentor: {companionName}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Subject Picker Pills */}
      <section id="subject-picker-section" className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SYLLABUS_SUBJECTS.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setSelectedTopicId(sub.topics[0]?.id || '');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs scale-102'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50/70'
                }`}
              >
                <span className="text-base">{sub.emoji}</span>
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Topics for Selected Subject */}
      <section id="topic-picker-section" className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Explore Topics in {currentSubject.name}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentSubject.topics.map((t) => {
            const isSelected = selectedTopicId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTopicId(t.id)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-100 hover:border-indigo-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-slate-900">{t.title}</h4>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.quickHook}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Active Explainer Card */}
      <section id="active-explainer-card">
        {isLoading ? (
          <div className="p-12 rounded-3xl bg-white border border-indigo-100 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              {companionName} is crafting your bite-sized explainer card...
            </p>
          </div>
        ) : explainer ? (
          <div className="rounded-3xl bg-white border-2 border-indigo-100 p-6 sm:p-7 shadow-xs space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {currentSubject.emoji} {explainer.subjectName}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {explainer.topicTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bookmark topic"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFetchExplainer(currentSubject, currentTopic.title)}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  title="Regenerate perspective"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hook / Opener */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <p className="text-xs sm:text-sm font-black text-indigo-950 leading-relaxed">
                💡 "{explainer.hook}"
              </p>
            </div>

            {/* Deep Dive Bullets */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                How It Works:
              </h4>
              <ul className="space-y-2">
                {explainer.deepDive.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fun Fact & Takeaway Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                  ⭐ Mind-Bending Fact
                </span>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {explainer.funFact}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  🧠 Key Takeaway
                </span>
                <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                  {explainer.takeaway}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
