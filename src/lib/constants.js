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
