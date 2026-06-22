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

export async function mockGenerateInstrumental({ supabase, genre, instruments }) {
  const cleanGenre = genre?.toLowerCase() || 'pop';
  
  // 1. Attempt to resolve from Supabase Storage first (if files are uploaded)
  // Folder format: stems/{genre}.mp3
  const stemPath = `stems/${cleanGenre}.mp3`;
  
  const { data: publicUrlData } = supabase.storage
    .from('audio-stems')
    .getPublicUrl(stemPath);

  // Check if file exists by head request, otherwise fallback
  let audioUrl = publicUrlData?.publicUrl;

  try {
    const checkFile = await fetch(audioUrl, { method: 'HEAD' });
    if (!checkFile.ok) {
      audioUrl = GENRE_STEM_FALLBACKS[cleanGenre] || GENRE_STEM_FALLBACKS.pop;
    }
  } catch (e) {
    audioUrl = GENRE_STEM_FALLBACKS[cleanGenre] || GENRE_STEM_FALLBACKS.pop;
  }

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
