/**
 * Daily Expression Prompts Bank for TEN_TO_FOURTEEN
 * - ~30 curated rotating questions
 * - Rotates daily without repeats until full cycle completes
 */

export interface ExpressionPrompt {
  id: number;
  prompt: string;
  category: 'reflection' | 'gratitude' | 'curiosity' | 'boundaries' | 'creativity' | 'resilience';
  suggestedStarter?: string;
}

export const EXPRESSION_PROMPTS_BANK: ExpressionPrompt[] = [
  {
    id: 1,
    prompt: "What's one thing that took up space in your head today?",
    category: 'reflection',
    suggestedStarter: 'Something on my mind today was...',
  },
  {
    id: 2,
    prompt: 'What was a moment today where you felt like yourself?',
    category: 'reflection',
    suggestedStarter: 'I felt most like myself when...',
  },
  {
    id: 3,
    prompt: "What's a small win or progress point you noticed today?",
    category: 'gratitude',
    suggestedStarter: 'A small win today was...',
  },
  {
    id: 4,
    prompt: 'If today had a soundtrack or a weather forecast, what would it be?',
    category: 'creativity',
    suggestedStarter: "Today's weather would be...",
  },
  {
    id: 5,
    prompt: 'What was something someone said or did that stuck with you today?',
    category: 'reflection',
    suggestedStarter: 'Something that stuck with me was...',
  },
  {
    id: 6,
    prompt: "Is there anything you felt like you couldn't say out loud today?",
    category: 'boundaries',
    suggestedStarter: "I wanted to say that...",
  },
  {
    id: 7,
    prompt: 'What drained your battery the most today, and what recharged it?',
    category: 'resilience',
    suggestedStarter: 'My battery was drained by... and recharged by...',
  },
  {
    id: 8,
    prompt: "What's a topic, hobby, or question you've been curious about lately?",
    category: 'curiosity',
    suggestedStarter: "I've been wondering about...",
  },
  {
    id: 9,
    prompt: 'Who was someone who made things even a little bit easier or nicer today?',
    category: 'gratitude',
    suggestedStarter: 'Shoutout to...',
  },
  {
    id: 10,
    prompt: "What's one thing you're quietly looking forward to this week?",
    category: 'gratitude',
    suggestedStarter: "I'm looking forward to...",
  },
  {
    id: 11,
    prompt: 'Did you feel any pressure today? Where was it coming from?',
    category: 'boundaries',
    suggestedStarter: 'The main pressure was around...',
  },
  {
    id: 12,
    prompt: 'What is a strength or skill you used today without even thinking about it?',
    category: 'resilience',
    suggestedStarter: 'A strength I used was...',
  },
  {
    id: 13,
    prompt: "If you could redo one 5-minute slice of today, what would you change?",
    category: 'reflection',
    suggestedStarter: 'If I could redo a moment, I would...',
  },
  {
    id: 14,
    prompt: "What's a song, video, or thing you saw today that made you smile?",
    category: 'creativity',
    suggestedStarter: 'Something cool I saw was...',
  },
  {
    id: 15,
    prompt: 'How would you rate your social energy today on a scale of 1 to 10?',
    category: 'boundaries',
    suggestedStarter: 'My social energy was around...',
  },
  {
    id: 16,
    prompt: 'What was the most interesting or surprising thing you learned today?',
    category: 'curiosity',
    suggestedStarter: 'I learned that...',
  },
  {
    id: 17,
    prompt: "What's something you did for yourself today to take care of your mood?",
    category: 'resilience',
    suggestedStarter: 'I took care of myself by...',
  },
  {
    id: 18,
    prompt: 'Did something feel unfair or confusing today? Want to unpack it?',
    category: 'boundaries',
    suggestedStarter: 'Something confusing was...',
  },
  {
    id: 19,
    prompt: 'What is a goal or project you want to spend time on this weekend?',
    category: 'creativity',
    suggestedStarter: 'I want to work on...',
  },
  {
    id: 20,
    prompt: 'What kind of vibe do you want to bring into tomorrow?',
    category: 'reflection',
    suggestedStarter: 'Tomorrow I want my vibe to be...',
  },
  {
    id: 21,
    prompt: 'When did you laugh the hardest or smile the most today?',
    category: 'gratitude',
    suggestedStarter: 'I laughed when...',
  },
  {
    id: 22,
    prompt: "What's a boundary or choice you made today that you feel good about?",
    category: 'boundaries',
    suggestedStarter: 'I decided to...',
  },
  {
    id: 23,
    prompt: 'If you could talk to an expert on any subject right now, what would you ask?',
    category: 'curiosity',
    suggestedStarter: 'I would ask...',
  },
  {
    id: 24,
    prompt: 'What made today feel different from yesterday?',
    category: 'reflection',
    suggestedStarter: 'Today was different because...',
  },
  {
    id: 25,
    prompt: "What's a piece of advice you would give someone going through a day like yours?",
    category: 'resilience',
    suggestedStarter: 'My advice would be...',
  },
  {
    id: 26,
    prompt: 'Did you notice anyone else having a tough day today? How did you respond?',
    category: 'reflection',
    suggestedStarter: 'I noticed that...',
  },
  {
    id: 27,
    prompt: "What's your current favorite place to chill and reset your mind?",
    category: 'resilience',
    suggestedStarter: 'My favorite spot to reset is...',
  },
  {
    id: 28,
    prompt: 'What is one thing about yourself that you really appreciate right now?',
    category: 'gratitude',
    suggestedStarter: 'One thing I appreciate about myself is...',
  },
  {
    id: 29,
    prompt: 'If today was a chapter in your autobiography, what would its title be?',
    category: 'creativity',
    suggestedStarter: 'Chapter title: ',
  },
  {
    id: 30,
    prompt: 'What is one question you wish someone would ask you today?',
    category: 'reflection',
    suggestedStarter: 'I wish someone asked me...',
  },
];

/**
 * Returns today's expression prompt rotating daily based on calendar day index
 */
export function getDailyExpressionPrompt(childId?: string): ExpressionPrompt {
  const now = new Date();
  // Compute day of year index
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const promptIndex = dayOfYear % EXPRESSION_PROMPTS_BANK.length;
  return EXPRESSION_PROMPTS_BANK[promptIndex];
}
