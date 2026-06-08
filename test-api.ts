import { generateStory } from './services/aiService.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Add variables to process.env manually since Vite config is not used here
process.env.API_KEY = process.env.API_KEY || '';
process.env.API_BASE_URL = process.env.API_BASE_URL || '';
process.env.MODEL_ID = process.env.MODEL_ID || '';

async function test() {
  console.log('Testing generateStory...');
  try {
    const story = await generateStory(1, ['hello', 'world', 'cat', 'dog'], ['cat']);
    console.log('SUCCESS! Story generated:');
    console.log('Title:', story.title);
    console.log('Content preview:', story.content.substring(0, 100) + '...');
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
}
test();
