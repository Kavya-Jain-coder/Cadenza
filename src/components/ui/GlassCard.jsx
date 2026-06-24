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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
      className={cardClasses}
      {...props}
    >
      {/* Premium subtle inner overlay glare */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
      {children}
    </motion.div>
  );
}
