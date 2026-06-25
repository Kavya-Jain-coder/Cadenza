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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full mb-5">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] tracking-widest font-mono text-theme-400 uppercase mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type === 'password' && showPassword ? 'text' : type}
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
              ? 'border-theme-400 focus:border-theme-300 ring-2 ring-theme-500/10'
              : 'border-white/10 hover:border-white/20'
          } ${type === 'password' ? 'pr-12' : ''}`}
          {...props}
        />

        {/* Focus Soundwave Equalizer Micro-interaction */}
        {isFocused && type !== 'password' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-end gap-[2px] h-5 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="w-[2px] bg-theme-400 rounded-full"
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

        {/* Show/Hide Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-theme-400 focus:outline-none transition-colors"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-[11px] font-mono text-red-500">{error}</p>
      )}
    </div>
  );
}
