import { AgeGroup, CompanionVibe } from './childProfile';

export type MoodType = 'HAPPY' | 'MILD' | 'SAD';

export type PlaceType =
  | 'HOME'
  | 'SCHOOL'
  | 'PARK'
  | 'RELATIVES'
  | 'TUITION'
  | 'TRANSIT'
  | 'WORSHIP'
  | 'NEIGHBORHOOD';

export type RatingLevel = 'GOOD' | 'OKAY' | 'NOT_GREAT';

export interface MoodEntryData {
  id: string;
  childId: string;
  mood: MoodType;
  note?: string;
  promptStarter?: string;
  priorityFlag: boolean;
  createdAt: string;
}

export interface PlaceRatingData {
  id: string;
  childId: string;
  place: PlaceType;
  rating: RatingLevel;
  note?: string;
  wantsToTalk?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceMeta {
  type: PlaceType;
  label: string;
  icon: string;
  description: string;
}

export const PLACES_META: Record<PlaceType, PlaceMeta> = {
  HOME: {
    type: 'HOME',
    label: 'Home',
    icon: '🏠',
    description: 'Your room, house, or family space',
  },
  SCHOOL: {
    type: 'SCHOOL',
    label: 'School',
    icon: '🏫',
    description: 'Classrooms, playground, teachers & peers',
  },
  PARK: {
    type: 'PARK',
    label: 'Park / Playground',
    icon: '🌳',
    description: 'Outdoors, green spaces & playing outside',
  },
  RELATIVES: {
    type: 'RELATIVES',
    label: 'Relatives’ House',
    icon: '🏡',
    description: 'Grandparents, cousins, aunts & uncles',
  },
  TUITION: {
    type: 'TUITION',
    label: 'Tuition / Classes',
    icon: '📚',
    description: 'Tutoring, music, sports, art & after-school',
  },
  TRANSIT: {
    type: 'TRANSIT',
    label: 'Transit / Commute',
    icon: '🚌',
    description: 'School bus, car rides, train or walking routes',
  },
  WORSHIP: {
    type: 'WORSHIP',
    label: 'Place of Worship',
    icon: '🕊️',
    description: 'Temple, church, mosque, or spiritual center',
  },
  NEIGHBORHOOD: {
    type: 'NEIGHBORHOOD',
    label: 'Neighborhood',
    icon: '🏘️',
    description: 'Your street, local shops & surroundings',
  },
};

export const PROMPT_STARTERS: Array<{ id: string; text: string; icon: string; forMoods: MoodType[] }> = [
  {
    id: 'school_stuff',
    text: 'Something happened at school',
    icon: '🎒',
    forMoods: ['MILD', 'SAD'],
  },
  {
    id: 'friend_argument',
    text: 'Had an argument or felt left out',
    icon: '💬',
    forMoods: ['MILD', 'SAD'],
  },
  {
    id: 'tired_body',
    text: 'Tired, overwhelmed, or need quiet',
    icon: '🛋️',
    forMoods: ['MILD', 'SAD'],
  },
  {
    id: 'home_heavy',
    text: 'Things felt a bit tough at home',
    icon: '🏠',
    forMoods: ['MILD', 'SAD'],
  },
  {
    id: 'just_unsure',
    text: 'Not really sure, just feeling off',
    icon: '☁️',
    forMoods: ['MILD', 'SAD'],
  },
];

const MOOD_STORAGE_KEY_PREFIX = 'nest_child_mood_entries_';
const PLACES_STORAGE_KEY_PREFIX = 'nest_child_place_ratings_';
const SESSION_CHECKIN_KEY_PREFIX = 'nest_child_last_checkin_';

/**
 * Checks if child has already completed check-in for the current day / active session
 */
export function hasCheckedInToday(childId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`${SESSION_CHECKIN_KEY_PREFIX}${childId}`);
    if (!raw) return false;
    const lastDate = new Date(raw);
    const today = new Date();
    return (
      lastDate.getFullYear() === today.getFullYear() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Resets the session checkin state (for re-testing check-in flow anytime)
 */
export function resetSessionCheckin(childId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${SESSION_CHECKIN_KEY_PREFIX}${childId}`);
  }
}

/**
 * Mark session as checked in
 */
export function markSessionCheckedIn(childId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${SESSION_CHECKIN_KEY_PREFIX}${childId}`, new Date().toISOString());
  }
}

/**
 * Get all mood entries for child (sorted by createdAt ascending or descending)
 */
export function getMoodEntries(childId: string): MoodEntryData[] {
  if (typeof window === 'undefined') return getSampleMoodEntries(childId);
  try {
    const raw = localStorage.getItem(`${MOOD_STORAGE_KEY_PREFIX}${childId}`);
    if (!raw) {
      // Seed initial 14 entries for rich sparkline demonstration
      const initial = getSampleMoodEntries(childId);
      localStorage.setItem(`${MOOD_STORAGE_KEY_PREFIX}${childId}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as MoodEntryData[];
  } catch (err) {
    console.error('Failed to get mood entries', err);
    return getSampleMoodEntries(childId);
  }
}

/**
 * Adds a new MoodEntry
 */
export function recordMoodEntry(
  childId: string,
  mood: MoodType,
  options?: {
    note?: string;
    promptStarter?: string;
  }
): MoodEntryData {
  const entries = getMoodEntries(childId);
  const now = new Date().toISOString();
  
  // SAD moods or sensitive signals get priorityFlag = true
  const priorityFlag = mood === 'SAD' || (options?.note?.toLowerCase().includes('hurt') ?? false);

  const newEntry: MoodEntryData = {
    id: `mood_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    childId,
    mood,
    note: options?.note?.trim() || undefined,
    promptStarter: options?.promptStarter?.trim() || undefined,
    priorityFlag,
    createdAt: now,
  };

  const updated = [...entries, newEntry];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${MOOD_STORAGE_KEY_PREFIX}${childId}`, JSON.stringify(updated));
    markSessionCheckedIn(childId);
  }

  // Safety pattern evaluation trigger
  try {
    import('./safetyPatterns').then(({ evaluatePatterns }) => {
      evaluatePatterns(childId);
    });
  } catch (err) {
    console.warn('Safety evaluation failed in recordMoodEntry:', err);
  }

  return newEntry;
}

/**
 * Get all place ratings for child
 */
export function getPlaceRatings(childId: string): Record<PlaceType, PlaceRatingData | undefined> {
  const result: Partial<Record<PlaceType, PlaceRatingData>> = {};
  if (typeof window === 'undefined') return result as Record<PlaceType, PlaceRatingData | undefined>;

  try {
    const raw = localStorage.getItem(`${PLACES_STORAGE_KEY_PREFIX}${childId}`);
    if (raw) {
      const list = JSON.parse(raw) as PlaceRatingData[];
      list.forEach((item) => {
        result[item.place] = item;
      });
    } else {
      // Default initial seeds
      const initial: PlaceRatingData[] = [
        {
          id: 'pr_seed_1',
          childId,
          place: 'HOME',
          rating: 'GOOD',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'pr_seed_2',
          childId,
          place: 'PARK',
          rating: 'GOOD',
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'pr_seed_3',
          childId,
          place: 'SCHOOL',
          rating: 'OKAY',
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
      ];
      localStorage.setItem(`${PLACES_STORAGE_KEY_PREFIX}${childId}`, JSON.stringify(initial));
      initial.forEach((item) => {
        result[item.place] = item;
      });
    }
  } catch (err) {
    console.error('Failed to get place ratings', err);
  }

  return result as Record<PlaceType, PlaceRatingData | undefined>;
}

/**
 * Upsert a place rating
 */
export function savePlaceRating(
  childId: string,
  place: PlaceType,
  rating: RatingLevel,
  options?: {
    note?: string;
    wantsToTalk?: boolean;
  }
): PlaceRatingData {
  const currentMap = getPlaceRatings(childId);
  const now = new Date().toISOString();

  const updatedItem: PlaceRatingData = {
    id: currentMap[place]?.id || `pr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    childId,
    place,
    rating,
    note: options?.note !== undefined ? options.note : currentMap[place]?.note,
    wantsToTalk: options?.wantsToTalk !== undefined ? options.wantsToTalk : currentMap[place]?.wantsToTalk,
    createdAt: currentMap[place]?.createdAt || now,
    updatedAt: now,
  };

  currentMap[place] = updatedItem;

  const array = Object.values(currentMap).filter(Boolean) as PlaceRatingData[];
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${PLACES_STORAGE_KEY_PREFIX}${childId}`, JSON.stringify(array));
  }

  // Safety pattern evaluation trigger
  try {
    import('./safetyPatterns').then(({ evaluatePatterns }) => {
      evaluatePatterns(childId);
    });
  } catch (err) {
    console.warn('Safety evaluation failed in savePlaceRating:', err);
  }

  return updatedItem;
}

/**
 * Generates sample 14-day history for the mood sparkline
 */
function getSampleMoodEntries(childId: string): MoodEntryData[] {
  const sampleMoods: MoodType[] = [
    'HAPPY',
    'HAPPY',
    'MILD',
    'HAPPY',
    'SAD',
    'MILD',
    'HAPPY',
    'HAPPY',
    'MILD',
    'HAPPY',
    'HAPPY',
    'MILD',
    'HAPPY',
    'HAPPY',
  ];

  const now = Date.now();
  return sampleMoods.map((mood, idx) => {
    const daysAgo = 13 - idx;
    const date = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `sample_mood_${idx}`,
      childId,
      mood,
      priorityFlag: mood === 'SAD',
      note: mood === 'SAD' ? 'Felt overwhelmed with homework' : mood === 'MILD' ? 'Quiet afternoon' : undefined,
      createdAt: date,
    };
  });
}
