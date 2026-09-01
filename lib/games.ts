/**
 * Games & Fun Learning for SIX_TO_TEN
 * - Points balance state management (e.g. 140 pts + 20 pts on win)
 * - Daily Game (Word Scramble with Day of Week)
 * - Memory Match pairs
 * - Calming Balloon / Star catch
 * - Daily Joke & "Did you know?" facts
 */

export interface ScrambleChallenge {
  day: string;
  word: string;
  scrambled: string[];
  hint: string;
  fact: string;
  theme: string;
  emoji: string;
}

export const DAILY_SCRAMBLE_SCHEDULE: Record<string, ScrambleChallenge> = {
  Monday: {
    day: 'Monday',
    word: 'BRAVE',
    scrambled: ['V', 'B', 'E', 'R', 'A'],
    hint: 'Being ready to try something new, even if it feels tricky!',
    fact: 'Lions roar so loud their pride can hear them 5 miles away!',
    theme: 'Courage',
    emoji: '🦁',
  },
  Tuesday: {
    day: 'Tuesday',
    word: 'SMILE',
    scrambled: ['L', 'M', 'S', 'E', 'I'],
    hint: 'A happy curve on your face that brightens the room.',
    fact: 'Sea otters hold hands while sleeping so they do not drift apart!',
    theme: 'Joy',
    emoji: '🦦',
  },
  Wednesday: {
    day: 'Wednesday',
    word: 'STARS',
    scrambled: ['R', 'S', 'T', 'S', 'A'],
    hint: 'Sparkly lights shining in the night sky.',
    fact: 'There are more stars in the universe than grains of sand on all Earth beaches!',
    theme: 'Wonder',
    emoji: '⭐',
  },
  Thursday: {
    day: 'Thursday',
    word: 'PEACE',
    scrambled: ['C', 'P', 'E', 'A', 'E'],
    hint: 'A quiet, calm feeling inside like a warm cozy blanket.',
    fact: 'Koalas sleep up to 20 hours a day in soft eucalyptus trees.',
    theme: 'Calm',
    emoji: '🐨',
  },
  Friday: {
    day: 'Friday',
    word: 'MAGIC',
    scrambled: ['G', 'M', 'I', 'A', 'C'],
    hint: 'Wonder and sparkle all around you.',
    fact: 'Hummingbirds can fly backwards and even upside down!',
    theme: 'Imagination',
    emoji: '✨',
  },
  Saturday: {
    day: 'Saturday',
    word: 'FRIEND',
    scrambled: ['R', 'F', 'D', 'N', 'I', 'E'],
    hint: 'Someone who cares about you, listens, and shares a smile.',
    fact: 'Dolphins have special whistle names for each of their friends!',
    theme: 'Kindness',
    emoji: '🐬',
  },
  Sunday: {
    day: 'Sunday',
    word: 'SUNNY',
    scrambled: ['N', 'S', 'Y', 'U', 'N'],
    hint: 'Bright, warm daylight filling the morning.',
    fact: 'Sunflowers turn their big golden faces to follow the sun all day long!',
    theme: 'Warmth',
    emoji: '🌻',
  },
};

export function getTodayScramble(): ScrambleChallenge {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  return DAILY_SCRAMBLE_SCHEDULE[todayName] || DAILY_SCRAMBLE_SCHEDULE.Monday;
}

export interface MemoryCard {
  id: number;
  pairId: string;
  emoji: string;
  label: string;
}

export const MEMORY_CARDS_DECK: Array<{ pairId: string; emoji: string; label: string }> = [
  { pairId: 'star', emoji: '⭐', label: 'Star' },
  { pairId: 'rocket', emoji: '🚀', label: 'Rocket' },
  { pairId: 'bear', emoji: '🧸', label: 'Bear' },
  { pairId: 'heart', emoji: '💛', label: 'Heart' },
  { pairId: 'sun', emoji: '☀️', label: 'Sun' },
  { pairId: 'sprout', emoji: '🌱', label: 'Sprout' },
];

export const JOKES_COLLECTION = [
  {
    setup: 'Why do stars love peaceful nights?',
    punchline: 'Because they get to shine their brightest! ⭐',
    reaction: 'Haha! Keep shining bright!',
  },
  {
    setup: 'What kind of tree fits in your hand?',
    punchline: 'A palm tree! 🌴',
    reaction: 'High five for palm trees!',
  },
  {
    setup: 'Why did the teddy bear say no to dessert?',
    punchline: 'Because it was already stuffed! 🧸',
    reaction: 'Hehe, cozy tummy!',
  },
  {
    setup: 'How do astronauts stay clean in space?',
    punchline: 'They take meteor showers! 🌠',
    reaction: 'Whoosh! That’s cosmic!',
  },
];

export const FUN_FACTS_COLLECTION = [
  {
    fact: 'Honey never spoils. Archaeologists found 3,000-year-old honey that is still good! 🍯',
    topic: 'Nature',
  },
  {
    fact: 'Butterflies taste their food with their feet! 🦋',
    topic: 'Animals',
  },
  {
    fact: 'A group of flamingos is called a flamboyance! 🦩',
    topic: 'Birds',
  },
  {
    fact: 'Sound travels 4 times faster in water than in air! 🐬',
    topic: 'Science',
  },
];

import {
  getChildPointsBalance,
  awardChildPoints,
} from './gamification';

const POINTS_KEY_PREFIX = 'nest_child_points_';

export function getChildPoints(childId: string): number {
  return getChildPointsBalance(childId);
}

export function addPoints(childId: string, amount: number): number {
  const res = awardChildPoints(childId, 'word_scramble_correct');
  return res.newBalance;
}

