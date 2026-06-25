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
    <div className="relative group rounded-3xl p-[1px] overflow-hidden bg-white/10 hover:bg-white/20 transition-colors duration-700">
      
      {/* Sweeping Highlight on the border */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      <div className="relative bg-black rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-center overflow-hidden">
        
        {/* Hardware Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] blur-3xl rounded-full pointer-events-none translate-x-1/3 -translate-y-1/2" />
        
        <div className="flex-grow space-y-5 relative z-10">
          <h2 className="text-2xl font-serif text-white flex items-center gap-4">
            Voice Footprint
            {hasExistingProfile && (
              <span className="flex items-center gap-1.5 bg-white text-black text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                Calibrated
              </span>
            )}
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg leading-relaxed">
            Record a short phrase to create your unique vocal signature. We&apos;ll use this to automatically tune and shape AI-generated vocals to match your natural timbre.
          </p>
          
          <AnimatePresence mode="wait">
            {state === 'calibrating' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <p className="text-[10px] font-mono tracking-widest text-zinc-300 uppercase">
                      Recording. Read aloud clearly:
                    </p>
                  </div>
                  <p className="text-lg text-white font-serif italic opacity-90">
                    &ldquo;{CALIBRATION_PHRASE}&rdquo;
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-red-400 text-[10px] font-mono tracking-widest uppercase">{error}</p>}
        </div>

        <div className="flex-shrink-0 relative z-10 flex flex-col items-center gap-3">
          {state === 'idle' || state === 'completed' || state === 'error' ? (
            <button
              onClick={startCalibration}
              className="px-8 py-4 rounded-full bg-white text-black font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              {hasExistingProfile ? 'Re-calibrate' : 'Start Calibration'}
            </button>
          ) : state === 'calibrating' ? (
            <button
              onClick={stopCalibration}
              className="px-8 py-4 rounded-full bg-red-600 text-white font-mono text-[11px] font-bold tracking-[0.2em] uppercase hover:scale-105 transition-transform animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]"
            >
              Stop & Save
            </button>
          ) : (
            <div className="px-8 py-4 font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin" />
              Processing
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
