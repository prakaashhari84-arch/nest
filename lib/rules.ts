/**
 * Clinician Rule Engine & Safety Configuration
 * Defines rules, escalation triggers, age-group vocabulary notes,
 * and the hierarchical precedence resolver:
 * GLOBAL_DEFAULT → Clinician-level override → Child-specific override.
 */

export type EscalationSeverity = 'MILD' | 'SERIOUS';

export interface EscalationTrigger {
  id?: string;
  keyword_or_pattern: string;
  severity: EscalationSeverity;
  description?: string;
}

export interface AgeGroupOverride {
  ageGroup: 'SIX_TO_TEN' | 'TEN_TO_FOURTEEN';
  vocabularyNotes: string;
  toneNotes?: string;
}

export interface RuleSetContent {
  allowedTopics: string[];
  forbiddenTopics: string[];
  escalationTriggers: EscalationTrigger[];
  toneGuidelines: string;
  ageGroupOverrides: AgeGroupOverride[];
}

export interface RuleSetRecord {
  id: string;
  clinicianId: string | null; // null = Global default
  childId: string | null;     // null = Clinician-wide default or Global default
  name: string;
  content: RuleSetContent;
  version: number;
  createdAt: string;
  updatedAt: string;
  isSystemDefault?: boolean;
}

/**
 * Seed 1: GLOBAL_DEFAULT RuleSet
 * Pre-configured safety baseline ensuring medical diagnosis boundaries,
 * serious abuse / self-harm escalation, and age-adapted tone.
 */
export const GLOBAL_DEFAULT_RULESET: RuleSetRecord = {
  id: 'ruleset_global_default',
  clinicianId: null,
  childId: null,
  name: 'Global Safety & Engagement Baseline',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  isSystemDefault: true,
  content: {
    allowedTopics: [
      'Daily feelings, emotional expression, and mood tracking',
      'School day reflections, hobbies, creativity, and drawing',
      'Friendships, social situations, and positive interactions',
      'Coping strategies, mindfulness, belly breathing, and grounding exercises',
      'Bedtime routines, sleep hygiene, and calming wind-down habits',
      'Self-esteem, positive affirmations, and gentle encouragement',
      'Your Places check-in reflections and safe spot visualizations',
    ],
    forbiddenTopics: [
      'Giving medical, psychiatric, or developmental diagnoses',
      'Recommending or adjusting prescription medications or dosages',
      'Providing unsupervised clinical psychotherapy or psychological diagnostic evaluations',
      'Making definitive safety guarantees without clinician/parent notification',
      'Instructing a child to keep secrets from parents or clinicians',
      'Adult-only themes, inappropriate violence, weapons, or dangerous behaviors',
    ],
    escalationTriggers: [
      {
        id: 'esc_global_01',
        keyword_or_pattern: 'want to hurt myself|kill myself|suicide|self-harm|cutting|end my life|die',
        severity: 'SERIOUS',
        description: 'Explicit self-harm, suicidal ideation, or life-threatening crisis mention',
      },
      {
        id: 'esc_global_02',
        keyword_or_pattern: 'someone is hurting me|hitting me|touching me inappropriately|abuse|scared of parents|unsafe at home',
        severity: 'SERIOUS',
        description: 'Physical/sexual abuse disclosure or immediate domestic danger',
      },
      {
        id: 'esc_global_03',
        keyword_or_pattern: "nobody cares if I disappear|don't want to wake up|hopeless|running away forever|giving away my things",
        severity: 'SERIOUS',
        description: 'Severe withdrawal, hopeless resignation, or active crisis indicators',
      },
      {
        id: 'esc_global_04',
        keyword_or_pattern: 'getting bullied|kids make fun of me|picked on at school|left out every day|called names',
        severity: 'MILD',
        description: 'Peer harassment, school bullying, or social exclusion',
      },
      {
        id: 'esc_global_05',
        keyword_or_pattern: "failing my test|homework stress|too much school pressure|can't keep up in class|scared of teacher",
        severity: 'MILD',
        description: 'Academic anxiety, test dread, or acute classroom distress',
      },
      {
        id: 'esc_global_06',
        keyword_or_pattern: 'feeling lonely today|sad today|crying in my room|nobody wants to play with me',
        severity: 'MILD',
        description: 'Mild transient sadness, social loneliness, or melancholy',
      },
    ],
    toneGuidelines:
      'Warm, empathetic, validating, non-judgmental, calm, and curiosity-driven. Maintain a safe developmental container. Mirror the child’s emotional state with warmth without magnifying panic. Always emphasize child agency while gently anchoring them to trusted real-world adults.',
    ageGroupOverrides: [
      {
        ageGroup: 'SIX_TO_TEN',
        vocabularyNotes:
          'Always use full, grammatically complete, natural sentences with proper punctuation. Use simple, concrete, gentle words that are easy for young children to read. Use playful analogies (e.g., feelings as weather, colors, or cute animals) and sensory calming cues (belly breaths, soft blankets, cozy colors). Avoid clinical jargon, baby talk, or chopped sentence fragments.',
        toneNotes: 'Playful, nurturing, gentle, and reassuring.',
      },
      {
        ageGroup: 'TEN_TO_FOURTEEN',
        vocabularyNotes:
          'Use a conversational peer-support tone without forced slang. Respect emerging independence and privacy. Validate complex social dynamics (friend groups, boundaries, stress). Introduce reflective prompts, guided reframing, and structured problem-solving.',
        toneNotes: 'Respectful, collaborative, thoughtful, and authentic.',
      },
    ],
  },
};

/**
 * Sample Clinician Caseload RuleSet (Dr. Marcus Vance Default)
 */
export const SAMPLE_CLINICIAN_RULESET: RuleSetRecord = {
  id: 'ruleset_clinician_vance_01',
  clinicianId: 'clp_clinician_01',
  childId: null,
  name: 'Dr. Vance Caseload Baseline (Pediatric Anxiety & Somatic Focus)',
  version: 2,
  createdAt: '2026-02-10T14:30:00.000Z',
  updatedAt: '2026-02-28T09:15:00.000Z',
  content: {
    allowedTopics: [
      'Daily feelings, emotional expression, and mood tracking',
      'School day reflections, hobbies, creativity, and drawing',
      'Friendships, social situations, and positive interactions',
      'Coping strategies, mindfulness, belly breathing, and grounding exercises',
      'Bedtime routines, sleep hygiene, and calming wind-down habits',
      'Somatic body sensations (butterflies in tummy, tight shoulders, racing pulse)',
      'Gradual exposure check-ins and brave step celebrations',
    ],
    forbiddenTopics: [
      'Giving medical, psychiatric, or developmental diagnoses',
      'Recommending or adjusting prescription medications or dosages',
      'Providing unsupervised clinical psychotherapy or psychological diagnostic evaluations',
      'Making definitive safety guarantees without clinician/parent notification',
      'Instructing a child to keep secrets from parents or clinicians',
      'Discussing catastrophic medical prognoses or complex diagnostic manuals',
    ],
    escalationTriggers: [
      {
        id: 'esc_vance_01',
        keyword_or_pattern: 'stomach hurts every morning|throwing up before school|chest tight and dizzy',
        severity: 'MILD',
        description: 'Frequent somatic manifestation of school-refusal anxiety',
      },
      {
        id: 'esc_vance_02',
        keyword_or_pattern: 'panic attack|can’t breathe at school|freaking out in hallway',
        severity: 'SERIOUS',
        description: 'Acute panic episode requiring caregiver/school nurse notification',
      },
    ],
    toneGuidelines:
      'Supportive, encouraging, somatic-aware, and structured. Encourage identifying where emotions live in the body and pairing with physical grounding techniques (5-4-3-2-1 sensory scan).',
    ageGroupOverrides: [
      {
        ageGroup: 'SIX_TO_TEN',
        vocabularyNotes:
          'Talk about the "worry bug" or "fluttery tummy butterfly". Practice 4-count "balloon breath".',
        toneNotes: 'Cozy and protective.',
      },
      {
        ageGroup: 'TEN_TO_FOURTEEN',
        vocabularyNotes:
          'Discuss physiological nervous system arousal (fight-or-flight vs calm parasympathetic reset) in accessible language.',
        toneNotes: 'Empowering and psychoeducational.',
      },
    ],
  },
};

/**
 * Sample Child-Specific Override (Leo Martinez)
 */
export const SAMPLE_CHILD_OVERRIDE_RULESET: RuleSetRecord = {
  id: 'ruleset_child_leo_01',
  clinicianId: 'clp_clinician_01',
  childId: 'cp_child_01',
  name: 'Leo Martinez — Math Anxiety & Transit Sensory Override',
  version: 1,
  createdAt: '2026-03-01T11:00:00.000Z',
  updatedAt: '2026-03-01T11:00:00.000Z',
  content: {
    allowedTopics: [
      'Daily feelings, emotional expression, and mood tracking',
      'School day reflections, hobbies, creativity, and drawing',
      'Friendships, social situations, and positive interactions',
      'Coping strategies, mindfulness, belly breathing, and grounding exercises',
      'Lego building, space exploration, and dinosaur trivia as soothing topics',
      'Transit and bus sensory calming strategies',
    ],
    forbiddenTopics: [
      'Giving medical, psychiatric, or developmental diagnoses',
      'Recommending or adjusting prescription medications or dosages',
      'High-pressure timed arithmetic tests or fast quiz simulations',
    ],
    escalationTriggers: [
      {
        id: 'esc_leo_01',
        keyword_or_pattern: 'hate the bus|transit is too loud|bus driver shouted|kids pushed on bus',
        severity: 'MILD',
        description: 'Sensory overload trigger during daily transit check-ins',
      },
      {
        id: 'esc_leo_02',
        keyword_or_pattern: 'math test tomorrow|failing 4th grade|math teacher makes me cry',
        severity: 'MILD',
        description: 'Specific math performance anxiety spike',
      },
    ],
    toneGuidelines:
      'Ultra gentle, use space/astronaut analogies (e.g., "mission control breathing"). Leo responds well to calm logic and structured countdowns.',
    ageGroupOverrides: [
      {
        ageGroup: 'SIX_TO_TEN',
        vocabularyNotes:
          'Use space captain and cosmic explorer themes. Suggest counting stars or listening to calm helmet audio when overwhelmed.',
        toneNotes: 'Adventurous and soothing.',
      },
      {
        ageGroup: 'TEN_TO_FOURTEEN',
        vocabularyNotes: 'Standard 10-14 phrasing.',
      },
    ],
  },
};

const RULESETS_STORAGE_KEY = 'nest_clinician_rulesets_v1';

/**
 * Retrieve all registered RuleSets from persistent store (localStorage + seed fallback)
 */
export function getAllRuleSets(): RuleSetRecord[] {
  if (typeof window === 'undefined') {
    return [GLOBAL_DEFAULT_RULESET, SAMPLE_CLINICIAN_RULESET, SAMPLE_CHILD_OVERRIDE_RULESET];
  }

  try {
    const raw = localStorage.getItem(RULESETS_STORAGE_KEY);
    if (!raw) {
      const initial = [GLOBAL_DEFAULT_RULESET, SAMPLE_CLINICIAN_RULESET, SAMPLE_CHILD_OVERRIDE_RULESET];
      localStorage.setItem(RULESETS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Ensure global default is always present
    const hasGlobal = parsed.some((r: RuleSetRecord) => r.clinicianId === null && r.childId === null);
    if (!hasGlobal) {
      parsed.unshift(GLOBAL_DEFAULT_RULESET);
      localStorage.setItem(RULESETS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [GLOBAL_DEFAULT_RULESET, SAMPLE_CLINICIAN_RULESET, SAMPLE_CHILD_OVERRIDE_RULESET];
  }
}

/**
 * Save or update a RuleSet. Automatically increments version number on update.
 */
export function saveRuleSet(record: Omit<RuleSetRecord, 'version' | 'updatedAt' | 'createdAt'> & { id?: string; version?: number; createdAt?: string }): RuleSetRecord {
  const currentSets = getAllRuleSets();
  const now = new Date().toISOString();

  let targetId = record.id;
  const isNew = !targetId || !currentSets.some((r) => r.id === targetId);

  if (isNew) {
    targetId = targetId || `ruleset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: RuleSetRecord = {
      id: targetId,
      clinicianId: record.clinicianId,
      childId: record.childId,
      name: record.name,
      content: record.content,
      version: 1,
      createdAt: record.createdAt || now,
      updatedAt: now,
      isSystemDefault: record.clinicianId === null && record.childId === null,
    };
    const updated = [newRecord, ...currentSets];
    if (typeof window !== 'undefined') {
      localStorage.setItem(RULESETS_STORAGE_KEY, JSON.stringify(updated));
    }
    return newRecord;
  } else {
    // Update existing and increment version
    let updatedRecord: RuleSetRecord | null = null;
    const updated = currentSets.map((existing) => {
      if (existing.id === targetId) {
        updatedRecord = {
          ...existing,
          name: record.name,
          clinicianId: record.clinicianId,
          childId: record.childId,
          content: record.content,
          version: existing.version + 1,
          updatedAt: now,
        };
        return updatedRecord;
      }
      return existing;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(RULESETS_STORAGE_KEY, JSON.stringify(updated));
    }
    return updatedRecord || currentSets[0];
  }
}

/**
 * Delete a RuleSet (unless it is the protected Global Default)
 */
export function deleteRuleSet(id: string): boolean {
  if (id === 'ruleset_global_default') return false;
  const currentSets = getAllRuleSets();
  const filtered = currentSets.filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(RULESETS_STORAGE_KEY, JSON.stringify(filtered));
  }
  return true;
}

/**
 * Reset all RuleSets to initial seed state
 */
export function resetRuleSetsToDefault(): RuleSetRecord[] {
  const initial = [GLOBAL_DEFAULT_RULESET, SAMPLE_CLINICIAN_RULESET, SAMPLE_CHILD_OVERRIDE_RULESET];
  if (typeof window !== 'undefined') {
    localStorage.setItem(RULESETS_STORAGE_KEY, JSON.stringify(initial));
  }
  return initial;
}

export interface EffectiveRuleHierarchy {
  effectiveRuleSet: RuleSetRecord;
  globalDefault: RuleSetRecord;
  clinicianOverride: RuleSetRecord | null;
  childOverride: RuleSetRecord | null;
  appliedSources: {
    allowedTopics: string;
    forbiddenTopics: string;
    escalationTriggers: string;
    toneGuidelines: string;
    ageGroupOverrides: string;
  };
}

/**
 * Core Resolver: getEffectiveRuleSet(childId, clinicianId?)
 * Implements strict precedence order:
 * GLOBAL_DEFAULT → Clinician-level override (if linked) → Child-specific override.
 * 
 * Safety Rules:
 * - Forbidden topics are UNIONED (safety-first: any forbidden topic at any tier remains forbidden).
 * - Escalation triggers are MERGED and DEDUPLICATED by pattern (if duplicate, SERIOUS severity wins).
 * - Tone guidelines and vocabulary notes take the most specific override available.
 */
export function getEffectiveRuleHierarchy(
  childId?: string | null,
  clinicianId?: string | null
): EffectiveRuleHierarchy {
  const allSets = getAllRuleSets();

  // 1. Base: Global Default
  const globalDefault =
    allSets.find((r) => r.clinicianId === null && r.childId === null) || GLOBAL_DEFAULT_RULESET;

  // 2. Clinician-level override (applicable to clinician's entire caseload)
  let clinicianOverride: RuleSetRecord | null = null;
  if (clinicianId) {
    clinicianOverride =
      allSets.find((r) => r.clinicianId === clinicianId && r.childId === null) || null;
  } else if (childId) {
    // If no explicit clinicianId provided, check if any clinician rule applies to this child's default
    clinicianOverride =
      allSets.find((r) => r.clinicianId === 'clp_clinician_01' && r.childId === null) || null;
  }

  // 3. Child-specific override
  let childOverride: RuleSetRecord | null = null;
  if (childId) {
    childOverride = allSets.find((r) => r.childId === childId) || null;
  }

  // Build merged Allowed Topics (union with duplicates removed)
  const allowedSet = new Set<string>([
    ...globalDefault.content.allowedTopics,
    ...(clinicianOverride?.content.allowedTopics || []),
    ...(childOverride?.content.allowedTopics || []),
  ]);

  // Build merged Forbidden Topics (STRICT UNION: safety-first)
  const forbiddenSet = new Set<string>([
    ...globalDefault.content.forbiddenTopics,
    ...(clinicianOverride?.content.forbiddenTopics || []),
    ...(childOverride?.content.forbiddenTopics || []),
  ]);

  // Build merged Escalation Triggers (deduplicated by pattern, SERIOUS severity prioritized)
  const triggerMap = new Map<string, EscalationTrigger>();

  // Add global triggers first
  globalDefault.content.escalationTriggers.forEach((t) => {
    triggerMap.set(t.keyword_or_pattern.trim().toLowerCase(), { ...t });
  });

  // Add/override with clinician triggers
  clinicianOverride?.content.escalationTriggers.forEach((t) => {
    const key = t.keyword_or_pattern.trim().toLowerCase();
    const existing = triggerMap.get(key);
    if (!existing || (existing.severity === 'MILD' && t.severity === 'SERIOUS')) {
      triggerMap.set(key, { ...t });
    }
  });

  // Add/override with child triggers
  childOverride?.content.escalationTriggers.forEach((t) => {
    const key = t.keyword_or_pattern.trim().toLowerCase();
    const existing = triggerMap.get(key);
    if (!existing || (existing.severity === 'MILD' && t.severity === 'SERIOUS')) {
      triggerMap.set(key, { ...t });
    }
  });

  const mergedTriggers = Array.from(triggerMap.values());

  // Tone Guidelines: Child > Clinician > Global
  let effectiveTone = globalDefault.content.toneGuidelines;
  let toneSource = 'Global Default (v' + globalDefault.version + ')';
  if (clinicianOverride?.content.toneGuidelines?.trim()) {
    effectiveTone = clinicianOverride.content.toneGuidelines;
    toneSource = 'Clinician Baseline (' + clinicianOverride.name + ' v' + clinicianOverride.version + ')';
  }
  if (childOverride?.content.toneGuidelines?.trim()) {
    effectiveTone = childOverride.content.toneGuidelines;
    toneSource = 'Child Override (' + childOverride.name + ' v' + childOverride.version + ')';
  }

  // Age Group Overrides: Merge for both SIX_TO_TEN and TEN_TO_FOURTEEN
  const ageGroups: ('SIX_TO_TEN' | 'TEN_TO_FOURTEEN')[] = ['SIX_TO_TEN', 'TEN_TO_FOURTEEN'];
  const mergedAgeOverrides: AgeGroupOverride[] = ageGroups.map((group) => {
    const glob = globalDefault.content.ageGroupOverrides.find((o) => o.ageGroup === group);
    const clin = clinicianOverride?.content.ageGroupOverrides.find((o) => o.ageGroup === group);
    const chld = childOverride?.content.ageGroupOverrides.find((o) => o.ageGroup === group);

    const vocabularyNotes =
      chld?.vocabularyNotes?.trim() ||
      clin?.vocabularyNotes?.trim() ||
      glob?.vocabularyNotes ||
      '';

    const toneNotes =
      chld?.toneNotes?.trim() ||
      clin?.toneNotes?.trim() ||
      glob?.toneNotes ||
      '';

    return {
      ageGroup: group,
      vocabularyNotes,
      toneNotes,
    };
  });

  // Calculate highest effective version or composite identifier
  const versions = [
    globalDefault.version,
    clinicianOverride?.version || 0,
    childOverride?.version || 0,
  ];
  const maxVersion = Math.max(...versions);

  const effectiveRuleSet: RuleSetRecord = {
    id: `effective_${childId || 'global'}_${Date.now()}`,
    clinicianId: clinicianId || clinicianOverride?.clinicianId || null,
    childId: childId || null,
    name: childOverride
      ? `Effective RuleSet: ${childOverride.name}`
      : clinicianOverride
      ? `Effective RuleSet: ${clinicianOverride.name}`
      : `Effective RuleSet: Global Safety Baseline`,
    version: maxVersion,
    createdAt: globalDefault.createdAt,
    updatedAt: new Date().toISOString(),
    content: {
      allowedTopics: Array.from(allowedSet),
      forbiddenTopics: Array.from(forbiddenSet),
      escalationTriggers: mergedTriggers,
      toneGuidelines: effectiveTone,
      ageGroupOverrides: mergedAgeOverrides,
    },
  };

  return {
    effectiveRuleSet,
    globalDefault,
    clinicianOverride,
    childOverride,
    appliedSources: {
      allowedTopics: `Union (${allowedSet.size} topics across ${childOverride ? 'Child + ' : ''}${clinicianOverride ? 'Clinician + ' : ''}Global)`,
      forbiddenTopics: `Strict Safety Union (${forbiddenSet.size} forbidden topics across all levels)`,
      escalationTriggers: `Deduplicated Priority Merge (${mergedTriggers.length} triggers)`,
      toneGuidelines: toneSource,
      ageGroupOverrides: childOverride
        ? `Child-Specific Adaptation (${childOverride.name})`
        : clinicianOverride
        ? `Clinician Caseload Baseline (${clinicianOverride.name})`
        : `Global Developmental Baseline`,
    },
  };
}

/**
 * Standard getEffectiveRuleSet function as requested by the spec
 */
export function getEffectiveRuleSet(childId?: string | null, clinicianId?: string | null): RuleSetRecord {
  return getEffectiveRuleHierarchy(childId, clinicianId).effectiveRuleSet;
}

/**
 * Escalation Trigger Evaluator:
 * Tests a candidate message string against a RuleSet's escalation patterns.
 */
export interface EscalationEvaluationResult {
  triggered: boolean;
  highestSeverity: EscalationSeverity | null;
  matches: {
    trigger: EscalationTrigger;
    matchedPattern: string;
    matchedSnippet: string;
  }[];
}

export function evaluateEscalation(
  messageText: string,
  ruleSet: RuleSetRecord
): EscalationEvaluationResult {
  if (!messageText || !messageText.trim()) {
    return {
      triggered: false,
      highestSeverity: null,
      matches: [],
    };
  }

  const matches: { trigger: EscalationTrigger; matchedPattern: string; matchedSnippet: string }[] = [];
  let highestSeverity: EscalationSeverity | null = null;

  for (const trigger of ruleSet.content.escalationTriggers) {
    try {
      const regex = new RegExp(`(${trigger.keyword_or_pattern})`, 'i');
      const match = messageText.match(regex);
      if (match) {
        matches.push({
          trigger,
          matchedPattern: trigger.keyword_or_pattern,
          matchedSnippet: match[0],
        });

        if (trigger.severity === 'SERIOUS') {
          highestSeverity = 'SERIOUS';
        } else if (trigger.severity === 'MILD' && highestSeverity !== 'SERIOUS') {
          highestSeverity = 'MILD';
        }
      }
    } catch {
      // Fallback simple string search if regex has special syntax errors
      const terms = trigger.keyword_or_pattern.split('|').map((s) => s.trim().toLowerCase());
      const lower = messageText.toLowerCase();
      for (const term of terms) {
        if (term && lower.includes(term)) {
          matches.push({
            trigger,
            matchedPattern: term,
            matchedSnippet: term,
          });
          if (trigger.severity === 'SERIOUS') {
            highestSeverity = 'SERIOUS';
          } else if (trigger.severity === 'MILD' && highestSeverity !== 'SERIOUS') {
            highestSeverity = 'MILD';
          }
        }
      }
    }
  }

  return {
    triggered: matches.length > 0,
    highestSeverity,
    matches,
  };
}
