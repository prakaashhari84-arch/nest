import { GoogleGenAI } from '@google/genai';

/**
 * Serverless API handler for secure Gemini AI generation
 * Reads GEMINI_API_KEY from Vercel environment variables
 */
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, options } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

    if (apiKey) {
      try {
        const client = new GoogleGenAI({ apiKey });
        const modelName = options?.model || 'gemini-2.5-flash';

        const config: any = {
          systemInstruction: options?.systemInstruction,
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 600,
        };

        if (options?.responseMimeType) {
          config.responseMimeType = options.responseMimeType;
        }

        const aiResponse = await client.models.generateContent({
          model: modelName,
          contents: prompt,
          config,
        });

        const outputText = aiResponse.text || '';
        if (outputText.trim()) {
          return res.status(200).json({
            text: outputText.trim(),
            source: 'gemini',
          });
        }
      } catch (geminiErr: any) {
        console.warn('[nest:api:ai] Gemini generation warning, using context fallback:', geminiErr?.message || geminiErr);
      }
    }

    // Fallback: Emotionally intelligent contextual generator
    const fallbackText = generateContextualReply(prompt, options?.systemInstruction);
    return res.status(200).json({
      text: fallbackText,
      source: 'fallback_engine',
    });
  } catch (error: any) {
    console.error('[nest:api:ai] Error handling AI request:', error);
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}

/**
 * Intelligent contextual companion engine for dynamic, empathetic child conversation
 */
function generateContextualReply(prompt: string, systemInstruction?: string): string {
  // Extract child's latest message if in dialogue format
  const lines = prompt.split('\n').filter((l) => l.trim().length > 0);
  const lastLine = lines[lines.length - 1] || prompt;
  const userMsg = lastLine.replace(/^[^:]+:\s*/, '').trim().toLowerCase();

  const isYounger = Boolean(systemInstruction?.toLowerCase().includes('six_to_ten') || systemInstruction?.toLowerCase().includes('mature elder figure'));

  // Medical / Diagnostic boundaries
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
      return "That sounds like something really important to talk about with a caring grown-up, like your doctor, parent, or teacher. I'm here to listen and play, but they can give you the best answers! 💛 Would you like to talk about how you're feeling right now, or try a calming breath together?";
    }
    return "I hear you asking about that. As an AI companion, I don't diagnose medical conditions or give clinical advice — that's something your doctor or clinician is specially trained to help with. Would you like some support talking with them about this?";
  }

  // Explicit story request
  if (userMsg.includes('tell me a story') || userMsg.includes('read a story') || userMsg.startsWith('story')) {
    if (isYounger) {
      return "Once upon a time, a curious little star named Twinkle wanted to explore the cozy forest below. Floating softly down between the pine trees, Twinkle met a friendly owl who shared warm cup of spiced cloudberry tea. Together, they looked up at the quiet night sky, feeling safe, peaceful, and warm. 🌟";
    }
    return "High in the quiet mountains, an ancient traveler reached a hidden valley where the rivers glowed with gentle starlight. Taking a deep breath, they realized that every challenging climb brings you to a peaceful view. Remember that your journey gets clearer one steady step at a time.";
  }

  // Happy / Joy / Excited
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

  // Scared / Worried / Anxious
  if (
    userMsg.includes('scared') ||
    userMsg.includes('afraid') ||
    userMsg.includes('worried') ||
    userMsg.includes('nervous') ||
    userMsg.includes('anxious') ||
    userMsg.includes('stress')
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

  // General conversational response
  if (isYounger) {
    return `Thank you for sharing that with me! 🌟 I'm really glad we're talking. How are you feeling about that right now?`;
  }
  return `Thanks for telling me about that. It's always great having space to talk through things. What's on your mind next?`;
}
