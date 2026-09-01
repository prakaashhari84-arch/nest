'use client';

import React from 'react';
import { MoodEntryData, MoodType } from '@/lib/mood';

interface MoodSparklineProps {
  entries: MoodEntryData[];
  maxDays?: number;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onSelectEntry?: (entry: MoodEntryData) => void;
}

const MOOD_CONFIG: Record<
  MoodType,
  {
    score: number; // 3 = HAPPY, 2 = MILD, 1 = SAD
    color: string;
    fillColor: string;
    label: string;
    emoji: string;
    dotClass: string;
  }
> = {
  HAPPY: {
    score: 3,
    color: '#10b981', // emerald-500
    fillColor: 'rgba(16, 185, 129, 0.15)',
    label: 'Happy / Good',
    emoji: '😊',
    dotClass: 'bg-emerald-500 ring-emerald-200',
  },
  MILD: {
    score: 2,
    color: '#f59e0b', // amber-500
    fillColor: 'rgba(245, 158, 11, 0.15)',
    label: 'Okay / Mild',
    emoji: '😐',
    dotClass: 'bg-amber-500 ring-amber-200',
  },
  SAD: {
    score: 1,
    color: '#f43f5e', // rose-500
    fillColor: 'rgba(244, 63, 94, 0.15)',
    label: 'Tough / Sad',
    emoji: '😢',
    dotClass: 'bg-rose-500 ring-rose-200',
  },
};

export default function MoodSparkline({
  entries,
  maxDays = 14,
  className = '',
  showLabels = true,
  compact = false,
  interactive = true,
  onSelectEntry,
}: MoodSparklineProps) {
  // Take last N entries sorted chronologically
  const sortedEntries = [...entries]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-maxDays);

  const [hoveredEntry, setHoveredEntry] = React.useState<MoodEntryData | null>(null);

  if (sortedEntries.length === 0) {
    return (
      <div
        id="mood-sparkline-empty"
        className={`p-3 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400 ${className}`}
      >
        No mood check-ins recorded yet.
      </div>
    );
  }

  // Calculate coordinates for SVG sparkline
  const width = 280;
  const height = compact ? 48 : 64;
  const paddingX = 14;
  const paddingTop = 8;
  const paddingBottom = 10;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;

  // Score mapping: 3 -> top (paddingTop), 2 -> mid, 1 -> bottom (height - paddingBottom)
  const getY = (score: number) => {
    // score 3 -> 0%, 2 -> 50%, 1 -> 100%
    const ratio = (3 - score) / 2;
    return paddingTop + ratio * usableHeight;
  };

  const points = sortedEntries.map((entry, idx) => {
    const score = MOOD_CONFIG[entry.mood]?.score || 2;
    const x =
      sortedEntries.length === 1
        ? width / 2
        : paddingX + (idx / (sortedEntries.length - 1)) * usableWidth;
    const y = getY(score);
    return { x, y, entry, score };
  });

  // Build SVG path
  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Catmull-Rom or smooth curve
    const prev = points[idx - 1];
    const cpx1 = prev.x + (p.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (p.x - prev.x) / 2;
    const cpy2 = p.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${p.x} ${p.y}`;
  }, '');

  // Fill gradient path
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const fillD = `${pathD} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

  // Summary counts
  const happyCount = sortedEntries.filter((e) => e.mood === 'HAPPY').length;
  const mildCount = sortedEntries.filter((e) => e.mood === 'MILD').length;
  const sadCount = sortedEntries.filter((e) => e.mood === 'SAD').length;

  return (
    <div
      id="mood-sparkline-container"
      className={`relative flex flex-col bg-white border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs ${className}`}
    >
      {/* Top Header Summary */}
      {showLabels && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-900">
              Mood Rhythm ({sortedEntries.length} entries)
            </span>
            {sadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                {sadCount} flag{sadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500">
            <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
              <span>😊</span> {happyCount}
            </span>
            <span className="flex items-center gap-0.5 text-amber-700 font-bold">
              <span>😐</span> {mildCount}
            </span>
            <span className="flex items-center gap-0.5 text-rose-700 font-bold">
              <span>😢</span> {sadCount}
            </span>
          </div>
        </div>
      )}

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Guideline lines */}
          <line
            x1={paddingX}
            y1={getY(3)}
            x2={width - paddingX}
            y2={getY(3)}
            stroke="#e2e8f0"
            strokeDasharray="2 3"
            strokeWidth="0.8"
          />
          <line
            x1={paddingX}
            y1={getY(2)}
            x2={width - paddingX}
            y2={getY(2)}
            stroke="#e2e8f0"
            strokeDasharray="2 3"
            strokeWidth="0.8"
          />
          <line
            x1={paddingX}
            y1={getY(1)}
            x2={width - paddingX}
            y2={getY(1)}
            stroke="#e2e8f0"
            strokeDasharray="2 3"
            strokeWidth="0.8"
          />

          {/* Gradient Area Fill */}
          <path d={fillD} fill="url(#sparklineGrad)" />

          {/* Line Stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {points.map((p, idx) => {
            const conf = MOOD_CONFIG[p.entry.mood];
            const isHovered = hoveredEntry?.id === p.entry.id;
            return (
              <g
                key={p.entry.id || idx}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => interactive && setHoveredEntry(p.entry)}
                onMouseLeave={() => interactive && setHoveredEntry(null)}
                onClick={() => onSelectEntry && onSelectEntry(p.entry)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : p.entry.priorityFlag ? 4.5 : 3.5}
                  fill={conf.color}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2 : 1.5}
                  className="transition-all duration-150"
                />
                {p.entry.priorityFlag && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={7}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    className="animate-spin-slow"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Info Tooltip */}
      {hoveredEntry && (
        <div className="mt-2 p-2 rounded-xl bg-stone-900 text-stone-100 text-[11px] flex items-center justify-between gap-2 shadow-md animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{MOOD_CONFIG[hoveredEntry.mood].emoji}</span>
            <span className="font-bold">{MOOD_CONFIG[hoveredEntry.mood].label}</span>
            {hoveredEntry.note && (
              <span className="text-stone-300 italic truncate max-w-[150px]">
                — "{hoveredEntry.note}"
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-400 font-mono">
            {new Date(hoveredEntry.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}

      {/* Footer Axis Guide */}
      <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium mt-1 px-1">
        <span>{sortedEntries.length}d ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
