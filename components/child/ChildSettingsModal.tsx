'use client';

import React from 'react';
import { LogOut, X, Sparkles } from 'lucide-react';
import { useChildTheme } from './ChildThemeProvider';

interface ChildSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  nickname: string;
  companionName?: string;
}

export default function ChildSettingsModal({
  isOpen,
  onClose,
  onLogout,
  nickname,
  companionName = 'Nestling',
}: ChildSettingsModalProps) {
  const { isYounger } = useChildTheme();

  if (!isOpen) return null;

  return (
    <div
      id="child-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="child-settings-modal-content"
        className={`w-full max-w-sm bg-white border shadow-2xl p-6 relative animate-scaleUp ${
          isYounger
            ? 'rounded-3xl border-purple-100'
            : 'rounded-2xl border-stone-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-stone-900">
            Settings
          </h2>
          <p className="text-xs text-stone-500">
            Logged in as <strong className="text-stone-800">{nickname}</strong> with <strong className="text-purple-700">{companionName}</strong>
          </p>
        </div>

        {/* Modal Content: Single Logout action */}
        <div className="mt-6 space-y-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100 text-center">
            <p className="text-xs text-stone-600">
              Ready to take a break for now? You can safely log out here.
            </p>
          </div>

          <button
            id="child-logout-btn"
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Log Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-all"
          >
            Stay & Keep Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
