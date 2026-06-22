'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgColors = {
    success: 'border-gold-500/30 bg-void/90 text-gold-300 shadow-[0_4px_24px_rgba(188,124,10,0.15)]',
    error: 'border-red-500/30 bg-red-950/20 text-red-400 shadow-[0_4px_24px_rgba(239,68,68,0.15)]',
    info: 'border-blue-500/30 bg-blue-950/20 text-blue-400 shadow-[0_4px_24px_rgba(59,130,246,0.15)]'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ ease: [0.34, 1.56, 0.64, 1], duration: 0.3 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md text-xs font-mono tracking-wider ${bgColors[type]}`}
          >
            {type === 'success' && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gold-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
            {type === 'error' && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            )}
            {type === 'info' && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.085 1.085l-.04.04m-2.113.375h.008a.014.014 0 1 1 0 .028h-.008a.014.014 0 0 1 0-.028ZM9 12a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
              </svg>
            )}
            <span>{message}</span>
            <button
              onClick={onClose}
              className="ml-2 text-zinc-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
