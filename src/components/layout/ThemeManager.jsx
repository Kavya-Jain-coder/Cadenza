'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getThemeForRoute } from '@/lib/themeRegistry';

export default function ThemeManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    
    const theme = getThemeForRoute(pathname);
    
    // Inject the theme into the root document as CSS variables
    const root = document.documentElement;
    
    Object.entries(theme).forEach(([shade, rgbValue]) => {
      root.style.setProperty(`--dyn-theme-${shade}`, rgbValue);
    });
  }, [pathname]);

  return null; // This component doesn't render anything visible
}
