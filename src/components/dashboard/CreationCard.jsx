'use client';

import { useState } from 'react';
import Link from 'next/link';
import WaveformVisualizer from '../ui/WaveformVisualizer';
import Button from '../ui/Button';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

export default function CreationCard({ creation, type, onDelete, isSelected, onToggleSelect }) {
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

  const handleDownloadDocx = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: creation.title || 'Untitled Lyrics',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Genre: ${creation.genre || 'N/A'} | Mood: ${creation.mood || 'N/A'}`,
                  italics: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            ...(creation.sections || []).flatMap(section => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `[${(section.type || 'SECTION').toUpperCase()}]`,
                    bold: true,
                  })
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.content || '',
                  })
                ]
              }),
              new Paragraph({ text: "" })
            ])
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${creation.title || 'Lyrics'}.docx`);
    } catch (err) {
      console.error("Error generating docx:", err);
    }
  };

  const handleDownloadMp3 = () => {
    if (creation.audio_url) {
      saveAs(creation.audio_url, `${type === 'instrumental' ? 'Beat' : 'FinalMix'}_${creation.id.substring(0, 6)}.mp3`);
    }
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
      className={`relative rounded-[2rem] p-[1px] bg-gradient-to-br from-theme-400/30 via-transparent to-theme-600/10 group h-full flex flex-col hover:theme-glow-hover transition-shadow duration-300 ${isSelected ? 'theme-glow' : ''}`}
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

      <div className={`relative glass-premium rounded-[2rem] p-6 h-full flex flex-col justify-between overflow-hidden shadow-2xl transition-colors ${isSelected ? 'bg-theme-900/40 border-theme-500/50' : ''}`}>
        
        {/* Subtle abstract grain/texture */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
          {/* Card Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {onToggleSelect && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(creation.id); }}
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-theme-500 border-theme-500 text-white' : 'border-white/20 hover:border-white/50 text-transparent'}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-[9px] font-mono tracking-widest uppercase ${badgeStyles[type]}`}>
                {type === 'lyric' ? 'Lyrics' : type === 'instrumental' ? 'Beat' : 'Full Mix'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-theme-300 tracking-wider">
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
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadMp3(); }}
              className="flex-1 py-3 rounded-xl bg-theme-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-theme-400 transition-colors shadow-[0_0_15px_rgba(var(--dyn-theme-500),0.5)]"
            >
              Export MP3
            </button>
          )}

          <div className="flex gap-2 ml-auto">
            {type === 'lyric' && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadDocx(); }}
                className="p-3 rounded-xl text-zinc-500 hover:text-theme-400 hover:bg-theme-500/10 border border-transparent hover:border-theme-500/30 transition-all"
                aria-label="Download DOCX"
                title="Download as DOCX"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}

            {(type === 'instrumental' || type === 'track') && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadMp3(); }}
                className="p-3 rounded-xl text-zinc-500 hover:text-theme-400 hover:bg-theme-500/10 border border-transparent hover:border-theme-500/30 transition-all"
                aria-label="Download MP3"
                title="Download as MP3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(creation.id, type); }}
              className="p-3 rounded-xl text-zinc-500 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition-all"
              aria-label="Delete creation"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.24 9m4.788 0L9.24 9m4.788 0L9.24 9m12-3h-3.53l-1.07-1.912C15.632 3.262 14.887 2.75 14 2.75h-4c-.887 0-1.632.512-1.93 1.238L6.998 5.75H3.5a.75.75 0 0 0 0 1.5h17a.75.75 0 0 0 0-1.5ZM4.5 19.25A2.25 2.25 0 0 0 6.75 21.5h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5H4.5v11.75Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
