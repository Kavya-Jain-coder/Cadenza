import { mockApplyVoice } from './mockProvider';
import { PROVIDERS } from '../config/providers';

export async function applyVoice(params) {
  const provider = PROVIDERS.voice;

  if (provider === 'mock') {
    return await mockApplyVoice(params);
  }

  if (params.audioDataUrl || provider === 'browser-mix') {
    // Browser-mix: the actual mixing happens client-side.
    // The API route just saves the pre-mixed audio data URL that the client sends.
    return {
      audioUrl: params.audioDataUrl || '',
      metadata: {
        synthesized_at: new Date().toISOString(),
        provider: 'browser-mix',
        effectsApplied: params.effectsApplied || {}
      }
    };
  }

  // Future integration of singing synthesis model API
  throw new Error(`Unsupported voice synthesis provider: ${provider}`);
}
