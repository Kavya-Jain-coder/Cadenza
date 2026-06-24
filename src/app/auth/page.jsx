'use client';

import Link from 'next/link';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import PageTransition from '@/components/layout/PageTransition';
import { motion } from 'framer-motion';

export default function WelcomeGate() {
  return (
    <PageTransition variant="scale-pop" className="flex flex-col h-full w-full relative">
      <BackgroundImage route="/auth" />
      <GoldWaveSVG speedMultiplier={1} density={2} />

      <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <motion.div 
          className="max-w-xl md:mb-12"
          initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ ease: [0.22, 1, 0.36, 1], duration: 1, delay: 0.2 }}
        >
          <span className="text-[10px] tracking-[0.3em] font-mono text-gold-400 uppercase mb-3 block drop-shadow-md">
            Welcome to Cadenza
          </span>
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-4 tracking-wide leading-tight drop-shadow-xl">
            Create Music <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-200 to-gold-400 font-normal italic">
              With AI.
            </span>
          </h1>
          <p className="text-zinc-300 text-sm md:text-base font-sans max-w-sm leading-relaxed drop-shadow-md">
            Unlock your sonic signature. Generate lyrics, design instrumentals, and synthesize vocals in our premium creative studio.
          </p>
        </motion.div>

        {/* Bottom/Right Input Region */}
        <GlassCard className="w-full max-w-sm md:mb-12 bg-obsidian/40 backdrop-blur-md border border-gold-500/20 shadow-2xl p-6">
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/signup/username"
              className="w-full py-3 rounded-lg text-xs font-mono tracking-widest uppercase bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-white font-bold border border-gold-400/20 hover:from-gold-500 hover:to-gold-400 hover:shadow-[0_4px_25px_rgba(188,124,10,0.35)] active:scale-[0.98] transition-all text-center"
            >
              I'm new here
            </Link>
            <Link
              href="/auth/login/email"
              className="w-full py-3 rounded-lg text-xs font-mono tracking-widest uppercase border border-gold-500/30 bg-white/5 text-gold-400 hover:bg-white/10 hover:border-gold-400 hover:text-white active:scale-[0.98] transition-all text-center"
            >
              I already have an account
            </Link>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}
