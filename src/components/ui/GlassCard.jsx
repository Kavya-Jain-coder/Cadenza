'use client';

import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = "",
  hoverGlow = false,
  animate = true,
  ...props
}) {
  const cardClasses = `glass-premium rounded-2xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden ${
    hoverGlow ? 'gold-glow-hover' : ''
  } ${className}`;

  if (!animate) {
    return (
      <div className={cardClasses} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: "-50px" }}
      exit={{ opacity: 0, y: -20, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.8, delay: 0.1 }}
      className={cardClasses}
      {...props}
    >
      {/* Premium subtle inner overlay glare */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
      {children}
    </motion.div>
  );
}
