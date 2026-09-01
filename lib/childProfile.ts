export type AgeGroup = 'SIX_TO_TEN' | 'TEN_TO_FOURTEEN';

export type CompanionVibe = 'CHILL' | 'HYPE' | 'COZY' | 'COOL';

export interface ChildProfileData {
  id: string;
  userId: string;
  nickname: string;
  age: number;
  grade?: string;
  nationality: string;
  preferredLanguage: string;
  hasTraumaHistory: boolean;
  traumaHistoryNote?: string;
  ageGroup: AgeGroup;
  onboarding_complete: boolean;
  companionName?: string;
  companionVibe?: CompanionVibe;
  avatarUrl?: string;
  trustedPersonName?: string;
  trustedPersonRel?: string;
  trustedPersonContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingFormValues {
  nickname: string;
  age: number;
  grade?: string;
  nationality: string;
  preferredLanguage: string;
  traumaChoice: 'YES' | 'NO' | 'PREFER_NOT_TO_SAY';
  traumaHistoryNote?: string;
  trustedPersonName?: string;
  trustedPersonRel?: string;
  trustedPersonContact?: string;
}

export interface CompanionFormValues {
  companionVibe: CompanionVibe;
  companionName: string;
}

export const VIBE_DEFINITIONS: Record<
  CompanionVibe,
  {
    name: string;
    tagline: string;
    description: string;
    emoji: string;
    color: string;
    borderColor: string;
    bgGlow: string;
    accentBg: string;
    speechTone: string;
  }
> = {
  CHILL: {
    name: 'Chill',
    tagline: 'Calm and easy-going',
    description: 'Relaxed, peaceful, and takes things one step at a time.',
    emoji: '🌿',
    color: '#10b981',
    borderColor: 'border-emerald-400',
    bgGlow: 'from-emerald-400/30 to-teal-500/20',
    accentBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    speechTone: 'gentle, patient, and soothing',
  },
  HYPE: {
    name: 'Hype',
    tagline: 'Energetic and funny',
    description: 'Bouncy, enthusiastic, and ready to cheer you on with jokes and high energy.',
    emoji: '⚡',
    color: '#f59e0b',
    borderColor: 'border-amber-400',
    bgGlow: 'from-amber-400/30 to-orange-500/20',
    accentBg: 'bg-amber-50 text-amber-800 border-amber-200',
    speechTone: 'upbeat, celebratory, and playful',
  },
  COZY: {
    name: 'Cozy',
    tagline: 'Warm and gentle',
    description: 'Soft, comforting, and always ready with a supportive hug.',
    emoji: '🧸',
    color: '#f43f5e',
    borderColor: 'border-rose-400',
    bgGlow: 'from-rose-400/30 to-pink-500/20',
    accentBg: 'bg-rose-50 text-rose-800 border-rose-200',
    speechTone: 'warm, deeply caring, and soft-spoken',
  },
  COOL: {
    name: 'Cool',
    tagline: 'Quiet and thoughtful',
    description: 'Curious, observant, and gives you thoughtful space to think.',
    emoji: '✨',
    color: '#6366f1',
    borderColor: 'border-indigo-400',
    bgGlow: 'from-indigo-400/30 to-sky-500/20',
    accentBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    speechTone: 'calm, clever, and insightful',
  },
};

/**
 * Computes the ageGroup strictly based on the age integer.
 * Age <= 10 -> SIX_TO_TEN
 * Age > 10  -> TEN_TO_FOURTEEN
 */
export function computeAgeGroup(age: number): AgeGroup {
  return age <= 10 ? 'SIX_TO_TEN' : 'TEN_TO_FOURTEEN';
}

const STORAGE_KEY_PREFIX = 'nest_child_profile_';

/**
 * Retrieves the stored child profile for a given user id.
 * Returns null or a default uncompleted profile if new.
 */
export function getChildProfile(userId: string): ChildProfileData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ChildProfileData;
  } catch (err) {
    console.error('Failed to read child profile from storage', err);
    return null;
  }
}

/**
 * Saves or updates child profile onboarding data
 */
export function saveChildOnboarding(
  userId: string,
  data: OnboardingFormValues
): ChildProfileData {
  const existing = getChildProfile(userId);
  const ageGroup = computeAgeGroup(data.age);
  const hasTrauma = data.traumaChoice === 'YES';

  const updated: ChildProfileData = {
    id: existing?.id || `cp_${Date.now()}`,
    userId,
    nickname: data.nickname.trim(),
    age: data.age,
    grade: data.grade?.trim() || undefined,
    nationality: data.nationality.trim(),
    preferredLanguage: data.preferredLanguage.trim() || 'English',
    hasTraumaHistory: hasTrauma,
    // Sensitive field: stored strictly for LLM context, never displayed back to child
    traumaHistoryNote: hasTrauma ? data.traumaHistoryNote?.trim() : undefined,
    ageGroup,
    // Still false until companion ritual finishes
    onboarding_complete: false,
    companionName: existing?.companionName,
    companionVibe: existing?.companionVibe,
    avatarUrl: existing?.avatarUrl,
    trustedPersonName: data.trustedPersonName?.trim() || existing?.trustedPersonName,
    trustedPersonRel: data.trustedPersonRel?.trim() || existing?.trustedPersonRel,
    trustedPersonContact: data.trustedPersonContact?.trim() || existing?.trustedPersonContact,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Saves companion configuration and marks onboarding as fully complete
 */
export function saveCompanionAndComplete(
  userId: string,
  companion: CompanionFormValues
): ChildProfileData {
  const existing = getChildProfile(userId);
  const now = new Date().toISOString();

  const updated: ChildProfileData = {
    id: existing?.id || `cp_${Date.now()}`,
    userId,
    nickname: existing?.nickname || 'Friend',
    age: existing?.age || 8,
    grade: existing?.grade,
    nationality: existing?.nationality || 'Earth',
    preferredLanguage: existing?.preferredLanguage || 'English',
    hasTraumaHistory: existing?.hasTraumaHistory || false,
    traumaHistoryNote: existing?.traumaHistoryNote,
    ageGroup: existing?.ageGroup || computeAgeGroup(existing?.age || 8),
    onboarding_complete: true,
    companionName: companion.companionName.trim() || 'Pip',
    companionVibe: companion.companionVibe,
    avatarUrl: existing?.avatarUrl,
    trustedPersonName: existing?.trustedPersonName,
    trustedPersonRel: existing?.trustedPersonRel,
    trustedPersonContact: existing?.trustedPersonContact,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Resets the child profile back to un-onboarded state for testing
 */
export function resetChildProfile(userId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
  }
}
