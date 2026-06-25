'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MockBadge({ text = "Mocked Preview", tooltip = "This feature uses pre-selected templates for demonstration purposes. Full AI generation integration coming soon." }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block z-10">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className="px-2 py-0.5 text-[9px] tracking-widest font-mono text-theme-300 bg-theme-950/40 border border-theme-500/30 rounded-full hover:bg-theme-900/60 hover:border-theme-400/50 transition-colors duration-200 uppercase"
      >
        {text}
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-void/95 border border-theme-500/20 text-white text-[10px] rounded-lg shadow-xl text-center backdrop-blur-md"
          >
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-void" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
