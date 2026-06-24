export const GENRES = [
  { id: 'pop', name: 'Pop', icon: '🎵' },
  { id: 'hip-hop', name: 'Hip-Hop', icon: '🎤' },
  { id: 'rock', name: 'Rock', icon: '🎸' },
  { id: 'lo-fi', name: 'Lo-Fi', icon: '☕' },
  { id: 'folk', name: 'Folk', icon: '🪕' },
  { id: 'edm', name: 'EDM', icon: '⚡' },
  { id: 'rnb', name: 'R&B', icon: '🎷' },
  { id: 'jazz', name: 'Jazz', icon: '🎺' }
];

export const INSTRUMENTS = [
  { id: 'drums', name: 'Drums', icon: '🥁' },
  { id: 'guitar', name: 'Guitar', icon: '🎸' },
  { id: 'piano', name: 'Piano', icon: '🎹' },
  { id: 'synth', name: 'Synth', icon: '🎛️' },
  { id: 'strings', name: 'Strings', icon: '🎻' },
  { id: 'ambient-pads', name: 'Ambient Pads', icon: '🌊' },
  { id: 'bass', name: 'Bass', icon: '🔊' }
];

export const VOICE_ARCHETYPES = [
  { id: 'warm-male-alto', name: 'Warm Male Alto', icon: '🎤', description: 'Smooth, warm mid-range male voice' },
  { id: 'powerful-female-belt', name: 'Powerful Female Belt', icon: '🎙️', description: 'Strong, projecting female vocal' },
  { id: 'raspy-indie-tenor', name: 'Raspy Indie Tenor', icon: '🎸', description: 'Textured, raw indie male voice' },
  { id: 'soft-breathy-falsetto', name: 'Soft Breathy Falsetto', icon: '✨', description: 'Ethereal, airy high-register voice' },
  { id: 'deep-narrator-bass', name: 'Deep Narrator Bass', icon: '🔊', description: 'Rich, resonant low male voice' }
];

// Motion language transitions
export const EASINGS = {
  primary: [0.22, 1, 0.36, 1], // easeOutQuint
  accent: [0.34, 1.56, 0.64, 1] // easeOutBack (overshoot)
};

export const TRANSITIONS = {
  primary: {
    ease: EASINGS.primary,
    duration: 0.5
  },
  accent: {
    ease: EASINGS.accent,
    duration: 0.25
  }
};

export const VOICE_EFFECTS_PRESETS = [
  {
    id: 'studio-warmth',
    name: 'Studio Warmth',
    icon: '🎙️',
    reverbAmount: 0.25,
    eqLow: 3,
    eqMid: 1,
    eqHigh: -2,
    compression: true,
    pitchShift: 0,
    dryWet: 0.35
  },
  {
    id: 'concert-hall',
    name: 'Concert Hall',
    icon: '🏛️',
    reverbAmount: 0.7,
    eqLow: -1,
    eqMid: 2,
    eqHigh: 3,
    compression: true,
    pitchShift: 0,
    dryWet: 0.6
  },
  {
    id: 'lofi-radio',
    name: 'Lo-Fi Radio',
    icon: '📻',
    reverbAmount: 0.15,
    eqLow: 4,
    eqMid: -3,
    eqHigh: -6,
    compression: false,
    pitchShift: 0,
    dryWet: 0.2
  },
  {
    id: 'raw-unprocessed',
    name: 'Raw & Clean',
    icon: '🔈',
    reverbAmount: 0,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    compression: false,
    pitchShift: 0,
    dryWet: 0
  }
];
