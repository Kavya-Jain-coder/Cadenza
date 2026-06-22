const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CORPUS_SEEDS = [
  // ==========================================
  // POP GENRE
  // ==========================================
  {
    genre: 'pop',
    category: 'structure_template',
    content: 'Intro (4 bars) -> Verse 1 (8 bars) -> Pre-Chorus (4 bars) -> Chorus (8 bars) -> Verse 2 (8 bars) -> Pre-Chorus (4 bars) -> Chorus (8 bars) -> Bridge (8 bars) -> Chorus (8 bars) -> Outro (4 bars).'
  },
  {
    genre: 'pop',
    category: 'rhyme_pattern',
    content: 'Structure relies heavily on ABAB or AABB rhyme schemes. Keep meter lengths equal (8-10 syllables per line) to maintain rhythmic stability and hook factor.'
  },
  {
    genre: 'pop',
    category: 'vocabulary_bank',
    content: 'Neon lights, heartbeats, midnight drives, shadows on the wall, magnetic pulls, fading echoes, high tides, breaking glass, rising heat, summer rain.'
  },

  // ==========================================
  // HIP-HOP GENRE
  // ==========================================
  {
    genre: 'hip-hop',
    category: 'structure_template',
    content: 'Intro (4 bars) -> Verse 1 (16 bars) -> Chorus (8 bars) -> Verse 2 (16 bars) -> Chorus (8 bars) -> Bridge/Breakdown (8 bars) -> Verse 3 (16 bars) -> Chorus (8 bars) -> Outro (4 bars).'
  },
  {
    genre: 'hip-hop',
    category: 'rhyme_pattern',
    content: 'Focuses on internal rhyme schemes, multisyllabic rhyming, and slant rhymes. AABB or AAAA structures are common but lines should flow continuously without rigid stops.'
  },
  {
    genre: 'hip-hop',
    category: 'vocabulary_bank',
    content: 'Concrete jungle, skyscrapers, heavy bass, golden chains, grinding hours, streets talk, dynamic rhythms, shadows dancing, cold pavement, microphones.'
  },

  // ==========================================
  // ROCK GENRE
  // ==========================================
  {
    genre: 'rock',
    category: 'structure_template',
    content: 'Intro (8 bars) -> Verse 1 (8 bars) -> Chorus (8 bars) -> Verse 2 (8 bars) -> Chorus (8 bars) -> Guitar Solo (8 bars) -> Bridge (8 bars) -> Chorus (8 bars) -> Outro (8 bars).'
  },
  {
    genre: 'rock',
    category: 'rhyme_pattern',
    content: 'Employs ABCB or AABB schemes. Uses strong emphasis on the first beat of each line. Syllable count can vary slightly to create a raw, energetic vocal delivery.'
  },
  {
    genre: 'rock',
    category: 'vocabulary_bank',
    content: 'Electric thunder, raging fire, broken glass, steel strings, driving rain, wild wind, roaring engines, chains of gravity, dark horizons, spark in the dark.'
  },

  // ==========================================
  // LO-FI GENRE
  // ==========================================
  {
    genre: 'lo-fi',
    category: 'structure_template',
    content: 'Aesthetic loop format: Intro (8 bars) -> Verse 1 (8 bars) -> Refrain (4 bars) -> Verse 2 (8 bars) -> Refrain (4 bars) -> Instrumental Bridge (8 bars) -> Outro (8 bars).'
  },
  {
    genre: 'lo-fi',
    category: 'rhyme_pattern',
    content: 'AABB or freeform. Focuses on imagery and mood rather than heavy rhyme density. Short lines with space between phrases allow the ambient elements to shine.'
  },
  {
    genre: 'lo-fi',
    category: 'vocabulary_bank',
    content: 'Vinyl crackle, warm tea, raindrops on glass, quiet cafes, misty mornings, fading sunlight, shadows stretching, soft keys, paper pages, dusty memories.'
  },

  // ==========================================
  // FOLK GENRE
  // ==========================================
  {
    genre: 'folk',
    category: 'structure_template',
    content: 'Verse 1 (8 bars) -> Refrain (4 bars) -> Verse 2 (8 bars) -> Refrain (4 bars) -> Verse 3 (8 bars) -> Instrument Break (8 bars) -> Verse 4 (8 bars) -> Outro (8 bars).'
  },
  {
    genre: 'folk',
    category: 'rhyme_pattern',
    content: 'Uses traditional ABCB ballad structure. Heavy focus on narrative storytelling. Syllables follow speech-like patterns, often aligning with simple acoustic guitar picking.'
  },
  {
    genre: 'folk',
    category: 'vocabulary_bank',
    content: 'Winding rivers, oak trees, mountain winds, wooden cabins, gravel paths, ancient stones, hearth fires, calloused hands, wild birds, amber sunsets.'
  },

  // ==========================================
  // EDM GENRE
  // ==========================================
  {
    genre: 'edm',
    category: 'structure_template',
    content: 'Intro (16 bars) -> Vocal Verse 1 (8 bars) -> Build-up (8 bars) -> Drop (16 bars) -> Breakdown (8 bars) -> Vocal Verse 2 (8 bars) -> Build-up (8 bars) -> Drop (16 bars) -> Outro (16 bars).'
  },
  {
    genre: 'edm',
    category: 'rhyme_pattern',
    content: 'Minimalist repetition. AABB or ABAB. Short, powerful phrases that build tension. Syllable patterns must align with metric grid, building energy before the drop.'
  },
  {
    genre: 'edm',
    category: 'vocabulary_bank',
    content: 'Laser beams, synthetic waves, pulsing hearts, neon horizons, electric storm, sound waves rising, weightless dreams, infinite space, cosmic frequency.'
  },

  // ==========================================
  // R&B GENRE
  // ==========================================
  {
    genre: 'rnb',
    category: 'structure_template',
    content: 'Intro (4 bars) -> Verse 1 (8 bars) -> Pre-Chorus (4 bars) -> Chorus (8 bars) -> Verse 2 (8 bars) -> Pre-Chorus (4 bars) -> Chorus (8 bars) -> Bridge (8 bars) -> Chorus (12 bars) -> Outro (4 bars).'
  },
  {
    genre: 'rnb',
    category: 'rhyme_pattern',
    content: 'Uses complex rhyme structures, rich internal rhyming, and melismatic phrasing. ABAB or AABB, but vocal delivery stretches across lines with syncopation.'
  },
  {
    genre: 'rnb',
    category: 'vocabulary_bank',
    content: 'Midnight blues, velvet sheets, sweet melodies, slow burning, golden sunsets, heavy heart, promises kept, soft whisper, burning candle, gentle breeze.'
  },

  // ==========================================
  // JAZZ GENRE
  // ==========================================
  {
    genre: 'jazz',
    category: 'structure_template',
    content: 'AABA Standard Form: Verse A (8 bars) -> Verse A (8 bars) -> Bridge B (8 bars) -> Verse A (8 bars) -> Instrumental Solos (32 bars) -> Outro Chorus (8 bars).'
  },
  {
    genre: 'jazz',
    category: 'rhyme_pattern',
    content: 'Extremely sophisticated AABA layout. Uses rich metaphors and wordplay. Syllables match complex swing or syncopated rhythms.'
  },
  {
    genre: 'jazz',
    category: 'vocabulary_bank',
    content: 'Blue notes, smoky air, saxophones playing, late night whispers, rainy streets, coffee cups, wandering stars, neon reflections, syncopated hearts.'
  }
];

async function seed() {
  console.log('Seeding lyric grounding corpus...');

  // Delete existing seeds
  const { error: deleteError } = await supabase
    .from('lyric_corpus')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.error('Error clearing corpus table:', deleteError.message);
    process.exit(1);
  }

  // Insert seeds
  const { data, error } = await supabase
    .from('lyric_corpus')
    .insert(CORPUS_SEEDS.map(item => ({
      ...item,
      embedding: null // Since we're using keyword/column fallback, we don't need vectors generated
    })));

  if (error) {
    console.error('Error seeding corpus:', error.message);
    process.exit(1);
  }

  console.log('Successfully seeded lyric grounding corpus!');
}

seed();
