'use client';

import Link from 'next/link';
import BackgroundImage from '../ui/BackgroundImage';
import GoldWaveSVG from '../ui/GoldWaveSVG';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-16">
      <BackgroundImage route="/landing" />
      <GoldWaveSVG speedMultiplier={0.5} density={3} />

      <div className="max-w-3xl relative z-10 select-none">
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: 0.1 }}
          className="text-[10px] sm:text-xs tracking-[0.35em] font-mono text-theme-400 uppercase mb-4 block"
        >
          The Future of Sound Creation
        </motion.span>
        
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6, delay: 0.2 }}
          className="font-serif text-4xl sm:text-6xl md:text-7xl text-white mb-6 tracking-wide leading-tight"
        >
          Create Music <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-theme-300 via-theme-200 to-theme-400 font-normal italic">
            With AI.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: 0.3 }}
          className="text-zinc-400 text-xs sm:text-base font-sans mb-10 max-w-xl mx-auto leading-relaxed"
        >
          An elegant portfolio platform designed to compose lyrics, build high-fidelity instrumentals, and synthesize vocals under a singular premium workflow.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link
            href="/auth"
            className="px-8 py-3.5 rounded-lg text-xs font-mono tracking-widest uppercase bg-gradient-to-r from-theme-600 via-theme-500 to-theme-600 text-white font-bold border border-theme-400/20 hover:from-theme-500 hover:to-theme-400 hover:shadow-[0_4px_30px_rgba(188,124,10,0.45)] transition-all active:scale-[0.98]"
          >
            Launch Studio Free
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-lg text-xs font-mono tracking-widest uppercase border border-theme-500/20 bg-void/30 text-theme-400 hover:bg-theme-500/10 hover:border-theme-400 hover:text-white transition-all active:scale-[0.98]"
          >
            Explore Features
          </a>
        </motion.div>
      </div>
    </section>
  );
}
