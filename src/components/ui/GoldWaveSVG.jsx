'use client';

import { motion } from 'framer-motion';

export default function GoldWaveSVG({ speedMultiplier = 1, density = 3 }) {
  // Configurable wave layers
  const waves = [
    {
      d: "M 0 100 Q 250 50 500 100 T 1000 100 T 1500 100 T 2000 100",
      opacity: 0.15,
      duration: 25 / speedMultiplier,
      animateY: [0, -15, 0]
    },
    {
      d: "M 0 120 Q 300 160 600 120 T 1200 120 T 1800 120 T 2000 120",
      opacity: 0.25,
      duration: 18 / speedMultiplier,
      animateY: [0, 20, 0]
    },
    {
      d: "M 0 80 Q 200 40 400 80 T 800 80 T 1200 80 T 1600 80 T 2000 80",
      opacity: 0.1,
      duration: 35 / speedMultiplier,
      animateY: [-10, 10, -10]
    }
  ].slice(0, density);

  return (
    <div className="absolute inset-0 -z-40 overflow-hidden pointer-events-none">
      <svg
        className="w-full h-full opacity-60"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#bc7c0a" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#d69c17" stopOpacity="1" />
            <stop offset="100%" stopColor="#bc7c0a" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {waves.map((wave, idx) => (
          <motion.path
            key={idx}
            d={wave.d}
            fill="none"
            stroke="url(#theme-gradient)"
            strokeWidth="1"
            opacity={wave.opacity}
            animate={{
              y: wave.animateY,
              d: [
                wave.d,
                wave.d.replace(/100/g, "115").replace(/120/g, "105").replace(/80/g, "95"),
                wave.d
              ]
            }}
            transition={{
              duration: wave.duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
    </div>
  );
}
