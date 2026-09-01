'use client';

import React from 'react';
import { Sparkles, MessageCircleQuestion } from 'lucide-react';

export interface ChoiceOption {
  id: string;
  emoji: string;
  label: string;
  fullMessage?: string;
  badge?: string;
  variant?: 'default' | 'highlight' | 'positive' | 'gentle';
}

interface MultipleChoiceBarProps {
  title?: string;
  options?: ChoiceOption[];
  onSelect: (optionText: string) => void;
  disabled?: boolean;
}

export const DEFAULT_CHILD_CHOICES: ChoiceOption[] = [
  { id: 'opt_yes', emoji: '😊', label: 'Yes!', fullMessage: 'Yes, that is true! 😊', variant: 'positive' },
  { id: 'opt_kind_of', emoji: '😐', label: 'Kind of', fullMessage: 'Kind of, a little bit. 😐', variant: 'default' },
  { id: 'opt_no', emoji: '😢', label: 'Not really', fullMessage: 'Not really, no. 😢', variant: 'gentle' },
  { id: 'opt_story', emoji: '📖', label: 'Tell a story', fullMessage: 'Can you tell me a cozy story?', variant: 'highlight' },
  { id: 'opt_breath', emoji: '💨', label: 'Breathe together', fullMessage: "Let's take three calm belly breaths together.", variant: 'default' },
];

export default function MultipleChoiceBar({
  title = 'Did something like this happen?',
  options = DEFAULT_CHILD_CHOICES,
  onSelect,
  disabled = false,
}: MultipleChoiceBarProps) {
  return (
    <div
      id="multiple-choice-response-bar"
      className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-2xl space-y-2.5 shadow-2xs animate-fadeIn"
    >
      {title && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-purple-600" />
            <span>{title}</span>
          </span>
          <span className="text-[10px] font-bold text-purple-600 bg-purple-100/80 px-2 py-0.5 rounded-full">
            Tap a choice
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {options.map((opt) => {
          const isHighlight = opt.variant === 'highlight';
          const isPositive = opt.variant === 'positive';

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.fullMessage || `${opt.emoji} ${opt.label}`)}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px] ${
                isHighlight
                  ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-300 ring-offset-1'
                  : isPositive
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white hover:bg-purple-100/90 text-stone-800 border border-purple-200/90'
              }`}
            >
              <span className="text-base leading-none">{opt.emoji}</span>
              <span className="whitespace-nowrap">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
