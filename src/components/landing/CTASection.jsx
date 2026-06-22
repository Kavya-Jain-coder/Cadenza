'use client';

import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="relative py-32 px-4 text-center overflow-hidden flex items-center justify-center min-h-[50vh]">
      {/* Background Image specific to CTA section */}
      <div
        className="absolute inset-0 bg-cover bg-center -z-20 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'url(/background_images/musician-playing-electric-guitar.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/70 to-obsidian -z-10" />

      <div className="max-w-2xl relative z-10 select-none">
        <span className="text-[10px] tracking-[0.3em] font-mono text-gold-400 uppercase mb-3 block">
          Get Started
        </span>
        <h2 className="font-serif text-3xl md:text-5xl text-white mb-6 tracking-wide">
          Ready to sound unique?
        </h2>
        <p className="text-zinc-400 text-xs md:text-sm mb-10 leading-relaxed max-w-md mx-auto">
          Sign up to save creations in your personal database. Build, listen, and extend your portfolio tracks entirely on our free tier.
        </p>
        <Link
          href="/auth"
          className="px-10 py-4 rounded-lg text-xs font-mono tracking-widest uppercase bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-white font-bold border border-gold-400/20 hover:from-gold-500 hover:to-gold-400 hover:shadow-[0_4px_30px_rgba(188,124,10,0.45)] transition-all active:scale-[0.98] inline-block"
        >
          Create Free Account
        </Link>
      </div>
    </section>
  );
}
