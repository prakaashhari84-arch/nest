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

  // Daily Mood Checkin Modal State
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

    if (loaded && loaded.onboarding_complete) {
      const alreadyCheckedIn = hasCheckedInToday(userId);
      setShowMoodCheckin(!alreadyCheckedIn);
    }

    setIsLoaded(true);
  }, [userId]);

  const handleOnboardingWizardComplete = (values: OnboardingFormValues) => {
    setTempOnboardingData(values);
    const updated = saveChildOnboarding(userId, values);
    setProfile(updated);
    setOnboardingStage('COMPANION');
  };

  const handleCompanionRitualComplete = (companion: CompanionFormValues) => {
    const completedProfile = saveCompanionAndComplete(userId, companion);
    setProfile(completedProfile);
    setShowMoodCheckin(true);
  };

  const handleMoodCheckinComplete = (entry: MoodEntryData) => {
    markSessionCheckedIn(userId);
    setShowMoodCheckin(false);
  };

  const handleResetFlow = () => {
    resetChildProfile(userId);
    resetSessionCheckin(userId);
    setProfile(null);
    setTempOnboardingData(null);
    setOnboardingStage('WIZARD');
    setShowMoodCheckin(false);
  };

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
      <div className="flex items-center justify-center min-h-[100dvh] w-full p-12 bg-stone-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    );
  }

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
  const isDev = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV);

  /* =========================================================================
     FLOW 1: CHILD FIRST-LOGIN ONBOARDING & COMPANION RITUAL
     ========================================================================= */
  if (!profile || !profile.onboarding_complete) {
    return (
      <div id="child-onboarding-wrapper" className="min-h-[100dvh] w-full flex flex-col justify-center items-center py-4 px-3 sm:px-6 bg-stone-50">
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
    <div id="child-shell-container" className="min-h-[100dvh] w-full flex flex-col">
      {/* Daily Mood Check-In Modal */}
      {showMoodCheckin && (
        <MoodCheckinModal profile={profile} onComplete={onMoodCheckinComplete} />
      )}

      {/* Dev-Only Preview Switcher (Excluded in production) */}
      {isDev && (
        <div className="bg-stone-900 text-stone-300 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-stone-800">
          <span className="font-mono text-[11px] text-amber-300">
            [DEV ONLY] Shell: {effectiveAgeGroup}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTriggerMoodCheckin}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-stone-950"
            >
              Test Mood
            </button>
            <button
              type="button"
              onClick={() => setAgeGroupOverride(effectiveAgeGroup === 'SIX_TO_TEN' ? 'TEN_TO_FOURTEEN' : 'SIX_TO_TEN')}
              className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-white"
            >
              Toggle Shell
            </button>
            <button
              type="button"
              onClick={onResetFlow}
              className="px-2 py-0.5 rounded text-[10px] bg-stone-800 text-stone-300"
            >
              Replay Onboarding
            </button>
          </div>
        </div>
      )}

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
