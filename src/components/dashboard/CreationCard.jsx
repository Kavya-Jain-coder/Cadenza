'use client';

import { useState } from 'react';
import Link from 'next/link';
import WaveformVisualizer from '../ui/WaveformVisualizer';
import Button from '../ui/Button';

export default function CreationCard({ creation, type, onDelete }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const badgeColors = {
    lyric: 'border-theme-500/20 bg-theme-950/20 text-theme-300',
    instrumental: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-300',
    track: 'border-blue-500/20 bg-blue-950/20 text-blue-300'
  };

  return (
    <div className="glass-premium rounded-xl p-5 border border-theme-500/10 flex flex-col justify-between hover:border-theme-500/30 transition-all select-none">
      <div>
        {/* Card Header */}
        <div className="flex justify-between items-center mb-3">
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest border uppercase ${badgeColors[type]}`}>
            {type === 'lyric' ? 'Lyrics' : type === 'instrumental' ? 'Beat' : 'Full Mix'}
          </span>
          <span className="text-[9px] font-mono text-zinc-500">
            {formatDate(creation.created_at)}
          </span>
        </div>

        {/* Content specific to Type */}
        {type === 'lyric' && (
          <div className="mb-4">
            <h3 className="font-serif text-lg text-white mb-1 line-clamp-1">{creation.title || 'Untitled Lyrics'}</h3>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
              Genre: {creation.genre} • Mood: {creation.mood}
            </p>
            <p className="text-xs text-zinc-400 italic line-clamp-3">
              "{creation.seed_phrase}"
            </p>
          </div>
        )}

        {type === 'instrumental' && (
          <div className="mb-4">
            <h3 className="font-serif text-lg text-white mb-1">
              Instrumental Beat
            </h3>
            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-3">
              ID: {creation.id.substring(0, 8)}
            </p>
            
            {/* Active instruments list */}
            <div className="flex flex-wrap gap-1 mb-4">
              {Array.isArray(creation.instruments) && creation.instruments.map((inst, idx) => (
                <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-mono text-zinc-300 uppercase">
                  {inst.name || inst}
                </span>
              ))}
            </div>

            {/* Visual Waveform player */}
            <WaveformVisualizer audioUrl={creation.audio_url} />
          </div>
        )}

        {type === 'track' && (
          <div className="mb-4">
            <h3 className="font-serif text-lg text-white mb-1">
              Final Combined Mix
            </h3>
            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mb-2">
              Voice: {creation.voice_archetype.replace(/-/g, ' ')}
            </p>
            
            <div className="mb-4">
              <WaveformVisualizer audioUrl={creation.audio_url} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Card Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-white/5 items-center">
        {type === 'lyric' && (
          <>
            <Link href={`/studio/instrumental?lyricId=${creation.id}`} className="flex-1">
              <Button variant="secondary" className="w-full py-2">
                Generate Beat
              </Button>
            </Link>
            <Link href={`/studio/lyrics?id=${creation.id}`} className="flex-grow-0">
              <Button variant="ghost" className="py-2 px-3 text-[10px] font-mono">
                Edit
              </Button>
            </Link>
          </>
        )}

        {type === 'instrumental' && (
          <Link href={`/studio/voice?instrumentalId=${creation.id}`} className="flex-1">
            <Button variant="secondary" className="w-full py-2">
              Apply Vocals
            </Button>
          </Link>
        )}

        {type === 'track' && (
          <span className="text-[8px] font-mono text-theme-400 uppercase tracking-widest">
            Production Complete
          </span>
        )}

        <button
          onClick={() => onDelete(creation.id, type)}
          className="p-2 text-zinc-500 hover:text-red-400 transition-colors ml-auto"
          aria-label="Delete creation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.24 9m4.788 0L9.24 9m4.788 0L9.24 9m12-3h-3.53l-1.07-1.912C15.632 3.262 14.887 2.75 14 2.75h-4c-.887 0-1.632.512-1.93 1.238L6.998 5.75H3.5a.75.75 0 0 0 0 1.5h17a.75.75 0 0 0 0-1.5ZM4.5 19.25A2.25 2.25 0 0 0 6.75 21.5h10.5a2.25 2.25 0 0 0 2.25-2.25V7.5H4.5v11.75Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
