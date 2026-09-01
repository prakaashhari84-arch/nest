'use client';

import React, { useState, useEffect } from 'react';
import { AppUser } from '@/lib/auth';
import {
  ChildProfileData,
  getChildProfile,
  saveChildOnboarding,
  saveCompanionAndComplete,
  resetChildProfile,
  OnboardingFormValues,
  CompanionFormValues,
  AgeGroup,
} from '@/lib/childProfile';
import {
  hasCheckedInToday,
  markSessionCheckedIn,
  resetSessionCheckin,
  MoodEntryData,
} from '@/lib/mood';
import ChildOnboardingWizard from '@/components/child/ChildOnboardingWizard';
import NestlingCompanionRitual from '@/components/child/NestlingCompanionRitual';
import { ChildThemeProvider, useChildTheme } from '@/components/child/ChildThemeProvider';
import SixToTenShell from '@/components/child/SixToTenShell';
import TenToFourteenShell from '@/components/child/TenToFourteenShell';
import MoodCheckinModal from '@/components/child/MoodCheckinModal';

interface ChildPageProps {
  user?: AppUser | null;
  onLogout?: () => void;
  onAttemptCrossRoleNav?: (path: string) => void;
}

export default function ChildPage({ user, onLogout, onAttemptCrossRoleNav }: ChildPageProps) {
  const userId = user?.id || 'user_child_01';

  // Child Profile State
  const [profile, setProfile] = useState<ChildProfileData | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Active Flow Sub-Stage when !onboarding_complete: 'WIZARD' | 'COMPANION'
  const [onboardingStage, setOnboardingStage] = useState<'WIZARD' | 'COMPANION'>('WIZARD');

  // Temporary onboarding answers prior to companion submission
  const [tempOnboardingData, setTempOnboardingData] = useState<OnboardingFormValues | null>(null);

  // Daily Mood Checkin Modal State (Fires first screen of every session before home screen)
  const [showMoodCheckin, setShowMoodCheckin] = useState<boolean>(false);

  // Load child profile on mount or user change
  useEffect(() => {
    const loaded = getChildProfile(userId);
    setProfile(loaded);
    if (loaded && !loaded.onboarding_complete && loaded.nickname) {
      if (loaded.nickname && !loaded.companionName) {
        setOnboardingStage('COMPANION');
      } else {
        setOnboardingStage('WIZARD');
      }
    } else {
      setOnboardingStage('WIZARD');
    }

    // Check if daily checkin is needed
    if (loaded && loaded.onboarding_complete) {
      const alreadyCheckedIn = hasCheckedInToday(userId);
      setShowMoodCheckin(!alreadyCheckedIn);
    }

    setIsLoaded(true);
  }, [userId]);

  // Handle completion of Prompt 2's Onboarding Questionnaire
  const handleOnboardingWizardComplete = (values: OnboardingFormValues) => {
    setTempOnboardingData(values);
    const updated = saveChildOnboarding(userId, values);
    setProfile(updated);
    setOnboardingStage('COMPANION');
  };

  // Handle completion of Prompt 2.5's Companion Creation Ritual
  const handleCompanionRitualComplete = (companion: CompanionFormValues) => {
    const completedProfile = saveCompanionAndComplete(userId, companion);
    setProfile(completedProfile);
    // After first onboarding completes, fire the first session mood checkin
    setShowMoodCheckin(true);
  };

  // Handle completion of Mood Checkin modal
  const handleMoodCheckinComplete = (entry: MoodEntryData) => {
    markSessionCheckedIn(userId);
    setShowMoodCheckin(false);
  };

  // Reset Onboarding for testing flow
  const handleResetFlow = () => {
    resetChildProfile(userId);
    resetSessionCheckin(userId);
    setProfile(null);
    setTempOnboardingData(null);
    setOnboardingStage('WIZARD');
    setShowMoodCheckin(false);
  };

  // Re-trigger Mood Checkin (for manual tester flow)
  const handleManualTriggerMoodCheckin = () => {
    setShowMoodCheckin(true);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  // Determine base age group (default to SIX_TO_TEN if missing)
  const initialAgeGroup: AgeGroup = profile?.ageGroup || 'SIX_TO_TEN';

  return (
    <ChildThemeProvider ageGroup={initialAgeGroup}>
      <ChildPageContent
        profile={profile}
        onboardingStage={onboardingStage}
        tempOnboardingData={tempOnboardingData}
        user={user}
        showMoodCheckin={showMoodCheckin}
        onWizardComplete={handleOnboardingWizardComplete}
        onCompanionComplete={handleCompanionRitualComplete}
        onMoodCheckinComplete={handleMoodCheckinComplete}
        onTriggerMoodCheckin={handleManualTriggerMoodCheckin}
        onResetFlow={handleResetFlow}
        onLogout={handleLogout}
        onAttemptCrossRoleNav={onAttemptCrossRoleNav}
      />
    </ChildThemeProvider>
  );
}

interface ChildPageContentProps {
  profile: ChildProfileData | null;
  onboardingStage: 'WIZARD' | 'COMPANION';
  tempOnboardingData: OnboardingFormValues | null;
  user?: AppUser | null;
  showMoodCheckin: boolean;
  onWizardComplete: (values: OnboardingFormValues) => void;
  onCompanionComplete: (companion: CompanionFormValues) => void;
  onMoodCheckinComplete: (entry: MoodEntryData) => void;
  onTriggerMoodCheckin: () => void;
  onResetFlow: () => void;
  onLogout: () => void;
  onAttemptCrossRoleNav?: (path: string) => void;
}

function ChildPageContent({
  profile,
  onboardingStage,
  tempOnboardingData,
  user,
  showMoodCheckin,
  onWizardComplete,
  onCompanionComplete,
  onMoodCheckinComplete,
  onTriggerMoodCheckin,
  onResetFlow,
  onLogout,
  onAttemptCrossRoleNav,
}: ChildPageContentProps) {
  const { effectiveAgeGroup, setAgeGroupOverride, ageGroupOverride } = useChildTheme();

  /* =========================================================================
     FLOW 1: CHILD FIRST-LOGIN ONBOARDING & COMPANION RITUAL
     Shown when onboarding_complete is false or profile is missing
     ========================================================================= */
  if (!profile || !profile.onboarding_complete) {
    return (
      <div id="child-onboarding-wrapper" className="space-y-6 max-w-2xl mx-auto py-4">
        {/* Helper Banner for Developer / Tester */}
        <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-purple-900 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">🪺</span>
            <span>
              <strong>First-Time Child Onboarding:</strong> 6-question questionnaire & Nestling companion creation ritual.
            </span>
          </div>
          <span className="font-mono text-[11px] bg-purple-200/70 text-purple-950 px-2.5 py-1 rounded-full font-bold">
            onboarding_complete = false
          </span>
        </div>

        {/* Wizard or Companion Ritual Screen */}
        {onboardingStage === 'WIZARD' ? (
          <ChildOnboardingWizard
            initialNickname={profile?.nickname || user?.name?.split(' ')[0] || ''}
            onComplete={onWizardComplete}
          />
        ) : (
          <NestlingCompanionRitual
            childNickname={profile?.nickname || tempOnboardingData?.nickname || 'Friend'}
            onComplete={onCompanionComplete}
          />
        )}
      </div>
    );
  }

  /* =========================================================================
     FLOW 2: AGE-APPROPRIATE VISUAL SHELLS & DAILY SESSION MOOD CHECK-IN
     ========================================================================= */
  return (
    <div id="child-shell-container" className="relative w-full">
      {/* Daily Mood Check-In Modal (Runs at start of every session before home screen) */}
      {showMoodCheckin && (
        <MoodCheckinModal profile={profile} onComplete={onMoodCheckinComplete} />
      )}

      {/* Discreet Shell Mode Switcher / Developer Testing Bar */}
      <div className="bg-stone-900/90 text-stone-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-amber-300">SHELL PREVIEW:</span>
          <span className="text-stone-300">
            Active: <strong>{effectiveAgeGroup === 'SIX_TO_TEN' ? '6-10 Shell (Explorer)' : '10-14 Shell (Navigator)'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTriggerMoodCheckin}
            className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer"
            title="Trigger daily mood checkin modal"
          >
            ☀️ Test Daily Mood Check-In
          </button>

          <button
            type="button"
            onClick={() => setAgeGroupOverride('SIX_TO_TEN')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              effectiveAgeGroup === 'SIX_TO_TEN'
                ? 'bg-purple-600 text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            6–10 Shell
          </button>
          <button
            type="button"
            onClick={() => setAgeGroupOverride('TEN_TO_FOURTEEN')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              effectiveAgeGroup === 'TEN_TO_FOURTEEN'
                ? 'bg-indigo-600 text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            10–14 Shell
          </button>
          {ageGroupOverride && (
            <button
              type="button"
              onClick={() => setAgeGroupOverride(null)}
              className="text-[10px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
            >
              Reset ({profile.age}y)
            </button>
          )}
          <button
            type="button"
            onClick={onResetFlow}
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-medium cursor-pointer"
          >
            🔄 Replay Onboarding
          </button>
        </div>
      </div>

      {/* Render the appropriate shell based on ageGroup */}
      {effectiveAgeGroup === 'SIX_TO_TEN' ? (
        <SixToTenShell
          profile={profile}
          onLogout={onLogout}
          onTriggerMoodCheckin={onTriggerMoodCheckin}
        />
      ) : (
        <TenToFourteenShell
          profile={profile}
          onLogout={onLogout}
          onTriggerMoodCheckin={onTriggerMoodCheckin}
        />
      )}
    </div>
  );
}
