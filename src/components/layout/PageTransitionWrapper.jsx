'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function PageTransitionWrapper({ children }) {
  const pathname = usePathname();

  // The landing page handles its own massive 3D animations and scrolling.
  // We don't want to fade out the entire landing page Canvas abruptly.
  const isLandingPage = pathname === '/';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={isLandingPage ? false : { opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={isLandingPage ? undefined : { opacity: 0, y: -20, filter: 'blur(10px)' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
