'use client';

import { motion } from 'framer-motion';

const variants = {
  'slide-right': {
    initial: { x: -100, opacity: 0, filter: 'blur(4px)' },
    animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: { x: 100, opacity: 0, filter: 'blur(4px)' }
  },
  'slide-left': {
    initial: { x: 100, opacity: 0, filter: 'blur(4px)' },
    animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: { x: -100, opacity: 0, filter: 'blur(4px)' }
  },
  'slide-up': {
    initial: { y: 50, opacity: 0, filter: 'blur(8px)' },
    animate: { y: 0, opacity: 1, filter: 'blur(0px)' },
    exit: { y: -50, opacity: 0, filter: 'blur(8px)' }
  },
  'scale-pop': {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
  },
  'dissolve': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }
};

export default function PageTransition({ children, variant = 'slide-left', className = "" }) {
  const currentVariant = variants[variant] || variants['slide-left'];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={currentVariant}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
      className={`w-full flex-grow flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
}
