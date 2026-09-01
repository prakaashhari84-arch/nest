import { GoogleGenAI, Type } from '@google/genai';

/**
 * AI Studio Gemini Client wrapper for Nest Child Companion & Safety Classifier
 * Uses @google/genai with 'gemini-3.7-flash' as recommended by AI Studio guidelines.
 */

const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY) {
    return (window as any).GEMINI_API_KEY;
  }
  return '';
};

let genAIInstance: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

export interface AiGenerateOptions {
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: any;
}

/**
 * Generate AI text with system instruction and optional structured schema
 */
export async function generateAiText(
  prompt: string,
  options?: AiGenerateOptions
): Promise<string> {
  const client = getGenAIClient();
  const modelName = options?.model || 'gemini-3.7-flash';

  if (!client) {
    // Graceful fallback simulation when API key is not present in local test environment
    console.info('[nest:ai] No GEMINI_API_KEY detected. Executing safety-aligned rule simulation.');
    return simulateCompanionResponse(prompt, options?.systemInstruction);
  }

  try {
    const config: any = {
      systemInstruction: options?.systemInstruction,
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxOutputTokens ?? 1000,
    };

    if (options?.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }
    if (options?.responseSchema) {
      config.responseSchema = options.responseSchema;
    }

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config,
    });

    const outputText = response.text || '';
    return outputText.trim();
  } catch (error) {
    console.error('[nest:ai] Gemini API error:', error);
    // Fall back to safety simulation on network error or quota exhaustion
    return simulateCompanionResponse(prompt, options?.systemInstruction);
  }
}

/**
 * Backward compatibility alias for generateAiText
 */
export const generateGeminiText = generateAiText;


/**
 * Secondary safety classification call that evaluates text against escalation triggers
 */
export async function classifyAiEscalation(
  userMessage: string,
  triggersSummary: string
): Promise<{ severity: 'NONE' | 'MILD' | 'SERIOUS'; reason: string }> {
  const client = getGenAIClient();

  if (!client) {
    return simulateEscalationClassification(userMessage);
  }

  const systemInstruction = `You are a pediatric clinical safety classifier. Your ONLY job is to evaluate child-to-companion messages for safety and clinical distress according to these triggers:
${triggersSummary}

Rules:
- Output valid JSON only with keys: "severity" ("NONE" | "MILD" | "SERIOUS") and "reason" (a concise 1-sentence clinical explanation).
- SERIOUS: Any mentions of self-harm, wanting to die, physical/sexual abuse, domestic danger, severe hopelessness/resignation, or acute panic.
- MILD: School bullying, friend arguments, test stress, feeling lonely/sad, transient anxiety.
- NONE: Normal conversation, hobbies, stories, daily greetings, questions, or positive sharing.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Evaluate this child message for safety risk: "${userMessage}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: {
              type: Type.STRING,
              enum: ['NONE', 'MILD', 'SERIOUS'],
            },
            reason: {
              type: Type.STRING,
            },
          },
          required: ['severity', 'reason'],
        },
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.severity && ['NONE', 'MILD', 'SERIOUS'].includes(parsed.severity)) {
      return {
        severity: parsed.severity,
        reason: parsed.reason || 'Classified based on clinical trigger parameters.',
      };
    }
    return simulateEscalationClassification(userMessage);
  } catch (err) {
    console.warn('[nest:ai] Secondary classification error, using pattern fallback:', err);
    return simulateEscalationClassification(userMessage);
  }
}

/**
 * Safety-aligned fallback response simulator that strictly follows persona and safety boundaries
 */
function simulateCompanionResponse(userPrompt: string, systemInstruction?: string): string {
  const lower = userPrompt.toLowerCase();
  const sys = systemInstruction?.toLowerCase() || '';

  const isYounger = sys.includes('six_to_ten') || sys.includes('mature elder figure');
  const forbiddenMatch =
    lower.includes('diagnose') ||
    lower.includes('adhd') ||
    lower.includes('autism') ||
    lower.includes('depression') ||
    lower.includes('bipolar') ||
    lower.includes('medicine') ||
    lower.includes('pills') ||
    lower.includes('prescription') ||
    lower.includes('keep this secret');

  // Forbidden topic redirection
  if (forbiddenMatch) {
    if (isYounger) {
      return "That sounds like something really important to talk about with a caring grown-up, like your doctor, parents, or teacher. I'm here to listen and play, but they can give you the best answers! 💛 Would you like to hear a cozy story or try a balloon breath together?";
    } else {
      return "I hear you wondering about that. As an AI companion, I don't diagnose medical conditions or give clinical advice — that's something your doctor or clinician is specially trained to help with. Would you like some support talking with them about this, or should we explore ways to manage how you're feeling right now?";
    }
  }

  // Story request
  if (lower.includes('story') || sys.includes('response mode: story')) {
    if (isYounger) {
      return "Once upon a time, a brave little bear named Barnaby built a cozy spaceship out of cardboard boxes and silver glitter. He zoomed past the smiling moon and discovered a peaceful planet covered in soft marshmallow clouds. Barnaby smiled happily knowing he was always safe, loved, and ready for another grand adventure. 🌟";
    } else {
      return "Under a canopy of starlight, an ancient navigator charted a path across uncharted waters, learning that even the strongest winds eventually turn into a gentle, steady breeze. Take a deep breath and remember that every journey gets easier one step at a time.";
    }
  }

  // Encouraging words request
  if (lower.includes('encourage') || lower.includes('warm words') || sys.includes('response mode: encouraging_words')) {
    if (isYounger) {
      return "You are doing such a wonderful job being yourself today! 🌟 Whenever things feel big or noisy, remember that you are strong, kind, and cared for. I am so glad we get to be friends.";
    } else {
      return "You're handling things with a lot of strength, even when it doesn't feel like it. Give yourself credit for how far you've come today, and remember to take things one moment at a time.";
    }
  }

  // Choices / multiple choice mode
  if (lower.includes('choice') || sys.includes('response mode: gentle interactive choices')) {
    if (isYounger) {
      return "I would love to spend quiet time with you! 🌟 Here are three fun things we can do together:\n1. We can tell a gentle story about a friendly space bear.\n2. We can try three superhero belly breaths to feel nice and calm.\n3. You can tell me about your favorite animal or game!";
    }
  }

  // Sad / heavy feeling
  if (lower.includes('sad') || lower.includes('crying') || lower.includes('hurt') || lower.includes('tough') || lower.includes('lonely')) {
    if (isYounger) {
      return "I am right here with you, and it is completely okay to feel sad sometimes. 🧸 Big feelings come and go just like passing clouds in the sky. Would you like to hear a gentle story, or should we take a slow, cozy breath together?";
    } else {
      return "Thanks for being honest with me about that. Having rough days is completely normal, and you don't have to carry it all by yourself. I'm right here to listen without judgment whenever you're ready.";
    }
  }

  // School / test / stress
  if (lower.includes('school') || lower.includes('test') || lower.includes('math') || lower.includes('bus') || lower.includes('bully')) {
    if (isYounger) {
      return "School days can have tricky and noisy moments, but you are very brave for doing your best! 🌟 Let us take three slow, relaxing superhero breaths together. Breathe in nice and deep, and let it out softly.";
    } else {
      return "School situations can definitely get overwhelming and stressful. Remember you can take things one step at a time. What part of it feels like the biggest pressure right now?";
    }
  }

  // Creative / Playful / General
  if (isYounger) {
    return "That sounds wonderful, and I love hearing what is on your mind! 🌟 Would you like to hear a fun mini-adventure story, practice a cozy stretch together, or share another great idea?";
  } else {
    return "That's really interesting. It's great having space to think and talk through things. What's the next thing on your mind today?";
  }
}

/**
 * Deterministic pattern-based classification fallback
 */
function simulateEscalationClassification(userMessage: string): {
  severity: 'NONE' | 'MILD' | 'SERIOUS';
  reason: string;
} {
  const lower = userMessage.toLowerCase();

  // SERIOUS patterns
  if (
    lower.includes('hurt myself') ||
    lower.includes('kill myself') ||
    lower.includes('suicide') ||
    lower.includes('die') ||
    lower.includes('end my life') ||
    lower.includes('cutting') ||
    lower.includes('someone is hurting me') ||
    lower.includes('hitting me') ||
    lower.includes('touching me') ||
    lower.includes('abuse') ||
    lower.includes('scared of parents') ||
    lower.includes('unsafe at home') ||
    lower.includes('nobody cares if i disappear') ||
    lower.includes('run away forever')
  ) {
    return {
      severity: 'SERIOUS',
      reason: 'Triggered SERIOUS safety boundary (self-harm, domestic safety, or acute crisis indicator).',
    };
  }

  // MILD patterns
  if (
    lower.includes('bullied') ||
    lower.includes('picked on') ||
    lower.includes('mean to me') ||
    lower.includes('argument') ||
    lower.includes('failing') ||
    lower.includes('test stress') ||
    lower.includes('lonely') ||
    lower.includes('sad today') ||
    lower.includes('crying in my room') ||
    lower.includes('stomach hurts') ||
    lower.includes('hate the bus')
  ) {
    return {
      severity: 'MILD',
      reason: 'Triggered MILD situational distress indicator (peer conflict, school anxiety, or sadness).',
    };
  }

  return {
    severity: 'NONE',
    reason: 'Standard conversational content within normal supportive boundaries.',
  };
}

export default generateAiText;
