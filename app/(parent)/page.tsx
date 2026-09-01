'use client';

import React from 'react';
import { AppUser } from '@/lib/auth';
import ParentDashboard from '@/components/parent/ParentDashboard';

interface ParentPageProps {
  user?: AppUser | null;
  onLogout?: () => void;
  onAttemptCrossRoleNav?: (path: string) => void;
}

export default function ParentPage({ user, onLogout }: ParentPageProps) {
  return (
    <div id="parent-area-container" className="min-h-[100dvh] w-full flex flex-col bg-stone-50 py-4 px-3 sm:px-6 space-y-6">
      {/* Role header */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50/40 border border-indigo-200/80 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-200 text-2xl flex items-center justify-center shrink-0">
              👩‍👧
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900">
                  Parent Caregiver
                </span>
              </div>
              <p className="text-sm text-stone-700 mt-0.5">
                Welcome, <strong>{user?.name || 'Parent'}</strong> &mdash; family activity and home practice overview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 border border-stone-300 bg-white hover:bg-stone-50 transition-all cursor-pointer min-h-[40px]"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main dashboard */}
      <ParentDashboard user={user} />
    </div>
  );
}
