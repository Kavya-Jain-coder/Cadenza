'use client';

export default function Footer() {
  return (
    <footer className="bg-void/80 border-t border-white/5 py-8 text-center select-none z-10 relative">
      <div className="max-w-7xl mx-auto px-4 text-[9px] font-mono tracking-widest text-zinc-500 uppercase flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          © {new Date().getFullYear()} CADENZA PLATFORM. ALL RIGHTS RESERVED.
        </div>
        <div className="flex gap-4">
          <span>FREE PORTFOLIO DEMO</span>
          <span className="text-zinc-700">•</span>
          <span>CC0 SOUND LIBRARY</span>
        </div>
      </div>
    </footer>
  );
}
