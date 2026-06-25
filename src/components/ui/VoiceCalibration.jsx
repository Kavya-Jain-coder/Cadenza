'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CALIBRATION_PHRASE = "My voice is a unique instrument. Its resonance and rhythm guide the melody, transforming simple words into a powerful song that speaks from the soul.";

export default function VoiceCalibration() {
  const [state, setState] = useState('idle'); // idle | calibrating | saving | completed | error
  const [error, setError] = useState(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  
  const frequencyAccumulator = useRef([]);
  const samplesCount = useRef(0);

  // Fetch initial profile state
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startCalibration = async () => {
    setError(null);
    setState('requesting');
    frequencyAccumulator.current = new Array(32).fill(0);
    samplesCount.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // 32 bins
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const collectData = () => {
        animFrameRef.current = requestAnimationFrame(collectData);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Only accumulate if there is actual sound (skip silence)
        const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avgVolume > 10) {
          for (let i = 0; i < dataArray.length; i++) {
            frequencyAccumulator.current[i] += dataArray[i];
          }
          samplesCount.current++;
        }
      };
      
      collectData();
      setState('calibrating');
      
    } catch (err) {
      console.error('Mic access error:', err);
      setState('error');
      setError('Microphone access denied or error occurred.');
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

    // Average the frequencies
    const footprint = frequencyAccumulator.current.map(sum => Math.round(sum / samplesCount.current));
    
    // Normalize to 0-100 range
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
    <div className="bg-void/80 border border-white/5 rounded-xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-theme-400">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-grow space-y-4">
          <h2 className="text-xl font-serif text-white flex items-center gap-2">
            Voice Footprint
            {hasExistingProfile && (
              <span className="bg-green-500/20 text-green-400 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-green-500/30">
                Calibrated
              </span>
            )}
          </h2>
          <p className="text-zinc-400 text-sm max-w-lg">
            Record a short phrase to create your unique vocal signature. We&apos;ll use this to automatically tune and shape AI-generated vocals to match your natural timbre.
          </p>
          
          <AnimatePresence mode="wait">
            {state === 'calibrating' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-zinc-900/50 border border-theme-500/20 rounded-lg p-4"
              >
                <p className="text-[10px] font-mono tracking-widest text-theme-400 uppercase mb-2 animate-pulse">
                  Read aloud clearly:
                </p>
                <p className="text-lg text-white font-serif italic">
                  &ldquo;{CALIBRATION_PHRASE}&rdquo;
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-red-400 text-xs font-mono">{error}</p>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col items-center gap-3">
          {state === 'idle' || state === 'completed' || state === 'error' ? (
            <button
              onClick={startCalibration}
              className="px-6 py-3 rounded-full bg-void border border-theme-500/30 text-theme-400 font-mono text-xs tracking-widest uppercase hover:bg-theme-500/10 transition-colors shadow-[0_0_15px_rgba(251,191,36,0.1)] hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
            >
              {hasExistingProfile ? 'Re-calibrate' : 'Start Calibration'}
            </button>
          ) : state === 'calibrating' ? (
            <button
              onClick={stopCalibration}
              className="px-6 py-3 rounded-full bg-red-600/20 border border-red-500 text-red-400 font-mono text-xs tracking-widest uppercase hover:bg-red-600/30 transition-colors animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              Stop & Save
            </button>
          ) : (
            <div className="px-6 py-3 font-mono text-xs tracking-widest uppercase text-zinc-500 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin" />
              Processing...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
