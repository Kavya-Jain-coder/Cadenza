'use client';

import { useEffect } from 'react';

export default function ThemeManager() {
  useEffect(() => {
    // Force strip any stale inline CSS variables from previous dynamic themes
    const root = document.documentElement;
    const vars = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
    vars.forEach(v => root.style.removeProperty(`--dyn-theme-${v}`));
  }, []);

  return null;
}
