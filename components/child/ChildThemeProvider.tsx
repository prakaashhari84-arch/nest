'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { AgeGroup } from '@/lib/childProfile';

interface ChildThemeContextValue {
  ageGroup: AgeGroup;
  effectiveAgeGroup: AgeGroup;
  setAgeGroupOverride: (override: AgeGroup | null) => void;
  ageGroupOverride: AgeGroup | null;
  isYounger: boolean;
}

const ChildThemeContext = createContext<ChildThemeContextValue | undefined>(undefined);

interface ChildThemeProviderProps {
  ageGroup: AgeGroup;
  children: ReactNode;
}

export function ChildThemeProvider({ ageGroup, children }: ChildThemeProviderProps) {
  const [ageGroupOverride, setAgeGroupOverride] = useState<AgeGroup | null>(null);

  const effectiveAgeGroup = ageGroupOverride || ageGroup || 'SIX_TO_TEN';
  const isYounger = effectiveAgeGroup === 'SIX_TO_TEN';

  const contextValue = useMemo<ChildThemeContextValue>(
    () => ({
      ageGroup,
      effectiveAgeGroup,
      setAgeGroupOverride,
      ageGroupOverride,
      isYounger,
    }),
    [ageGroup, effectiveAgeGroup, ageGroupOverride, isYounger]
  );

  // Define design tokens in CSS variables:
  // Everyday palette: warm, lavender/cream/mint/off-white tones
  const themeStyles: React.CSSProperties = {
    // Canvas & Surface Colors
    ['--child-canvas' as any]: isYounger ? '#fcfbf7' : '#f8f8fc',
    ['--child-surface' as any]: '#ffffff',
    ['--child-surface-soft' as any]: isYounger ? '#faf8f2' : '#f4f3fb',
    
    // Brand Lavender & Mint Accents
    ['--child-lavender-50' as any]: '#f5f3ff',
    ['--child-lavender-100' as any]: '#ede9fe',
    ['--child-lavender-200' as any]: '#ddd6fe',
    ['--child-lavender-500' as any]: '#8b5cf6',
    ['--child-lavender-700' as any]: '#6d28d9',

    ['--child-mint-50' as any]: '#ecfdf5',
    ['--child-mint-100' as any]: '#d1fae5',
    ['--child-mint-500' as any]: '#10b981',
    ['--child-mint-700' as any]: '#047857',

    ['--child-cream-50' as any]: '#fefdfa',
    ['--child-cream-100' as any]: '#fef9ec',
    ['--child-cream-200' as any]: '#fdebc4',
    ['--child-cream-500' as any]: '#f59e0b',

    // Text & Border tokens
    ['--child-text-primary' as any]: isYounger ? '#292524' : '#1e1b4b',
    ['--child-text-secondary' as any]: isYounger ? '#57534e' : '#475569',
    ['--child-text-muted' as any]: isYounger ? '#78716c' : '#64748b',
    ['--child-border' as any]: isYounger ? '#ede7db' : '#e2e0ee',
    ['--child-border-strong' as any]: isYounger ? '#d6cebe' : '#c7c4de',

    // Radii: 6-10 gets very soft (24px-32px), 10-14 gets refined (16px-20px)
    ['--child-radius-card' as any]: isYounger ? '1.75rem' : '1.25rem',
    ['--child-radius-btn' as any]: isYounger ? '1.25rem' : '0.875rem',
  };

  return (
    <ChildThemeContext.Provider value={contextValue}>
      <div
        id="child-theme-root"
        style={themeStyles}
        className={`w-full min-h-full font-sans transition-colors duration-300 ${
          isYounger ? 'theme-six-to-ten' : 'theme-ten-to-fourteen'
        }`}
      >
        {children}
      </div>
    </ChildThemeContext.Provider>
  );
}

export function useChildTheme(): ChildThemeContextValue {
  const context = useContext(ChildThemeContext);
  if (!context) {
    throw new Error('useChildTheme must be used within a ChildThemeProvider');
  }
  return context;
}
