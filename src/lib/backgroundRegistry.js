// Single source of truth for background image assignments.
// Every route must pull its background from here — never hardcode image paths in components.
// Validation runs in development: throws if any image is assigned to more than one route.

export const ROUTE_BACKGROUNDS = {
  '/auth':                     'electric-guitar-still-life.jpg',
  '/auth/signup/username':     'photorealistic-electric-guitar-still-life.jpg',
  '/auth/signup/email':        'view-futuristic-dj-booth.jpg',
  '/auth/signup/password':     'view-futuristic-dj-vinyl.jpg',
  '/auth/signup/genre-pref':   'view-futuristic-drums.jpg',
  '/auth/login/email':         '3d-music-related-scene.jpg',
  '/auth/login/password':      '3d-music-related-scene (4).jpg',
  '/studio/voice':             '3d-music-related-scene (5).jpg',
  '/studio/lyrics':            '3d-realistic-globe-with-musical-elements.jpg',
  '/studio/instrumental':      'party_people_dancing_on_a_bokeh_lights_background_1312.jpg',
  '/genre-select':             '3301.jpg',
  '/landing':                  'futuristic-musician-making-music-with-instrument.jpg',
  '/landing#cta':              'musician-playing-electric-guitar.jpg',
  '/landing#features':         'fantasy-dj-illustration.jpg',
  '/dashboard':                'futuristic-musician-making-music-with-instrument (1).jpg',
  '/404':                      'cute-cat-indoors.jpg',
  '/loading':                  'cute-possum-wearing-clothes.jpg',
  '/empty-state':              'cute-possum-wearing-clothes (1).jpg',
  // Reserved, unassigned:
  // 'futuristic-musician-making-music-with-instrument (2).jpg'
  // '3d-music-related-scene (1).jpg'
  // '3d-music-related-scene (2).jpg'
  // '3d-music-related-scene (3).jpg'
};

export function getBackground(route) {
  const file = ROUTE_BACKGROUNDS[route] ?? null;
  return file ? `/background_images/${file}` : null;
}

// Run in dev only — call from middleware or a layout to catch accidental duplicates early
export function validateRegistry() {
  const seen = new Set();
  for (const [route, img] of Object.entries(ROUTE_BACKGROUNDS)) {
    if (seen.has(img)) {
      throw new Error(`Background image "${img}" assigned to multiple routes: found on ${route} and another route.`);
    }
    seen.add(img);
  }
}
