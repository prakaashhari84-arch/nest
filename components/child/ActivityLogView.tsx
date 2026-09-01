'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Clock,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { ChildProfileData } from '@/lib/childProfile';
import { getActivityLogs, ActivityLogEntry, recordActivityLog } from '@/lib/activityLog';
import { getMoodEntries } from '@/lib/mood';
import MoodSparkline from '../mood-sparkline';

interface ActivityLogViewProps {
  profile: ChildProfileData;
  onOpenCompanionChat?: () => void;
  onTriggerMoodCheckin?: () => void;
}

export default function ActivityLogView({
  profile,
  onOpenCompanionChat,
  onTriggerMoodCheckin,
}: ActivityLogViewProps) {
  const nickname = profile.nickname || 'Friend';
  const companionName = profile.companionName || 'Pip';
  const moodEntries = getMoodEntries(profile.userId);
  const [logs, setLogs] = useState<ActivityLogEntry[]>(() => getActivityLogs(profile.userId));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customNote, setCustomNote] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  const handleAddQuickReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;

    const newEntry = recordActivityLog({
      childId: profile.userId,
      topicSummary: customNote.trim(),
      category: 'general',
      tags: ['Personal Note'],
      emoji: '📝',
      sentimentVibe: 'reflective',
    });

    setLogs((prev) => [newEntry, ...prev]);
    setCustomNote('');
    setIsAddingNote(false);
  };

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'school', label: 'School' },
    { id: 'friendship', label: 'Friendships' },
    { id: 'hobbies', label: 'Hobbies' },
    { id: 'emotions', label: 'Emotions' },
    { id: 'curiosity', label: 'Curiosity' },
  ];

  const filteredLogs = logs.filter((log) => {
    if (selectedCategory === 'all') return true;
    return log.category === selectedCategory;
  });

  return (
    <div id="activity-log-view" className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner: "Here's what we talked about this week" */}
      <section
        id="activity-log-header"
        className="p-5 sm:p-6 rounded-3xl bg-white border border-indigo-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Weekly Recap & Rhythm</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Here's what we talked about this week
          </h2>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            {companionName} keeps a light, private log of topics and moments you've explored together.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCompanionChat && (
            <button
              type="button"
              onClick={onOpenCompanionChat}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Talk to {companionName}</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Mood Sparkline Rhythm Overview */}
      <section id="activity-log-rhythm-section" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Emotional Rhythm (Past 14 Days)
          </span>
          {onTriggerMoodCheckin && (
            <button
              type="button"
              onClick={onTriggerMoodCheckin}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              + Quick Mood Check-In
            </button>
          )}
        </div>
        <MoodSparkline entries={moodEntries} maxDays={14} />
      </section>

      {/* 3. Category Filter Chips & Add Reflection */}
      <section className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50/50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer transition-all"
        >
          {isAddingNote ? 'Cancel' : '+ Add Note'}
        </button>
      </section>

      {/* Optional Note Form */}
      {isAddingNote && (
        <form
          onSubmit={handleAddQuickReflection}
          className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 animate-fadeIn"
        >
          <label className="text-xs font-bold text-slate-800 block">
            Add a quick private note to your weekly rhythm:
          </label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Something you want to remember or look back on..."
            rows={2}
            className="w-full text-xs p-3 rounded-xl border border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              Dismiss
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
            >
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* 4. Activity Log Cards Stream */}
      <section id="activity-log-stream" className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">No log entries found for this category</p>
            <p className="text-xs text-slate-400">
              As you chat with {companionName}, key moments and topics will be summarized here.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const dateObj = new Date(log.createdAt);
            const dateFormatted = dateObj.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeFormatted = dateObj.toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={log.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                    {log.emoji}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {log.topicSummary}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-md">
                        {log.category}
                      </span>
                      {log.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.2 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 self-end sm:self-center whitespace-nowrap">
                  <span>{dateFormatted}</span>
                  <span>•</span>
                  <span>{timeFormatted}</span>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
