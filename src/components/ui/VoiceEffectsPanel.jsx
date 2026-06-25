'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { VOICE_EFFECTS_PRESETS } from '@/lib/constants';
import { createEffectsChain, applyCyberneticEffect } from '@/lib/audio/audioUtils';

// Slider component declared outside to avoid re-creation on render and satisfy ESLint rules
const EffectSlider = ({ label, value, onChange, min, max, step = 1, unit = '' }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-mono text-theme-400">
        {typeof value === 'number' ? (value > 0 && !label.includes('Reverb') && !label.includes('Wet') ? '+' : '') : ''}{value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
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
);

export default function VoiceEffectsPanel({ vocalBuffer, voiceFootprint, isAutoVocal, onEffectsChange }) {
  // Effects state
  const [reverbAmount, setReverbAmount] = useState(0.3);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);
  const [compression, setCompression] = useState(true);
  const [pitchShift, setPitchShift] = useState(0);
  const [dryWet, setDryWet] = useState(0.5);
  const [activePreset, setActivePreset] = useState(null);

  // Preview playback
  const [isPreviewing, setIsPreviewing] = useState(false);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);

  // Notify parent of effect changes
  useEffect(() => {
    if (onEffectsChange) {
      onEffectsChange({ reverbAmount, eqLow, eqMid, eqHigh, compression, pitchShift, dryWet });
    }
  }, [reverbAmount, eqLow, eqMid, eqHigh, compression, pitchShift, dryWet, onEffectsChange]);

  // Apply a preset
  const applyPreset = (preset) => {
    setActivePreset(preset.id);
    setReverbAmount(preset.reverbAmount);
    setEqLow(preset.eqLow);
    setEqMid(preset.eqMid);
    setEqHigh(preset.eqHigh);
    setCompression(preset.compression);
    setPitchShift(preset.pitchShift || 0);
    setDryWet(preset.dryWet);
  };

  // Preview with effects
  const togglePreview = useCallback(() => {
    if (isPreviewing) {
      // Stop
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (_e) { /* ignore */ }
        sourceRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPreviewing(false);
      return;
    }

    if (!vocalBuffer) return;

    // Create a fresh audio context for preview
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const source = ctx.createBufferSource();
    source.buffer = vocalBuffer;

    if (isAutoVocal) {
      source.playbackRate.value = 0.85; 
    }

    // Apply pitch shift
    if (pitchShift !== 0) {
      source.detune.value = pitchShift * 100;
    }

    let lastNode;
    if (isAutoVocal && voiceFootprint) {
      // Vocode in real-time for Auto-Sing using the user's voice footprint
      const vocodedNode = applyCyberneticEffect(ctx, source, vocalBuffer.duration, voiceFootprint);
      const effects = createEffectsChain(ctx, { reverbAmount, eqLow, eqMid, eqHigh, compression, pitchShift, dryWet });
      vocodedNode.connect(effects.input);
      lastNode = effects.output;
    } else if (voiceFootprint) {
      // For real human recordings: just apply user's voice footprint EQ profile
      // We do NOT use the channel vocoder here!
      const vocoder = createVocoderChain(ctx, voiceFootprint);
      source.connect(vocoder.input);
      const effects = createEffectsChain(ctx, { reverbAmount, eqLow, eqMid, eqHigh, compression, pitchShift, dryWet });
      vocoder.output.connect(effects.input);
      lastNode = effects.output;
    } else {
      const effects = createEffectsChain(ctx, { reverbAmount, eqLow, eqMid, eqHigh, compression, pitchShift, dryWet });
      source.connect(effects.input);
      lastNode = effects.output;
    }

    lastNode.connect(ctx.destination);

    source.onended = () => {
      setIsPreviewing(false);
      sourceRef.current = null;
    };

    source.start(0);
    sourceRef.current = source;
    setIsPreviewing(true);
  }, [isPreviewing, vocalBuffer, voiceFootprint, reverbAmount, eqLow, eqMid, eqHigh, compression, pitchShift, dryWet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch (_e) { /* ignore */ }
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Presets */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-mono text-theme-400 tracking-widest uppercase">Quick Presets</span>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_EFFECTS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                activePreset === preset.id
                  ? 'border-theme-400 bg-theme-500/10 text-white'
                  : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
              }`}
            >
              <span className="text-sm">{preset.icon}</span>
              <span className="text-[9px] font-mono tracking-wider uppercase">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reverb */}
      <EffectSlider
        label="Reverb Amount"
        value={reverbAmount}
        onChange={setReverbAmount}
        min={0} max={1} step={0.05}
        unit=""
      />

      {/* 3-Band EQ */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-mono text-theme-400 tracking-widest uppercase mb-1">Equalizer</span>
        <div className="grid grid-cols-3 gap-3">
          <EffectSlider label="Low" value={eqLow} onChange={setEqLow} min={-12} max={12} unit="dB" />
          <EffectSlider label="Mid" value={eqMid} onChange={setEqMid} min={-12} max={12} unit="dB" />
          <EffectSlider label="High" value={eqHigh} onChange={setEqHigh} min={-12} max={12} unit="dB" />
        </div>
      </div>

      {/* Compression Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-void/20">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-400 tracking-widest uppercase">Compressor</span>
          <span className="text-[8px] text-zinc-600">Evens out loud and quiet parts</span>
        </div>
        <button
          onClick={() => setCompression(!compression)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            compression ? 'bg-theme-500/40' : 'bg-zinc-700'
          }`}
        >
          <motion.div
            animate={{ x: compression ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute top-0.5 w-4 h-4 rounded-full ${
              compression ? 'bg-theme-400' : 'bg-zinc-500'
            }`}
          />
        </button>
      </div>

      {/* Pitch Shift */}
      <EffectSlider
        label="Pitch Shift"
        value={pitchShift}
        onChange={setPitchShift}
        min={-12} max={12} step={1}
        unit=" st"
      />

      {/* Dry/Wet */}
      <EffectSlider
        label="Dry / Wet Mix"
        value={dryWet}
        onChange={setDryWet}
        min={0} max={1} step={0.05}
      />

      {/* Preview Button */}
      <button
        onClick={togglePreview}
        disabled={!vocalBuffer}
        className={`w-full py-2.5 rounded-lg border text-[10px] font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
          !vocalBuffer
            ? 'border-white/5 text-zinc-600 cursor-not-allowed bg-void/20'
            : isPreviewing
              ? 'border-red-500/30 bg-red-950/10 text-red-400 hover:bg-red-950/20'
              : 'border-theme-500/20 bg-theme-500/10 text-theme-400 hover:bg-theme-500/20'
        }`}
      >
        {isPreviewing ? '⏹ Stop Preview' : '▶ Preview With Effects'}
      </button>
    </div>
  );
}
