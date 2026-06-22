import { mockApplyVoice } from './mockProvider';
import { PROVIDERS } from '../config/providers';

export async function applyVoice(params) {
  const provider = PROVIDERS.voice;

  if (provider === 'mock') {
    return await mockApplyVoice(params);
  }

  // Future integration of singing synthesis model API
  throw new Error(`Unsupported voice synthesis provider: ${provider}`);
}
