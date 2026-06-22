'use client';

import Link from 'next/link';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import PageTransition from '@/components/layout/PageTransition';

export default function WelcomeGate() {
  return (
    <PageTransition variant="scale-pop" className="items-center justify-center">
      <BackgroundImage route="/auth" />
      <GoldWaveSVG speedMultiplier={1} density={2} />

      <GlassCard className="max-w-md w-full text-center relative z-10 select-none">
        <span className="text-[10px] tracking-[0.3em] font-mono text-gold-400 uppercase mb-3 block">
          Welcome to Cadenza
        </span>
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-4 tracking-wide leading-tight">
          Create Music <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-200 to-gold-400 font-normal italic">
            With AI.
          </span>
        </h1>
        <p className="text-zinc-400 text-xs md:text-sm font-sans mb-8 max-w-sm mx-auto leading-relaxed">
          Unlock your sonic signature. Generate lyrics, design instrumentals, and synthesize vocals in our premium creative studio.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signup/username"
            className="w-full py-3 rounded-lg text-xs font-mono tracking-widest uppercase bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-white font-bold border border-gold-400/20 hover:from-gold-500 hover:to-gold-400 hover:shadow-[0_4px_25px_rgba(188,124,10,0.35)] active:scale-[0.98] transition-all text-center"
          >
            I'm new here
          </Link>
          <Link
            href="/auth/login/email"
            className="w-full py-3 rounded-lg text-xs font-mono tracking-widest uppercase border border-gold-500/30 bg-void/30 text-gold-400 hover:bg-gold-500/10 hover:border-gold-400 hover:text-white active:scale-[0.98] transition-all text-center"
          >
            I already have an account
          </Link>
        </div>
      </GlassCard>
    </PageTransition>
  );
}
