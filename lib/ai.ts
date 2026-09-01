import { GoogleGenAI, Type } from '@google/genai';

/**
 * AI Studio Gemini Client wrapper for Nest Child Companion & Safety Classifier
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
  // 1. Try serverless backend API route when running in browser
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, options }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.text === 'string' && data.text.trim()) {
          return data.text.trim();
        }
      }
    } catch (apiErr) {
      console.warn('[nest:ai] Backend API fetch warning, trying direct client/fallback:', apiErr);
    }
  }

  // 2. Direct client fallback if key is present in environment
  const client = getGenAIClient();
  const modelName = options?.model || 'gemini-2.5-flash';

  if (client) {
    try {
      const config: any = {
        systemInstruction: options?.systemInstruction,
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 600,
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
      if (outputText.trim()) {
        return outputText.trim();
      }
    } catch (error) {
      console.warn('[nest:ai] Direct Gemini API error:', error);
    }
  }

  // 3. Fallback: Contextual empathetic companion simulation
  return simulateCompanionResponse(prompt, options?.systemInstruction);
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
      model: 'gemini-2.5-flash',
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
  // Extract child's latest message even when prompt ends with "Pip:"
  const lines = userPrompt
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let userMsg = '';
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.match(/^(pip|companion|bot|assistant|nestling):\s*$/i)) {
      continue;
    }
    const clean = line.replace(/^[^:]+:\s*/, '').trim();
    if (clean) {
      userMsg = clean.toLowerCase();
      break;
    }
  }
  if (!userMsg) {
    userMsg = userPrompt.toLowerCase();
  }

  const isYounger = Boolean(
    systemInstruction?.toLowerCase().includes('six_to_ten') ||
    systemInstruction?.toLowerCase().includes('mature elder figure') ||
    systemInstruction?.toLowerCase().includes('age 6') ||
    systemInstruction?.toLowerCase().includes('age 7') ||
    systemInstruction?.toLowerCase().includes('age 8') ||
    systemInstruction?.toLowerCase().includes('age 9') ||
    systemInstruction?.toLowerCase().includes('age 10')
  );

  // Medical / Clinical Non-Diagnostic Mandates
  if (
    userMsg.includes('diagnose') ||
    userMsg.includes('adhd') ||
    userMsg.includes('autism') ||
    userMsg.includes('depression') ||
    userMsg.includes('bipolar') ||
    userMsg.includes('medicine') ||
    userMsg.includes('pills') ||
    userMsg.includes('prescription') ||
    userMsg.includes('keep this secret')
  ) {
    if (isYounger) {
      return "That sounds like something really important to talk about with a caring grown-up, like your doctor, parents, or teacher. I'm here to listen and play, but they can give you the best answers! 💛 Would you like to talk about how you're feeling right now, or try a calming breath together?";
    }
    return "I hear you asking about that. As an AI companion, I don't diagnose medical conditions or give clinical advice — that's something your doctor or clinician is specially trained to help with. Would you like some support talking with them about this?";
  }

  // Explicit story request (only if user explicitly asked for one)
  if (userMsg.includes('tell me a story') || userMsg.includes('read a story') || userMsg.startsWith('story')) {
    if (isYounger) {
      return "Once upon a time, a curious little star named Twinkle wanted to explore the cozy forest below. Floating softly down between the pine trees, Twinkle met a friendly owl who shared a warm cup of spiced cloudberry tea. Together, they looked up at the quiet night sky, feeling safe, peaceful, and warm. 🌟";
    }
    return "High in the quiet mountains, an ancient traveler reached a hidden valley where the rivers glowed with gentle starlight. Taking a deep breath, they realized that every challenging climb brings you to a peaceful view. Remember that your journey gets clearer one steady step at a time.";
  }

  // Happy / Joyful / Excited
  if (
    userMsg.includes('happy') ||
    userMsg.includes('great') ||
    userMsg.includes('good') ||
    userMsg.includes('awesome') ||
    userMsg.includes('fun') ||
    userMsg.includes('excited') ||
    userMsg.includes('yay') ||
    userMsg.includes('love')
  ) {
    if (isYounger) {
      return "Yay! That makes me so happy to hear! 🌟 What was the best part of your day, or what's making you smile so big?";
    }
    return "That's awesome! It's always great when things are going well. What's been the highlight for you today?";
  }

  // Sad / Down / Crying / Lonely
  if (
    userMsg.includes('sad') ||
    userMsg.includes('cry') ||
    userMsg.includes('crying') ||
    userMsg.includes('down') ||
    userMsg.includes('lonely') ||
    userMsg.includes('hurt') ||
    userMsg.includes('unhappy') ||
    userMsg.includes('blue')
  ) {
    if (isYounger) {
      return "I'm right here with you, and it is completely okay to feel sad sometimes. 🧸 Big feelings come and go like soft clouds in the sky. Would you like to tell me what happened, or should we take three slow, cozy belly breaths together?";
    }
    return "I'm really sorry you're feeling down right now. Having tough days is completely normal, and you don't have to carry it alone. I'm right here to listen whenever you want to share what's on your mind.";
  }

  // Angry / Mad / Frustrated
  if (
    userMsg.includes('angry') ||
    userMsg.includes('mad') ||
    userMsg.includes('annoyed') ||
    userMsg.includes('frustrated') ||
    userMsg.includes('hate') ||
    userMsg.includes('furious')
  ) {
    if (isYounger) {
      return "I hear you, and it is totally okay to feel frustrated or mad. 🌋 Let's take a deep superhero breath in... and blow all that steam out softly. What made you feel so upset?";
    }
    return "It's completely valid to feel frustrated or angry when things don't go right. Take all the time you need. If you want to vent or talk through what happened, I'm here.";
  }

  // Scared / Worried / Anxious / Nervous
  if (
    userMsg.includes('scared') ||
    userMsg.includes('afraid') ||
    userMsg.includes('worried') ||
    userMsg.includes('nervous') ||
    userMsg.includes('anxious') ||
    userMsg.includes('stress') ||
    userMsg.includes('panic')
  ) {
    if (isYounger) {
      return "You are safe right now, and I'm right here by your side. 💛 When worries feel big, we can hold hands and take slow, steady breaths together. What is on your mind?";
    }
    return "Feeling nervous or worried can be really overwhelming. Take a moment to ground yourself — you're doing the best you can. What's the main thing causing that stress right now?";
  }

  // Greetings
  if (
    userMsg === 'hi' ||
    userMsg === 'hello' ||
    userMsg === 'hey' ||
    userMsg.startsWith('hi ') ||
    userMsg.startsWith('hello ') ||
    userMsg.startsWith('hey ')
  ) {
    if (isYounger) {
      return "Hello there! It is so wonderful to see you today! 🌟 How are you feeling right now?";
    }
    return "Hey! Great to see you. How is your day going so far?";
  }

  // Jokes
  if (userMsg.includes('joke') || userMsg.includes('funny')) {
    return "Why did the little bear wear boots in space? To keep his paws warm while walking on marshmallow clouds! 🐻✨ Did that bring a little smile?";
  }

  // General conversation
  if (isYounger) {
    return "Thank you for sharing that with me! 🌟 I really enjoy talking with you. How are you feeling about that right now?";
  }
  return "Thanks for telling me about that. It's always great having space to talk through things. What's on your mind next?";
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
