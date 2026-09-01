/**
 * AI Companion Core Engine
 * 
 * Provides:
 * - generateCompanionResponse({ childId, userMessage, moodEntry, responseMode })
 * - getConversationTurns(childId, limit?)
 * - recordConversationTurn(...)
 * - clearConversationTurns(childId)
 * 
 * System Prompt Construction:
 * 1. Persona per AgeGroup (Mature Elder Figure for 6-10 vs Mature Friend for 10-14)
 * 2. Strict Hard-Coded Boundaries (Never diagnose, no clinical advice, never claim to be human)
 * 3. Unioned Allowed/Forbidden Topics from Effective RuleSet
 * 4. Trauma-History Sensitivity Injection (sensitivity only, never repeats words as labels)
 * 5. Preferred Language enforcement
 * 6. Short sentences & Response Mode formatting for 6-10
 * 7. Secondary Escalation Classification against RuleSet triggers (NONE, MILD, SERIOUS)
 * 8. Audit Logging into ConversationTurn
 */

import { getChildProfile, ChildProfileData, computeAgeGroup } from './childProfile';
import { getEffectiveRuleSet, evaluateEscalation, RuleSetRecord, EscalationTrigger } from './rules';
import { getMoodEntries, MoodEntryData } from './mood';
import { generateAiText, classifyAiEscalation } from './ai';
import { recordActivityLog, deriveLogSummary } from './activityLog';

export type TurnRole = 'CHILD' | 'COMPANION' | 'SYSTEM';
export type TurnSeverity = 'NONE' | 'MILD' | 'SERIOUS';
export type ResponseMode = 'standard' | 'story' | 'encouraging_words' | 'multiple_choice';

export interface ConversationTurnData {
  id: string;
  childId: string;
  role: TurnRole;
  content: string;
  severity: TurnSeverity;
  reason?: string;
  responseMode?: ResponseMode;
  metadata?: {
    ageGroup?: string;
    companionName?: string;
    companionVibe?: string;
    ruleSetVersion?: number;
    matchedTriggers?: string[];
  };
  createdAt: string;
}

export interface GenerateCompanionResponseParams {
  childId: string;
  userMessage: string;
  moodEntry?: MoodEntryData | null;
  responseMode?: ResponseMode;
}

export interface CompanionResponseResult {
  reply: string;
  severity: TurnSeverity;
  reason: string;
  turnId: string;
  childTurnId: string;
  responseMode?: ResponseMode;
}

const TURNS_STORAGE_PREFIX = 'nest_conversation_turns_';

/**
 * Retrieve recent conversation turns for a child
 */
export function getConversationTurns(childId: string, limit: number = 20): ConversationTurnData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${TURNS_STORAGE_PREFIX}${childId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversationTurnData[];
    return parsed.slice(-limit);
  } catch (err) {
    console.error('Failed to get conversation turns:', err);
    return [];
  }
}

/**
 * Record a conversation turn into storage (Audit Trail for Prompt 8)
 */
export function recordConversationTurn(
  turn: Omit<ConversationTurnData, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): ConversationTurnData {
  const allTurns = getConversationTurns(turn.childId, 100);
  const now = new Date().toISOString();

  const newTurn: ConversationTurnData = {
    id: turn.id || `turn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    childId: turn.childId,
    role: turn.role,
    content: turn.content,
    severity: turn.severity || 'NONE',
    reason: turn.reason,
    responseMode: turn.responseMode,
    metadata: turn.metadata,
    createdAt: turn.createdAt || now,
  };

  const updated = [...allTurns, newTurn];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${TURNS_STORAGE_PREFIX}${turn.childId}`, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save turn to localStorage:', err);
    }
  }

  return newTurn;
}

/**
 * Clear conversation history for a child
 */
export function clearConversationTurns(childId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${TURNS_STORAGE_PREFIX}${childId}`);
  }
}

/**
 * Main Function: generateCompanionResponse
 */
export async function generateCompanionResponse({
  childId,
  userMessage,
  moodEntry,
  responseMode = 'standard',
}: GenerateCompanionResponseParams): Promise<CompanionResponseResult> {
  // 1. Load the child's ChildProfile
  const profile: ChildProfileData = getChildProfile(childId) || {
    id: `cp_${childId}`,
    userId: childId,
    nickname: 'Friend',
    age: 8,
    nationality: 'Global',
    preferredLanguage: 'English',
    hasTraumaHistory: false,
    ageGroup: 'SIX_TO_TEN',
    onboarding_complete: true,
    companionName: 'Pip',
    companionVibe: 'CHILL',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ageGroup = profile.ageGroup || computeAgeGroup(profile.age || 8);
  const isYounger = ageGroup === 'SIX_TO_TEN';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';

  // 2. Load the effective RuleSet via getEffectiveRuleSet(childId)
  const effectiveRuleSet: RuleSetRecord = getEffectiveRuleSet(childId);
  const { allowedTopics, forbiddenTopics, escalationTriggers, toneGuidelines, ageGroupOverrides } =
    effectiveRuleSet.content;

  const ageOverride = ageGroupOverrides.find((o) => o.ageGroup === ageGroup);

  // 3. Load the last ~10 MoodEntry and conversation turns for short-term context
  const recentMoods = getMoodEntries(childId).slice(-5);
  const recentTurns = getConversationTurns(childId, 10);

  // 4. Construct the System Prompt
  let systemPrompt = `You are ${companionName}, an AI companion in the Nest child wellness application.
You are interacting with ${profile.nickname} (Age ${profile.age}, ${profile.nationality}).
Your chosen personality vibe is: ${vibe}.

CRITICAL IDENTITY & CORE MANDATES:
1. NEVER claim to be a human. You are an AI companion (Nestling).
2. NEVER diagnose any medical, psychological, psychiatric, or neurodivergent condition (such as ADHD, Autism, Depression, Anxiety Disorders, etc.).
3. NEVER give direct medical or clinical advice, prescribe medications, or recommend specific medical treatments.
4. NEVER encourage keeping secrets from parents, guardians, doctors, or clinicians.
5. If the child asks for a diagnosis, medical advice, or discusses complex clinical topics, gently and warmly redirect them to talk with a trusted adult, parent, teacher, or clinician.
`;

  // Persona by AgeGroup
  if (isYounger) {
    systemPrompt += `
PERSONA FOR SIX_TO_TEN (6–10 YEARS OLD):
- You are a MATURE ELDER FIGURE: warm, calm, patient, reassuring, safe, and nurturing. Never use baby talk, fake slang, or disjointed words.
- CRITICAL GRAMMAR MANDATE: You MUST ALWAYS speak in full, grammatically complete, natural English sentences with proper subjects, verbs, capital letters, and punctuation.
- NEVER speak in telegraphic fragments, single-word responses, cut-off phrases, or irregular baby-talk (e.g., NEVER say "Me listen. Big hug. Bear jump.").
- Use clear, gentle, age-appropriate vocabulary suitable for a 6 to 10 year old reader.
- Keep each reply concise and easy to read (2 to 4 complete, well-formed sentences per message), avoiding overwhelming walls of text.
- Use sensory, cozy analogies (e.g., feelings as soft clouds, warm blankets, star counting, or gentle balloon breaths).
- Structured Interaction Modes (if triggered or requested):
  * Mini Story: 3 to 4 complete, beautifully narrated sentences telling a gentle story.
  * Warm Words: 2 to 3 complete, uplifting, reassuring sentences.
  * Choices: 2 to 3 distinct, full-sentence options for what to do next.
`;
  } else {
    systemPrompt += `
PERSONA FOR TEN_TO_FOURTEEN (10–14 YEARS OLD):
- You are a MATURE FRIEND: casual, grounded, non-judgmental, authentic, respectful of their autonomy, and a great listener.
- Do NOT lecture, patronize, or talk down to them.
- Avoid fake or outdated teen slang. Speak naturally like a thoughtful, supportive peer in full, articulate sentences.
- Validate their feelings, offer reflective questions, and support structured problem-solving.
`;
  }

  // Trauma-History Sensitivity Injection
  if (profile.hasTraumaHistory) {
    systemPrompt += `
CRITICAL SENSITIVITY INSTRUCTION (TRAUMA-INFORMED CARE):
- This child has indicated something difficult happened in their past.
- Be extra gentle, safe, and predictable.
- NEVER probe, ask for details, or interrogate about traumatic events or past pain.
- Watch carefully for signs of distress.
- Maintain a comforting, grounding presence without forcing deep emotional disclosures.
- STRICT RULE: NEVER repeat the child's confidential profile notes back as a diagnosis, label, or interrogation.
`;
  }

  // Language Directive
  if (profile.preferredLanguage && profile.preferredLanguage.toLowerCase() !== 'english') {
    systemPrompt += `
LANGUAGE DIRECTIVE:
- Respond in the child's preferred language: ${profile.preferredLanguage}.
`;
  } else {
    systemPrompt += `
LANGUAGE DIRECTIVE:
- Respond in English with natural, age-appropriate clarity.
`;
  }

  // Safety Boundaries from RuleSet
  systemPrompt += `
CLINICIAN SAFETY BOUNDARIES:
ALLOWED TOPICS:
${allowedTopics.map((t) => `- ${t}`).join('\n')}

FORBIDDEN TOPICS (STRICT BOUNDARY - NEVER BREACH):
${forbiddenTopics.map((t) => `- ${t}`).join('\n')}

TONE GUIDELINES:
${toneGuidelines}

${ageOverride ? `AGE-GROUP ADAPTATION NOTES:\n${ageOverride.vocabularyNotes}\n${ageOverride.toneNotes || ''}` : ''}
`;

  // Specific Response Mode instruction if requested
  if (responseMode === 'story') {
    systemPrompt += `\nRESPONSE MODE: Story Adventure. Tell a brief 3 to 4 complete-sentence chapter of a gentle metaphorical story starring a character resembling ${profile.nickname} (such as a brave explorer, astronaut, or gentle animal) and their companion ${companionName}. Loosely mirror their current emotional situation in a creative, safe metaphor (e.g. overcoming stormy clouds, finding a path in a glowing forest, building a cozy shelter). End on a gentle choice point asking the child what the character should do next.\n`;
  } else if (responseMode === 'encouraging_words') {
    systemPrompt += `\nRESPONSE MODE: Encouraging Words. Provide 2 to 3 warm, comforting, and fully-formed sentences of genuine encouragement.\n`;
  } else if (responseMode === 'multiple_choice') {
    systemPrompt += `\nRESPONSE MODE: Gentle Interactive Choices. Provide 1 opening full sentence, followed by 2 or 3 clearly numbered full-sentence choices (for example: "1. We could read a cozy space story together." "2. We can try three superhero belly breaths."). Make sure each choice is a complete, clear thought.\n`;
  }

  // Context: Recent Moods & Turns
  if (moodEntry) {
    systemPrompt += `\nCURRENT SESSION CHECK-IN CONTEXT:
The child checked in with mood: ${moodEntry.mood}.
${moodEntry.promptStarter ? `Selected Prompt: "${moodEntry.promptStarter}"` : ''}
${moodEntry.note ? `Child Note: "${moodEntry.note}"` : ''}
`;
  } else if (recentMoods.length > 0) {
    const latest = recentMoods[recentMoods.length - 1];
    systemPrompt += `\nRECENT MOOD CONTEXT: Latest checkin was ${latest.mood} (${new Date(latest.createdAt).toLocaleDateString()}).\n`;
  }

  // Construct dialogue history prompt
  let dialogueContext = '';
  if (recentTurns.length > 0) {
    dialogueContext = recentTurns
      .map((t) => `${t.role === 'CHILD' ? profile.nickname : companionName}: ${t.content}`)
      .join('\n');
    dialogueContext += '\n';
  }

  const fullPrompt = dialogueContext
    ? `${dialogueContext}${profile.nickname}: ${userMessage}\n${companionName}:`
    : `${profile.nickname}: ${userMessage}\n${companionName}:`;

  // 5. Call Gemini API via /lib/ai.ts
  const rawResponse = await generateAiText(fullPrompt, {
    systemInstruction: systemPrompt,
    temperature: isYounger ? 0.5 : 0.7,
    maxOutputTokens: isYounger ? 500 : 600,
  });

  // Clean companion reply
  const replyText = rawResponse
    .replace(new RegExp(`^${companionName}:\\s*`, 'i'), '')
    .trim();

  // 6. Secondary Escalation Classification
  // Score the exchange against RuleSet.escalationTriggers
  const algorithmicEval = evaluateEscalation(userMessage, effectiveRuleSet);
  const triggersSummary = escalationTriggers
    .map((t) => `[${t.severity}] ${t.keyword_or_pattern} (${t.description || ''})`)
    .join('\n');

  let severity: TurnSeverity = 'NONE';
  let reason = 'Normal conversational dialogue within safe boundaries.';

  if (algorithmicEval.triggered && algorithmicEval.highestSeverity) {
    severity = algorithmicEval.highestSeverity;
    reason = `Algorithmic pattern match: ${algorithmicEval.matches.map((m) => m.matchedSnippet).join(', ')}`;
  } else {
    // Run secondary Gemini classification call
    const secondaryClass = await classifyAiEscalation(userMessage, triggersSummary);
    if (secondaryClass.severity !== 'NONE') {
      severity = secondaryClass.severity;
      reason = secondaryClass.reason;
    }
  }

  // 7. Store every exchange in ConversationTurn (Audit Trail for Prompt 8)
  const childTurn = recordConversationTurn({
    childId,
    role: 'CHILD',
    content: userMessage,
    severity,
    reason: severity !== 'NONE' ? reason : undefined,
    responseMode,
    metadata: {
      ageGroup,
      companionName,
      companionVibe: vibe,
      ruleSetVersion: effectiveRuleSet.version,
    },
  });

  // 8. Write Companion response row
  const companionTurn = recordConversationTurn({
    childId,
    role: 'COMPANION',
    content: replyText,
    severity,
    reason,
    responseMode,
    metadata: {
      ageGroup,
      companionName,
      companionVibe: vibe,
      ruleSetVersion: effectiveRuleSet.version,
      matchedTriggers: algorithmicEval.matches.map((m) => m.matchedPattern),
    },
  });

  // Prompt 9: Safety Pattern Tracking & Escalation Engine Trigger
  try {
    const { evaluatePatterns } = await import('./safetyPatterns');
    await evaluatePatterns(childId, {
      triggerTurnId: childTurn.id,
      triggerSeverity: severity !== 'NONE' ? severity : undefined,
      triggerText: userMessage,
    });
  } catch (safetyErr) {
    console.warn('[nest:safety] evaluatePatterns trigger failed:', safetyErr);
  }

  // 9. Activity Log Entry for TEN_TO_FOURTEEN (running recap "Here's what we talked about this week")
  if (ageGroup === 'TEN_TO_FOURTEEN' && userMessage.trim().length > 5) {
    try {
      const derived = deriveLogSummary(userMessage);
      recordActivityLog({
        childId,
        topicSummary: derived.summary,
        category: derived.category,
        tags: derived.tags,
        emoji: derived.emoji,
        sentimentVibe: severity === 'SERIOUS' ? 'challenging' : severity === 'MILD' ? 'reflective' : 'positive',
      });
    } catch (logErr) {
      console.warn('Failed to record activity log summary:', logErr);
    }
  }

  return {
    reply: replyText,
    severity,
    reason,
    turnId: companionTurn.id,
    childTurnId: childTurn.id,
    responseMode,
  };
}
