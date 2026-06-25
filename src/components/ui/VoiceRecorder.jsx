'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_DURATION = 240; // 4 minutes in seconds

export default function VoiceRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  onRecordingReset
}) {
  const [state, setState] = useState('idle'); // idle | requesting | recording | recorded
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const playbackAudioRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
        playbackAudioRef.current = null;
      }
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, [playbackUrl]);

  // ── Live Frequency Visualizer ──
  const drawVisualizer = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 48;
      const barWidth = canvas.width / barCount - 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < barCount; i++) {
        // Sample from the frequency data
        const dataIdx = Math.floor(i * (bufferLength / barCount));
        const value = dataArray[dataIdx];
        const barHeight = (value / 255) * centerY * 0.9;

        // Gold gradient
        const hue = 38 + (i / barCount) * 10;
        const lightness = 45 + (value / 255) * 15;
        ctx.fillStyle = `hsl(${hue}, 85%, ${lightness}%)`;

        const x = i * (barWidth + 2);

        // Mirror bars from center
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight, 2);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(x, centerY, barWidth, barHeight * 0.6, 2);
        ctx.fill();
      }
    };

    draw();
  }, []);

  // ── Start Recording ──
  const startRecording = async () => {
    setError(null);
    setState('requesting');

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

      // Audio context for analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setPlaybackUrl(url);

        // Decode to AudioBuffer and pass to parent
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          if (onRecordingComplete) {
            onRecordingComplete(decodedBuffer, blob);
          }
        } catch (decodeErr) {
          console.error('Failed to decode recorded audio:', decodeErr);
          setError('Failed to process recording. Please try again.');
        }

        // Stop tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100); // Collect data every 100ms
      setState('recording');
      if (onRecordingStart) onRecordingStart();
      setTimer(0);

      // Start visualizer
      drawVisualizer();

      // Start timer
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const next = prev + 1;
          if (next >= MAX_DURATION) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error('Mic access error:', err);
      setState('idle');
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone permission in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Microphone error: ${err.message}`);
      }
    }
  };

  // ── Stop Recording ──
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setState('recorded');
    if (onRecordingStop) onRecordingStop();
  };

  // ── Reset ──
  const resetRecording = () => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }
    setAudioBlob(null);
    setPlaybackUrl(null);
    setTimer(0);
    setState('idle');
    setIsPlaying(false);
    setError(null);
    chunksRef.current = [];
    if (onRecordingReset) onRecordingReset();
  };

  // ── Playback ──
  const togglePlayback = () => {
    if (!playbackUrl) return;

    if (isPlaying && playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(playbackUrl);
    playbackAudioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.play();
    setIsPlaying(true);
  };

  // ── Format timer ──
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercent = (timer / MAX_DURATION) * 100;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full p-3 rounded-lg border border-red-500/20 bg-red-950/10 text-red-400 text-xs font-mono text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Frequency Visualizer */}
      <div className="w-full h-24 bg-void/40 rounded-xl border border-theme-500/10 overflow-hidden relative">
        {state === 'recording' ? (
          <canvas
            ref={canvasRef}
            width={600}
            height={96}
            className="w-full h-full"
          />
        ) : state === 'recorded' ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex gap-[2px] items-center h-12">
              {[...Array(48)].map((_, i) => {
                const height = 8 + Math.sin(i * 0.5) * 20 + Math.abs(Math.sin(i * 1.3)) * 12;
                return (
                  <div
                    key={i}
                    className="w-[6px] rounded-full bg-theme-400/40"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-600 font-mono text-[9px] tracking-widest uppercase">
              Awaiting voice input...
            </span>
          </div>
        )}

        {/* Recording progress bar */}
        {state === 'recording' && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-red-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        )}
      </div>

      {/* Timer Display */}
      <div className="flex items-center gap-3">
        <span className={`font-mono text-2xl tracking-wider ${
          state === 'recording' ? 'text-red-400' : 'text-zinc-400'
        }`}>
          {formatTime(timer)}
        </span>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
          / {formatTime(MAX_DURATION)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {state === 'idle' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-500 border-4 border-red-400/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] transition-shadow"
          >
            <div className="w-5 h-5 rounded-full bg-white" />
          </motion.button>
        )}

        {state === 'requesting' && (
          <div className="w-16 h-16 rounded-full border-4 border-zinc-700 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin" />
          </div>
        )}

        {state === 'recording' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-700 to-red-600 border-4 border-red-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] animate-pulse"
          >
            <div className="w-5 h-5 rounded-sm bg-white" />
          </motion.button>
        )}

        {state === 'recorded' && (
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayback}
              className="px-4 py-2 rounded-lg bg-theme-500/10 border border-theme-500/20 text-theme-400 hover:bg-theme-500/20 transition-all text-[10px] font-mono tracking-widest uppercase flex items-center gap-2"
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
                  Preview
                </>
              )}
            </motion.button>

            {/* Re-record */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetRecording}
              className="px-4 py-2 rounded-lg border border-white/10 bg-void/40 text-zinc-400 hover:text-white hover:border-white/20 transition-all text-[10px] font-mono tracking-widest uppercase"
            >
              Re-record
            </motion.button>
          </div>
        )}
      </div>

      {/* State Label */}
      <span className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase">
        {state === 'idle' && 'Tap to start recording'}
        {state === 'requesting' && 'Requesting microphone access...'}
        {state === 'recording' && 'Recording — sing along with the lyrics'}
        {state === 'recorded' && `Recording captured (${formatTime(timer)})`}
      </span>
    </div>
  );
}
