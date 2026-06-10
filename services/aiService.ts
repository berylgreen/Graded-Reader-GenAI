import { GeneratedStory } from '../types';
import { z } from 'zod';

const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
});

const VocabItemSchema = z.object({
  word: z.string(),
  meaning: z.string(),
  pronunciation: z.string(),
  count: z.number().optional(),
});

const GeneratedStorySchema = z.object({
  title: z.string(),
  content: z.string(),
  targetWordsUsed: z.array(VocabItemSchema),
  outOfScopeWords: z.array(VocabItemSchema),
  quiz: z.array(QuizQuestionSchema),
});

// Ensure API configuration is available
const apiKey = process.env.API_KEY || '';
const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '') || 'https://api.openai.com';
const modelId = process.env.MODEL_ID || 'gpt-4o-mini';

// TTS API configuration (fallbacks to main API config if not specified)
const ttsApiKey = process.env.TTS_API_KEY || apiKey;
const ttsApiBaseUrl = process.env.TTS_API_BASE_URL?.trim().replace(/\/$/, '') || 'https://api.openai.com';

export const generateStory = async (
  currentLevel: number,
  allowedWords: string[],
  targetWords: string[]
): Promise<GeneratedStory> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  // Dynamic Word Count (Spec 6)
  const targetWordCount = Math.min(currentLevel * 15 + 50, 400);

  // Dynamic Grammar Rules (Spec 1)
  let grammarRules = "Use extremely simple sentences (SVO). Use ONLY present and past simple tenses. Strictly NO complex clauses.";
  if (currentLevel > 3 && currentLevel <= 6) {
    grammarRules = "You may use simple compound sentences and basic continuous tenses. Keep sentence structures straightforward.";
  } else if (currentLevel > 6) {
    grammarRules = "You may use varied sentence structures and common tenses appropriate for an intermediate learner.";
  }

  const systemInstruction = `You are an expert English teacher specializing in Graded Readers. 
  Your task is to write a short, engaging story suitable for a student at Level ${currentLevel}.
  
  VOCABULARY RULES:
  1. You generally should only use words from the "Allowed Vocabulary" list provided below.
  2. You MUST prioritize using words from the "Target Vocabulary" (Level ${currentLevel}) list to help the student learn them.
  3. You are ALLOWED to use common morphological variants of the allowed words (e.g., plurals, -ed, -ing forms).
  4. If you absolutely must use a word that is NOT in the "Allowed Vocabulary" to make the story make sense, you are allowed to, but it is considered "Out-of-Scope".
  
  GRAMMAR RULES:
  ${grammarRules}

  STORY LENGTH:
  Aim for approximately ${targetWordCount} words.
  
  FORMATTING RULES:
  - Do NOT wrap words in brackets or braces. Output the story text naturally as pure text.
  
  DATA OUTPUT RULES:
  - For 'targetWordsUsed' and 'outOfScopeWords', you must provide:
    - The base word itself.
    - The IPA pronunciation.
    - The Chinese meaning specifically appropriate for how the word is used in this story (contextual meaning).
  - Generate 2 to 3 multiple-choice reading comprehension questions based on the story.

  JSON OUTPUT RULES:
  You must output valid JSON exactly matching this structure:
  {
    "title": "A creative title",
    "content": "The story content in pure natural text...",
    "targetWordsUsed": [
      { "word": "example", "meaning": "例子", "pronunciation": "/ɪɡˈzæmpəl/" }
    ],
    "outOfScopeWords": [
      { "word": "example", "meaning": "例子", "pronunciation": "/ɪɡˈzæmpəl/" }
    ],
    "quiz": [
      {
        "question": "What is the main topic?",
        "options": ["A", "B", "C", "D"],
        "answer": "A"
      }
    ]
  }
  `;

  const prompt = `
  Target Vocabulary (Level ${currentLevel}): ${targetWords.join(', ')}
  
  Allowed Vocabulary (Level 1-${currentLevel}): ${allowedWords.join(', ')}
  
  Write a story using these constraints and output as JSON.
  `;

  try {
    const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      let cleanContent = content;
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }
      const parsedJson = JSON.parse(cleanContent);
      
      try {
        const validatedStory = GeneratedStorySchema.parse(parsedJson);
        return validatedStory;
      } catch (validationError: any) {
        console.error("Zod Validation Error:", validationError);
        throw new Error(`AI generated malformed data: ${validationError.message}`);
      }
    }
    throw new Error("No content generated.");
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<Blob> => {
  if (!ttsApiKey) {
    throw new Error("TTS API Key is missing. Please check your environment configuration.");
  }
  
  try {
    const response = await fetch(`${ttsApiBaseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ttsApiKey}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova',
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API Request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("TTS API Error:", error);
    throw error;
  }
};
