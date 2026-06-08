

// Read API keys and variables
const apiKey = process.env.API_KEY || '';
const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/$/, '') || 'https://api.openai.com';
const modelId = process.env.MODEL_ID || 'gpt-4o-mini';

async function test() {
  console.log('Testing raw API request...');
  
  const systemInstruction = `You are a test agent. Output valid JSON like: {"title": "Test", "content": "Test"}`;
  const prompt = `Test me`;

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
    console.log('SUCCESS! Response:');
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
}

test();
