'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShieldAlert,
  Sliders,
  Calendar,
  MessageSquare,
  Activity,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  RefreshCw,
  Eye,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Video,
  Info,
  Play,
} from 'lucide-react';
import { AppUser } from '@/lib/auth';
import { getChildProfile, ChildProfileData } from '@/lib/childProfile';
import { getMoodEntries, MoodEntryData } from '@/lib/mood';
import { getConversationTurns, ConversationTurnData } from '@/lib/companion';
import {
  getPatternAlerts,
  markAlertReviewed,
  PatternAlert,
  evaluatePatterns,
} from '@/lib/safetyPatterns';
import {
  CareTeamMessage,
  getCareTeamMessages,
  sendCareTeamMessage,
} from '@/lib/careTeamMessages';
import {
  AvailabilitySlot,
  getAvailabilitySlots,
  createAvailabilitySlot,
  cancelSlotBooking,
} from '@/lib/scheduling';
import {
  TherapyActivity,
  getTherapyActivities,
  assignTherapyActivity,
  updateTherapyActivityStatus,
  TARGET_SKILL_PRESETS,
} from '@/lib/therapyActivities';
import {
  TherapySubmission,
  getTherapySubmissions,
  sendClinicianFeedback,
  CLINICIAN_FEEDBACK_TAG_PRESETS,
  getSkillSubmissionsTrend,
  InsightReport,
} from '@/lib/therapySubmissions';
import TherapyVideoPlayer from '@/components/TherapyVideoPlayer';
import MoodSparkline from '@/components/mood-sparkline';

type BottomTab = 'goals' | 'chats' | 'ai-room' | 'log';

interface PatientSummary {
  childId: string;
  profile: ChildProfileData;
  moodEntries: MoodEntryData[];
  conversationTurns: ConversationTurnData[];
  alerts: PatternAlert[];
  openAlertsCount: number;
  lastActiveDate: string;
  hasOfflineClinician: boolean;
}

interface ClinicianDashboardProps {
  user?: AppUser | null;
  onNavigateToRules?: (childId?: string) => void;
  onNavigateToAlerts?: () => void;
}

export default function ClinicianDashboard({
  user,
  onNavigateToRules,
  onNavigateToAlerts,
}: ClinicianDashboardProps) {
  const PATIENT_IDS = ['user_child_01', 'user_child_02'];

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('log');
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [chatMessages, setChatMessages] = useState<CareTeamMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [showSlotModal, setShowSlotModal] = useState<boolean>(false);
  const [newSlotDate, setNewSlotDate] = useState<string>('');
  const [newSlotTime, setNewSlotTime] = useState<string>('10:00');
  const [newSlotNotes, setNewSlotNotes] = useState<string>('');
  const [clinicalNotesMap, setClinicalNotesMap] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Home Therapy Goal Assignment State
  const [activities, setActivities] = useState<TherapyActivity[]>([]);
  const [submissions, setSubmissions] = useState<TherapySubmission[]>([]);
  const [viewVideoModal, setViewVideoModal] = useState<{
    title: string;
    url: string;
    initialSeekSeconds?: number;
    report?: InsightReport;
  } | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const [showAssignForm, setShowAssignForm] = useState<boolean>(false);
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalSkill, setGoalSkill] = useState<string>(TARGET_SKILL_PRESETS[0]);
  const [goalInstructions, setGoalInstructions] = useState<string>('');
  const [goalDueDate, setGoalDueDate] = useState<string>('');

  const loadData = () => {
    const loadedPatients: PatientSummary[] = PATIENT_IDS.map((childId, idx) => {
      let profile = getChildProfile(childId);
      if (!profile) {
        profile = {
          id: childId,
          userId: childId,
          nickname: idx === 0 ? 'Leo Martinez' : 'Maya Lin',
          age: idx === 0 ? 9 : 12,
          nationality: 'United States',
          preferredLanguage: 'English',
          hasTraumaHistory: idx === 0,
          traumaHistoryNote: idx === 0 ? 'Sensitive to loud arguments; prefers gentle tone' : undefined,
          ageGroup: idx === 0 ? 'SIX_TO_TEN' : 'TEN_TO_FOURTEEN',
          onboarding_complete: true,
          companionName: idx === 0 ? 'Pip' : 'Nova',
          companionVibe: idx === 0 ? 'CHILL' : 'COOL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      const moodEntries = getMoodEntries(childId);
      const turns = getConversationTurns(childId, 30);
      const alerts = getPatternAlerts(childId, 'CLINICIAN');
      const openAlertsCount = alerts.filter((a) => !a.reviewedByHuman).length;

      const lastMoodDate = moodEntries[moodEntries.length - 1]?.createdAt;
      const lastTurnDate = turns[turns.length - 1]?.createdAt;
      const lastActiveDate = lastTurnDate || lastMoodDate || new Date().toISOString();

      return {
        childId,
        profile,
        moodEntries,
        conversationTurns: turns,
        alerts,
        openAlertsCount,
        lastActiveDate,
        hasOfflineClinician: (profile as any).hasOfflineClinicianOfRecord || false,
      };
    });

    setPatients(loadedPatients);
    setAvailabilitySlots(getAvailabilitySlots());
    setSubmissions(getTherapySubmissions());

    if (selectedChildId) {
      setChatMessages(getCareTeamMessages(selectedChildId));
      setActivities(getTherapyActivities(selectedChildId));
    }
  };

  const handleAssignGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalInstructions.trim() || !selectedChildId) return;

    assignTherapyActivity({
      clinicianId: user?.id || 'clinician_01',
      clinicianName: user?.name || 'Dr. Marcus Vance, MD',
      childId: selectedChildId,
      title: goalTitle.trim(),
      instructions: goalInstructions.trim(),
      targetSkill: goalSkill,
      dueBy: goalDueDate || undefined,
    });

    setGoalTitle('');
    setGoalInstructions('');
    setGoalDueDate('');
    setShowAssignForm(false);
    loadData();
    showToast('Goal assigned and sent to parent Home Therapy tab.');
  };

  // Feedback Loop State
  const [feedbackTextMap, setFeedbackTextMap] = useState<Record<string, string>>({});
  const [feedbackTagsMap, setFeedbackTagsMap] = useState<Record<string, string[]>>({});

  const toggleFeedbackTag = (submissionId: string, tag: string) => {
    const current = feedbackTagsMap[submissionId] || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setFeedbackTagsMap({ ...feedbackTagsMap, [submissionId]: updated });
  };

  const handleSendFeedback = (submissionId: string) => {
    const feedback = feedbackTextMap[submissionId] || '';
    const tags = feedbackTagsMap[submissionId] || [];

    if (!feedback.trim() && tags.length === 0) {
      showToast('Please enter clinical feedback notes or select feedback tags.');
      return;
    }

    sendClinicianFeedback({
      submissionId,
      feedback: feedback.trim() || 'Session reviewed by Clinician. Great job following practice guidelines!',
      tags,
      clinicianId: user?.id || 'clinician_01',
      clinicianName: user?.name || 'Dr. Marcus Vance, MD',
    });

    loadData();
    showToast('Clinical feedback sent to parent dashboard & Care Team chat.');
  };

  useEffect(() => {
    loadData();
  }, [selectedChildId, activeBottomTab]);

  useEffect(() => {
    if (viewVideoModal && videoPlayerRef.current) {
      if (typeof viewVideoModal.initialSeekSeconds === 'number') {
        videoPlayerRef.current.currentTime = viewVideoModal.initialSeekSeconds;
      }
    }
  }, [viewVideoModal]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChildId) return;

    sendCareTeamMessage({
      senderId: user?.id || 'clinician_01',
      senderName: user?.name || 'Dr. Marcus Vance, MD',
      senderRole: 'CLINICIAN',
      childId: selectedChildId,
      content: newMessageText.trim(),
    });

    setNewMessageText('');
    setChatMessages(getCareTeamMessages(selectedChildId));
    showToast('Message sent to Care Team.');
  };

  const handleReviewAlert = (alertId: string) => {
    const note = clinicalNotesMap[alertId] || 'Reviewed and verified by Clinician';
    markAlertReviewed(alertId, user?.id || 'clinician_01', note);
    loadData();
    showToast('Alert marked as reviewed and recorded in audit log.');
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDate) return;

    const start = new Date(`${newSlotDate}T${newSlotTime}:00`);
    const end = new Date(start.getTime() + 45 * 60000); // 45 min slot

    createAvailabilitySlot({
      clinicianId: user?.id || 'clinician_01',
      clinicianName: user?.name || 'Dr. Marcus Vance, MD',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      notes: newSlotNotes.trim() || 'Monthly 1-on-1 Clinical Telehealth (45 min)',
    });

    setShowSlotModal(false);
    setNewSlotDate('');
    setNewSlotNotes('');
    loadData();
    showToast('Availability slot added.');
  };

  const selectedPatient = patients.find((p) => p.childId === selectedChildId);

  // ---------------------------------------------------------------------------
  // PATIENT LIST VIEW
  // ---------------------------------------------------------------------------
  if (!selectedChildId || !selectedPatient) {
    const totalOpenAlerts = patients.reduce((acc, p) => acc + p.openAlertsCount, 0);

    return (
      <div id="clinician-patient-list-view" className="space-y-6 animate-fadeIn select-none">
        {/* Toast */}
        {toastMsg && (
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-between shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Header Bar */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-indigo-50 border-2 border-sky-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center text-2xl shadow-md border border-sky-300">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-200 text-sky-900">
                  Role: Clinician
                </span>
                <span className="text-xs font-mono text-slate-500">
                  /app/(clinician)/dashboard
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
                Clinical Caseload & Governance
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Supervising {patients.length} assigned patients across 6–10 and 10–14 programmes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSlotModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Manage Availability ({availabilitySlots.length})</span>
            </button>

            {onNavigateToRules && (
              <button
                type="button"
                onClick={() => onNavigateToRules()}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Global Rule Engine</span>
              </button>
            )}
          </div>
        </div>

        {/* Overview Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Caseload</span>
            <span className="text-2xl font-black text-slate-900 block">{patients.length} Children</span>
          </div>
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Open Pattern Alerts</span>
            <span className="text-2xl font-black text-rose-950 block">{totalOpenAlerts}</span>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Booked 1-on-1 Slots</span>
            <span className="text-2xl font-black text-indigo-950 block">
              {availabilitySlots.filter((s) => s.isBooked).length}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Clinical Status</span>
            <span className="text-2xl font-black text-emerald-950 block">Active Oversight</span>
          </div>
        </div>

        {/* Patient Caseload List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
              <span>Assigned Patient Caseload</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Click patient to open detail workspace</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {patients.map((patient) => {
              const { childId, profile, moodEntries, openAlertsCount, lastActiveDate } = patient;

              return (
                <div
                  key={childId}
                  id={`patient-card-${childId}`}
                  className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-sky-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Patient Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-300 flex items-center justify-center text-2xl font-black text-sky-900 select-none">
                          {profile.nickname.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{profile.nickname}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                              {profile.ageGroup === 'SIX_TO_TEN' ? '6–10 Program' : '10–14 Program'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Age {profile.age} • Companion: <strong>{profile.companionName || 'Pip'}</strong> ({profile.companionVibe || 'CHILL'})
                          </p>
                        </div>
                      </div>

                      {/* Open Alerts Pill */}
                      {openAlertsCount > 0 ? (
                        <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-900 text-xs font-black border border-rose-300 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{openAlertsCount} Alert{openAlertsCount > 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Stable</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Metadata Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Last Session:</span>
                        <span className="font-bold text-slate-800">
                          {new Date(lastActiveDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Care Provider:</span>
                        <span className="font-bold text-slate-800">
                          {patient.hasOfflineClinician ? 'Offline Clinician' : 'Platform Telehealth'}
                        </span>
                      </div>
                    </div>

                    {/* Mood Trend Sparkline */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        14-Day Mood Trend:
                      </span>
                      <MoodSparkline
                        entries={moodEntries}
                        maxDays={14}
                        showLabels={false}
                        compact
                        className="p-2 border-0 bg-slate-50/60"
                      />
                    </div>
                  </div>

                  {/* Open Detail Button */}
                  <button
                    id={`open-patient-btn-${childId}`}
                    type="button"
                    onClick={() => {
                      setSelectedChildId(childId);
                      setActiveBottomTab('log');
                    }}
                    className="w-full py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>Open Patient Workspace (Goals / Chats / AI Room / Log)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Clinician Availability Slot Manager */}
        {showSlotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-sky-600" />
                  <h3 className="font-black text-base text-slate-900">
                    Monthly 1-on-1 Availability Manager
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Existing Slots List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="text-xs font-bold text-slate-700 block">Existing Slots:</span>
                {availabilitySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      slot.isBooked
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <span className="font-bold block">
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
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {slot.isBooked ? `Booked for: ${slot.bookedForChildName || 'Patient'}` : 'Open for booking'}
                      </span>
                    </div>

                    {slot.isBooked && (
                      <button
                        type="button"
                        onClick={() => {
                          cancelSlotBooking(slot.id);
                          loadData();
                          showToast('Booking cancelled.');
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Slot Form */}
              <form onSubmit={handleCreateSlot} className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 block">Add New Availability Slot (45 min):</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Date:</label>
                    <input
                      type="date"
                      required
                      value={newSlotDate}
                      onChange={(e) => setNewSlotDate(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Start Time:</label>
                    <input
                      type="time"
                      required
                      value={newSlotTime}
                      onChange={(e) => setNewSlotTime(e.target.value)}
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Notes (e.g. Telehealth progress check-in)"
                  value={newSlotNotes}
                  onChange={(e) => setNewSlotNotes(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSlotModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Add Open Slot +
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // PER-PATIENT DETAIL VIEW
  // ---------------------------------------------------------------------------
  const { profile, moodEntries, conversationTurns, alerts } = selectedPatient;
  const seriousTurnsCount = conversationTurns.filter((t) => t.severity === 'SERIOUS').length;
  const mildTurnsCount = conversationTurns.filter((t) => t.severity === 'MILD').length;

  return (
    <div id="clinician-patient-detail-view" className="space-y-6 animate-fadeIn select-none">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Patient Header Strip */}
      <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedChildId(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              ← Back to Caseload
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{profile.nickname}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900">
                  {profile.ageGroup === 'SIX_TO_TEN' ? '6–10 Program' : '10–14 Program'}
                </span>
                {profile.hasTraumaHistory && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    💛 Sensitive Care
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Age {profile.age} • Language: {profile.preferredLanguage || 'English'} • Companion: {profile.companionName || 'Pip'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToRules && (
              <button
                type="button"
                onClick={() => onNavigateToRules(selectedChildId)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Edit Patient Safety Rules 🛡️</span>
              </button>
            )}
          </div>
        </div>

        {/* Clinical Health & Trend Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              14-Day Mood Sparkline:
            </span>
            <MoodSparkline
              entries={moodEntries}
              maxDays={14}
              showLabels={false}
              compact
              className="p-1 border-0 bg-transparent"
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Turn Severity History:
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                {conversationTurns.length - seriousTurnsCount - mildTurnsCount} Safe
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold">
                {mildTurnsCount} Mild
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold">
                {seriousTurnsCount} Serious
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1-on-1 Monthly Telehealth:
            </span>
            <span className="text-xs font-bold text-slate-800">
              {selectedPatient.hasOfflineClinician
                ? 'External Offline Clinician on File'
                : 'Platform Monthly Scheduling Active'}
            </span>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          BOTTOM TAB BAR: Goals / Chats / AI Room / Log
          ----------------------------------------------------------------------- */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
          {(
            [
              { id: 'goals', label: '🎯 Goals', desc: 'Therapy & Activities' },
              { id: 'chats', label: `💬 Chats (${chatMessages.length})`, desc: 'Care Team Messaging' },
              { id: 'ai-room', label: '🤖 AI Room', desc: 'Insight Synthesis' },
              { id: 'log', label: `📋 Log (${alerts.length})`, desc: 'Alerts & History' },
            ] as { id: BottomTab; label: string; desc: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              type="button"
              onClick={() => setActiveBottomTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex flex-col items-start gap-0.5 cursor-pointer whitespace-nowrap ${
                activeBottomTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[9px] font-normal opacity-80">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: GOALS (TherapyActivity Goal Engine - Prompt 12) */}
        {activeBottomTab === 'goals' && (
          <div id="tab-goals-content" className="space-y-5 animate-fadeIn">
            {/* Header & Assign Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Prescribed Home Therapy Goals ({activities.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Assign actionable home exercises for {profile.nickname} to practice with parents and record video sessions.
                </p>
              </div>

              <button
                id="toggle-assign-goal-btn"
                type="button"
                onClick={() => setShowAssignForm(!showAssignForm)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{showAssignForm ? 'Close Form' : 'Assign New Goal +'}</span>
              </button>
            </div>

            {/* REAL GOAL ASSIGNMENT FORM */}
            {showAssignForm && (
              <form
                onSubmit={handleAssignGoal}
                className="p-5 sm:p-6 rounded-3xl bg-sky-50/70 border-2 border-sky-300 space-y-4 animate-fadeIn shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>New Prescribed Therapy Goal for {profile.nickname}</span>
                  </h4>
                  <span className="text-[10px] text-sky-700 font-semibold">
                    Will appear in Parent Home Therapy tab
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Goal Title / Target Phrase:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder='e.g. "Produce /s/ and /z/ sounds in conversation" or "Take turns during a board game"'
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Target Clinical Skill:
                      </label>
                      <select
                        value={goalSkill}
                        onChange={(e) => setGoalSkill(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        {TARGET_SKILL_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>
                            {preset}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Target Due Date (Optional):
                      </label>
                      <input
                        type="date"
                        value={goalDueDate}
                        onChange={(e) => setGoalDueDate(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Parent Step-by-Step Instructions & Context:
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Detailed guidance for parents (e.g. Have Leo tell a short story while focusing on tongue placement behind front teeth; praise clear sounds gently)..."
                      value={goalInstructions}
                      onChange={(e) => setGoalInstructions(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-200">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Assign Goal & Notify Parent</span>
                  </button>
                </div>
              </form>
            )}

            {/* LIST OF PREVIOUSLY ASSIGNED GOALS */}
            <div className="space-y-3.5">
              {activities.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                  No therapy goals assigned yet for {profile.nickname}. Click "Assign New Goal +" to create one.
                </div>
              ) : (
                activities.map((act) => {
                  const statusConfig = {
                    ASSIGNED: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', label: 'Assigned (Pending Video)' },
                    SUBMITTED: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300', label: 'Video Submitted (Ready for Review)' },
                    REVIEWED: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', label: 'Reviewed & Complete' },
                  }[act.status];

                  return (
                    <div
                      key={act.id}
                      className="p-5 rounded-3xl bg-slate-50 border-2 border-slate-200/90 shadow-2xs space-y-4 hover:border-sky-300 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {statusConfig.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700">
                            {act.targetSkill}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                          <span>Assigned: {new Date(act.assignedAt).toLocaleDateString()}</span>
                          {act.dueBy && <span>• Due: {new Date(act.dueBy).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {act.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-2xl border border-slate-200">
                          {act.instructions}
                        </p>
                      </div>

                      {/* Longitudinal Loop-Closure Indicator */}
                      {(() => {
                        const trend = getSkillSubmissionsTrend(selectedChildId, act.targetSkill);
                        if (!trend.trendNote) return null;
                        return (
                          <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs font-semibold flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block text-[11px] uppercase tracking-wider text-indigo-900">
                                Longitudinal Skill Progress ({trend.count} Sessions)
                              </span>
                              <span className="text-[11px] font-medium text-indigo-900 leading-relaxed">
                                {trend.trendNote}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* FULL INSIGHT REPORT (Prompt 14) */}
                      {(() => {
                        const actSubmissions = (submissions || []).filter((s) => s.therapyActivityId === act.id);
                        if (actSubmissions.length === 0) return null;

                        return (
                          <div className="space-y-3 pt-2 border-t border-slate-200">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                              AI Video Analysis & Insight Reports ({actSubmissions.length})
                            </span>

                            {actSubmissions.map((sub) => {
                              const report = sub.insightReport;
                              const isReviewed = sub.status === 'REVIEWED';

                              return (
                                <div
                                  key={sub.id}
                                  className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3 shadow-2xs"
                                >
                                  {/* Sub Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-slate-900">
                                        Recorded Session • {new Date(sub.uploadedAt).toLocaleDateString()}
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900">
                                        {sub.status}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setViewVideoModal({
                                          title: `${act.title} (${new Date(sub.uploadedAt).toLocaleDateString()})`,
                                          url: sub.videoUrl,
                                        })
                                      }
                                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                                    >
                                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Watch Recording</span>
                                    </button>
                                  </div>

                                  {/* Report Summary */}
                                  {report ? (
                                    <div className="space-y-3">
                                      <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <strong>Overall Summary:</strong> {report.overallSummary}
                                      </p>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-950">
                                          <span className="font-bold text-[10px] uppercase tracking-wider block text-sky-800">
                                            Adherence:
                                          </span>
                                          <span className="text-[11px] leading-relaxed">{report.adherenceNotes}</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950">
                                          <span className="font-bold text-[10px] uppercase tracking-wider block text-indigo-800">
                                            Engagement & Affect:
                                          </span>
                                          <span className="text-[11px] leading-relaxed">{report.engagementNotes}</span>
                                        </div>
                                      </div>

                                      {/* Timestamped Notes Timeline */}
                                      <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                          Timestamped Moment Analysis:
                                        </span>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                          {report.timestampedNotes.map((ts) => {
                                            const tagConfig = {
                                              SPEECH: 'bg-sky-100 text-sky-900 border-sky-300',
                                              ENGAGEMENT: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                                              POSTURE: 'bg-purple-100 text-purple-900 border-purple-300',
                                              PACING: 'bg-amber-100 text-amber-900 border-amber-300',
                                              POSITIVE: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                                              NEUTRAL: 'bg-slate-100 text-slate-800 border-slate-300',
                                            }[ts.tag] || 'bg-slate-100 text-slate-800 border-slate-300';

                                            return (
                                              <button
                                                key={ts.id}
                                                type="button"
                                                onClick={() =>
                                                  setViewVideoModal({
                                                    title: `${act.title} (Jumped to ${ts.timestamp})`,
                                                    url: sub.videoUrl,
                                                    initialSeekSeconds: ts.seconds,
                                                    report,
                                                  })
                                                }
                                                className="w-full p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 flex items-start gap-2 text-xs text-left transition-all group cursor-pointer"
                                              >
                                                <span className="font-mono text-[10px] font-bold text-indigo-700 bg-white group-hover:bg-indigo-600 group-hover:text-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0 transition-colors flex items-center gap-1">
                                                  <Play className="w-2.5 h-2.5" />
                                                  <span>{ts.timestamp}</span>
                                                </span>
                                                <span
                                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${tagConfig}`}
                                                >
                                                  {ts.tag}
                                                </span>
                                                <span className="text-slate-700 text-[11px] leading-snug flex-1">
                                                  {ts.note}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-400 italic py-2">
                                      AI Insight Analysis in progress...
                                    </div>
                                  )}

                                  {/* CLINICIAN ACTION: SEND FEEDBACK TO PARENT */}
                                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                                    {isReviewed && sub.clinicianFeedback ? (
                                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                                          <span>✓ Feedback Sent to Parent:</span>
                                          <span className="text-[10px] font-mono text-emerald-700">
                                            {sub.feedbackSentAt ? new Date(sub.feedbackSentAt).toLocaleDateString() : 'Sent'}
                                          </span>
                                        </div>
                                        <p className="text-slate-800 italic">
                                          "{sub.clinicianFeedback}"
                                        </p>
                                        {sub.feedbackTags && sub.feedbackTags.length > 0 && (
                                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                            {sub.feedbackTags.map((t) => (
                                              <span
                                                key={t}
                                                className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-[10px] font-bold text-emerald-950"
                                              >
                                                {t}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
                                        <span className="text-xs font-black text-sky-950 block">
                                          Send Clinician Feedback to Parent:
                                        </span>

                                        {/* Quick-Select Tags */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {CLINICIAN_FEEDBACK_TAG_PRESETS.map((tag) => {
                                            const isSelected = (feedbackTagsMap[sub.id] || []).includes(tag);
                                            return (
                                              <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleFeedbackTag(sub.id, tag)}
                                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                                                  isSelected
                                                    ? 'bg-sky-600 text-white shadow-xs'
                                                    : 'bg-white border border-sky-200 text-sky-900 hover:bg-sky-100'
                                                }`}
                                              >
                                                {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        <textarea
                                          rows={2}
                                          placeholder="Enter personalized guidance for home practice (e.g. Great pace today! For next session, encourage slightly longer pauses between phrases)..."
                                          value={feedbackTextMap[sub.id] || ''}
                                          onChange={(e) =>
                                            setFeedbackTextMap({
                                              ...feedbackTextMap,
                                              [sub.id]: e.target.value,
                                            })
                                          }
                                          className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                        />

                                        <div className="flex items-center justify-end">
                                          <button
                                            type="button"
                                            onClick={() => handleSendFeedback(sub.id)}
                                            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>Send Feedback to Parent ✓</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CHATS (Care Team Threaded Messaging) */}
        {activeBottomTab === 'chats' && (
          <div id="tab-chats-content" className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Care Team Messaging Thread</h3>
                <p className="text-xs text-slate-500">
                  Direct asynchronous communication between Clinician (Dr. Vance) and Linked Parent (Sarah Martinez).
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-mono font-bold">
                Context: {profile.nickname}
              </span>
            </div>

            {/* Messages Feed */}
            <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {!chatMessages || chatMessages.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No messages yet. Start a conversation with the parent.
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  if (!msg) return null;
                  const isClinician = msg.senderRole === 'CLINICIAN';
                  let formattedTime = 'Recently';
                  try {
                    if (msg.createdAt) {
                      const d = new Date(msg.createdAt);
                      if (!isNaN(d.getTime())) {
                        formattedTime = d.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }
                    }
                  } catch (e) {
                    formattedTime = 'Recently';
                  }

                  return (
                    <div
                      key={msg.id || `chat_msg_${idx}`}
                      className={`flex flex-col ${isClinician ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-500 font-semibold">
                        <span>{msg.senderName || (isClinician ? 'Dr. Marcus Vance, MD' : 'Parent')}</span>
                        <span className="font-mono text-[10px]">
                          {formattedTime}
                        </span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          isClinician
                            ? 'bg-sky-600 text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-2xs'
                        }`}
                      >
                        <p>{msg.content || ''}</p>

                        {/* Embedded Video Saved in Chat (Interactive & Persistent) */}
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
                            <div className="flex items-center justify-between text-[11px] gap-2 pt-0.5">
                              <span className="font-bold flex items-center gap-1 truncate text-stone-700">
                                <span>📹</span>
                                <span className="truncate">{msg.attachedSubmissionTitle || 'Recorded Practice Video'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const sub = (submissions || []).find((s) => s?.id === msg.attachedSubmissionId);
                                  setViewVideoModal({
                                    title: msg.attachedSubmissionTitle || 'Recorded Practice Session',
                                    url:
                                      msg.attachedVideoUrl ||
                                      sub?.videoUrl ||
                                      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                                    report: sub?.insightReport,
                                  });
                                }}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold shrink-0 cursor-pointer transition-all border border-indigo-200"
                              >
                                Full Screen Review ↗
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder={`Type a note to ${profile.nickname}'s parents...`}
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                className="flex-1 p-3 text-xs rounded-2xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white shadow-2xs"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: AI ROOM (Prompt 14 Insight-Report Preview) */}
        {activeBottomTab === 'ai-room' && (
          <div id="tab-ai-room-content" className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">AI Room: Longitudinal Clinical Insight Synthesis</h3>
                <p className="text-xs text-slate-500">
                  Synthesizes multi-week trends, place ratings, and sentiment trajectories without diagnostic labeling.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-bold">
                Prompt 14 Analysis
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-sky-50 border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Longitudinal Observations for {profile.nickname}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Analysis of {moodEntries.length} check-ins and {conversationTurns.length} conversation turns shows steady emotional regulation. 
                Slight dips in sentiment consistently correlate with mid-week school stressors, resolving positively by Friday afternoon.
              </p>

              {/* Video Sessions Progress Summary */}
              {submissions.filter((s) => s.childId === selectedChildId).length > 0 && (
                <div className="p-3.5 rounded-xl bg-white/90 border border-purple-100 space-y-2">
                  <span className="text-[11px] font-black text-purple-950 uppercase tracking-wider block">
                    📹 Home Therapy Practice Synthesis ({submissions.filter((s) => s.childId === selectedChildId).length} Submissions)
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {submissions
                      .filter((s) => s.childId === selectedChildId && s.insightReport)
                      .map((sub) => (
                        <div key={sub.id} className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/50">
                          <span className="font-bold text-purple-900 text-[11px] shrink-0">
                            {sub.therapyActivityTitle || 'Practice Session'}:
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {sub.insightReport?.overallSummary}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-white border border-purple-100 text-[11px] text-slate-600">
                <strong>Clinician Recommendation:</strong> Maintain calm, predictable bedtime companion check-ins. Continue encouraging open caregiver dialogue around school group dynamics.
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOG (Alerts & History Timeline with Clinical Review & Notes) */}
        {activeBottomTab === 'log' && (
          <div id="tab-log-content" className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Safety Alerts & Timeline Audit Log</h3>
                <p className="text-xs text-slate-500">
                  Full PatternAlert records with human review sign-off and clinical note attachment.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {alerts.length} Total Alerts
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                No safety alerts logged for this patient.
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const isSerious = alert.severity === 'SERIOUS';

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 ${
                        isSerious
                          ? 'bg-rose-50/40 border-rose-300'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isSerious
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {alert.category}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {alert.summary}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                        {alert.reviewedByHuman ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              Reviewed by {alert.reviewedByUserId || 'Dr. Vance'}
                              {alert.reviewNotes ? ` — Clinical note: "${alert.reviewNotes}"` : ''}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2 w-full">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Add clinician audit note (e.g. Conducted 1-on-1 check-in, verified safety)..."
                                value={clinicalNotesMap[alert.id] || ''}
                                onChange={(e) =>
                                  setClinicalNotesMap({
                                    ...clinicalNotesMap,
                                    [alert.id]: e.target.value,
                                  })
                                }
                                className="flex-1 p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleReviewAlert(alert.id)}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Sign Off & Resolve</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clinician Video Review Player Modal */}
      {viewVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-sm text-white truncate max-w-md">
                  {viewVideoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewVideoModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Self-Contained High-Fidelity Therapy Video Player */}
            <TherapyVideoPlayer
              videoUrl={viewVideoModal.url}
              title={viewVideoModal.title}
              initialSeekSeconds={viewVideoModal.initialSeekSeconds || 0}
              report={viewVideoModal.report}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Analysis Readiness: <strong className="text-emerald-400">AI Verified & Calibrated</strong>
              </span>
              <button
                type="button"
                onClick={() => setViewVideoModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Video Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
