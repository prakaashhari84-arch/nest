'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Clock,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppUser } from '@/lib/auth';
import {
  PatternAlert,
  getPatternAlerts,
  markAlertReviewed,
  evaluatePatterns,
  getRegionalHelpline,
  getTrustedPerson,
} from '@/lib/safetyPatterns';
import { getConversationTurns } from '@/lib/companion';

interface ClinicianAlertsPageProps {
  user?: AppUser | null;
  onNavigateBack?: () => void;
}

export default function ClinicianAlertsPage({
  user,
  onNavigateBack,
}: ClinicianAlertsPageProps) {
  const [alerts, setAlerts] = useState<PatternAlert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'SERIOUS' | 'MILD' | 'UNREVIEWED' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<PatternAlert | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [evaluatingChildId, setEvaluatingChildId] = useState<string>('user_child_01');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadAlerts = () => {
    const list = getPatternAlerts(undefined, 'CLINICIAN');
    setAlerts([...list]);
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleRunEvaluation = async (simulatedType?: 'SERIOUS_DISCLOSURE' | 'PARENT_CONFLICT' | 'RECURRING_SAD') => {
    setIsEvaluating(true);
    try {
      if (simulatedType === 'PARENT_CONFLICT') {
        await evaluatePatterns(evaluatingChildId, {
          triggerSeverity: 'SERIOUS',
          forceCategory: 'abuse_disclosure',
          triggerText: 'My dad got really angry and hit me again last night. I am scared to go home.',
        });
      } else if (simulatedType === 'SERIOUS_DISCLOSURE') {
        await evaluatePatterns(evaluatingChildId, {
          triggerSeverity: 'SERIOUS',
          forceCategory: 'self_harm_mention',
          triggerText: 'I feel like giving up and I do not want to be around anymore.',
        });
      } else if (simulatedType === 'RECURRING_SAD') {
        await evaluatePatterns(evaluatingChildId, {
          forceCategory: 'sustained_sadness',
        });
      } else {
        await evaluatePatterns(evaluatingChildId);
      }
      loadAlerts();
      showToast('Safety pattern evaluation completed.');
    } catch (err) {
      console.error('Failed to run safety evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleConfirmReview = () => {
    if (!selectedAlert) return;
    const reviewerId = user?.id || 'clinician_01';
    markAlertReviewed(selectedAlert.id, reviewerId, reviewNotes);
    setReviewModalOpen(false);
    setReviewNotes('');
    loadAlerts();
    showToast(`Alert marked as reviewed by ${user?.name || 'Clinician'}.`);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'SERIOUS') return a.severity === 'SERIOUS';
    if (filterSeverity === 'MILD') return a.severity === 'MILD';
    if (filterSeverity === 'UNREVIEWED') return !a.reviewedByHuman;
    if (filterSeverity === 'RESOLVED') return a.reviewedByHuman;
    return true;
  });

  const unreviewedCount = alerts.filter((a) => !a.reviewedByHuman).length;
  const seriousCount = alerts.filter((a) => a.severity === 'SERIOUS' && !a.reviewedByHuman).length;

  return (
    <div id="clinician-alerts-page" className="space-y-6 animate-fadeIn select-none">
      {/* Toast Notice */}
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

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-sky-50 border-2 border-rose-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl shadow-md border border-rose-300">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                Safety-Critical
              </span>
              <span className="text-xs font-mono text-slate-500">
                /app/(clinician)/alerts
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1">
              Pattern Tracking & Escalation Hub
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Watches ConversationTurns, MoodEntries & PlaceRatings over 14-day rolling windows. AI strictly flags patterns and never auto-resolves alerts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              ← Back to Overview
            </button>
          )}
          <button
            type="button"
            onClick={() => loadAlerts()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Safety Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Alerts</span>
          <span className="text-2xl font-black text-slate-900 block">{alerts.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Serious Unreviewed</span>
          <span className="text-2xl font-black text-rose-950 block">{seriousCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Requires Human Review</span>
          <span className="text-2xl font-black text-amber-950 block">{unreviewedCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Resolved by Clinician</span>
          <span className="text-2xl font-black text-emerald-950 block">
            {alerts.filter((a) => a.reviewedByHuman).length}
          </span>
        </div>
      </div>

      {/* Safety Simulator & Evaluation Launcher Card */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">
              Prompt 9 Safety Engine Tester & Simulator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            evaluatePatterns(childId)
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Simulate safety-critical disclosures to verify explicit pattern routing, parent safety blocks, and helpline escalations:
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={isEvaluating}
            onClick={() => handleRunEvaluation('PARENT_CONFLICT')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate Serious Abuse Disclosure (Parent Guard Test)</span>
          </button>

          <button
            type="button"
            disabled={isEvaluating}
            onClick={() => handleRunEvaluation('SERIOUS_DISCLOSURE')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Self-Harm Signal (SERIOUS Alert)</span>
          </button>

          <button
            type="button"
            disabled={isEvaluating}
            onClick={() => handleRunEvaluation('RECURRING_SAD')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Simulate Recurring Sad Moods (MILD Alert)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'SERIOUS', 'MILD', 'UNREVIEWED', 'RESOLVED'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setFilterSeverity(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterSeverity === filter
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {filter === 'ALL' && 'All Alerts'}
            {filter === 'SERIOUS' && '🚨 SERIOUS'}
            {filter === 'MILD' && '⚠️ MILD'}
            {filter === 'UNREVIEWED' && '⏳ Unreviewed'}
            {filter === 'RESOLVED' && '✅ Resolved'}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No matching alerts</h3>
            <p className="text-xs text-slate-500">
              No safety concerns match the selected filter.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isSerious = alert.severity === 'SERIOUS';
            const isParentBlocked = alert.suspectedAbuserIsParent;

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-5 sm:p-6 rounded-3xl border-2 transition-all space-y-4 ${
                  isSerious
                    ? 'bg-rose-50/40 border-rose-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Alert Top Row: Severity, Category, Status, Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                        isSerious
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isSerious ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{alert.severity}</span>
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs capitalize">
                      {alert.category.replace(/_/g, ' ')}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Child: {alert.childId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        alert.reviewedByHuman
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {alert.status}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(alert.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Non-Diagnostic Observation Summary */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Clinical Observation Summary (Non-Diagnostic)
                  </span>
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-white/80 p-3.5 rounded-2xl border border-slate-200">
                    "{alert.summary}"
                  </p>
                </div>

                {/* PARENT SAFETY GUARD NOTICE (If parent is suspected abuser) */}
                {isParentBlocked && (
                  <div
                    id={`parent-safety-block-${alert.id}`}
                    className="p-4 rounded-2xl bg-rose-100/90 border-2 border-rose-400 text-rose-950 space-y-2 animate-fadeIn"
                  >
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide text-rose-900">
                      <ShieldAlert className="w-4 h-4 text-rose-700" />
                      <span>CRITICAL PARENT SAFETY GUARD ACTIVATED: Parent Notification Blocked</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      An explicit LLM classification identified a primary caregiver/parent as the suspected source of harm.
                      <strong> This alert is strictly hidden from the parent dashboard</strong> to ensure child safety.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-semibold">
                      <div className="p-2.5 rounded-xl bg-white border border-rose-300 flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold block text-rose-950">Helpline Escalated:</span>
                          <span className="text-[11px] text-slate-600">
                            {alert.helplineContact?.name || 'Childhelp Hotline'} ({alert.helplineContact?.phoneNumber || '1-800-422-4453'})
                          </span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-rose-300 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold block text-rose-950">Trusted Person Contacted:</span>
                          <span className="text-[11px] text-slate-600">
                            {alert.trustedPerson?.name || 'Aunt Sarah (Family Advocate)'} ({alert.trustedPerson?.contactPhone || '555-0142'})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Standard Routing Notice for Normal SERIOUS alerts */}
                {isSerious && !isParentBlocked && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      <strong>Standard Serious Escalation:</strong> Linked clinician and primary caregiver notified simultaneously. Emergency helpline resources attached.
                    </span>
                  </div>
                )}

                {/* Review Audit Status & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs">
                    {alert.reviewedByHuman ? (
                      <div className="text-emerald-800 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          Reviewed by {alert.reviewedByUserId || 'Dr. Vance'} at{' '}
                          {alert.reviewedAt ? new Date(alert.reviewedAt).toLocaleDateString() : 'recently'}
                          {alert.reviewNotes ? ` — "${alert.reviewNotes}"` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-800 font-bold text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Action Required: Awaiting clinician human verification</span>
                      </span>
                    )}
                  </div>

                  {!alert.reviewedByHuman && (
                    <button
                      id={`mark-reviewed-btn-${alert.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedAlert(alert);
                        setReviewModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Review & Acknowledge Alert</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Human Review Modal (AI Never auto-resolves alerts) */}
      {reviewModalOpen && selectedAlert && (
        <div
          id="review-alert-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-black text-base text-slate-900">
                  Human Clinical Review & Acknowledgment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p>
                <strong>Alert ID:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">{selectedAlert.id}</code>
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-bold block text-slate-900">Observation:</span>
                <p className="mt-0.5 italic">"{selectedAlert.summary}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Clinical Action / Follow-up Notes (Optional):
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Conducted 1-on-1 check-in, verified safety with school counselor, caregiver outreach planned..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">
                🔒 Mandate: Confirming this review marks <code>reviewedByHuman: true</code> and records your clinician identifier in the permanent safety audit trail.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md cursor-pointer active:scale-95"
              >
                Confirm Review & Resolve Alert ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
