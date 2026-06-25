// Registry for dynamic neon themes based on active route
// We use RGB values so we can interpolate alpha in Tailwind (e.g., bg-theme-500/20)

export const THEME_PALETTES = {
  // Neon Cyan (Lyric Studio)
  cyan: {
    50: '236 254 255',
    100: '207 250 254',
    200: '165 243 252',
    300: '103 232 249',
    400: '34 211 238',
    500: '6 182 212',
    600: '8 145 178',
    700: '14 116 144',
    800: '21 94 117',
    900: '22 78 99',
    950: '8 51 68',
  },
  // Neon Purple (Instrumental Studio)
  purple: {
    50: '250 245 255',
    100: '243 232 255',
    200: '233 213 255',
    300: '216 180 254',
    400: '192 132 252',
    500: '168 85 247',
    600: '147 51 234',
    700: '126 34 206',
    800: '107 33 168',
    900: '88 28 135',
    950: '59 7 100',
  },
  // Neon Emerald/Green (Voice Studio)
  emerald: {
    50: '236 253 245',
    100: '209 250 229',
    200: '167 243 208',
    300: '110 231 183',
    400: '52 211 153',
    500: '16 185 129',
    600: '5 150 105',
    700: '4 120 87',
    800: '6 95 70',
    900: '6 78 59',
    950: '2 44 34',
  },
  // Neon Orange/Gold (Dashboard / Default)
  orange: {
    50: '255 247 237',
    100: '255 237 213',
    200: '254 215 170',
    300: '253 186 116',
    400: '251 146 60',
    500: '249 115 22',
    600: '234 88 12',
    700: '194 65 12',
    800: '154 52 18',
    900: '124 45 18',
    950: '67 20 7',
  },
  // Neon Blue (Auth)
  blue: {
    50: '239 246 255',
    100: '219 234 254',
    200: '191 219 254',
    300: '147 197 253',
    400: '96 165 250',
    500: '59 130 246',
    600: '37 99 235',
    700: '29 78 216',
    800: '30 64 175',
    900: '30 58 138',
    950: '23 37 84',
  }
};

export const ROUTE_THEMES = {
  '/auth': 'blue',
  '/auth/signup/username': 'blue',
  '/auth/signup/email': 'blue',
  '/auth/signup/password': 'blue',
  '/auth/signup/genre-pref': 'blue',
  '/auth/login/email': 'blue',
  '/auth/login/password': 'blue',
  '/studio/lyrics': 'cyan',
  '/studio/instrumental': 'purple',
  '/studio/voice': 'emerald',
  '/dashboard': 'orange',
  '/landing': 'orange',
  '/': 'cyan',
};

export function getThemeForRoute(route) {
  // Handle exact matches
  if (ROUTE_THEMES[route]) {
    return THEME_PALETTES[ROUTE_THEMES[route]];
  }
  
  // Handle prefix matches
  for (const [prefix, theme] of Object.entries(ROUTE_THEMES)) {
    if (route.startsWith(prefix) && prefix !== '/') {
      return THEME_PALETTES[theme];
    }
  }

  // Fallback to orange
  return THEME_PALETTES['orange'];
}
