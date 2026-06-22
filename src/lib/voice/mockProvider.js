// MOCK LAYER — swap implementation by changing VOICE_PROVIDER in lib/config/providers.js
// TODO: replace with open-source singing synthesis model

const ARCHETYPE_FALLBACK_URLS = {
  'warm-male-alto': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'powerful-female-belt': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
  'raspy-indie-tenor': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
  'soft-breathy-falsetto': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
  'deep-narrator-bass': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
};

export async function mockApplyVoice({ supabase, voiceArchetype }) {
  // 1. Attempt to resolve from Supabase Storage first (if files are uploaded)
  // Folder format: voices/{archetype}.mp3
  const voicePath = `voices/${voiceArchetype}.mp3`;
  
  const { data: publicUrlData } = supabase.storage
    .from('voice-samples')
    .getPublicUrl(voicePath);

  let audioUrl = publicUrlData?.publicUrl;

  try {
    const checkFile = await fetch(audioUrl, { method: 'HEAD' });
    if (!checkFile.ok) {
      audioUrl = ARCHETYPE_FALLBACK_URLS[voiceArchetype] || ARCHETYPE_FALLBACK_URLS['warm-male-alto'];
    }
  } catch (e) {
    audioUrl = ARCHETYPE_FALLBACK_URLS[voiceArchetype] || ARCHETYPE_FALLBACK_URLS['warm-male-alto'];
  }

  const metadata = {
    synthesized_at: new Date().toISOString(),
    archetype: voiceArchetype,
    provider: 'mock'
  };

  return {
    audioUrl,
    metadata
  };
}
