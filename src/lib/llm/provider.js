import { groqGenerate } from './groqClient';
import { PROVIDERS } from '../config/providers';

export async function generateLyrics({ systemPrompt, userPrompt, stream = false }) {
  const provider = PROVIDERS.llm;

  if (provider === 'groq') {
    return await groqGenerate({ systemPrompt, userPrompt, stream });
  }

  // Future fallback/alternative providers (like Google Gemini Free tier)
  throw new Error(`Unsupported LLM provider: ${provider}`);
}
