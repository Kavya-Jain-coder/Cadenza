'use client';

import { getBackground } from '@/lib/backgroundRegistry';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackgroundImage({ route }) {
  const bgPath = getBackground(route);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-obsidian">
      <AnimatePresence mode="wait">
        {bgPath && (
          <motion.div
            key={bgPath}
            initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            animate={{ opacity: 0.45, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgPath})` }}
          />
        )}
      </AnimatePresence>
      {/* Cinematic dark luxury gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-transparent to-obsidian/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,10,15,0.95)_90%)]" />
    </div>
  );
}
