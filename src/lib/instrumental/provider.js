import { mockGenerateInstrumental } from './mockProvider';
import { PROVIDERS } from '../config/providers';

export async function generateInstrumental(params) {
  const provider = PROVIDERS.instrumental;

  if (provider === 'mock') {
    return await mockGenerateInstrumental(params);
  }

  // Future integration of Stable Audio or MusicGen
  throw new Error(`Unsupported instrumental generator provider: ${provider}`);
}
