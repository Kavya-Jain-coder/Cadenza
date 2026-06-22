'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedInput({
  label,
  type = 'text',
  id,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full mb-5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] tracking-widest font-mono text-gold-400 uppercase mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-4 py-3 bg-void/60 text-white rounded-lg border focus:outline-none transition-all duration-300 ${
            error
              ? 'border-red-500 focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20'
              : isFocused
              ? 'border-gold-400 focus:border-gold-300 ring-2 ring-gold-500/10'
              : 'border-white/10 hover:border-white/20'
          }`}
          {...props}
        />

        {/* Focus Soundwave Equalizer Micro-interaction */}
        {isFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-end gap-[2px] h-5 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-[2px] bg-gold-400 rounded-full"
                animate={{
                  height: [4, 16, 4],
                }}
                transition={{
                  duration: 0.8 + i * 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] font-mono text-red-500">{error}</p>
      )}
    </div>
  );
}
