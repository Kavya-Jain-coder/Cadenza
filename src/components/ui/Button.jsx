'use client';

import { motion } from 'framer-motion';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = "",
  disabled = false,
  ...props
}) {
  const baseClasses = "px-6 py-3 rounded-lg text-xs font-mono tracking-widest uppercase transition-all duration-300 select-none focus:outline-none flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-white font-bold border border-gold-400/20 hover:from-gold-500 hover:to-gold-400 shadow-[0_4px_20px_rgba(188,124,10,0.25)] hover:shadow-[0_4px_30px_rgba(188,124,10,0.45)] disabled:from-zinc-800 disabled:to-zinc-900 disabled:text-zinc-500 disabled:shadow-none",
    secondary: "border border-gold-500/30 bg-void/30 text-gold-400 hover:bg-gold-500/10 hover:border-gold-400 hover:text-white disabled:border-zinc-800 disabled:bg-transparent disabled:text-zinc-600",
    ghost: "text-zinc-400 hover:text-white hover:bg-white/5 disabled:hover:bg-transparent disabled:text-zinc-600"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.2 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
