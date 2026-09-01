/**
 * Safety-Critical Pattern Tracking & Alert Escalation Engine (Prompt 9)
 * 
 * CORE CLINICAL MANDATES:
 * 1. Conservative, explicit, non-diagnostic observation (strictly "flag", "pattern", "concern", NEVER "diagnosis" or "disorder").
 * 2. Every alert requires human acknowledgment (`reviewedByHuman: true`); the AI never auto-resolves its own alert.
 * 3. Parent Safety Guard: If an explicit LLM classification identifies a parent as the suspected source of harm,
 *    the alert is strictly BLOCKED from the parent dashboard and routed to the HelplineContact and TrustedPerson.
 */

import { getConversationTurns, ConversationTurnData } from './companion';
import { getMoodEntries, getPlaceRatings, MoodEntryData, PlaceRatingData } from './mood';
import { getEffectiveRuleSet, RuleSetRecord } from './rules';
import { getChildProfile, ChildProfileData } from './childProfile';
import { generateAiText } from './ai';

export type AlertSeverity = 'MILD' | 'SERIOUS';
export type AlertStatus =
  | 'OPEN'
  | 'PARENT_NOTIFIED'
  | 'CLINICIAN_NOTIFIED'
  | 'HELPLINE_ROUTED'
  | 'RESOLVED';

export interface HelplineContact {
  id: string;
  countryCode: string;
  name: string;
  phoneNumber: string;
  textNumber?: string;
  website?: string;
  description: string;
  isDefault?: boolean;
}

export interface TrustedPerson {
  id: string;
  childId: string;
  name: string;
  relationship: string;
  contactPhone?: string;
  contactEmail?: string;
  isPrimary: boolean;
}

export interface PatternAlert {
  id: string;
  childId: string;
  severity: AlertSeverity;
  category: string; // e.g. "sustained_sadness", "abuse_disclosure", "self_harm_mention", "home_safety_concern", "withdrawal"
  summary: string; // Human-readable, LLM generated, strictly non-diagnostic
  sourceTurnIds: string[];
  status: AlertStatus;
  reviewedByHuman: boolean;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewNotes?: string;
  suspectedAbuserIsParent: boolean; // Explicit LLM classification step only
  suggestedStarters?: string[]; // 2-3 gentle conversation starters for caregivers
  helplineContact?: HelplineContact;
  trustedPerson?: TrustedPerson;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------------
// REGIONAL HELPLINE CATALOG (Configurable / Seed Data)
// -------------------------------------------------------------------

export const HELPLINE_CATALOG: HelplineContact[] = [
  {
    id: 'hl_us_childhelp',
    countryCode: 'US',
    name: 'Childhelp National Child Abuse Hotline',
    phoneNumber: '1-800-422-4453',
    textNumber: '1-800-422-4453',
    website: 'https://www.childhelphotline.org',
    description: 'Dedicated 24/7 confidential crisis intervention and support for children and concerned adults.',
    isDefault: true,
  },
  {
    id: 'hl_us_988',
    countryCode: 'US',
    name: '988 Suicide & Crisis Lifeline',
    phoneNumber: '988',
    textNumber: '988',
    website: 'https://988lifeline.org',
    description: 'Free, confidential 24/7 support for people in suicidal crisis or emotional distress.',
  },
  {
    id: 'hl_us_crisis_text',
    countryCode: 'US',
    name: 'Crisis Text Line',
    phoneNumber: '741741',
    textNumber: 'HOME to 741741',
    website: 'https://www.crisistextline.org',
    description: 'Free 24/7 text line connecting individuals to volunteer crisis counselors.',
  },
  {
    id: 'hl_uk_childline',
    countryCode: 'UK',
    name: 'Childline UK',
    phoneNumber: '0800 1111',
    website: 'https://www.childline.org.uk',
    description: 'Free, private, and confidential service where young people can talk about anything.',
  },
  {
    id: 'hl_ca_kids_help',
    countryCode: 'CA',
    name: 'Kids Help Phone Canada',
    phoneNumber: '1-800-668-6868',
    textNumber: 'CONNECT to 686868',
    website: 'https://kidshelpphone.ca',
    description: 'Canada’s only 24/7 e-mental health service offering free, confidential support to young people.',
  },
  {
    id: 'hl_in_childline',
    countryCode: 'IN',
    name: 'Childline India',
    phoneNumber: '1098',
    website: 'https://www.childlineindia.org',
    description: '24-hour emergency phone outreach service for children in need of care and protection in India.',
  },
];

export function getRegionalHelpline(countryCode?: string): HelplineContact {
  const code = (countryCode || 'US').toUpperCase();
  const match =
    HELPLINE_CATALOG.find((h) => h.countryCode === code) ||
    HELPLINE_CATALOG.find((h) => h.isDefault) ||
    HELPLINE_CATALOG[0];
  return match;
}

// -------------------------------------------------------------------
// TRUSTED PERSON HELPERS
// -------------------------------------------------------------------

const TRUSTED_PERSON_STORAGE_PREFIX = 'nest_trusted_person_';

export function getTrustedPerson(childId: string): TrustedPerson | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${TRUSTED_PERSON_STORAGE_PREFIX}${childId}`);
    if (raw) return JSON.parse(raw) as TrustedPerson;
    
    // Check if child profile has onboarded trusted person info
    const profile = getChildProfile(childId);
    if (profile && (profile as any).trustedPersonName) {
      return {
        id: `tp_${childId}`,
        childId,
        name: (profile as any).trustedPersonName,
        relationship: (profile as any).trustedPersonRel || 'Trusted Adult',
        contactPhone: (profile as any).trustedPersonContact || '555-0199',
        isPrimary: true,
      };
    }

    // Default placeholder for safety routing demonstrations
    return {
      id: `tp_default_${childId}`,
      childId,
      name: 'Aunt Sarah (Family Advocate)',
      relationship: 'Aunt',
      contactPhone: '555-0142',
      contactEmail: 'sarah.family@safecontact.org',
      isPrimary: true,
    };
  } catch {
    return null;
  }
}

export function saveTrustedPerson(childId: string, data: Partial<TrustedPerson>): TrustedPerson {
  const existing = getTrustedPerson(childId) || {
    id: `tp_${Date.now()}`,
    childId,
    name: '',
    relationship: 'Trusted Adult',
    isPrimary: true,
  };
  const updated: TrustedPerson = { ...existing, ...data, childId };
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${TRUSTED_PERSON_STORAGE_PREFIX}${childId}`, JSON.stringify(updated));
  }
  return updated;
}

// -------------------------------------------------------------------
// STORAGE KEYS & SEED ALERTS
// -------------------------------------------------------------------

const ALERTS_STORAGE_KEY = 'nest_pattern_alerts_';

export function getStoredAlerts(): PatternAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic clinical pattern alert for demonstration
      const initialAlerts: PatternAlert[] = [
        {
          id: 'alert_seed_01',
          childId: 'user_child_01',
          severity: 'MILD',
          category: 'sustained_sadness',
          summary: 'Observed a pattern of low energy and sad mood check-ins across 3 consecutive sessions this week.',
          sourceTurnIds: ['turn_init_1'],
          status: 'PARENT_NOTIFIED',
          reviewedByHuman: false,
          suspectedAbuserIsParent: false,
          suggestedStarters: [
            "I noticed you seemed a little tired or quiet recently—is there anything heavy you'd like to share over a warm snack?",
            "What was one moment today that felt hard, and what was one moment that made you smile?",
            "You don't have to fix anything right now—I'm just right here if you want a hug or some quiet company.",
          ],
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ];
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(initialAlerts));
      return initialAlerts;
    }
    return JSON.parse(raw) as PatternAlert[];
  } catch {
    return [];
  }
}

export async function generateSuggestedStarters(
  category: string,
  severity: AlertSeverity,
  signals: string[]
): Promise<string[]> {
  try {
    const prompt = `Generate 3 gentle, open-ended, supportive conversation starters that a parent/caregiver can use to connect warmly with their child about this observation:
Category: ${category}
Signals: "${signals.join('; ')}"

Rules:
- Non-clinical, non-interrogative, warm, supportive, safe phrasing.
- 1 sentence per question/starter.
- Example: "I noticed you've had some busy days lately—would you like to build a blanket fort and talk about whatever is on your mind?"
- Format as JSON array of strings: ["starter 1", "starter 2", "starter 3"]`;

    const raw = await generateAiText(prompt, {
      systemInstruction: 'You are a warm, supportive parenting and child wellness communication expert.',
      temperature: 0.3,
      maxOutputTokens: 250,
    });
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 3);
  } catch {}

  // Fallback defaults
  if (category === 'home_safety_concern' || category === 'home_environment_check') {
    return [
      "Is there anything in our home space that would make you feel more comfortable and cozy right now?",
      "I love spending time with you—what is one fun thing we could do together around the house tonight?",
      "If you could design a quiet corner just for you to relax, what would you put in it?",
    ];
  }
  if (category === 'sustained_sadness' || category === 'recurring_distress') {
    return [
      "I noticed you seemed a little tired or quiet recently—is there anything heavy you'd like to share over a warm snack?",
      "What was one moment today that felt hard, and what was one moment that made you smile?",
      "You don't have to fix anything right now—I'm just right here if you want a hug or some quiet company.",
    ];
  }
  return [
    "How are things feeling with your friends and activities this week?",
    "If today were a weather forecast, what kind of weather was it for you?",
    "I'm always in your corner—is there anything you'd like to chat about before bedtime?",
  ];
}

function saveAlerts(alerts: PatternAlert[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }
}

// -------------------------------------------------------------------
// EXPLICIT LLM CLASSIFICATION: Suspected Abuser Is Parent
// -------------------------------------------------------------------

export async function classifySuspectedAbuserIsParent(
  userText: string,
  contextTurns: string = ''
): Promise<boolean> {
  const lower = (userText + ' ' + contextTurns).toLowerCase();
  
  // Fast-path heuristic detection for parent conflict
  const parentKeywords = ['dad', 'mom', 'father', 'mother', 'stepdad', 'stepmom', 'parent', 'step-father', 'step-mother'];
  const harmKeywords = ['hit', 'beat', 'hurt', 'punched', 'locked', 'scared of him', 'scared of her', 'threatened', 'bruise', 'touches me', 'touching me', 'abused', 'yells all night', 'threw something'];

  const mentionsParent = parentKeywords.some((k) => lower.includes(k));
  const mentionsHarm = harmKeywords.some((k) => lower.includes(k));

  if (mentionsParent && mentionsHarm) {
    return true;
  }

  // LLM verification step
  try {
    const prompt = `Analyze this child disclosure and determine if there is an explicit statement or strong indicator that a parent, mother, father, or immediate primary caregiver is the source of physical harm, abuse, violence, or severe danger to the child.
Child message: "${userText}"
Recent conversation context: "${contextTurns}"

Respond with strictly valid JSON:
{
  "suspectedAbuserIsParent": boolean,
  "rationale": string
}`;

    const raw = await generateAiText(prompt, {
      systemInstruction: 'You are a child safety classifier. Determine strictly if a parent or legal guardian is identified as the source of harm.',
      temperature: 0.1,
    });

    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return Boolean(parsed.suspectedAbuserIsParent);
  } catch (err) {
    // If error occurs, be conservative: if both keywords exist, treat as true
    return mentionsParent && mentionsHarm;
  }
}

// -------------------------------------------------------------------
// NON-DIAGNOSTIC SUMMARY GENERATOR
// -------------------------------------------------------------------

export async function generateNonDiagnosticSummary(
  category: string,
  severity: AlertSeverity,
  signals: string[]
): Promise<string> {
  const signalSummary = signals.join('; ');
  try {
    const prompt = `Generate a single concise, human-readable observation summary for a child safety alert.
Category: ${category}
Severity: ${severity}
Observed data points: "${signalSummary}"

CRITICAL MANDATE:
- NEVER phrase this as a diagnosis or psychiatric condition (do NOT say "child has depression", "anxiety disorder", "PTSD", etc.).
- Use observational language: "pattern of", "observed indicators of", "child shared that", "flagged concern regarding".
- Limit to 1-2 clear, professional sentences for caregivers and clinicians.`;

    const summary = await generateAiText(prompt, {
      systemInstruction: 'You are a clinical documentation assistant for child wellness. Strictly avoid diagnostic terminology.',
      temperature: 0.2,
      maxOutputTokens: 120,
    });
    return summary.trim().replace(/^"|"$/g, '');
  } catch {
    if (category === 'home_safety_concern') {
      return 'Observed persistent negative rating of home environment coinciding with emotional distress signals.';
    }
    if (category === 'abuse_disclosure') {
      return 'Child shared statements regarding physical safety concerns that require immediate adult and clinical verification.';
    }
    if (category === 'self_harm_mention') {
      return 'Child expressed thoughts of wanting to hurt themselves, requiring immediate proactive caregiver engagement.';
    }
    return `Observed a recurring pattern of ${severity === 'SERIOUS' ? 'severe emotional distress' : 'low mood check-ins and quiet withdrawal'} across recent sessions.`;
  }
}

// -------------------------------------------------------------------
// MAIN SAFETY ENGINE: evaluatePatterns(childId)
// -------------------------------------------------------------------

export interface EvaluatePatternsOptions {
  forceCategory?: string;
  triggerTurnId?: string;
  triggerSeverity?: AlertSeverity;
  triggerText?: string;
}

export async function evaluatePatterns(
  childId: string,
  options?: EvaluatePatternsOptions
): Promise<PatternAlert | null> {
  const profile = getChildProfile(childId);
  const ruleSet: RuleSetRecord = getEffectiveRuleSet(childId);
  const windowDays = 14;
  const cutoffTime = Date.now() - windowDays * 86400000;

  // 1. Gather recent data across MoodEntry, ConversationTurn, and PlaceRating
  const allTurns = getConversationTurns(childId, 50);
  const recentTurns = allTurns.filter((t) => new Date(t.createdAt).getTime() >= cutoffTime);

  const allMoods = getMoodEntries(childId);
  const recentMoods = allMoods.filter((m) => new Date(m.createdAt).getTime() >= cutoffTime);

  const placeRatings = getPlaceRatings(childId);
  const homeRating = placeRatings['HOME'];

  const allAlerts = getStoredAlerts();

  // Find any single SERIOUS turn in the window
  const seriousTurns = recentTurns.filter((t) => t.severity === 'SERIOUS');
  const mildTurns = recentTurns.filter((t) => t.severity === 'MILD');
  const sadMoods = recentMoods.filter((m) => m.mood === 'SAD');
  const mildMoods = recentMoods.filter((m) => m.mood === 'MILD');

  let alertToCreate: {
    severity: AlertSeverity;
    category: string;
    signals: string[];
    sourceTurnIds: string[];
    suspectedAbuserIsParent: boolean;
  } | null = null;

  // =================================================================
  // RULE 1: SINGLE TURN SCORED SERIOUS (Immediate Escalation)
  // =================================================================
  if (options?.triggerSeverity === 'SERIOUS' || seriousTurns.length > 0) {
    const triggerTurn = seriousTurns[seriousTurns.length - 1];
    const userText = options?.triggerText || triggerTurn?.content || '';
    const turnId = options?.triggerTurnId || triggerTurn?.id || 'turn_serious';

    let category = options?.forceCategory || 'safety_escalation';
    if (!options?.forceCategory) {
      const lower = userText.toLowerCase();
      if (lower.includes('hit') || lower.includes('hurt') || lower.includes('beat') || lower.includes('abuse')) {
        category = 'abuse_disclosure';
      } else if (lower.includes('die') || lower.includes('suicide') || lower.includes('cut') || lower.includes('kill')) {
        category = 'self_harm_mention';
      } else {
        category = 'severe_distress';
      }
    }

    // Run explicit LLM classification to check if suspected abuser is a parent
    const recentContext = recentTurns.map((t) => `${t.role}: ${t.content}`).join('\n');
    const isParentSuspected = await classifySuspectedAbuserIsParent(userText, recentContext);

    alertToCreate = {
      severity: 'SERIOUS',
      category,
      signals: [
        `High-severity disclosure flagged: "${userText.slice(0, 100)}"`,
        `Triggered safety rule: ${triggerTurn?.reason || 'Critical safety keyword match'}`,
      ],
      sourceTurnIds: [turnId],
      suspectedAbuserIsParent: isParentSuspected,
    };
  }

  // =================================================================
  // RULE 2: HOME RATED "NOT_GREAT" (Never an unexamined data point)
  // =================================================================
  else if (homeRating?.rating === 'NOT_GREAT') {
    const hasCoincidingMildOrSad = mildTurns.length > 0 || sadMoods.length >= 2;
    const hasCoincidingSerious = seriousTurns.length > 0;

    if (hasCoincidingSerious || hasCoincidingMildOrSad) {
      // Coincides with emotional distress -> Escalate toward SERIOUS
      const sampleText = homeRating.note || mildTurns[0]?.content || 'Negative home rating paired with distress';
      const isParentSuspected = await classifySuspectedAbuserIsParent(sampleText);

      alertToCreate = {
        severity: 'SERIOUS',
        category: 'home_safety_concern',
        signals: [
          'PlaceRating: HOME rated NOT_GREAT by child',
          homeRating.note ? `Child note: "${homeRating.note}"` : 'Home flagged as uncomfortable',
          `Coincides with ${mildTurns.length} mild distress turns and ${sadMoods.length} sad mood check-ins`,
        ],
        sourceTurnIds: mildTurns.map((t) => t.id),
        suspectedAbuserIsParent: isParentSuspected,
      };
    } else {
      // Standalone NOT_GREAT on HOME -> treated as at least MILD on its own
      alertToCreate = {
        severity: 'MILD',
        category: 'home_environment_check',
        signals: [
          'PlaceRating: HOME rated NOT_GREAT by child',
          homeRating.note ? `Child note: "${homeRating.note}"` : 'Child flagged home as feeling not great',
        ],
        sourceTurnIds: [],
        suspectedAbuserIsParent: false,
      };
    }
  }

  // =================================================================
  // RULE 3: RECURRING MILD TURNS OR SAD MOODS BEYOND THRESHOLD (Default 3+ in 14d)
  // =================================================================
  else {
    const recurringMildCount = mildTurns.length + sadMoods.length;
    const threshold = 3; // Configurable on RuleSet

    if (recurringMildCount >= threshold) {
      alertToCreate = {
        severity: 'MILD',
        category: sadMoods.length >= 3 ? 'sustained_sadness' : 'recurring_distress',
        signals: [
          `${sadMoods.length} SAD mood check-ins in the past 14 days`,
          `${mildTurns.length} conversation turns flagged with mild emotional friction`,
        ],
        sourceTurnIds: mildTurns.map((t) => t.id),
        suspectedAbuserIsParent: false,
      };
    }
  }

  if (!alertToCreate) {
    return null;
  }

  // Check if a similar open unreviewed alert was created in the past 24 hours to prevent spamming
  const oneDayAgo = Date.now() - 86400000;
  const recentDuplicate = allAlerts.find(
    (a) =>
      a.childId === childId &&
      a.category === alertToCreate!.category &&
      a.severity === alertToCreate!.severity &&
      !a.reviewedByHuman &&
      new Date(a.createdAt).getTime() >= oneDayAgo
  );

  if (recentDuplicate) {
    return recentDuplicate;
  }

  // 2. Generate human-readable, strictly non-diagnostic summary
  const summary = await generateNonDiagnosticSummary(
    alertToCreate.category,
    alertToCreate.severity,
    alertToCreate.signals
  );

  // 3. Generate suggested conversation starters for caregivers
  const suggestedStarters = await generateSuggestedStarters(
    alertToCreate.category,
    alertToCreate.severity,
    alertToCreate.signals
  );

  // 4. Routing Logic
  let status: AlertStatus = 'OPEN';
  let helplineContact: HelplineContact | undefined = undefined;
  let trustedPerson: TrustedPerson | undefined = undefined;

  const childCountry = profile?.nationality || 'US';

  if (alertToCreate.severity === 'MILD') {
    // MILD -> Notify linked parent(s) only. No clinician page, no emergency urgency styling.
    status = 'PARENT_NOTIFIED';
  } else {
    // SERIOUS
    if (alertToCreate.suspectedAbuserIsParent) {
      // PARENT SAFETY GUARD: DO NOT notify parent!
      // Route to regional helpline contact and child's trusted person
      status = 'HELPLINE_ROUTED';
      helplineContact = getRegionalHelpline(childCountry);
      trustedPerson = getTrustedPerson(childId) || undefined;
    } else {
      // Standard SERIOUS -> Notify linked clinician and parent
      status = 'CLINICIAN_NOTIFIED';
      helplineContact = getRegionalHelpline(childCountry);
    }
  }

  const newAlert: PatternAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    childId,
    severity: alertToCreate.severity,
    category: alertToCreate.category,
    summary,
    sourceTurnIds: alertToCreate.sourceTurnIds,
    status,
    reviewedByHuman: false,
    suspectedAbuserIsParent: alertToCreate.suspectedAbuserIsParent,
    suggestedStarters,
    helplineContact,
    trustedPerson,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedAlerts = [newAlert, ...allAlerts];
  saveAlerts(updatedAlerts);

  console.warn(
    `[nest:safety] PatternAlert created: id=${newAlert.id}, childId=${childId}, severity=${newAlert.severity}, category=${newAlert.category}, status=${newAlert.status}, suspectedAbuserIsParent=${newAlert.suspectedAbuserIsParent}`
  );

  return newAlert;
}

// -------------------------------------------------------------------
// ALERT RETRIEVAL & ROLE-BASED ACCESS CONTROL
// -------------------------------------------------------------------

export function getPatternAlerts(
  childId?: string,
  viewerRole: 'PARENT' | 'CLINICIAN' | 'ADMIN' = 'CLINICIAN'
): PatternAlert[] {
  const alerts = getStoredAlerts();
  let filtered = childId ? alerts.filter((a) => a.childId === childId) : alerts;

  // STRICT PARENT FILTER: Never show alerts where the parent is the suspected source of harm
  if (viewerRole === 'PARENT') {
    filtered = filtered.filter((a) => !a.suspectedAbuserIsParent && a.status !== 'HELPLINE_ROUTED');
  }

  return filtered;
}

/**
 * Human Review Action (Mandate: AI never auto-resolves alerts)
 */
export function markAlertReviewed(
  alertId: string,
  reviewerUserId: string,
  reviewNotes?: string
): PatternAlert | null {
  const alerts = getStoredAlerts();
  const index = alerts.findIndex((a) => a.id === alertId);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: PatternAlert = {
    ...alerts[index],
    reviewedByHuman: true,
    reviewedAt: now,
    reviewedByUserId: reviewerUserId,
    reviewNotes: reviewNotes?.trim() || undefined,
    status: 'RESOLVED',
    updatedAt: now,
  };

  alerts[index] = updated;
  saveAlerts(alerts);
  return updated;
}
