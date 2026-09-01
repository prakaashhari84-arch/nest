'use client';

import React, { useState } from 'react';
import { AppUser } from '@/lib/auth';
import ClinicianRulesPage from './rules/page';
import ClinicianAlertsPage from './alerts/page';
import ClinicianDashboard from '@/components/clinician/ClinicianDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getAllRuleSets } from '@/lib/rules';
import { getStoredAlerts } from '@/lib/safetyPatterns';

interface ClinicianPageProps {
  user?: AppUser | null;
  onLogout?: () => void;
  onAttemptCrossRoleNav?: (path: string) => void;
  initialSubTab?: 'overview' | 'rules' | 'alerts';
}

export default function ClinicianPage({
  user,
  onLogout,
  initialSubTab = 'overview',
}: ClinicianPageProps) {
  const [currentSubTab, setCurrentSubTab] = useState<'overview' | 'rules' | 'alerts'>(initialSubTab);
  const ruleSets = getAllRuleSets();
  const alerts = getStoredAlerts();
  const unreviewedCount = alerts.filter((a) => !a.reviewedByHuman).length;

  if (currentSubTab === 'rules') {
    return (
      <ClinicianRulesPage
        user={user}
        onNavigateBack={() => setCurrentSubTab('overview')}
      />
    );
  }

  if (currentSubTab === 'alerts') {
    return (
      <ClinicianAlertsPage
        user={user}
        onNavigateBack={() => setCurrentSubTab('overview')}
      />
    );
  }

  return (
    <div id="clinician-area-container" className="min-h-[100dvh] w-full flex flex-col bg-stone-50 py-4 px-3 sm:px-6 space-y-6">
      {/* Clinician Header */}
      <div className="bg-gradient-to-br from-sky-50 via-white to-sky-50/50 border border-sky-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-300 text-2xl flex items-center justify-center shrink-0 shadow-xs">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-100 text-sky-900">
                  Supervising Clinician
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-stone-900 mt-0.5 font-['Space_Grotesk',sans-serif]">
                Clinical Workspace & Supervision Hub
              </h1>
              <p className="text-xs text-stone-600">
                Welcome, {user?.name || 'Dr. Marcus Vance, MD'} &mdash; Caseload management, safety oversight, and therapy progression.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="open-alerts-hub-header-btn"
              type="button"
              onClick={() => setCurrentSubTab('alerts')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px]"
            >
              <span>🚨</span>
              <span>Safety Alerts ({unreviewedCount})</span>
            </button>
            <button
              id="open-rules-engine-header-btn"
              type="button"
              onClick={() => setCurrentSubTab('rules')}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px]"
            >
              <span>🛡️</span>
              <span>Safety Rules ({ruleSets.length})</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-stone-700 border border-stone-300 bg-white hover:bg-stone-50 transition-all cursor-pointer min-h-[42px]"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sky-100 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCurrentSubTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
              currentSubTab === 'overview'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            Caseload Overview
          </button>
          <button
            id="nav-to-alerts-tab-btn"
            type="button"
            onClick={() => setCurrentSubTab('alerts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[40px] ${
              currentSubTab === 'alerts'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            <span>🚨</span>
            <span>Safety Alerts Hub ({alerts.length})</span>
          </button>
          <button
            id="nav-to-rules-tab-btn"
            type="button"
            onClick={() => setCurrentSubTab('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[40px] ${
              currentSubTab === 'rules'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            <span>🛡️</span>
            <span>Safety Rule Engine</span>
          </button>
        </div>
      </div>

      {/* Main Clinician Workspace */}
      <ErrorBoundary fallbackTitle="Error loading Clinician Workspace">
        <ClinicianDashboard
          user={user}
          onNavigateToRules={() => setCurrentSubTab('rules')}
          onNavigateToAlerts={() => setCurrentSubTab('alerts')}
        />
      </ErrorBoundary>
    </div>
  );
}
