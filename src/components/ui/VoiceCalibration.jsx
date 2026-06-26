'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CALIBRATION_PHRASE = "My voice is a unique instrument. Its resonance and rhythm guide the melody, transforming simple words into a powerful song that speaks from the soul.";

export default function VoiceCalibration() {
  const [state, setState] = useState('idle'); 
  const [error, setError] = useState(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  
  const frequencyAccumulator = useRef([]);
  const samplesCount = useRef(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.voiceFootprint) {
            setHasExistingProfile(true);
            setState('completed');
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile");
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    };
  }, []);

  const startCalibration = async () => {
    setError(null);
    setState('requesting');
    frequencyAccumulator.current = new Array(32).fill(0);
    samplesCount.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100 }
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; 
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const collectData = () => {
        animFrameRef.current = requestAnimationFrame(collectData);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avgVolume > 10) {
          for (let i = 0; i < dataArray.length; i++) frequencyAccumulator.current[i] += dataArray[i];
          samplesCount.current++;
        }
      };
      
      collectData();
      setState('calibrating');
      
    } catch (err) {
      console.error('Mic access error:', err);
      setState('error');
      setError('Microphone access denied.');
    }
  };

  const stopCalibration = async () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setState('saving');

    if (samplesCount.current === 0) {
      setError("No voice detected. Please speak louder.");
      setState('error');
      return;
    }

    const footprint = frequencyAccumulator.current.map(sum => Math.round(sum / samplesCount.current));
    const maxVal = Math.max(...footprint, 1);
    const normalizedFootprint = footprint.map(val => Math.round((val / maxVal) * 100));

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceFootprint: normalizedFootprint })
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setState('completed');
      setHasExistingProfile(true);
    } catch (e) {
      console.error(e);
      setError("Failed to save footprint.");
      setState('error');
    }
  };

  return (
    <div className="relative group rounded-[3rem] p-[1px] overflow-hidden bg-gradient-to-br from-theme-500/30 to-transparent hover:from-theme-400/50 transition-all duration-700 shadow-2xl">
      
      {/* Sweeping Highlight on the border */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      <div className="relative glass-premium rounded-[3rem] p-12 md:p-20 shadow-inner flex flex-col items-center justify-center text-center overflow-hidden min-h-[50vh]">
        
        {/* Hardware Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--dyn-theme-500),0.15)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="max-w-2xl space-y-8 relative z-10 flex flex-col items-center">
          
          <div className="flex items-center gap-4">
            <h2 className="text-4xl md:text-5xl font-serif text-white tracking-wide">
              Voice Footprint
            </h2>
            {hasExistingProfile && (
              <span className="flex items-center gap-2 bg-theme-500/20 border border-theme-500 text-theme-300 text-[10px] uppercase font-bold tracking-[0.2em] px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(var(--dyn-theme-500),0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-theme-400 animate-pulse" />
                Calibrated
              </span>
            )}
          </div>
          
          <p className="text-zinc-300 text-lg md:text-xl leading-relaxed">
            Record a short phrase to create your unique vocal signature. We&apos;ll use this to automatically tune and shape AI-generated vocals to match your natural timbre.
          </p>
          
          <AnimatePresence mode="wait">
            {state === 'calibrating' && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="overflow-hidden w-full"
              >
                <div className="bg-white/[0.05] border border-white/20 rounded-3xl p-8 mt-4 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    <p className="text-xs font-mono tracking-[0.3em] text-red-400 uppercase font-bold">
                      Recording. Read aloud clearly:
                    </p>
                  </div>
                  <p className="text-2xl md:text-3xl text-white font-serif italic leading-relaxed">
                    &ldquo;{CALIBRATION_PHRASE}&rdquo;
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-red-400 text-xs font-mono tracking-widest uppercase bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
            >
              {error}
            </motion.p>
          )}

          <div className="pt-8">
            {state === 'idle' || state === 'completed' || state === 'error' ? (
              <button
                onClick={startCalibration}
                className="px-12 py-5 rounded-full bg-gradient-to-r from-theme-600 to-theme-400 text-white font-mono text-sm font-bold tracking-[0.2em] uppercase hover:scale-105 transition-all shadow-[0_0_40px_rgba(var(--dyn-theme-500),0.5)] hover:shadow-[0_0_60px_rgba(var(--dyn-theme-500),0.7)]"
              >
                {hasExistingProfile ? 'Re-calibrate Voice' : 'Start Calibration'}
              </button>
            ) : state === 'calibrating' ? (
              <button
                onClick={stopCalibration}
                className="px-12 py-5 rounded-full bg-red-600 text-white font-mono text-sm font-bold tracking-[0.2em] uppercase hover:scale-105 transition-all animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.6)]"
              >
                Stop & Save
              </button>
            ) : (
              <div className="px-12 py-5 font-mono text-sm tracking-[0.2em] uppercase text-zinc-400 flex items-center justify-center gap-4 bg-white/5 rounded-full border border-white/10">
                <div className="w-5 h-5 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
                Processing Profile...
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
