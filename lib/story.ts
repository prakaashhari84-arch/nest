/**
 * Animated Story Engine for SIX_TO_TEN
 * - Dark Cosmic visual theme data
 * - Chapter progression (5-8 beats/chapters)
 * - Metaphorical story starring character resembling the child
 * - Choice points driving the narrative
 */

import { generateAiText } from './ai';
import { getChildProfile, ChildProfileData } from './childProfile';
import { getMoodEntries } from './mood';

export interface StoryChoice {
  id: string;
  icon: string;
  label: string;
  isSuggested?: boolean;
}

export interface StoryChapter {
  chapterNumber: number;
  totalChapters: number;
  title: string;
  narrative: string;
  illustration: {
    type: 'cosmic_forest' | 'space_ship' | 'cloud_castle' | 'crystal_cave' | 'starlit_beach';
    accentColor: string;
    ambientEmoji: string;
  };
  choices: StoryChoice[];
  isCompleted?: boolean;
}

export interface ActiveStoryState {
  id: string;
  childId: string;
  title: string;
  characterName: string;
  companionName: string;
  currentChapterIndex: number; // 0-based
  totalChapters: number;
  history: Array<{
    chapter: StoryChapter;
    chosenOption?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

const STORY_STORAGE_PREFIX = 'nest_story_progress_';

export const DEFAULT_COSMIC_STORY: StoryChapter[] = [
  {
    chapterNumber: 1,
    totalChapters: 5,
    title: 'The Whispering Starlight',
    narrative:
      'High above the quiet rooftops, a glowing star fell softly into a silver meadow. Barnaby the Explorer looked out his window and noticed the star was softly pulsing with gentle blue light. It seemed to be calling for a friend to join a special quest.',
    illustration: {
      type: 'cosmic_forest',
      accentColor: '#38bdf8',
      ambientEmoji: '🌌',
    },
    choices: [
      {
        id: 'c1_telescope',
        icon: '🔭',
        label: 'Peer through the telescope to see where it landed.',
        isSuggested: true,
      },
      {
        id: 'c1_lantern',
        icon: '🏮',
        label: 'Grab a warm lantern and step outside into the garden.',
      },
      {
        id: 'c1_companion',
        icon: '🧸',
        label: 'Call your trusty companion Pip to come look together.',
      },
    ],
  },
  {
    chapterNumber: 2,
    totalChapters: 5,
    title: 'The Enchanted Starwood',
    narrative:
      'Guided by the soft glow, Barnaby and Pip entered the ancient Whispering Starwood. Soft purple moss lit up under their footsteps like tiny nightlights. Ahead stood a friendly owl wearing brass goggles, guarding a crossroads of three glowing paths.',
    illustration: {
      type: 'crystal_cave',
      accentColor: '#c084fc',
      ambientEmoji: '🦉',
    },
    choices: [
      {
        id: 'c2_melody',
        icon: '🎵',
        label: 'Follow the gentle melody playing down the crystal path.',
        isSuggested: true,
      },
      {
        id: 'c2_owl',
        icon: '✨',
        label: 'Ask the wise owl for a map to the starlight fountain.',
      },
      {
        id: 'c2_rest',
        icon: '☕',
        label: 'Take a calm breath and rest on a mossy stone first.',
      },
    ],
  },
  {
    chapterNumber: 3,
    totalChapters: 5,
    title: 'The Bridge of Courage',
    narrative:
      'A wide shimmering river of starry clouds blocked their way. The only way across was a bridge made of floating rainbow stones that required calm, steady steps. Pip held Barnaby’s hand and whispered, "We can do this together, one stone at a time!"',
    illustration: {
      type: 'cloud_castle',
      accentColor: '#f472b6',
      ambientEmoji: '🌈',
    },
    choices: [
      {
        id: 'c3_slow_breath',
        icon: '💨',
        label: 'Take three slow superhero breaths and step forward.',
        isSuggested: true,
      },
      {
        id: 'c3_hum',
        icon: '🎶',
        label: 'Hum a brave adventure song together while crossing.',
      },
      {
        id: 'c3_count',
        icon: '⭐',
        label: 'Count five sparkling stars to keep eyes focused and calm.',
      },
    ],
  },
  {
    chapterNumber: 4,
    totalChapters: 5,
    title: 'The Starlight Crystal Palace',
    narrative:
      'Across the cloud bridge, they arrived at a magnificent palace made of glowing starlight crystals. In the center lay the lost Star of Warmth, which was glowing softly but needed a kind word to regain its full brilliant shine.',
    illustration: {
      type: 'space_ship',
      accentColor: '#fbbf24',
      ambientEmoji: '🏰',
    },
    choices: [
      {
        id: 'c4_share_kindness',
        icon: '💛',
        label: 'Share a happy memory and gentle encouraging words.',
        isSuggested: true,
      },
      {
        id: 'c4_touch_star',
        icon: '✨',
        label: 'Gently place both hands on the crystal to warm it.',
      },
      {
        id: 'c4_sing',
        icon: '🌟',
        label: 'Sing a cozy lullaby with Pip to wake the star.',
      },
    ],
  },
  {
    chapterNumber: 5,
    totalChapters: 5,
    title: 'A Hero’s Starlit Slumber',
    narrative:
      'The star burst with dazzling golden sparkles that showered the whole sky with warmth and peace. Barnaby felt strong, safe, and deeply proud of his brave heart. Hand in hand with Pip, they curled up under the gentle cosmic aurora for a peaceful night.',
    illustration: {
      type: 'starlit_beach',
      accentColor: '#34d399',
      ambientEmoji: '🌌',
    },
    choices: [
      {
        id: 'c5_dream',
        icon: '🌙',
        label: 'Close your eyes and dream of tomorrow’s bright discoveries.',
        isSuggested: true,
      },
      {
        id: 'c5_celebrate',
        icon: '🎉',
        label: 'High-five Pip for finishing an awesome quest together!',
      },
    ],
    isCompleted: true,
  },
];

/**
 * Get active story for child from storage
 */
export function getActiveStoryState(childId: string): ActiveStoryState {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${STORY_STORAGE_PREFIX}${childId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read story progress:', err);
    }
  }

  // Initialize initial story state
  const profile = getChildProfile(childId);
  const nickname = profile?.nickname || 'Barnaby';
  const companionName = profile?.companionName || 'Pip';

  const initial: ActiveStoryState = {
    id: `story_${Date.now()}`,
    childId,
    title: 'The Starlight Journey',
    characterName: nickname,
    companionName,
    currentChapterIndex: 0,
    totalChapters: 5,
    history: DEFAULT_COSMIC_STORY.map((ch) => ({ chapter: ch })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStoryState(initial);
  return initial;
}

/**
 * Save story state to local storage
 */
export function saveStoryState(state: ActiveStoryState): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORY_STORAGE_PREFIX}${state.childId}`, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save story state:', err);
    }
  }
}

/**
 * Advance story with child's chosen action
 */
export async function advanceStoryChapter(
  childId: string,
  chosenChoiceLabel: string
): Promise<{ state: ActiveStoryState; nextChapter: StoryChapter }> {
  const current = getActiveStoryState(childId);
  const nextIdx = Math.min(current.currentChapterIndex + 1, current.totalChapters - 1);

  // Update history record for previous chapter
  if (current.history[current.currentChapterIndex]) {
    current.history[current.currentChapterIndex].chosenOption = chosenChoiceLabel;
  }

  current.currentChapterIndex = nextIdx;
  current.updatedAt = new Date().toISOString();

  // Try dynamic LLM continuation if available, otherwise use curated cosmic chapter
  const nextChapter = current.history[nextIdx]?.chapter || DEFAULT_COSMIC_STORY[nextIdx] || DEFAULT_COSMIC_STORY[0];

  saveStoryState(current);
  return { state: current, nextChapter };
}

/**
 * Reset story for a fresh run
 */
export function resetStory(childId: string): ActiveStoryState {
  const profile = getChildProfile(childId);
  const nickname = profile?.nickname || 'Barnaby';
  const companionName = profile?.companionName || 'Pip';

  const resetState: ActiveStoryState = {
    id: `story_${Date.now()}`,
    childId,
    title: 'The Starlight Journey',
    characterName: nickname,
    companionName,
    currentChapterIndex: 0,
    totalChapters: 5,
    history: DEFAULT_COSMIC_STORY.map((ch) => ({ chapter: ch })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStoryState(resetState);
  return resetState;
}
