'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const variants = {
  'slide-right': {
    initial: { x: -80, opacity: 0, filter: 'blur(10px)', scale: 0.95 },
    animate: { x: 0, opacity: 1, filter: 'blur(0px)', scale: 1 },
    exit: { x: 80, opacity: 0, filter: 'blur(10px)', scale: 0.95 }
  },
  'slide-left': {
    initial: { x: 80, opacity: 0, filter: 'blur(10px)', scale: 0.95 },
    animate: { x: 0, opacity: 1, filter: 'blur(0px)', scale: 1 },
    exit: { x: -80, opacity: 0, filter: 'blur(10px)', scale: 0.95 }
  },
  'slide-up': {
    initial: { y: 60, opacity: 0, filter: 'blur(12px)', scale: 0.95 },
    animate: { y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 },
    exit: { y: -60, opacity: 0, filter: 'blur(12px)', scale: 0.95 }
  },
  'scale-pop': {
    initial: { scale: 0.85, opacity: 0, filter: 'blur(12px)', y: 30 },
    animate: { scale: 1, opacity: 1, filter: 'blur(0px)', y: 0 },
    exit: { scale: 1.1, opacity: 0, filter: 'blur(12px)', y: -30 }
  },
  'dissolve': {
    initial: { opacity: 0, filter: 'blur(8px)', scale: 1.02 },
    animate: { opacity: 1, filter: 'blur(0px)', scale: 1 },
    exit: { opacity: 0, filter: 'blur(8px)', scale: 0.98 }
  }
};

export default function PageTransition({ children, variant = 'slide-left', className = "" }) {
  const currentVariant = variants[variant] || variants['slide-left'];
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
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
