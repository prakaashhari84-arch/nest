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
  onAttemptCrossRoleNav,
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
    <div id="clinician-area-container" className="space-y-6">
      {/* Route Badge & Role Header */}
      <div className="bg-sky-50 border border-sky-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-300 text-2xl flex items-center justify-center shadow-xs">
              🩺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-200 text-sky-900">
                  Role: CLINICIAN
                </span>
                <span className="text-xs font-mono text-stone-500">
                  /app/(clinician)/page.tsx
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-stone-900 mt-0.5">
                Clinician Workspace & Supervision Hub
              </h1>
              <p className="text-xs text-stone-600">
                Welcome, {user?.name || 'Dr. Marcus Vance, MD'}! Clinical caseload, safety rules, care team messaging, and audit log.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="open-alerts-hub-header-btn"
              type="button"
              onClick={() => setCurrentSubTab('alerts')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚨</span>
              <span>Safety Alerts ({unreviewedCount})</span>
            </button>
            <button
              id="open-rules-engine-header-btn"
              type="button"
              onClick={() => setCurrentSubTab('rules')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🛡️</span>
              <span>Safety Rules ({ruleSets.length})</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-sky-200/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCurrentSubTab('overview')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              currentSubTab === 'overview'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            Caseload Overview (Goals / Chats / AI Room / Log)
          </button>
          <button
            id="nav-to-alerts-tab-btn"
            type="button"
            onClick={() => setCurrentSubTab('alerts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSubTab === 'alerts'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            <span>🚨</span>
            <span>Safety Alerts Hub ({alerts.length})</span>
          </button>
          <button
            id="nav-to-rules-tab-btn"
            type="button"
            onClick={() => setCurrentSubTab('rules')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSubTab === 'rules'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            <span>🛡️</span>
            <span>Safety Rule Engine & Precedence</span>
          </button>
        </div>
      </div>

      {/* Main Clinician Workspace */}
      <ErrorBoundary fallbackTitle="Error loading Clinician Workspace">
        <ClinicianDashboard
          user={user}
          onNavigateToRules={(childId) => setCurrentSubTab('rules')}
          onNavigateToAlerts={() => setCurrentSubTab('alerts')}
        />
      </ErrorBoundary>

      {/* Middleware Cross-Role Test Buttons */}
      {onAttemptCrossRoleNav && (
        <div className="p-4 rounded-3xl border border-stone-200 bg-stone-50/50 space-y-2">
          <div className="text-xs font-bold text-stone-800 flex items-center justify-between">
            <span>🛡️ Role-Based Access Guard Test</span>
            <span className="text-[11px] font-normal text-stone-500">Attempting to cross roles triggers middleware blocking</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="test-cross-child-btn"
              type="button"
              onClick={() => onAttemptCrossRoleNav('/child')}
              className="px-3 py-1.5 rounded-xl border border-stone-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-xs font-semibold text-stone-700 hover:text-rose-700 transition-all cursor-pointer"
            >
              Try navigating to /app/(child) 🛑
            </button>
            <button
              id="test-cross-parent-btn"
              type="button"
              onClick={() => onAttemptCrossRoleNav('/parent')}
              className="px-3 py-1.5 rounded-xl border border-stone-300 hover:border-rose-400 bg-white hover:bg-rose-50 text-xs font-semibold text-stone-700 hover:text-rose-700 transition-all cursor-pointer"
            >
              Try navigating to /app/(parent) 🛑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
