import { GeneratedStory } from '../types';

// Ensure API configuration is available
const apiKey = process.env.API_KEY || '';
const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '') || 'https://api.openai.com';
const modelId = process.env.MODEL_ID || 'gpt-4o-mini';

export const generateStory = async (
  currentLevel: number,
  allowedWords: string[],
  targetWords: string[]
): Promise<GeneratedStory> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

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

  JSON OUTPUT RULES:
  You must output valid JSON exactly matching this structure:
  {
    "title": "A creative title",
    "content": "The story content...",
    "translation": "Natural Chinese translation...",
    "targetWordsUsed": [
      { "word": "example", "meaning": "例子", "pronunciation": "/ɪɡˈzæmpəl/" }
    ],
    "outOfScopeWords": [
      { "word": "example", "meaning": "例子", "pronunciation": "/ɪɡˈzæmpəl/" }
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
      return JSON.parse(cleanContent) as GeneratedStory;
    }
    throw new Error("No content generated.");
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};
