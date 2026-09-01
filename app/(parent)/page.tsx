'use client';

import React from 'react';
import { AppUser } from '@/lib/auth';
import ParentDashboard from '@/components/parent/ParentDashboard';

interface ParentPageProps {
  user?: AppUser | null;
  onLogout?: () => void;
  onAttemptCrossRoleNav?: (path: string) => void;
}

export default function ParentPage({ user, onLogout, onAttemptCrossRoleNav }: ParentPageProps) {
  return (
    <div id="parent-area-container" className="space-y-6">
      {/* Role badge header */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50/40 border border-indigo-200/80 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-200 text-2xl flex items-center justify-center">
              👩‍👧
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900">
                  Role: Parent
                </span>
                <span className="text-xs font-mono text-stone-400">
                  /app/(parent)
                </span>
              </div>
              <p className="text-sm text-stone-600 mt-0.5">
                Welcome, <strong>{user?.name || 'Parent'}</strong> — your family overview is below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 border border-stone-200 bg-white hover:bg-stone-50 transition-all cursor-pointer"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* Cross-role test strip */}
        {onAttemptCrossRoleNav && (
          <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-stone-400 font-semibold">Role guard test:</span>
            <button
              id="test-cross-child-btn"
              type="button"
              onClick={() => onAttemptCrossRoleNav('/child')}
              className="px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] font-semibold text-stone-500 hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer"
            >
              /child 🛑
            </button>
            <button
              id="test-cross-clinician-btn"
              type="button"
              onClick={() => onAttemptCrossRoleNav('/clinician')}
              className="px-2.5 py-1 rounded-lg border border-stone-200 text-[11px] font-semibold text-stone-500 hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer"
            >
              /clinician 🛑
            </button>
          </div>
        )}
      </div>

      {/* Main dashboard */}
      <ParentDashboard user={user} />
    </div>
  );
}
