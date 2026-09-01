'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppUser } from '@/lib/auth';
import { getMoodEntries, MoodEntryData } from '@/lib/mood';
import { getChildProfile, ChildProfileData } from '@/lib/childProfile';
import {
  getPatternAlerts,
  markAlertReviewed,
  PatternAlert,
} from '@/lib/safetyPatterns';
import { getActivityLogs, ActivityLogEntry } from '@/lib/activityLog';
import {
  CareTeamMessage,
  getCareTeamMessages,
  sendCareTeamMessage,
} from '@/lib/careTeamMessages';
import {
  AvailabilitySlot,
  getAvailabilitySlots,
  bookAvailabilitySlot,
  cancelSlotBooking,
} from '@/lib/scheduling';
import {
  TherapyActivity,
  getTherapyActivities,
} from '@/lib/therapyActivities';
import {
  TherapySubmission,
  getTherapySubmissions,
} from '@/lib/therapySubmissions';
import TherapyVideoPlayer from '@/components/TherapyVideoPlayer';
import VideoUploadModal from './VideoUploadModal';
import MoodSparkline from '@/components/mood-sparkline';

// ─── Types ────────────────────────────────────────────────────────────────────

type ParentView = 'home' | 'child-detail';
type DetailTab = 'mood' | 'activity' | 'alerts' | 'therapy';
type MoodRange = 7 | 14 | 30 | 90;

interface LinkedChildSummary {
  childId: string;
  profile: ChildProfileData;
  moodEntries: MoodEntryData[];
  unreviewedAlerts: number;
  latestMood?: MoodEntryData;
  currentStreak: number;
}

interface ParentDashboardProps {
  user?: AppUser | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute current daily streak from mood entries */
function computeStreak(entries: MoodEntryData[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const entry of sorted) {
    const d = new Date(entry.createdAt);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((cursor.getTime() - d.getTime()) / 86400000);
    if (diffDays <= 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }
  return streak;
}

/** Filter mood entries by day range */
function filterByRange(entries: MoodEntryData[], days: MoodRange): MoodEntryData[] {
  const cutoff = Date.now() - days * 86400000;
  return entries.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
}

// ─── Mood Trend Bar Chart ─────────────────────────────────────────────────────

function MoodTrendChart({ entries, days }: { entries: MoodEntryData[]; days: MoodRange }) {
  const filtered = filterByRange(entries, days);

  // Bucket by day
  const buckets: Record<string, { happy: number; mild: number; sad: number }> = {};
  filtered.forEach((e) => {
    const dayKey = new Date(e.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!buckets[dayKey]) buckets[dayKey] = { happy: 0, mild: 0, sad: 0 };
    if (e.mood === 'HAPPY') buckets[dayKey].happy++;
    else if (e.mood === 'MILD') buckets[dayKey].mild++;
    else if (e.mood === 'SAD') buckets[dayKey].sad++;
  });

  const bucketKeys = Object.keys(buckets);

  if (bucketKeys.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center text-sm text-stone-400">
        No check-in data for this period.
      </div>
    );
  }

  // SVG line chart
  const width = 560;
  const height = 110;
  const padL = 28;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const usableW = width - padL - padR;
  const usableH = height - padT - padB;

  const scores = bucketKeys.map((k) => {
    const b = buckets[k];
    const total = b.happy + b.mild + b.sad || 1;
    return (b.happy * 3 + b.mild * 2 + b.sad * 1) / total;
  });

  const minScore = 1;
  const maxScore = 3;
  const getY = (s: number) => padT + ((maxScore - s) / (maxScore - minScore)) * usableH;
  const getX = (i: number) =>
    bucketKeys.length === 1
      ? padL + usableW / 2
      : padL + (i / (bucketKeys.length - 1)) * usableW;

  const points = scores.map((s, i) => ({ x: getX(i), y: getY(s), s, key: bucketKeys[i] }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const fillD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${height - padB} L ${points[0].x} ${height - padB} Z`
      : '';

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const overallLabel =
    avgScore >= 2.5 ? '😊 Generally positive' : avgScore >= 1.8 ? '😐 Mixed' : '😔 Some tough days';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Mood Trend</span>
        <span className="text-xs text-stone-500">{overallLabel}</span>
      </div>
      <div className="relative bg-white rounded-2xl border border-stone-200 overflow-hidden p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id="moodTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          {[3, 2, 1].map((score) => (
            <React.Fragment key={score}>
              <line
                x1={padL} y1={getY(score)} x2={width - padR} y2={getY(score)}
                stroke="#e2e8f0" strokeWidth="0.7" strokeDasharray="3 3"
              />
              <text x={padL - 4} y={getY(score) + 4} textAnchor="end" fontSize="8" fill="#94a3b8">
                {score === 3 ? '😊' : score === 2 ? '😐' : '😔'}
              </text>
            </React.Fragment>
          ))}
          {/* Fill */}
          {fillD && <path d={fillD} fill="url(#moodTrendGrad)" />}
          {/* Line */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {points.map((p) => {
            const color = p.s >= 2.5 ? '#10b981' : p.s >= 1.8 ? '#f59e0b' : '#f43f5e';
            return (
              <circle key={p.key} cx={p.x} cy={p.y} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
            );
          })}
          {/* X-axis labels – show first, middle, last */}
          {[0, Math.floor(points.length / 2), points.length - 1]
            .filter((i, idx, arr) => arr.indexOf(i) === idx && i < points.length)
            .map((i) => (
              <text key={i} x={points[i].x} y={height - 6} textAnchor="middle" fontSize="7.5" fill="#94a3b8">
                {points[i].key}
              </text>
            ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-stone-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />Happy</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Okay</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Tough</span>
      </div>
    </div>
  );
}

// ─── Alert Card (calm, non-alarming) ─────────────────────────────────────────

interface ParentAlertCardProps {
  alert: PatternAlert;
  onAcknowledge: (id: string) => void;
}

const ParentAlertCard: React.FC<ParentAlertCardProps> = ({
  alert,
  onAcknowledge,
}) => {
  const [startersOpen, setStartersOpen] = useState(false);
  const isSerious = alert.severity === 'SERIOUS';

  return (
    <div
      id={`parent-alert-${alert.id}`}
      className={`p-5 rounded-2xl border space-y-3.5 ${
        isSerious
          ? 'bg-violet-50/60 border-violet-200'
          : 'bg-stone-50 border-stone-200'
      }`}
    >
      {/* Header: calm, non-alarming label */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
              isSerious
                ? 'bg-violet-100 text-violet-900'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isSerious ? '💜 Flagged for your attention' : '💛 Gentle insight'}
          </span>
          <span className="text-[11px] text-stone-500 capitalize font-medium">
            {alert.category.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-[11px] text-stone-400 whitespace-nowrap font-mono shrink-0">
          {new Date(alert.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Non-diagnostic summary */}
      <p className="text-sm text-stone-800 leading-relaxed font-medium">
        {alert.summary}
      </p>

      {/* Suggested conversation starters */}
      {alert.suggestedStarters && alert.suggestedStarters.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setStartersOpen((v) => !v)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{startersOpen ? '▾' : '▸'}</span>
            <span>{startersOpen ? 'Hide' : 'Show'} conversation starters</span>
          </button>
          {startersOpen && (
            <div className="space-y-2 pl-3 border-l-2 border-indigo-200 animate-fadeIn">
              {alert.suggestedStarters.map((s, i) => (
                <p key={i} className="text-xs text-stone-700 leading-relaxed italic">
                  "{s}"
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Acknowledge action */}
      <div className="flex items-center justify-between pt-1">
        {alert.reviewedByHuman ? (
          <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
            <span>✓</span>
            <span>Acknowledged{alert.reviewedAt ? ` on ${new Date(alert.reviewedAt).toLocaleDateString()}` : ''}</span>
          </span>
        ) : (
          <button
            id={`parent-ack-${alert.id}`}
            type="button"
            onClick={() => onAcknowledge(alert.id)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            I've seen this ✓
          </button>
        )}
        <span className="text-[10px] text-stone-400 font-mono">{alert.status}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParentDashboard({ user }: ParentDashboardProps) {
  // Simulate two linked children for a richer demo
  const LINKED_CHILD_IDS = ['user_child_01', 'user_child_02'];

  const [view, setView] = useState<ParentView>('home');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('mood');
  const [moodRange, setMoodRange] = useState<MoodRange>(14);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [childrenData, setChildrenData] = useState<LinkedChildSummary[]>([]);
  const [allAlerts, setAllAlerts] = useState<PatternAlert[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [parentChatMessages, setParentChatMessages] = useState<CareTeamMessage[]>([]);
  const [parentChatInput, setParentChatInput] = useState<string>('');
  const [parentSlots, setParentSlots] = useState<AvailabilitySlot[]>([]);
  const [childActivities, setChildActivities] = useState<TherapyActivity[]>([]);
  const [submissions, setSubmissions] = useState<TherapySubmission[]>([]);
  const [uploadGoalModal, setUploadGoalModal] = useState<TherapyActivity | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadData = () => {
    // Build child summaries
    const summaries: LinkedChildSummary[] = LINKED_CHILD_IDS.map((childId, idx) => {
      // Seed a second child profile if missing
      let profile = getChildProfile(childId);
      if (!profile) {
        profile = {
          id: childId,
          userId: childId,
          nickname: idx === 0 ? 'Leo' : 'Maya',
          age: idx === 0 ? 9 : 12,
          nationality: 'United States',
          preferredLanguage: 'English',
          hasTraumaHistory: false,
          ageGroup: idx === 0 ? 'SIX_TO_TEN' : 'TEN_TO_FOURTEEN',
          onboarding_complete: true,
          companionName: idx === 0 ? 'Pip' : 'Nova',
          companionVibe: 'CHILL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const moodEntries = getMoodEntries(childId);
      const alertsForChild = getPatternAlerts(childId, 'PARENT');
      const unreviewedAlerts = alertsForChild.filter((a) => !a.reviewedByHuman).length;
      const latestMood = [...moodEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      const currentStreak = computeStreak(moodEntries);

      return { childId, profile, moodEntries, unreviewedAlerts, latestMood, currentStreak };
    });

    setChildrenData(summaries);
    setParentSlots(getAvailabilitySlots());
    setSubmissions(getTherapySubmissions());

    // Alerts, chat, and activities for selected child
    if (selectedChildId) {
      setAllAlerts(getPatternAlerts(selectedChildId, 'PARENT'));
      setActivityLogs(getActivityLogs(selectedChildId));
      setParentChatMessages(getCareTeamMessages(selectedChildId));
      setChildActivities(getTherapyActivities(selectedChildId));
    }
  };

  const handleSendParentMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentChatInput.trim() || !selectedChildId) return;

    sendCareTeamMessage({
      senderId: user?.id || 'parent_01',
      senderName: user?.name ? `${user.name} (Parent)` : 'Sarah Martinez (Parent)',
      senderRole: 'PARENT',
      childId: selectedChildId,
      content: parentChatInput.trim(),
    });

    setParentChatInput('');
    setParentChatMessages(getCareTeamMessages(selectedChildId));
    showToast('Message sent to Dr. Vance.');
  };

  const handleBookSlot = (slotId: string) => {
    if (!selectedChildId) return;
    const child = childrenData.find((c) => c.childId === selectedChildId);
    bookAvailabilitySlot({
      slotId,
      parentId: user?.id || 'parent_01',
      childId: selectedChildId,
      childName: child?.profile.nickname || 'Child',
    });
    loadData();
    showToast('Monthly 1-on-1 session booked with Dr. Vance.');
  };

  const handleCancelSlot = (slotId: string) => {
    cancelSlotBooking(slotId);
    loadData();
    showToast('Session booking cancelled.');
  };

  useEffect(() => {
    loadData();
  }, [selectedChildId]);

  const handleAcknowledge = (alertId: string) => {
    markAlertReviewed(alertId, user?.id || 'parent_01', 'Acknowledged by parent');
    loadData();
    showToast('Noted — thanks for staying connected.');
  };

  const openChildDetail = (childId: string) => {
    setSelectedChildId(childId);
    setDetailTab('mood');
    setView('child-detail');
  };

  const selectedChild = childrenData.find((c) => c.childId === selectedChildId);
  const selectedProfile = selectedChild?.profile;

  const totalUnread = childrenData.reduce((sum, c) => sum + c.unreviewedAlerts, 0);

  const moodForRange = useMemo(
    () => filterByRange(selectedChild?.moodEntries || [], moodRange as MoodRange),
    [selectedChild, moodRange]
  );

  const alertsMILD = allAlerts.filter((a) => a.severity === 'MILD');
  const alertsSERIOUS = allAlerts.filter((a) => a.severity === 'SERIOUS');

  // ── Home view ────────────────────────────────────────────────────────────────
  if (view === 'home') {
    return (
      <div id="parent-dashboard-home" className="space-y-6 animate-fadeIn">
        {/* Toast */}
        {toastMsg && (
          <div className="p-3.5 rounded-2xl bg-stone-900 text-white text-xs font-bold flex items-center gap-2 shadow-xl animate-fadeIn">
            <span>✓</span><span>{toastMsg}</span>
          </div>
        )}

        {/* Header with bell */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Here's how your children are doing.
            </p>
          </div>

          {/* Bell icon with unread count */}
          <button
            id="parent-bell-btn"
            type="button"
            className="relative p-3 rounded-2xl bg-white border border-stone-200 hover:bg-stone-50 transition-all cursor-pointer shadow-2xs"
            onClick={() => {
              const firstUnread = childrenData.find((c) => c.unreviewedAlerts > 0);
              if (firstUnread) openChildDetail(firstUnread.childId);
            }}
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405C18.21 14.79 18 14.145 18 13.5V10a6 6 0 00-12 0v3.5c0 .645-.21 1.29-.595 2.095L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9" />
            </svg>
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                {totalUnread}
              </span>
            )}
          </button>
        </div>

        {/* Linked children cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {childrenData.map(({ childId, profile, moodEntries, unreviewedAlerts, latestMood, currentStreak }) => {
            const latestMoodConfig: Record<string, { emoji: string; color: string; label: string }> = {
              HAPPY: { emoji: '😊', color: 'text-emerald-700', label: 'Happy' },
              MILD: { emoji: '😐', color: 'text-amber-700', label: 'Okay' },
              SAD: { emoji: '😔', color: 'text-violet-700', label: 'Tough day' },
            };
            const moodMeta = latestMood ? latestMoodConfig[latestMood.mood] : null;

            return (
              <div
                key={childId}
                id={`child-summary-card-${childId}`}
                className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-stone-300 hover:shadow-sm transition-all"
              >
                {/* Child identity row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center text-2xl select-none">
                      {profile.ageGroup === 'SIX_TO_TEN' ? '🌱' : '🌿'}
                    </div>
                    <div>
                      <p className="font-black text-stone-900 text-base">{profile.nickname}</p>
                      <p className="text-xs text-stone-500">
                        Age {profile.age} · {profile.ageGroup === 'SIX_TO_TEN' ? '6–10' : '10–14'} programme
                      </p>
                    </div>
                  </div>

                  {/* Unread badge */}
                  {unreviewedAlerts > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-200">
                      {unreviewedAlerts} new insight{unreviewedAlerts > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="text-base font-black text-orange-600">🔥 {currentStreak}</p>
                    <p className="text-[10px] text-stone-500 font-semibold">day streak</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <p className={`text-base font-black ${moodMeta?.color || 'text-stone-600'}`}>
                      {moodMeta ? moodMeta.emoji : '—'}
                    </p>
                    <p className="text-[10px] text-stone-500 font-semibold">
                      {moodMeta ? moodMeta.label : 'No data'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="text-base font-black text-stone-800">{moodEntries.length}</p>
                    <p className="text-[10px] text-stone-500 font-semibold">check-ins</p>
                  </div>
                </div>

                {/* Sparkline */}
                <MoodSparkline
                  entries={moodEntries}
                  maxDays={14}
                  showLabels={false}
                  compact
                  className="border-0 shadow-none p-0 bg-transparent"
                />

                <button
                  type="button"
                  onClick={() => openChildDetail(childId)}
                  className="w-full py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  View full dashboard →
                </button>
              </div>
            );
          })}
        </div>

        {/* Quick info bar */}
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-medium">
          💜 Everything here is drawn from your child's companion sessions. All observations are supportive, never clinical diagnoses. If something feels urgent, the clinical team is already aware.
        </div>
      </div>
    );
  }

  // ── Per-child detail view ─────────────────────────────────────────────────
  return (
    <div id="parent-child-detail" className="space-y-5 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-stone-900 text-white text-xs font-bold flex items-center gap-2 shadow-xl animate-fadeIn">
          <span>✓</span><span>{toastMsg}</span>
        </div>
      )}

      {/* Back + Child header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => { setView('home'); setSelectedChildId(null); }}
          className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all cursor-pointer"
        >
          ← All Children
        </button>

        {selectedProfile && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-200 flex items-center justify-center text-xl select-none">
              {selectedProfile.ageGroup === 'SIX_TO_TEN' ? '🌱' : '🌿'}
            </div>
            <div>
              <p className="font-black text-stone-900">{selectedProfile.nickname}</p>
              <p className="text-xs text-stone-500">Age {selectedProfile.age}</p>
            </div>
            {/* Bell with unread count for this child */}
            {allAlerts.filter((a) => !a.reviewedByHuman).length > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-200">
                {allAlerts.filter((a) => !a.reviewedByHuman).length} unread
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200">
        {(
          [
            { id: 'mood', label: '📈 Mood Trends' },
            { id: 'activity', label: '💬 Activity' },
            { id: 'alerts', label: `🔔 Insights (${allAlerts.length})` },
            { id: 'therapy', label: '🌿 Home Activities' },
          ] as { id: DetailTab; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDetailTab(id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              detailTab === id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Mood Trends tab ─────────────────────────────────────────────────── */}
      {detailTab === 'mood' && selectedChild && (
        <div className="space-y-5">
          {/* Range selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500 mr-1">Show:</span>
            {([7, 14, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMoodRange(d as MoodRange)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  moodRange === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {/* Trend chart */}
          <MoodTrendChart entries={selectedChild.moodEntries} days={moodRange as MoodRange} />

          {/* Full sparkline */}
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Day-by-day rhythm</p>
            <MoodSparkline entries={moodForRange} maxDays={moodRange} showLabels interactive />
          </div>

          {/* Mood breakdown stats */}
          <div className="grid grid-cols-3 gap-3">
            {(['HAPPY', 'MILD', 'SAD'] as const).map((mood) => {
              const count = moodForRange.filter((e) => e.mood === mood).length;
              const pct = moodForRange.length ? Math.round((count / moodForRange.length) * 100) : 0;
              const config = {
                HAPPY: { emoji: '😊', label: 'Happy days', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
                MILD: { emoji: '😐', label: 'Okay days', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' },
                SAD: { emoji: '😔', label: 'Tough days', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900' },
              }[mood];
              return (
                <div key={mood} className={`p-4 rounded-2xl ${config.bg} border ${config.border} text-center space-y-1`}>
                  <p className="text-2xl">{config.emoji}</p>
                  <p className={`text-xl font-black ${config.text}`}>{pct}%</p>
                  <p className="text-[11px] font-semibold text-stone-600">{config.label}</p>
                  <p className="text-[10px] text-stone-400">{count} of {moodForRange.length}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Activity tab ────────────────────────────────────────────────────── */}
      {detailTab === 'activity' && (
        <div className="space-y-4">
          <p className="text-xs text-stone-500 leading-relaxed">
            {selectedProfile?.ageGroup === 'TEN_TO_FOURTEEN'
              ? 'What your child shared with their companion this week:'
              : 'A gentle summary of what your child explored and felt:'}
          </p>

          {selectedProfile?.ageGroup === 'TEN_TO_FOURTEEN' ? (
            /* ActivityLogEntry feed for 10-14 */
            activityLogs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-stone-400 text-center">
                No conversations logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.slice(0, 12).map((log) => {
                  const vibeStyle: Record<string, string> = {
                    positive: 'bg-emerald-50 border-emerald-200',
                    reflective: 'bg-sky-50 border-sky-200',
                    challenging: 'bg-violet-50 border-violet-200',
                    creative: 'bg-amber-50 border-amber-200',
                  };
                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${vibeStyle[log.sentimentVibe || 'reflective'] || 'bg-stone-50 border-stone-200'}`}
                    >
                      <span className="text-xl shrink-0">{log.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900 leading-relaxed">{log.topicSummary}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {log.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-stone-200 text-stone-600 font-semibold">
                              {t}
                            </span>
                          ))}
                          <span className="text-[10px] text-stone-400 ml-auto font-mono">
                            {new Date(log.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Simpler "what they shared" feed for 6-10 */
            <div className="space-y-3">
              {selectedChild && selectedChild.moodEntries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="p-4 rounded-2xl bg-white border border-stone-200 flex items-start gap-3">
                  <span className="text-xl shrink-0">
                    {entry.mood === 'HAPPY' ? '😊' : entry.mood === 'MILD' ? '😐' : '😔'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      {entry.promptStarter || (
                        entry.mood === 'HAPPY' ? 'Had a good day and checked in with their companion.' :
                        entry.mood === 'MILD' ? 'Checked in — things were okay.' :
                        'Had a harder day and reached out to their companion.'
                      )}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-stone-500 mt-0.5 italic">"{entry.note}"</p>
                    )}
                    <p className="text-[10px] text-stone-400 mt-1 font-mono">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
              {(!selectedChild || selectedChild.moodEntries.length === 0) && (
                <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-stone-400 text-center">
                  No check-ins yet.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Alerts tab ──────────────────────────────────────────────────────── */}
      {detailTab === 'alerts' && (
        <div className="space-y-6">
          {/* Intro */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-medium leading-relaxed">
            💜 These observations were flagged by {selectedProfile?.nickname || 'your child'}'s companion. They are supportive notes, not clinical diagnoses. The suggested conversation starters below are gentle ways to connect.
          </div>

          {/* SERIOUS section */}
          {alertsSERIOUS.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
                <h3 className="text-sm font-black text-stone-900">
                  Flagged for your attention ({alertsSERIOUS.length})
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                These may benefit from a gentle conversation. The clinical team has also been informed.
              </p>
              {alertsSERIOUS.map((a) => (
                <ParentAlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} />
              ))}
            </div>
          )}

          {/* MILD section */}
          {alertsMILD.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <h3 className="text-sm font-black text-stone-900">
                  Gentle insights ({alertsMILD.length})
                </h3>
              </div>
              <p className="text-xs text-stone-500">
                Mild patterns observed over the past two weeks. A warm check-in is all that's needed.
              </p>
              {alertsMILD.map((a) => (
                <ParentAlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} />
              ))}
            </div>
          )}

          {allAlerts.length === 0 && (
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center space-y-2">
              <p className="text-2xl">☀️</p>
              <h3 className="text-base font-bold text-stone-800">All clear</h3>
              <p className="text-xs text-stone-500">
                No observations flagged for {selectedProfile?.nickname || 'your child'} right now.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Home Therapy & Care Team tab ──────────────────────────────────── */}
      {detailTab === 'therapy' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Section 1: Care Team Chat */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <span>💬</span>
                  <span>Care Team Chat with Clinician</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Direct asynchronous communication with Dr. Marcus Vance, MD regarding {selectedProfile?.nickname}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-900 text-xs font-bold border border-indigo-200">
                Connected
              </span>
            </div>

            {/* Chat Feed */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
              {parentChatMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-400">
                  No messages yet. Send a note to Dr. Vance below.
                </div>
              ) : (
                parentChatMessages.map((msg) => {
                  const isParent = msg.senderRole === 'PARENT';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-stone-500 font-semibold">
                        <span>{msg.senderName}</span>
                        <span className="font-mono text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed ${
                          isParent
                            ? 'bg-emerald-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-stone-900 border border-stone-200 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        <p>{msg.content}</p>

                        {/* Embedded Video Saved in Chat */}
                        {(msg.attachedVideoUrl || msg.attachedSubmissionId) && (
                          <div className="mt-3 space-y-2">
                            <TherapyVideoPlayer
                              videoUrl={
                                msg.attachedVideoUrl ||
                                (submissions || []).find((s) => s?.id === msg.attachedSubmissionId)?.videoUrl
                              }
                              title={msg.attachedSubmissionTitle || 'Recorded Practice Video'}
                              report={(submissions || []).find((s) => s?.id === msg.attachedSubmissionId)?.insightReport}
                              compact
                            />
                            <div className="text-[10px] font-bold opacity-90 truncate">
                              📹 {msg.attachedSubmissionTitle || 'Recorded Practice Video'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendParentMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask Dr. Vance a question or share an update..."
                value={parentChatInput}
                onChange={(e) => setParentChatInput(e.target.value)}
                className="flex-1 p-3 text-xs rounded-2xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white shadow-2xs"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer active:scale-95"
              >
                Send
              </button>
            </form>
          </div>

          {/* Section 2: Monthly 1-on-1 Telehealth Scheduling */}
          {!selectedChild?.profile.hasTraumaHistory && (
            <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <span>📅</span>
                    <span>Monthly 1-on-1 Clinical Telehealth Check-ins</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    45-minute virtual check-in with Dr. Vance to review progress and companion insights.
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-500">
                  Monthly Routine
                </span>
              </div>

              {/* Booked Sessions */}
              {parentSlots.filter((s) => s.bookedForChildId === selectedChildId).length > 0 ? (
                <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 space-y-2">
                  <span className="text-xs font-black text-indigo-900 uppercase tracking-wide block">
                    Upcoming Confirmed Session:
                  </span>
                  {parentSlots
                    .filter((s) => s.bookedForChildId === selectedChildId)
                    .map((slot) => (
                      <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-indigo-100">
                        <div>
                          <p className="font-black text-stone-900 text-sm">
                            {new Date(slot.startTime).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(slot.startTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-stone-500">{slot.notes}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelSlot(slot.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold cursor-pointer self-start sm:self-auto"
                        >
                          Cancel / Reschedule
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-stone-700 block">
                    Available Open Slots for {selectedProfile?.nickname}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parentSlots.filter((s) => !s.isBooked).slice(0, 4).map((slot) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between gap-3 hover:border-indigo-300 transition-all"
                      >
                        <div>
                          <p className="font-black text-stone-900 text-xs">
                            {new Date(slot.startTime).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(slot.startTime).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">{slot.notes}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBookSlot(slot.id)}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                        >
                          Book 1-on-1 Session →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Prescribed Home Therapy Goals & "Record Session" Screen (Prompt 12) */}
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Record Session: Prescribed Goals ({childActivities.length})</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Practice these clinical target skills at home with {selectedProfile?.nickname} and upload video recordings for Dr. Vance to review.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-900 text-xs font-black border border-purple-200">
                Home Therapy Loop
              </span>
            </div>

            {/* List of Goals */}
            <div className="space-y-4">
              {childActivities.length === 0 ? (
                <div className="p-8 rounded-3xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
                  No active therapy goals assigned yet for {selectedProfile?.nickname}. Dr. Vance will prescribe goals after your next session.
                </div>
              ) : (
                childActivities.map((act) => {
                  const isSubmitted = act.status === 'SUBMITTED';
                  const isReviewed = act.status === 'REVIEWED';
                  const actSubmissions = (submissions || []).filter((s) => s.therapyActivityId === act.id);

                  return (
                    <div
                      key={act.id}
                      className={`p-5 sm:p-6 rounded-3xl border-2 space-y-4 transition-all ${
                        isReviewed
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : isSubmitted
                          ? 'bg-indigo-50/30 border-indigo-200'
                          : 'bg-stone-50/70 border-stone-200 hover:border-indigo-300'
                      }`}
                    >
                      {/* Top Skill Pill & Due Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white border border-stone-200 text-stone-700">
                            {act.targetSkill}
                          </span>
                          {isReviewed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                              <span>✓</span>
                              <span>Reviewed by Dr. Vance</span>
                            </span>
                          )}
                          {isSubmitted && !isReviewed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                              📹 Video Submitted (Review in Progress)
                            </span>
                          )}
                        </div>

                        {act.dueBy && (
                          <span className="text-[11px] text-stone-400 font-mono">
                            Target Date: {new Date(act.dueBy).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Goal Title & Short Instructions */}
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-stone-900 leading-snug">
                          {act.title}
                        </h4>
                        <p className="text-xs text-stone-700 leading-relaxed bg-white p-3.5 rounded-2xl border border-stone-200/80">
                          {act.instructions}
                        </p>
                      </div>

                      {/* SURFACED CLINICIAN FEEDBACK & SIMPLIFIED INSIGHTS (Prompt 14) */}
                      {actSubmissions.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-stone-200/70">
                          {actSubmissions.map((sub) => {
                            const report = sub.insightReport;

                            return (
                              <div
                                key={sub.id}
                                className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-2xs"
                              >
                                {/* Header */}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-stone-800">
                                    📹 Session Recorded on {new Date(sub.uploadedAt).toLocaleDateString()}
                                  </span>
                                  <span className="text-[11px] font-mono text-indigo-600 font-semibold">
                                    {sub.status === 'REVIEWED' ? 'Complete' : 'AI Analysis Ready'}
                                  </span>
                                </div>

                                {/* Clinician's Personalized Feedback */}
                                {sub.clinicianFeedback && (
                                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                                    <div className="flex items-center justify-between text-emerald-950 font-black text-xs">
                                      <span className="flex items-center gap-1.5">
                                        <span>🩺</span>
                                        <span>Dr. Marcus Vance's Feedback for Home:</span>
                                      </span>
                                      <span className="text-[10px] font-mono text-emerald-800 font-normal">
                                        {sub.feedbackSentAt ? new Date(sub.feedbackSentAt).toLocaleDateString() : 'Recent'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-800 leading-relaxed italic">
                                      "{sub.clinicianFeedback}"
                                    </p>
                                    {sub.feedbackTags && sub.feedbackTags.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                        {sub.feedbackTags.map((t) => (
                                          <span
                                            key={t}
                                            className="px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-900 border border-emerald-200"
                                          >
                                            ✓ {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Gentle, Supportive Session Highlights */}
                                {report && (
                                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 block">
                                      ✨ Practice Recap & Highlights:
                                    </span>
                                    <p className="text-xs text-stone-700 leading-relaxed">
                                      {report.overallSummary}
                                    </p>
                                    {report.keyObservations && report.keyObservations.length > 0 && (
                                      <div className="flex items-center gap-2 flex-wrap pt-1">
                                        {report.keyObservations.map((obs, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-lg bg-white border border-indigo-200 text-[11px] font-medium text-indigo-900"
                                          >
                                            🌟 {obs}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Next Practice Session Call-to-Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="text-[11px] text-stone-500 font-medium">
                          {isReviewed
                            ? '🌟 Session complete! You can record a follow-up session anytime.'
                            : isSubmitted
                            ? '📹 Video recorded. Dr. Vance has been notified.'
                            : 'Recommended: 1–2 minute practice recording'}
                        </div>

                        <button
                          type="button"
                          id={`upload-video-btn-${act.id}`}
                          onClick={() => setUploadGoalModal(act)}
                          className={`px-5 py-2.5 rounded-2xl text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                            isReviewed
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <span>📹</span>
                          <span>
                            {isReviewed ? 'Record Follow-up Session →' : 'Upload Video for 1 Goal →'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal / Video Upload Flow (Prompt 13) */}
          {uploadGoalModal && (
            <VideoUploadModal
              goal={uploadGoalModal}
              childName={selectedProfile?.nickname || 'Child'}
              onClose={() => setUploadGoalModal(null)}
              onSuccess={(submission) => {
                loadData();
                showToast(`Video uploaded successfully for "${uploadGoalModal.title}".`);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
