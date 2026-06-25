'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { mixAudioBuffers, audioBufferToWav, audioBufferToMp3, blobToBase64 } from '@/lib/audio/audioUtils';

// Volume slider component
const VolumeSlider = ({ label, icon, value, onChange, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-void/20">
    <span className="text-lg">{icon}</span>
    <div className="flex-1 flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="text-[9px] font-mono text-theme-400">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0} max={1} step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full bg-void/60 cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-theme-400
          [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(214,156,23,0.4)]
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-theme-400 [&::-moz-range-thumb]:border-none"
      />
    </div>
  </div>
);

export default function AudioMixer({
  vocalBuffer,
  instrumentalBuffer,
  effectsOptions,
  voiceFootprint,
  isAutoVocal,
  onMixComplete
}) {
  const [instrumentalVol, setInstrumentalVol] = useState(0.65);
  const [vocalVol, setVocalVol] = useState(1.0);
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixedUrl, setMixedUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Cleanup playback on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const canMix = vocalBuffer && instrumentalBuffer;

  const handleMix = async () => {
    if (!canMix) return;

    setIsMixing(true);
    setMixProgress(5);
    setMixedUrl(null);

    try {
      // Step 1: Mix with OfflineAudioContext
      setMixProgress(15);
      const mixedBuffer = await mixAudioBuffers(
        instrumentalBuffer,
        vocalBuffer,
        instrumentalVol,
        vocalVol,
        effectsOptions,
        effectsOptions?.pitchShift || 0,
        voiceFootprint || null,
        isAutoVocal,
        (p) => setMixProgress(Math.max(p * 0.6, mixProgress)) // 0-60%
      );

      // Step 2: Encode as MP3 to avoid Vercel 4.5MB payload limit
      setMixProgress(70);
      const mp3Blob = audioBufferToMp3(mixedBuffer);

      // Step 3: Create playback URL
      setMixProgress(85);
      const url = URL.createObjectURL(mp3Blob);
      setMixedUrl(url);

      // Step 4: Convert to base64 for storage
      setMixProgress(90);
      const base64DataUrl = await blobToBase64(mp3Blob);

      setMixProgress(100);

      if (onMixComplete) {
        onMixComplete({
          blobUrl: url,
          base64DataUrl,
          duration: mixedBuffer.duration,
          sampleRate: mixedBuffer.sampleRate
        });
      }
    } catch (err) {
      console.error('Mix error:', err);
    } finally {
      setIsMixing(false);
    }
  };

  const togglePlayback = () => {
    if (!mixedUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(mixedUrl);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Channel Faders */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-mono text-theme-400 tracking-widest uppercase">Channel Mix</span>
        <VolumeSlider
          label="Instrumental"
          icon="🎵"
          value={instrumentalVol}
          onChange={setInstrumentalVol}
        />
        <VolumeSlider
          label="Vocals"
          icon="🎤"
          value={vocalVol}
          onChange={setVocalVol}
        />
      </div>

      {/* Mix Button */}
      {!isMixing && !mixedUrl && (
        <button
          onClick={handleMix}
          disabled={!canMix}
          className={`w-full py-3 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
            canMix
              ? 'bg-gradient-to-r from-theme-600 to-theme-500 text-white hover:from-theme-500 hover:to-theme-400 font-bold shadow-[0_0_20px_rgba(214,156,23,0.15)]'
              : 'bg-void/30 border border-white/5 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {canMix ? '✨ Mix & Export Final Track' : 'Record voice and select instrumental first'}
        </button>
      )}

      {/* Progress Bar */}
      {isMixing && (
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-theme-500/10 bg-void/20">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-theme-400 tracking-widest uppercase">
              Rendering final mix...
            </span>
            <span className="text-[9px] font-mono text-zinc-400">
              {mixProgress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-void/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-theme-600 to-theme-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${mixProgress}%` }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.5 }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
              Processing audio channels...
            </span>
          </div>
        </div>
      )}

      {/* Result Preview */}
      {mixedUrl && !isMixing && (
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-theme-400/20 bg-theme-500/5">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm">✓</span>
            <span className="text-[9px] font-mono text-theme-400 tracking-widest uppercase">
              Mix Complete
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={togglePlayback}
              className="flex-1 py-2 rounded-lg border border-theme-500/20 bg-theme-500/10 text-theme-400 hover:bg-theme-500/20 transition-all text-[10px] font-mono tracking-widest uppercase flex items-center justify-center gap-2"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play Mix'}
            </button>
            <button
              onClick={() => {
                setMixedUrl(null);
                setMixProgress(0);
              }}
              className="px-4 py-2 rounded-lg border border-white/10 bg-void/40 text-zinc-400 hover:text-white transition-all text-[10px] font-mono tracking-widest uppercase"
            >
              Remix
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
