'use client';

import Link from 'next/link';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative py-12 px-4 sm:px-6 lg:px-8">
      <BackgroundImage route="/404" />
      <GoldWaveSVG speedMultiplier={0.3} density={1} />

      <GlassCard className="max-w-md w-full text-center relative z-10 select-none">
        <div
          className="w-32 h-32 mx-auto rounded-full bg-cover bg-center border-2 border-theme-500/20 shadow-[0_0_20px_rgba(188,124,10,0.15)] mb-6 opacity-85"
          style={{ backgroundImage: 'url(/background_images/cute-cat-indoors.jpg)' }}
        />
        
        <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
          Error 404
        </span>
        <h2 className="font-serif text-2xl text-white mb-3">Lost in the mix</h2>
        <p className="text-zinc-400 text-xs mb-8 leading-relaxed max-w-xs mx-auto">
          We couldn't find the track or studio room you are looking for. Let's get you back on frequency.
        </p>

        <Link href="/" className="inline-block w-full">
          <Button variant="primary" className="w-full">
            Back to Home
          </Button>
        </Link>
      </GlassCard>
    </div>
  );
}
