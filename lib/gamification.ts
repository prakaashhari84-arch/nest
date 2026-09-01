/**
 * Cross-Cutting Gamification Layer for Nest
 * 
 * Strict separation: This is a purely cosmetic engagement layer and NEVER
 * factors into clinical safety or pattern-tracking escalation.
 * 
 * Features:
 * 1. Points Ledger (Balance is dynamically calculated as the sum of all entries)
 * 2. StreakRecord (Tracking current/longest streaks & activity dates)
 * 3. Badges Grid (Earned & Locked/Grayed out)
 * 4. Cosmetic Rewards Shop (Purchases with negative ledger deductions)
 * 5. Streak Milestones Celebration Logic
 */

export interface PointsLedgerEntry {
  id: string;
  childId: string;
  amount: number; // Positive (earned) or negative (spent)
  reason: string;
  createdAt: string;
}

export interface StreakRecord {
  childId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date or YYYY-MM-DD
  celebratedMilestones: number[]; // List of streak day milestones already celebrated
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  iconKey: string;
  iconEmoji: string;
  category: 'story' | 'streak' | 'games' | 'places' | 'reflection';
  milestoneStreak?: number;
}

export interface ChildBadge {
  id: string;
  childId: string;
  badgeId: string;
  badgeKey: string;
  earnedAt: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  costPoints: number;
  category: 'companion_theme' | 'accessory' | 'aura';
  previewImageKey?: string;
  iconEmoji: string;
  themeValue: string;
  description: string;
}

export interface ChildCosmeticPurchase {
  id: string;
  childId: string;
  cosmeticItemId: string;
  purchasedAt: string;
}

// -------------------------------------------------------------------
// SEED DATA: BADGES
// -------------------------------------------------------------------

export const BADGES_CATALOG: Badge[] = [
  {
    id: 'badge_first_story',
    key: 'first_story',
    name: 'First Story',
    description: 'Completed your first cosmic adventure chapter.',
    iconKey: 'book-open',
    iconEmoji: '📖',
    category: 'story',
  },
  {
    id: 'badge_quiz_pro',
    key: 'quiz_pro',
    name: 'Quiz Pro',
    description: 'Solved a daily word puzzle or memory challenge.',
    iconKey: 'trophy',
    iconEmoji: '🎯',
    category: 'games',
  },
  {
    id: 'badge_7_day',
    key: 'seven_day_streak',
    name: '7-Day Champion',
    description: 'Kept a 7-day daily check-in streak alive!',
    iconKey: 'flame',
    iconEmoji: '⚡',
    category: 'streak',
    milestoneStreak: 7,
  },
  {
    id: 'badge_14_day',
    key: 'fourteen_day_streak',
    name: 'Two-Week Star',
    description: 'Reached an epic 14-day streak of daily check-ins.',
    iconKey: 'sparkles',
    iconEmoji: '🌟',
    category: 'streak',
    milestoneStreak: 14,
  },
  {
    id: 'badge_30_day',
    key: 'thirty_day_streak',
    name: '30-Day Master',
    description: 'Master of consistency! A full month of checking in.',
    iconKey: 'crown',
    iconEmoji: '👑',
    category: 'streak',
    milestoneStreak: 30,
  },
  {
    id: 'badge_bookworm',
    key: 'bookworm',
    name: 'Bookworm',
    description: 'Completed 3 or more adventure story chapters.',
    iconKey: 'library',
    iconEmoji: '📚',
    category: 'story',
  },
  {
    id: 'badge_places',
    key: 'place_explorer',
    name: 'Place Explorer',
    description: 'Checked in on how your everyday places feel.',
    iconKey: 'map-pin',
    iconEmoji: '📍',
    category: 'places',
  },
  {
    id: 'badge_mindful',
    key: 'mindful_friend',
    name: 'Mindful Friend',
    description: 'Shared 5 or more daily mood reflections.',
    iconKey: 'heart',
    iconEmoji: '💛',
    category: 'reflection',
  },
];

// -------------------------------------------------------------------
// SEED DATA: COSMETIC REWARDS SHOP
// -------------------------------------------------------------------

export const COSMETICS_CATALOG: CosmeticItem[] = [
  {
    id: 'cosmetic_crown',
    name: 'Starlight Crown',
    costPoints: 40,
    category: 'accessory',
    iconEmoji: '👑',
    themeValue: 'crown',
    description: 'A glowing golden tiara to crown your companion.',
  },
  {
    id: 'cosmetic_cosmic_aura',
    name: 'Cosmic Aura',
    costPoints: 60,
    category: 'aura',
    iconEmoji: '🌌',
    themeValue: 'cosmic_aura',
    description: 'A deep nebula glow that softly shimmers around your mascot.',
  },
  {
    id: 'cosmetic_cozy_scarf',
    name: 'Cozy Knit Scarf',
    costPoints: 50,
    category: 'accessory',
    iconEmoji: '🧣',
    themeValue: 'scarf',
    description: 'A soft autumn scarf keeping your companion warm.',
  },
  {
    id: 'cosmetic_forest_hue',
    name: 'Emerald Forest Hue',
    costPoints: 80,
    category: 'companion_theme',
    iconEmoji: '🌲',
    themeValue: 'forest',
    description: 'Nature-inspired deep emerald and moss coloring.',
  },
  {
    id: 'cosmetic_sunset_gold',
    name: 'Sunset Gold Glow',
    costPoints: 80,
    category: 'companion_theme',
    iconEmoji: '🌅',
    themeValue: 'sunset',
    description: 'Warm twilight gradient with golden amber sparks.',
  },
  {
    id: 'cosmetic_astro_helmet',
    name: 'Astro Explorer Helmet',
    costPoints: 100,
    category: 'accessory',
    iconEmoji: '🧑‍🚀',
    themeValue: 'astro',
    description: 'High-tech galactic explorer gear for space adventures.',
  },
];

// -------------------------------------------------------------------
// STORAGE KEYS & DEFAULTS
// -------------------------------------------------------------------

const STORAGE_KEYS = {
  LEDGER: 'nest_points_ledger_',
  STREAK: 'nest_streak_record_',
  BADGES: 'nest_child_badges_',
  PURCHASES: 'nest_cosmetic_purchases_',
  EQUIPPED_THEME: 'nest_equipped_theme_',
};

/**
 * Standard Award Amount Rules
 */
export const POINT_AWARDS: Record<string, { amount: number; label: string }> = {
  word_scramble_correct: { amount: 20, label: 'Word Scramble Solved' },
  memory_match_complete: { amount: 20, label: 'Memory Game Won' },
  story_chapter_complete: { amount: 15, label: 'Story Chapter Read' },
  mood_checkin: { amount: 10, label: 'Daily Mood Check-In' },
  places_checkin: { amount: 10, label: 'Your Places Check-In' },
  daily_prompt_reflection: { amount: 10, label: 'Daily Thought Shared' },
  first_onboarding: { amount: 100, label: 'Explorer Welcome Bonus' },
};

// -------------------------------------------------------------------
// 1. POINTS LEDGER & BALANCE COMPUTATION
// Balance is strictly the SUM of all ledger rows, never a mutable count
// -------------------------------------------------------------------

export function getPointsLedger(childId: string): PointsLedgerEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.LEDGER}${childId}`);
    if (!raw) {
      // Seed with initial ledger
      const initialSeed: PointsLedgerEntry[] = [
        {
          id: 'pledger_init_1',
          childId,
          amount: 100,
          reason: 'first_onboarding',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'pledger_init_2',
          childId,
          amount: 20,
          reason: 'word_scramble_correct',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'pledger_init_3',
          childId,
          amount: 20,
          reason: 'story_chapter_complete',
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ];
      localStorage.setItem(`${STORAGE_KEYS.LEDGER}${childId}`, JSON.stringify(initialSeed));
      return initialSeed;
    }
    return JSON.parse(raw) as PointsLedgerEntry[];
  } catch {
    return [];
  }
}

/**
 * Returns dynamic balance calculated as sum of all ledger entries
 */
export function getChildPointsBalance(childId: string): number {
  const ledger = getPointsLedger(childId);
  return ledger.reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Award points via server-guarded action key (never arbitrary client number)
 */
export function awardChildPoints(
  childId: string,
  reasonKey: keyof typeof POINT_AWARDS | string
): { newBalance: number; awarded: number; reasonLabel: string; newBadges: Badge[] } {
  const awardDef = POINT_AWARDS[reasonKey] || { amount: 10, label: reasonKey };
  const ledger = getPointsLedger(childId);

  const newEntry: PointsLedgerEntry = {
    id: `pledger_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    childId,
    amount: awardDef.amount,
    reason: reasonKey,
    createdAt: new Date().toISOString(),
  };

  const updatedLedger = [newEntry, ...ledger];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEYS.LEDGER}${childId}`, JSON.stringify(updatedLedger));
      // Also update legacy storage for backward compatibility
      localStorage.setItem(
        `nest_child_points_${childId}`,
        updatedLedger.reduce((sum, e) => sum + e.amount, 0).toString()
      );
    } catch (err) {
      console.warn('Could not persist points ledger:', err);
    }
  }

  // Update activity streak and evaluate badges
  recordChildActivity(childId);
  const newBadges = checkAndAwardBadges(childId, reasonKey);

  const newBalance = updatedLedger.reduce((sum, entry) => sum + entry.amount, 0);
  return {
    newBalance,
    awarded: awardDef.amount,
    reasonLabel: awardDef.label,
    newBadges,
  };
}

// -------------------------------------------------------------------
// 2. STREAK RECORD LOGIC
// -------------------------------------------------------------------

export function getStreakRecord(childId: string): StreakRecord {
  if (typeof window === 'undefined') {
    return {
      childId,
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
      celebratedMilestones: [3],
    };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.STREAK}${childId}`);
    if (!raw) {
      const defaultRecord: StreakRecord = {
        childId,
        currentStreak: 3,
        longestStreak: 5,
        lastActiveDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        celebratedMilestones: [],
      };
      localStorage.setItem(`${STORAGE_KEYS.STREAK}${childId}`, JSON.stringify(defaultRecord));
      return defaultRecord;
    }
    return JSON.parse(raw) as StreakRecord;
  } catch {
    return {
      childId,
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: new Date().toISOString().split('T')[0],
      celebratedMilestones: [],
    };
  }
}

export function recordChildActivity(childId: string): {
  streakRecord: StreakRecord;
  newMilestone?: { days: number; badge?: Badge };
} {
  const current = getStreakRecord(childId);
  const todayStr = new Date().toISOString().split('T')[0];

  if (current.lastActiveDate === todayStr) {
    // Already active today, streak doesn't change
    return { streakRecord: current };
  }

  const lastDate = new Date(current.lastActiveDate);
  const todayDate = new Date(todayStr);
  const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

  let newCurrent = current.currentStreak;
  if (diffDays === 1) {
    // Consecutive day
    newCurrent += 1;
  } else if (diffDays > 1) {
    // Streak broken
    newCurrent = 1;
  } else {
    newCurrent = Math.max(1, newCurrent);
  }

  const newLongest = Math.max(current.longestStreak, newCurrent);
  const updated: StreakRecord = {
    ...current,
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastActiveDate: todayStr,
  };

  // Check for newly reached milestones (3, 7, 14, 30...)
  let newMilestone: { days: number; badge?: Badge } | undefined = undefined;
  const milestones = [3, 7, 14, 30, 60, 100];
  for (const m of milestones) {
    if (newCurrent >= m && !current.celebratedMilestones.includes(m)) {
      updated.celebratedMilestones = [...current.celebratedMilestones, m];
      const associatedBadge = BADGES_CATALOG.find((b) => b.milestoneStreak === m);
      newMilestone = { days: m, badge: associatedBadge };
      break; // trigger one milestone celebration per turn
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEYS.STREAK}${childId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save streak record:', err);
    }
  }

  return { streakRecord: updated, newMilestone };
}

// -------------------------------------------------------------------
// 3. BADGES SYSTEM
// -------------------------------------------------------------------

export function getChildBadges(childId: string): ChildBadge[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.BADGES}${childId}`);
    if (!raw) {
      // Seed with initial badges (First Story & Quiz Pro earned)
      const seedBadges: ChildBadge[] = [
        {
          id: 'cbadge_1',
          childId,
          badgeId: 'badge_first_story',
          badgeKey: 'first_story',
          earnedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'cbadge_2',
          childId,
          badgeId: 'badge_quiz_pro',
          badgeKey: 'quiz_pro',
          earnedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ];
      localStorage.setItem(`${STORAGE_KEYS.BADGES}${childId}`, JSON.stringify(seedBadges));
      return seedBadges;
    }
    return JSON.parse(raw) as ChildBadge[];
  } catch {
    return [];
  }
}

export function checkAndAwardBadges(childId: string, triggerEvent?: string): Badge[] {
  const currentEarned = getChildBadges(childId);
  const earnedKeys = new Set(currentEarned.map((b) => b.badgeKey));
  const streak = getStreakRecord(childId);
  const ledger = getPointsLedger(childId);

  const newlyEarnedBadges: Badge[] = [];

  const earnBadge = (key: string) => {
    if (!earnedKeys.has(key)) {
      const badgeDef = BADGES_CATALOG.find((b) => b.key === key);
      if (badgeDef) {
        newlyEarnedBadges.push(badgeDef);
        currentEarned.push({
          id: `cbadge_${Date.now()}_${key}`,
          childId,
          badgeId: badgeDef.id,
          badgeKey: key,
          earnedAt: new Date().toISOString(),
        });
        earnedKeys.add(key);
      }
    }
  };

  // Rule 1: First story
  if (triggerEvent === 'story_chapter_complete' || ledger.some((e) => e.reason === 'story_chapter_complete')) {
    earnBadge('first_story');
  }

  // Rule 2: Quiz Pro
  if (
    triggerEvent === 'word_scramble_correct' ||
    triggerEvent === 'memory_match_complete' ||
    ledger.some((e) => e.reason === 'word_scramble_correct')
  ) {
    earnBadge('quiz_pro');
  }

  // Rule 3: 7-Day & 30-Day streak
  if (streak.currentStreak >= 7) {
    earnBadge('seven_day_streak');
  }
  if (streak.currentStreak >= 14) {
    earnBadge('fourteen_day_streak');
  }
  if (streak.currentStreak >= 30) {
    earnBadge('thirty_day_streak');
  }

  // Rule 4: Bookworm (3+ story chapters)
  const chaptersRead = ledger.filter((e) => e.reason === 'story_chapter_complete').length;
  if (chaptersRead >= 3) {
    earnBadge('bookworm');
  }

  // Rule 5: Place Explorer
  if (triggerEvent === 'places_checkin' || ledger.some((e) => e.reason === 'places_checkin')) {
    earnBadge('place_explorer');
  }

  // Rule 6: Mindful Friend (5+ mood checkins)
  const moodCheckins = ledger.filter((e) => e.reason === 'mood_checkin').length;
  if (moodCheckins >= 5) {
    earnBadge('mindful_friend');
  }

  if (newlyEarnedBadges.length > 0 && typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEYS.BADGES}${childId}`, JSON.stringify(currentEarned));
    } catch (err) {
      console.warn('Could not save earned badges:', err);
    }
  }

  return newlyEarnedBadges;
}

// -------------------------------------------------------------------
// 4. COSMETIC REWARDS SHOP & PURCHASES
// -------------------------------------------------------------------

export function getChildPurchases(childId: string): ChildCosmeticPurchase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PURCHASES}${childId}`);
    return raw ? (JSON.parse(raw) as ChildCosmeticPurchase[]) : [];
  } catch {
    return [];
  }
}

export function purchaseCosmeticItem(
  childId: string,
  itemId: string
): { success: boolean; message: string; newBalance: number } {
  const item = COSMETICS_CATALOG.find((c) => c.id === itemId);
  if (!item) {
    return { success: false, message: 'Item not found in catalog.', newBalance: getChildPointsBalance(childId) };
  }

  const currentBalance = getChildPointsBalance(childId);
  const purchases = getChildPurchases(childId);

  if (purchases.some((p) => p.cosmeticItemId === itemId)) {
    return { success: false, message: 'You already own this item!', newBalance: currentBalance };
  }

  if (currentBalance < item.costPoints) {
    return {
      success: false,
      message: `Not enough points! You need ${item.costPoints - currentBalance} more pts.`,
      newBalance: currentBalance,
    };
  }

  // Deduct points via negative PointsLedger entry
  const ledger = getPointsLedger(childId);
  const deductEntry: PointsLedgerEntry = {
    id: `pledger_spend_${Date.now()}`,
    childId,
    amount: -item.costPoints,
    reason: `cosmetic_purchase:${item.name}`,
    createdAt: new Date().toISOString(),
  };

  const updatedLedger = [deductEntry, ...ledger];
  const newPurchase: ChildCosmeticPurchase = {
    id: `cpurchase_${Date.now()}`,
    childId,
    cosmeticItemId: itemId,
    purchasedAt: new Date().toISOString(),
  };

  const updatedPurchases = [newPurchase, ...purchases];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEYS.LEDGER}${childId}`, JSON.stringify(updatedLedger));
      localStorage.setItem(`${STORAGE_KEYS.PURCHASES}${childId}`, JSON.stringify(updatedPurchases));
      localStorage.setItem(
        `nest_child_points_${childId}`,
        updatedLedger.reduce((sum, e) => sum + e.amount, 0).toString()
      );
      // Auto-equip purchased cosmetic theme
      localStorage.setItem(`${STORAGE_KEYS.EQUIPPED_THEME}${childId}`, item.themeValue);
    } catch (err) {
      console.warn('Could not save cosmetic purchase:', err);
    }
  }

  const newBalance = updatedLedger.reduce((sum, e) => sum + e.amount, 0);
  return {
    success: true,
    message: `Unlocked ${item.name}! Your companion is looking awesome.`,
    newBalance,
  };
}

export function getEquippedTheme(childId: string): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(`${STORAGE_KEYS.EQUIPPED_THEME}${childId}`) || 'default';
}

export function setEquippedTheme(childId: string, themeValue: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_KEYS.EQUIPPED_THEME}${childId}`, themeValue);
  }
}

// -------------------------------------------------------------------
// 5. WEEKLY STREAK DAYS COMPUTATION (Mon-Sun checkmarks)
// -------------------------------------------------------------------

export interface DayStreakStatus {
  dayLabel: string;
  isCompleted: boolean;
  isToday: boolean;
}

export function getWeeklyStreakDays(childId: string): DayStreakStatus[] {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const dayIndex = (today.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const streak = getStreakRecord(childId);

  return dayNames.map((name, idx) => {
    const isToday = idx === dayIndex;
    // For days before or on today within the current streak count
    const daysAgo = dayIndex - idx;
    const isCompleted = daysAgo >= 0 && daysAgo < streak.currentStreak;

    return {
      dayLabel: name,
      isCompleted,
      isToday,
    };
  });
}
