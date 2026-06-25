'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { motion } from 'framer-motion';

export default function WaveformVisualizer({ audioUrl, onReady, isMuted = false }) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    let loadUrl = audioUrl;
    if (!audioUrl.startsWith('blob:') && !audioUrl.startsWith('data:') && audioUrl.startsWith('http')) {
      loadUrl = `/api/proxy-audio?url=${encodeURIComponent(audioUrl)}`;
    }

    const audio = new Audio();
    audio.src = loadUrl;
    audio.crossOrigin = 'anonymous';

    // Create WaveSurfer instance
    const ws = WaveSurfer.create({
      container: containerRef.current,
      media: audio,
      waveColor: 'rgba(188, 124, 10, 0.25)',
      progressColor: '#d69c17',
      cursorColor: 'transparent',
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 60,
      normalize: true,
      fillParent: true
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setIsLoaded(true);
      if (onReady) onReady(ws);
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      try {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      } catch (err) {
        console.warn('WaveSurfer cleanup error:', err);
      }
    };
  }, [audioUrl, onReady]);

  // Handle Mute changes
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setMuted(isMuted);
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="w-full bg-void/40 border border-theme-500/10 rounded-xl p-4 flex flex-col gap-3">
      {!isLoaded && (
        <div className="h-[60px] flex items-center justify-center">
          <div className="flex gap-[3px] items-end h-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="w-[2px] bg-theme-400/60 rounded-full"
                animate={{
                  height: [6, 20, 6]
                }}
                transition={{
                  duration: 0.6 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}
      />

      {isLoaded && (
        <div className="flex justify-between items-center mt-1">
          <button
            onClick={togglePlay}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-500/10 border border-theme-500/20 text-theme-400 hover:bg-theme-500/20 hover:text-white transition-all text-[10px] font-mono tracking-widest uppercase"
          >
            {isPlaying ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
                Play Preview
              </>
            )}
          </button>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            REAL AUDIO WAVEFORM
          </span>
        </div>
      )}
    </div>
  );
}
