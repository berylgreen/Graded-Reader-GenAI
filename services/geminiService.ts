import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedStory } from '../types';

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative title for the story." },
    content: { 
      type: Type.STRING, 
      description: "The story content. Target vocabulary words (from the current level) must be wrapped in [square brackets]. Out-of-scope words (not in the allowed list) must be wrapped in {curly braces}. The story should be around 100-150 words." 
    },
    translation: { type: Type.STRING, description: "A natural Chinese translation of the story." },
    targetWordsUsed: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          meaning: { type: Type.STRING, description: "The concise Chinese meaning of the word specifically as it is used in this story context." },
          pronunciation: { type: Type.STRING, description: "IPA pronunciation (e.g., /wɜːrd/)." }
        },
        required: ["word", "meaning", "pronunciation"]
      },
      description: "List of words from the target level that were actually used in the story."
    },
    outOfScopeWords: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          meaning: { type: Type.STRING, description: "The concise Chinese meaning of the word specifically as it is used in this story context." },
          pronunciation: { type: Type.STRING, description: "IPA pronunciation (e.g., /wɜːrd/)." }
        },
        required: ["word", "meaning", "pronunciation"]
      },
      description: "List of words used that were not in the allowed vocabulary list."
    }
  },
  required: ["title", "content", "translation", "targetWordsUsed", "outOfScopeWords"]
};

export const generateStory = async (
  currentLevel: number,
  allowedWords: string[],
  targetWords: string[]
): Promise<GeneratedStory> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const modelId = 'gemini-2.5-flash';

  const systemInstruction = `You are an expert English teacher specializing in Graded Readers. 
  Your task is to write a short, engaging story suitable for a student at Level ${currentLevel}.
  
  VOCABULARY RULES:
  1. You generally should only use words from the "Allowed Vocabulary" list provided below.
  2. You MUST prioritize using words from the "Target Vocabulary" (Level ${currentLevel}) list to help the student learn them.
  3. If you absolutely must use a word that is NOT in the "Allowed Vocabulary" to make the story make sense, you are allowed to, but it is considered "Out-of-Scope".
  
  FORMATTING RULES:
  - When you use a word from the "Target Vocabulary" list, wrap it in square brackets like this: [word].
  - When you use an "Out-of-Scope" word (one that is NOT in the Allowed Vocabulary list), wrap it in curly braces like this: {word}.
  - Do not mark words from previous levels (Allowed but not Target).
  
  DATA OUTPUT RULES:
  - For 'targetWordsUsed' and 'outOfScopeWords', you must provide:
    - The word itself.
    - The IPA pronunciation.
    - The Chinese meaning specifically appropriate for how the word is used in this story (contextual meaning).

  Output valid JSON.
  `;

  const prompt = `
  Target Vocabulary (Level ${currentLevel}): ${targetWords.join(', ')}
  
  Allowed Vocabulary (Level 1-${currentLevel}): ${allowedWords.join(', ')}
  
  Write a story using these constraints.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedStory;
    }
    throw new Error("No content generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};