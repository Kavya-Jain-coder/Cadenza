'use client';

import Link from 'next/link';
import Button from '../ui/Button';

export default function EmptyState() {
  return (
    <div className="glass-premium rounded-2xl p-8 md:p-12 text-center max-w-lg mx-auto relative overflow-hidden border border-theme-500/10 select-none">
      {/* Background illustration */}
      <div
        className="w-40 h-40 mx-auto rounded-full bg-cover bg-center border-2 border-theme-500/20 shadow-[0_0_30px_rgba(188,124,10,0.15)] mb-6 opacity-80"
        style={{ backgroundImage: 'url(/background_images/cute-possum-wearing-clothes (1).jpg)' }}
      />

      <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
        Empty Studio
      </span>
      <h2 className="font-serif text-2xl text-white mb-3">No tracks in your catalog</h2>
      <p className="text-zinc-400 text-xs md:text-sm mb-8 leading-relaxed max-w-sm mx-auto">
        Your creative slate is clean. Kick off your production journey in the Lyric Studio and build your song from scratch.
      </p>

      <div className="flex justify-center gap-3">
        <Link href="/studio/lyrics">
          <Button variant="primary">
            Start Lyrical Draft ✨
          </Button>
        </Link>
      </div>
    </div>
  );
}
