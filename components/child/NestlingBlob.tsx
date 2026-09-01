import React, { useState } from 'react';
import { CompanionVibe, VIBE_DEFINITIONS } from '@/lib/childProfile';

interface NestlingBlobProps {
  vibe?: CompanionVibe | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'cosmic';
  interactive?: boolean;
  showAura?: boolean;
  className?: string;
  onClick?: () => void;
  customName?: string;
}

export default function NestlingBlob({
  vibe = 'CHILL',
  size = 'md',
  interactive = true,
  showAura = false,
  className = '',
  onClick,
  customName,
}: NestlingBlobProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const activeVibe = vibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[activeVibe];

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 600);
    if (onClick) onClick();
  };

  // Dimensions & scaling based on size prop
  const sizeMap = {
    sm: { width: 64, height: 64, container: 'w-16 h-16' },
    md: { width: 120, height: 120, container: 'w-32 h-32' },
    lg: { width: 180, height: 180, container: 'w-44 h-44' },
    xl: { width: 240, height: 240, container: 'w-60 h-60' },
    cosmic: { width: 280, height: 280, container: 'w-72 h-72 md:w-80 md:h-80' },
  };

  const { width, height, container } = sizeMap[size];

  // Visual gradients and themes per vibe
  const vibeGradients: Record<CompanionVibe, { bodyTop: string; bodyBottom: string; glow: string; shadow: string }> = {
    CHILL: {
      bodyTop: '#34d399',
      bodyBottom: '#059669',
      glow: '#10b981',
      shadow: '#064e3b',
    },
    HYPE: {
      bodyTop: '#fde047',
      bodyBottom: '#f59e0b',
      glow: '#fbbf24',
      shadow: '#b45309',
    },
    COZY: {
      bodyTop: '#fda4af',
      bodyBottom: '#f43f5e',
      glow: '#fb7185',
      shadow: '#9f1239',
    },
    COOL: {
      bodyTop: '#818cf8',
      bodyBottom: '#4f46e5',
      glow: '#6366f1',
      shadow: '#312e81',
    },
  };

  const gradient = vibeGradients[activeVibe];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${container} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={interactive ? handleClick : undefined}
    >
      {/* Outer Luminous Magical Aura */}
      {(showAura || size === 'cosmic') && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${gradient.glow} 0%, rgba(255,255,255,0) 70%)`,
            transform: size === 'cosmic' ? 'scale(1.45)' : 'scale(1.2)',
          }}
        />
      )}

      {/* Cosmic Orbiting Stars / Particles for cosmic reveal */}
      {size === 'cosmic' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-6 text-amber-300 text-sm animate-bounce">✨</div>
          <div className="absolute bottom-6 right-4 text-cyan-300 text-base animate-pulse">🌟</div>
          <div className="absolute top-10 right-8 text-pink-300 text-xs animate-ping">💫</div>
        </div>
      )}

      {/* SVG Blob Creature */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 200 200"
        className={`transition-transform duration-300 ease-out cursor-pointer ${
          isClicked ? 'scale-110 -translate-y-2' : isHovered ? 'scale-105 -translate-y-1' : 'scale-100'
        }`}
        style={{
          filter:
            size === 'cosmic'
              ? `drop-shadow(0 0 24px ${gradient.glow}) drop-shadow(0 10px 20px rgba(0,0,0,0.5))`
              : `drop-shadow(0 10px 15px rgba(0,0,0,0.12))`,
        }}
      >
        <defs>
          <linearGradient id={`blobGrad-${activeVibe}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.bodyTop} />
            <stop offset="100%" stopColor={gradient.bodyBottom} />
          </linearGradient>

          <radialGradient id={`bellyGlow-${activeVibe}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Shadow under feet/bottom */}
        <ellipse
          cx="100"
          cy="185"
          rx={isHovered ? 48 : 55}
          ry="10"
          fill="rgba(0, 0, 0, 0.15)"
          className="transition-all duration-300"
        />

        {/* Main Blob Body - organic rounded morph */}
        <path
          d={
            activeVibe === 'HYPE'
              ? 'M 100 25 C 165 25 185 75 180 135 C 175 180 145 185 100 185 C 55 185 25 180 20 135 C 15 75 35 25 100 25 Z'
              : activeVibe === 'COZY'
              ? 'M 100 35 C 160 30 185 75 182 140 C 178 185 140 185 100 185 C 60 185 22 185 18 140 C 15 75 40 30 100 35 Z'
              : activeVibe === 'COOL'
              ? 'M 100 30 C 155 30 178 70 175 135 C 172 182 140 182 100 182 C 60 182 28 182 25 135 C 22 70 45 30 100 30 Z'
              : 'M 100 30 C 160 30 180 75 178 135 C 175 182 145 185 100 185 C 55 185 25 182 22 135 C 20 75 40 30 100 30 Z'
          }
          fill={`url(#blobGrad-${activeVibe})`}
        />

        {/* Highlights and Soft Belly Light */}
        <ellipse cx="100" cy="135" rx="45" ry="32" fill={`url(#bellyGlow-${activeVibe})`} />
        <ellipse cx="65" cy="55" rx="14" ry="7" transform="rotate(-30 65 55)" fill="#ffffff" opacity="0.4" />

        {/* Small Cute Little Antenna / Leaf / Cap depending on Vibe */}
        {activeVibe === 'CHILL' && (
          <g transform="translate(100, 30)">
            <path d="M 0 0 C 0 -18 16 -22 22 -14 C 26 -6 10 2 0 0" fill="#10b981" stroke="#047857" strokeWidth="2" />
            <path d="M 0 0 C 0 -14 -12 -18 -16 -10 C -18 -4 -8 2 0 0" fill="#34d399" />
          </g>
        )}

        {activeVibe === 'HYPE' && (
          <g transform="translate(100, 25)">
            <polygon points="0,-22 8,-8 2,-8 6,2 -8,-4 -2,-4" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          </g>
        )}

        {activeVibe === 'COZY' && (
          <g transform="translate(100, 35)">
            <circle cx="-35" cy="-2" r="10" fill="#fda4af" stroke="#e11d48" strokeWidth="2" />
            <circle cx="35" cy="-2" r="10" fill="#fda4af" stroke="#e11d48" strokeWidth="2" />
          </g>
        )}

        {activeVibe === 'COOL' && (
          <g transform="translate(100, 30)">
            <polygon points="0,-18 5,-8 16,-8 7,-2 10,9 0,3 -10,9 -7,-2 -16,-8 -5,-8" fill="#a5b4fc" />
          </g>
        )}

        {/* Blush Cheeks */}
        <circle cx="50" cy="115" r="9" fill={activeVibe === 'COZY' ? '#fb7185' : '#f43f5e'} opacity="0.35" />
        <circle cx="150" cy="115" r="9" fill={activeVibe === 'COZY' ? '#fb7185' : '#f43f5e'} opacity="0.35" />

        {/* EYES - Expressive based on Vibe */}
        {activeVibe === 'CHILL' && (
          <g>
            {/* Gentle curved happy closed eyes */}
            <path d="M 62 95 Q 75 82 88 95" fill="none" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" />
            <path d="M 112 95 Q 125 82 138 95" fill="none" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {activeVibe === 'HYPE' && (
          <g>
            {/* Wide sparkling open eyes */}
            <circle cx="72" cy="92" r="14" fill="#1f2937" />
            <circle cx="128" cy="92" r="14" fill="#1f2937" />
            {/* Eye glints */}
            <circle cx="68" cy="88" r="5" fill="#ffffff" />
            <circle cx="76" cy="96" r="2.5" fill="#ffffff" />
            <circle cx="124" cy="88" r="5" fill="#ffffff" />
            <circle cx="132" cy="96" r="2.5" fill="#ffffff" />
            {/* Star sparkle in eyes */}
            <polygon points="72,82 74,86 78,86 75,89 76,93 72,90 68,93 69,89 66,86 70,86" fill="#fde047" />
            <polygon points="128,82 130,86 134,86 131,89 132,93 128,90 124,93 125,89 122,86 126,86" fill="#fde047" />
          </g>
        )}

        {activeVibe === 'COZY' && (
          <g>
            {/* Sweet curved sleepy happy eyes */}
            <path d="M 64 96 Q 76 86 88 96" fill="none" stroke="#881337" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 112 96 Q 124 86 136 96" fill="none" stroke="#881337" strokeWidth="4.5" strokeLinecap="round" />
            {/* Cute lashes */}
            <line x1="88" y1="94" x2="94" y2="90" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
            <line x1="112" y1="94" x2="106" y2="90" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {activeVibe === 'COOL' && (
          <g>
            {/* Sleek cool stylish look / glasses or starry confident eyes */}
            <rect x="56" y="82" width="36" height="24" rx="8" fill="#1e1b4b" stroke="#c7d2fe" strokeWidth="2.5" />
            <rect x="108" y="82" width="36" height="24" rx="8" fill="#1e1b4b" stroke="#c7d2fe" strokeWidth="2.5" />
            <line x1="92" y1="92" x2="108" y2="92" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
            {/* Glass glint */}
            <line x1="62" y1="86" x2="74" y2="100" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
            <line x1="114" y1="86" x2="126" y2="100" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
          </g>
        )}

        {/* MOUTH - Cute, responsive */}
        {activeVibe === 'CHILL' && (
          <path d="M 92 114 Q 100 122 108 114" fill="none" stroke="#064e3b" strokeWidth="3.5" strokeLinecap="round" />
        )}

        {activeVibe === 'HYPE' && (
          <path d="M 88 112 Q 100 134 112 112 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
        )}

        {activeVibe === 'COZY' && (
          <path d="M 94 114 Q 100 120 106 114" fill="none" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" />
        )}

        {activeVibe === 'COOL' && (
          <path d="M 94 116 Q 102 120 110 115" fill="none" stroke="#312e81" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Small bouncy feet / base buds */}
        <ellipse cx="70" cy="180" rx="14" ry="8" fill={gradient.bodyBottom} />
        <ellipse cx="130" cy="180" rx="14" ry="8" fill={gradient.bodyBottom} />
      </svg>

      {/* Floating Name Label if provided */}
      {customName && (
        <div className="mt-2 px-3 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-xs font-bold shadow-md border border-white/20 flex items-center gap-1.5 animate-fadeIn">
          <span>{vibeInfo.emoji}</span>
          <span>{customName}</span>
        </div>
      )}
    </div>
  );
}
