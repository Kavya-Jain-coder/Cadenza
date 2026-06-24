// MOCK LAYER — swap implementation by changing INSTRUMENTAL_PROVIDER in lib/config/providers.js
// TODO: replace stem library with real audio generation provider

const GENRE_STEM_FALLBACKS = {
  pop: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'hip-hop': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  rock: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'lo-fi': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  folk: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  edm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  rnb: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  jazz: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
};

export async function mockGenerateInstrumental({ genre, instruments }) {
  let index = 0;
  if (instruments && instruments.length) {
    index = instruments.map(i => i.name.charCodeAt(0)).reduce((a, b) => a + b, 0) % 8;
  } else {
    const cleanGenre = genre?.toLowerCase() || 'pop';
    const genres = Object.keys(GENRE_STEM_FALLBACKS);
    index = genres.indexOf(cleanGenre);
    if (index === -1) index = 0;
  }
  
  const audioUrls = Object.values(GENRE_STEM_FALLBACKS);
  const audioUrl = audioUrls[index];

  // Construct fake generation parameters
  const metadata = {
    generated_at: new Date().toISOString(),
    tempo: cleanGenre === 'lo-fi' || cleanGenre === 'folk' ? 'Slow (76 BPM)' : 'Fast (124 BPM)',
    instruments_applied: instruments,
    provider: 'mock'
  };

  return {
    audioUrl,
    metadata
  };
}
