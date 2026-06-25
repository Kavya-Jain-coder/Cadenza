'use client';

import { useState } from 'react';
import Link from 'next/link';
import WaveformVisualizer from '../ui/WaveformVisualizer';
import Button from '../ui/Button';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function CreationCard({ creation, type, onDelete }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Holographic Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const badgeStyles = {
    lyric: 'bg-white/10 text-white',
    instrumental: 'bg-white text-black font-bold',
    track: 'bg-black text-white border border-white/20'
  };

  return (
    <motion.div 
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-[2rem] p-[1px] bg-gradient-to-br from-white/20 via-transparent to-white/5 group h-full flex flex-col"
    >
      <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
        <motion.div 
          style={{ 
            left: glareX, 
            top: glareY,
            transform: 'translate(-50%, -50%)'
          }}
          className="absolute w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
        />
      </div>

      <div className="relative bg-[#050505] rounded-[2rem] p-6 h-full flex flex-col justify-between overflow-hidden shadow-2xl">
        
        {/* Subtle abstract grain/texture */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
          {/* Card Header */}
          <div className="flex justify-between items-center mb-6">
            <span className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase ${badgeStyles[type]}`}>
              {type === 'lyric' ? 'Lyrics' : type === 'instrumental' ? 'Beat' : 'Full Mix'}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
              {formatDate(creation.created_at)}
            </span>
          </div>

          {/* Content specific to Type */}
          {type === 'lyric' && (
            <div className="mb-6">
              <h3 className="font-serif text-2xl text-white mb-2 line-clamp-1">{creation.title || 'Untitled Lyrics'}</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                {creation.genre} • {creation.mood}
              </p>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <p className="text-sm text-zinc-400 italic line-clamp-3 leading-relaxed">
                  &ldquo;{creation.seed_phrase}&rdquo;
                </p>
              </div>
            </div>
          )}

          {type === 'instrumental' && (
            <div className="mb-6">
              <h3 className="font-serif text-2xl text-white mb-2">Instrumental</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
                ID: {creation.id.substring(0, 8)}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {Array.isArray(creation.instruments) && creation.instruments.map((inst, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-sm bg-white/5 text-[9px] font-mono text-zinc-300 uppercase tracking-wider">
                    {inst.name || inst}
                  </span>
                ))}
              </div>
              <WaveformVisualizer audioUrl={creation.audio_url} />
            </div>
          )}

          {type === 'track' && (
            <div className="mb-6">
              <h3 className="font-serif text-2xl text-white mb-2">Final Mix</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-6">
                Voice: {creation.voice_archetype.replace(/-/g, ' ')}
              </p>
              <WaveformVisualizer audioUrl={creation.audio_url} />
            </div>
          )}
        </div>

        {/* Footer Card Actions */}
        <div className="relative z-10 flex gap-3 mt-auto pt-6 items-center" style={{ transform: "translateZ(30px)" }}>
          {type === 'lyric' && (
            <>
              <Link href={`/studio/instrumental?lyricId=${creation.id}`} className="flex-1">
                <button className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                  Generate Beat
                </button>
              </Link>
              <Link href={`/studio/lyrics?id=${creation.id}`} className="flex-shrink-0">
                <button className="px-4 py-3 rounded-xl border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-colors">
                  Edit
                </button>
              </Link>
            </>
          )}

          {type === 'instrumental' && (
            <Link href={`/studio/voice?instrumentalId=${creation.id}`} className="flex-1">
              <button className="w-full py-3 rounded-xl bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                Apply Vocals
              </button>
            </Link>
          )}

          {type === 'track' && (
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-[0.2em]">
              Ready for Export
            </span>
          )}

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(creation.id, type); }}
            className="p-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all ml-auto"
            aria-label="Delete creation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.24 9m4.788 0L9.24 9m4.788 0L9.24 9m12-3h-3.53l-1.07-1.912C15.632 3.262 14.887 2.75 14 2.75h-4c-.887 0-1.632.512-1.93 1.238L6.998 5.75H3.5a.75.75 0 0 0 0 1.5h17a.75.75 0 0 0 0-1.5ZM4.5 19.25A2.25 2.25 0 0 0 6.75 21.5h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5H4.5v11.75Z" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
