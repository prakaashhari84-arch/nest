import React, { useState } from 'react';
import { CompanionVibe, VIBE_DEFINITIONS, CompanionFormValues } from '@/lib/childProfile';
import NestlingBlob from './NestlingBlob';

interface NestlingCompanionRitualProps {
  onComplete: (companion: CompanionFormValues) => void;
  childNickname?: string;
}

export default function NestlingCompanionRitual({
  onComplete,
  childNickname = 'Friend',
}: NestlingCompanionRitualProps) {
  // Ritual Screen: 1 = Vibe Selection (Light), 2 = Cosmic Naming Reveal (Dark)
  const [ritualScreen, setRitualScreen] = useState<1 | 2>(1);
  const [selectedVibe, setSelectedVibe] = useState<CompanionVibe | null>(null);
  const [companionName, setCompanionName] = useState<string>('');

  const VIBE_OPTIONS: Array<{
    key: CompanionVibe;
    title: string;
    description: string;
    emoji: string;
    borderHighlight: string;
    cardBg: string;
  }> = [
    {
      key: 'CHILL',
      title: 'Chill',
      description: 'Calm and easy-going',
      emoji: '🌿',
      borderHighlight: 'border-emerald-500 ring-4 ring-emerald-200/60 bg-emerald-50/50',
      cardBg: 'border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/20',
    },
    {
      key: 'HYPE',
      title: 'Hype',
      description: 'Energetic and funny',
      emoji: '⚡',
      borderHighlight: 'border-amber-500 ring-4 ring-amber-200/60 bg-amber-50/50',
      cardBg: 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/20',
    },
    {
      key: 'COZY',
      title: 'Cozy',
      description: 'Warm and gentle',
      emoji: '🧸',
      borderHighlight: 'border-rose-500 ring-4 ring-rose-200/60 bg-rose-50/50',
      cardBg: 'border-stone-200 hover:border-rose-300 hover:bg-rose-50/20',
    },
    {
      key: 'COOL',
      title: 'Cool',
      description: 'Quiet and thoughtful',
      emoji: '✨',
      borderHighlight: 'border-indigo-500 ring-4 ring-indigo-200/60 bg-indigo-50/50',
      cardBg: 'border-stone-200 hover:border-indigo-300 hover:bg-indigo-50/20',
    },
  ];

  const handleNextToNaming = () => {
    if (selectedVibe) {
      setRitualScreen(2);
    }
  };

  const handleFinish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedVibe) return;

    onComplete({
      companionVibe: selectedVibe,
      companionName: companionName.trim() || 'Pip',
    });
  };

  /* =========================================================================
     SCREEN 1 — "Create your Nestling" (Light Background)
     ========================================================================= */
  if (ritualScreen === 1) {
    return (
      <div id="nestling-creation-screen-1" className="w-full max-w-xl mx-auto py-4 px-4 sm:px-6 animate-fadeIn">
        <div className="bg-white rounded-3xl border-2 border-stone-200 shadow-lg p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-block">
              Companion Ritual • Step 1
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Create your Nestling
            </h1>
            <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto">
              This little creature will be your companion. Make it yours.
            </p>
          </div>

          {/* Friendly Rounded Blob-Creature Illustration */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="p-4 rounded-3xl bg-stone-50 border border-stone-100 flex items-center justify-center min-h-[160px] w-full max-w-xs shadow-inner">
              <NestlingBlob
                vibe={selectedVibe || 'CHILL'}
                size="lg"
                interactive={true}
                showAura={!!selectedVibe}
              />
            </div>
            <span className="text-xs font-semibold text-stone-400 mt-2">
              {selectedVibe ? `Previewing: ${VIBE_DEFINITIONS[selectedVibe].name} vibe` : 'Tap a vibe below to see it change!'}
            </span>
          </div>

          {/* 2x2 Grid of Selectable Cards */}
          <div className="space-y-3">
            <h2 className="text-center font-bold text-sm text-stone-700 uppercase tracking-wide">
              What vibe do you want?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIBE_OPTIONS.map((v) => {
                const isSelected = selectedVibe === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    id={`vibe-card-${v.key.toLowerCase()}`}
                    onClick={() => setSelectedVibe(v.key)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-left group cursor-pointer ${
                      isSelected ? v.borderHighlight : v.cardBg
                    }`}
                  >
                    <span className="text-3xl p-2 rounded-xl bg-white shadow-xs border border-stone-100 group-hover:scale-110 transition-transform">
                      {v.emoji}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-base text-stone-900">
                          {v.title}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-500 block mt-0.5">
                        "{v.description}"
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next Button at Bottom (Disabled until vibe is picked) */}
          <div className="pt-3 border-t border-stone-100 flex justify-end">
            <button
              id="nestling-vibe-next-btn"
              type="button"
              onClick={handleNextToNaming}
              disabled={!selectedVibe}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-black text-base shadow-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-102 active:scale-98"
            >
              <span>Next: Bring Creature to Life →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     SCREEN 2 — Naming: Full-Bleed Dark Cosmic Gradient Background (Purples/Blues/Teals)
     ========================================================================= */
  const activeVibe = selectedVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[activeVibe];

  return (
    <div
      id="nestling-naming-cosmic-reveal"
      className="relative min-h-[580px] w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10 flex flex-col items-center justify-between text-white animate-fadeIn"
      style={{
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #022c22 100%)',
      }}
    >
      {/* Background Cosmic Starry Grid & Nebulae */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-10 left-12 w-64 h-64 rounded-full bg-purple-600/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-12 w-72 h-72 rounded-full bg-teal-500/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-indigo-500/20 blur-2xl" />
      </div>

      {/* Top Badge */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <button
          type="button"
          onClick={() => setRitualScreen(1)}
          className="text-xs font-bold text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all"
        >
          ← Change vibe ({vibeInfo.name})
        </button>
        <span className="text-[11px] font-mono tracking-widest text-teal-300 uppercase bg-teal-950/60 border border-teal-500/30 px-3 py-1 rounded-full">
          Nestling Reveal ✨
        </span>
      </div>

      {/* Main Center Area: Speech Bubble & Luminous Creature */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 my-4 w-full max-w-lg">
        {/* Speech-Bubble Style Prompt */}
        <div className="relative bg-white/90 backdrop-blur-md text-stone-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-white/40 max-w-md animate-bounce-subtle">
          <p className="text-base sm:text-lg font-bold leading-snug">
            "Hey <span className="text-amber-700">{childNickname}</span>! I'm your Nestling. I don't have a real name yet — want to give me one?"
          </p>
          {/* Speech Bubble Arrow pointing down to creature */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white/90" />
        </div>

        {/* Luminous Cosmic Creature (Rendered larger and glowing) */}
        <div className="my-2">
          <NestlingBlob
            vibe={activeVibe}
            size="cosmic"
            interactive={true}
            showAura={true}
            customName={companionName || undefined}
          />
        </div>

        {/* Naming Input Form */}
        <form onSubmit={handleFinish} className="w-full space-y-4">
          <div className="relative max-w-sm mx-auto">
            <input
              id="nestling-name-input"
              type="text"
              value={companionName}
              onChange={(e) => setCompanionName(e.target.value)}
              placeholder="Type a name... (e.g. Pip, Nova)"
              autoFocus
              maxLength={20}
              className="w-full px-5 py-4 text-center text-lg sm:text-xl font-black rounded-2xl bg-white/10 text-white placeholder-stone-400 border-2 border-teal-400/50 focus:border-teal-300 focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-teal-400/30 backdrop-blur-md shadow-inner transition-all"
            />
          </div>

          {/* Quick Name Suggestions */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
            {['Pip', 'Nova', 'Mochi', 'Bramble', 'Echo', 'Lumi', 'Cosmo', 'Ziggy'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setCompanionName(suggestion)}
                className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-all ${
                  companionName === suggestion
                    ? 'bg-teal-400 text-stone-950 font-black shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-stone-200'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Let's go Button */}
          <div className="pt-2">
            <button
              id="nestling-finish-btn"
              type="submit"
              className="w-full max-w-sm mx-auto py-4 px-8 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 hover:from-teal-300 hover:to-amber-200 text-stone-950 font-black text-lg shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>Let's go →</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Subtext */}
      <div className="relative z-10 text-[11px] text-teal-200/70 font-mono">
        Your companion vibe: <span className="text-white font-bold">{vibeInfo.name}</span> ({vibeInfo.tagline})
      </div>
    </div>
  );
}
