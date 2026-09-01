/**
 * Fun Learning Aligned with Syllabus & Life Skills for TEN_TO_FOURTEEN
 * 
 * Includes:
 * 1. Syllabus Subject Picker (Science, History, Math, Literature, Tech, Space)
 * 2. LLM Explainer generator via /lib/ai.ts
 * 3. Static Life Skills & Encouragement library tagged by mood/topic
 */

import { generateAiText } from './ai';

export interface LearningSubject {
  id: string;
  name: string;
  emoji: string;
  color: string;
  topics: Array<{
    id: string;
    title: string;
    description: string;
    quickHook: string;
    defaultFact: string;
  }>;
}

export const SYLLABUS_SUBJECTS: LearningSubject[] = [
  {
    id: 'science',
    name: 'Science & Nature',
    emoji: '🔬',
    color: 'emerald',
    topics: [
      {
        id: 'neuroscience',
        title: 'How Neuroplasticity Rewires Your Brain',
        description: 'How your brain physically builds new pathways when you practice tricky things.',
        quickHook: 'Your brain is like high-tech kinetic sand that reshapes every time you learn.',
        defaultFact: 'Every time you make a mistake and try again, your brain releases neurochemicals that strengthen memory pathways!',
      },
      {
        id: 'ecosystems',
        title: 'The Underground Wood Wide Web',
        description: 'How forest trees use fungal mycelium networks to send warning signals and nutrients to each other.',
        quickHook: 'Trees literally have a secret underground internet network made of mushrooms.',
        defaultFact: 'Mother trees can recognize their own saplings through root networks and send them extra sugars!',
      },
      {
        id: 'quantum',
        title: 'Quantum Physics in Everyday Life',
        description: 'How lasers, smartphones, and MRI scanners rely on the strange world of atoms.',
        quickHook: 'Particles can exist in two places at once until someone measures them.',
        defaultFact: 'Without quantum tunneling physics, the microchips inside your smartphone could not process calculations!',
      },
    ],
  },
  {
    id: 'space',
    name: 'Astronomy & Cosmos',
    emoji: '🔭',
    color: 'indigo',
    topics: [
      {
        id: 'blackholes',
        title: 'Inside Event Horizons & Spaghettification',
        description: 'What happens to time and gravity near supermassive black holes.',
        quickHook: 'Time slows down so much near a black hole that an hour there could be decades on Earth.',
        defaultFact: 'The supermassive black hole at our Milky Way center, Sagittarius A*, has the mass of 4 million suns!',
      },
      {
        id: 'exoplanets',
        title: 'Oceans on Enceladus & Alien Moons',
        description: 'Why icy moons in our solar system are prime candidates for microbial life.',
        quickHook: 'Saturn has an icy moon shooting water geysers hundreds of miles into space.',
        defaultFact: 'Saturn’s moon Enceladus has a warm subsurface ocean with all six key ingredients for organic life!',
      },
    ],
  },
  {
    id: 'history',
    name: 'World History & Civilizations',
    emoji: '🏛️',
    color: 'amber',
    topics: [
      {
        id: 'antikythera',
        title: 'The 2,000-Year-Old Ancient Computer',
        description: 'The Greek Antikythera Mechanism that predicted eclipses with bronze gears.',
        quickHook: 'Ancient divers discovered a bronze clockwork device built over 2,000 years ago.',
        defaultFact: 'The Antikythera mechanism was so advanced that nothing matching its complexity was built again for another 1,000 years!',
      },
      {
        id: 'silkroad',
        title: 'Ideas & Spices on the Ancient Silk Road',
        description: 'How trade routes connected civilizations and exchanged innovations like paper and astronomy.',
        quickHook: 'The Silk Road was not a single road, but an ancient global trade network spanning thousands of miles.',
        defaultFact: 'Along with silk and spices, the Silk Road carried musical instruments, chess, and mathematics across continents!',
      },
    ],
  },
  {
    id: 'math',
    name: 'Applied Math & Logic',
    emoji: '📐',
    color: 'sky',
    topics: [
      {
        id: 'fibonacci',
        title: 'The Golden Ratio in Nature & Art',
        description: 'Why sunflowers, spiral galaxies, and seashells all follow the Fibonacci sequence.',
        quickHook: 'Math isn’t just numbers—it’s the architectural code of nature.',
        defaultFact: 'Pinecones and sunflowers pack their seeds in Fibonacci spirals to maximize sunlight and space efficiency!',
      },
      {
        id: 'cryptography',
        title: 'Prime Numbers & Modern Encryption',
        description: 'How giant prime numbers keep internet passwords and game accounts safe.',
        quickHook: 'Multiplying two huge prime numbers creates an unbreakable digital lock.',
        defaultFact: 'Modern HTTPS web security relies on multiplying prime numbers that are hundreds of digits long!',
      },
    ],
  },
  {
    id: 'tech',
    name: 'Technology & AI',
    emoji: '🤖',
    color: 'purple',
    topics: [
      {
        id: 'llms',
        title: 'How AI Neural Networks Learn',
        description: 'How transformers and attention mechanisms process language like humans.',
        quickHook: 'AI models learn language patterns by predicting the next most logical word billions of times.',
        defaultFact: 'Neural networks are inspired by the billions of interconnected neurons firing in human brains!',
      },
    ],
  },
];

export interface ExplainerContent {
  subjectName: string;
  topicTitle: string;
  hook: string;
  deepDive: string[];
  takeaway: string;
  funFact: string;
}

/**
 * Generate bite-sized engaging explainer via LLM
 */
export async function generateSubjectExplainer(
  subjectName: string,
  topicTitle: string,
  grade: string = '7th Grade'
): Promise<ExplainerContent> {
  const prompt = `You are an engaging, smart, and relatable learning mentor for a student in ${grade} (age 10-14).
Create a bite-sized, fascinating explainer card on: "${topicTitle}" within ${subjectName}.

Return a JSON object with:
{
  "hook": "1 punchy, intriguing opening sentence that hooks attention without being childish",
  "deepDive": [
    "2-3 short, clear, interesting bullet point sentences explaining how it works with crisp analogies"
  ],
  "takeaway": "1 practical or mind-expanding takeaway thought",
  "funFact": "1 jaw-dropping fun fact"
}`;

  try {
    const raw = await generateAiText(prompt, {
      systemInstruction: 'You are a brilliant youth science and humanities communicator. Return valid JSON only.',
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      subjectName,
      topicTitle,
      hook: parsed.hook || 'Here is something fascinating you might not know about this topic.',
      deepDive: Array.isArray(parsed.deepDive) ? parsed.deepDive : [parsed.deepDive || ''],
      takeaway: parsed.takeaway || 'Curiosity unlocks how the universe works around us.',
      funFact: parsed.funFact || 'Learning new concepts expands neural connections in your brain.',
    };
  } catch (err) {
    console.warn('Fallback to static explainer content:', err);
    return {
      subjectName,
      topicTitle,
      hook: `Discovering how ${topicTitle.toLowerCase()} works opens up an amazing perspective.`,
      deepDive: [
        'Complex systems in this field rely on simple, elegant foundational principles.',
        'When you break it down into core components, patterns emerge naturally.',
        'Scientists and researchers use these exact models to solve real-world problems today.',
      ],
      takeaway: 'Questioning how things work is the first step toward master-level thinking.',
      funFact: 'Did you know that understanding these fundamentals gives you an edge in both academics and everyday problem solving?',
    };
  }
}

// -------------------------------------------------------------------
// ENCOURAGEMENT & LIFE SKILLS LIBRARY (Static / Non-LLM Cards)
// Tagged with relevant mood/topic for contextual surfacing
// -------------------------------------------------------------------

export interface LifeSkillCard {
  id: string;
  title: string;
  topic: 'confidence' | 'emotions' | 'conflict' | 'boundaries' | 'focus' | 'friendship';
  relevantMoods: Array<'HAPPY' | 'MILD' | 'SAD'>;
  emoji: string;
  headline: string;
  keyInsight: string;
  actionableStep: string;
}

export const LIFE_SKILLS_LIBRARY: LifeSkillCard[] = [
  {
    id: 'skill_name_it',
    title: 'Name It to Tame It',
    topic: 'emotions',
    relevantMoods: ['MILD', 'SAD'],
    emoji: '🏷️',
    headline: 'Putting words to feelings cools down the amygdala.',
    keyInsight:
      'When you feel a heavy storm inside, your brain’s alarm center is firing. The moment you accurately name the emotion (e.g. "I feel left out" or "I feel rushed"), your prefrontal cortex kicks in and dials down the physical stress.',
    actionableStep: 'Try asking yourself: "What are three exact words that describe what I am feeling right now?"',
  },
  {
    id: 'skill_box_breathing',
    title: 'The 4-4-4 Reset',
    topic: 'focus',
    relevantMoods: ['MILD', 'SAD'],
    emoji: '🌬️',
    headline: 'A quick autonomic nervous system reset.',
    keyInsight:
      'Inhaling for 4 seconds, holding for 4, and exhaling for 4 lowers your heart rate and sends an immediate signal to your brain that you are safe.',
    actionableStep: 'Do 3 rounds of 4-4-4 breathing before stepping into a stressful classroom or conversation.',
  },
  {
    id: 'skill_conflict_pause',
    title: 'The 10-Second Friction Pause',
    topic: 'conflict',
    relevantMoods: ['MILD', 'SAD'],
    emoji: '⏸️',
    headline: 'Never reply when your heart rate is above resting speed.',
    keyInsight:
      'In heated moments with friends or siblings, reacting instantly puts you in defense mode. Taking 10 seconds to pause lets your logical mind choose your words rather than letting anger drive.',
    actionableStep: 'Say: "Give me a minute to think about that, and let’s talk." It protects the friendship and keeps you in control.',
  },
  {
    id: 'skill_boundaries',
    title: 'Clear Is Kind: Healthy Boundaries',
    topic: 'boundaries',
    relevantMoods: ['MILD', 'SAD', 'HAPPY'],
    emoji: '🛡️',
    headline: 'You can be kind without saying yes to everything.',
    keyInsight:
      'Saying no to something that drains your battery isn’t mean—it’s how you preserve your energy to be a genuine friend when it matters most.',
    actionableStep: 'A simple script: "I can’t do that today, but thanks for asking me!"',
  },
  {
    id: 'skill_imposter_syndrome',
    title: 'The Spotlight Effect',
    topic: 'confidence',
    relevantMoods: ['MILD', 'SAD'],
    emoji: '🔦',
    headline: 'People notice your mistakes 90% less than you think.',
    keyInsight:
      'Psychologists call it the Spotlight Effect: we think everyone is watching our awkward moments, but in reality, almost everyone is focused on their own world.',
    actionableStep: 'If you fumble an answer in class, give yourself grace: everyone forgot about it 30 seconds later.',
  },
  {
    id: 'skill_growth_mindset',
    title: 'The Power of "Yet"',
    topic: 'confidence',
    relevantMoods: ['MILD', 'HAPPY'],
    emoji: '🌱',
    headline: 'Add one small word to transform frustration.',
    keyInsight:
      'Replacing "I don’t understand this" with "I don’t understand this yet" reminds your subconscious that skill is built through repetition, not instant luck.',
    actionableStep: 'Catch yourself when you say "I can’t" and tag "yet" at the end of the sentence.',
  },
];

/**
 * Get contextual life skills cards based on child's recent mood
 */
export function getContextualLifeSkills(mood: 'HAPPY' | 'MILD' | 'SAD' = 'MILD'): LifeSkillCard[] {
  const filtered = LIFE_SKILLS_LIBRARY.filter((card) => card.relevantMoods.includes(mood));
  return filtered.slice(0, 2);
}
