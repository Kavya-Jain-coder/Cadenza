'use client';

import { motion, useTransform } from 'framer-motion';

const features = [
  {
    id: 1,
    title: "AI Vocal Tuning",
    description: "Perfectly align your pitch without losing the natural emotion and timbre of your performance. Studio-grade correction in real-time.",
    tag: "VOICE ENGINE"
  },
  {
    id: 2,
    title: "Stem Separation",
    description: "Instantly isolate vocals, drums, bass, and instruments from any audio file with surgical precision.",
    tag: "PROCESSING"
  },
  {
    id: 3,
    title: "Mastering Console",
    description: "Give your tracks the final polish they deserve. Our AI mastering applies perfect EQ, compression, and limiting for a radio-ready sound.",
    tag: "FINAL MIX"
  }
];

export default function FeatureShowcase({ showcaseRef, scrollYProgress }) {
  // Translate the horizontal track based on vertical scroll
  // We map the translation to [0, 0.8] so the final card stays fully visible 
  // for the remaining 20% of the scroll before moving down!
  const x = useTransform(scrollYProgress, [0, 0.8], ["0vw", "-200vw"]);
  return (
    <section ref={showcaseRef} className="relative" style={{ height: '400vh' }}>
      {/* Sticky container that locks into place while we scroll */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center bg-transparent">
        
        {/* The horizontal track */}
        <motion.div 
          style={{ width: '300vw', x }} 
          className="flex h-full items-center"
        >
        {features.map((feature, index) => (
          <div 
            key={feature.id} 
            className="h-screen flex shrink-0 items-center justify-center p-8 md:p-24"
            style={{ width: '100vw' }}
          >
            <div className="w-full max-w-4xl glass rounded-[3rem] p-12 md:p-20 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-theme-400/30 transition-colors duration-700">
              
              {/* Subtle highlight effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-theme-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <span className="text-xs tracking-[0.4em] font-mono text-theme-400 uppercase mb-8 block relative z-10 font-bold">
                {feature.tag}
              </span>
              
              <h2 className="text-5xl md:text-6xl font-serif text-white mb-8 relative z-10 tracking-wide">
                {feature.title}
              </h2>
              
              <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed relative z-10 max-w-2xl">
                {feature.description}
              </p>
              
            </div>
          </div>
        ))}
        </motion.div>
      </div>
    </section>
  );
}
