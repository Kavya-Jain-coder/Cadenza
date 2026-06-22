export const PROVIDERS = {
  llm: process.env.LLM_PROVIDER || 'groq', // 'groq' | 'gemini'
  instrumental: process.env.INSTRUMENTAL_PROVIDER || 'mock', // 'mock'
  voice: process.env.VOICE_PROVIDER || 'mock' // 'mock'
};
