'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { INSTRUMENTS } from '@/lib/constants';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import MockBadge from '@/components/ui/MockBadge';
import WaveformVisualizer from '@/components/ui/WaveformVisualizer';
import Toast from '@/components/ui/Toast';
import { generateProceduralBeat } from '@/lib/audio/beatGenerator';
import { audioBufferToMp3, fetchAndDecode } from '@/lib/audio/audioUtils';
import { saveAs } from 'file-saver';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLenis } from 'lenis/react';

const BackgroundOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-zinc-950" />
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 100, 0],
        y: [0, -50, 0],
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-theme-500/10 rounded-full blur-[60px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.5, 1],
        x: [0, -100, 0],
        y: [0, 100, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-theme-400/5 rounded-full blur-[80px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-theme-600/5 rounded-full blur-[60px]"
    />
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
  </div>
);

function InstrumentalStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const lenis = useLenis();

  const scrollToStep = (stepNum) => {
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(`#step-${stepNum}`, { duration: 1.2 });
    } else {
      const el = document.getElementById(`step-${stepNum}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const preselectedLyricId = searchParams.get('lyricId');
  const preselectedInstruments = searchParams.get('instruments');
  const initialInstruments = preselectedInstruments ? preselectedInstruments.split(',').filter(Boolean) : [];
  const initialSettings = {};
  initialInstruments.forEach(id => {
    initialSettings[id] = { quality: 'Standard', effect: 'None' };
  });

  const [lyricsList, setLyricsList] = useState([]);
  const [selectedLyricId, setSelectedLyricId] = useState(preselectedLyricId || '');
  const [selectedGenre, setSelectedGenre] = useState('pop');
  const [selectedInstruments, setSelectedInstruments] = useState(initialInstruments);
  const [instrumentSettings, setInstrumentSettings] = useState(initialSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  // Load lyrics on mount via API
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchLyrics = async () => {
      try {
        const res = await fetch('/api/creations');
        if (res.status === 401) {
          router.push('/auth');
          return;
        }
        const data = await res.json();
        if (data.error) {
          setToastType('error');
          setToastMessage('Failed to load lyrics history');
        } else {
          const lyricsData = (data.lyrics || []).map(l => ({
            id: l.id,
            title: l.title || 'Untitled',
            genre: l.genre
          }));
          setLyricsList(lyricsData);
          
          if (preselectedLyricId) {
            const match = lyricsData.find((l) => l.id === preselectedLyricId);
            if (match) setSelectedGenre(match.genre);
          } else if (lyricsData.length > 0) {
            setSelectedLyricId(lyricsData[0].id);
            setSelectedGenre(lyricsData[0].genre);
          }
        }
      } catch (e) {
        setToastType('error');
        setToastMessage('Failed to load lyrics history');
      }
    };

    fetchLyrics();
  }, [status, router, preselectedLyricId]);

  const handleLyricChange = (id) => {
    setSelectedLyricId(id);
    const match = lyricsList.find((l) => l.id === id);
    if (match) setSelectedGenre(match.genre);
  };

  const toggleInstrument = (instId) => {
    setSelectedInstruments((prev) => {
      const isSelected = prev.includes(instId);
      if (isSelected) {
        const nextSettings = { ...instrumentSettings };
        delete nextSettings[instId];
        setInstrumentSettings(nextSettings);
        return prev.filter((id) => id !== instId);
      } else {
        setInstrumentSettings((prevS) => ({
          ...prevS,
          [instId]: { quality: 'Standard', effect: 'None' }
        }));
        return [...prev, instId];
      }
    });
  };

  const handleSettingChange = (instId, field, value) => {
    setInstrumentSettings((prev) => ({
      ...prev,
      [instId]: {
        ...prev[instId],
        [field]: value
      }
    }));
  };

  const handleCompose = async () => {
    if (selectedInstruments.length === 0) {
      setToastType('error');
      setToastMessage('Please select at least 1 instrument');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    const formattedInstruments = selectedInstruments.map((id) => ({
      name: id,
      quality: instrumentSettings[id]?.quality || 'Standard',
      effect: instrumentSettings[id]?.effect || 'None'
    }));

    try {
      let audioDataUrl = null;
      const provider = process.env.NEXT_PUBLIC_INSTRUMENTAL_PROVIDER;

      if (provider === 'browser-synth') {
        const synthResult = await generateProceduralBeat(selectedGenre, formattedInstruments);
        audioDataUrl = synthResult.audioUrl;
      }

      const res = await fetch('/api/instrumental/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyricId: selectedLyricId,
          genre: selectedGenre,
          instruments: formattedInstruments,
          audioDataUrl
        })
      });

      const data = await res.json();
      if (data.error) {
        setToastType('error');
        setToastMessage(data.error);
        setIsGenerating(false);
        return;
      }

      setResult(data);
      setToastType('success');
      setToastMessage('Instrumental track composed successfully!');
    } catch (e) {
      console.error('Procedural generation failed:', e);
      setToastType('error');
      setToastMessage('Failed to generate audio stems.');
    } finally {
      setIsGenerating(false);
    }
  };

  const primaryEase = [0.22, 1, 0.36, 1];
  const motionPropsLeft = {
    initial: { opacity: 0, x: -80, scale: 0.95 },
    whileInView: { opacity: 1, x: 0, scale: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { ease: primaryEase, duration: 1.2 }
  };
  const motionPropsRight = {
    initial: { opacity: 0, x: 80, scale: 0.95 },
    whileInView: { opacity: 1, x: 0, scale: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { ease: primaryEase, duration: 1.2 }
  };
  const motionPropsCenter = {
    initial: { opacity: 0, y: 50, scale: 0.95 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, amount: 0.1 },
    transition: { ease: primaryEase, duration: 1.2 }
  };

  return (
    <div ref={containerRef} className="w-full relative min-h-screen">
      <BackgroundOrbs />

      {/* Sticky Scrollytelling Visualizer */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ 
            rotate: useTransform(scrollYProgress, [0, 1], [0, 180]),
            scale: useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.9]),
            opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.4, 0.4, 0])
          }}
          className="w-[90vw] h-[90vw] md:w-[50vw] md:h-[50vw] rounded-full border-[1px] border-theme-500/30 mix-blend-screen"
        />
        <motion.div 
          style={{ 
            rotate: useTransform(scrollYProgress, [0, 1], [0, -180]),
            scale: useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 1.1]),
            opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.2, 0.2, 0])
          }}
          className="absolute w-[70vw] h-[70vw] md:w-[35vw] md:h-[35vw] rounded-full border-[1px] border-white/20 mix-blend-screen"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col pt-24 pb-24">
        
        {/* STEP 1: LYRIC TARGET & INTRO */}
        <div id="step-1" className="min-h-screen w-full flex flex-col justify-center items-start py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsLeft} className="w-full max-w-2xl">
            <GlassCard className="flex flex-col gap-8 p-10 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                  <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                    Phase 01 / Foundation
                  </span>
                </div>
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 drop-shadow-2xl">
                  Design the soundscape
                </h2>
                <p className="text-zinc-400 text-sm font-light leading-relaxed">
                  Select a lyric target to anchor your instrumental generation.
                </p>
              </div>

              {/* Lyric History Selector */}
              <div>
                <label className="text-[10px] tracking-widest font-mono text-zinc-500 uppercase mb-3 block">
                  Lyric History Target
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-theme-500/50 to-purple-600/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                  <select
                    value={selectedLyricId}
                    onChange={(e) => handleLyricChange(e.target.value)}
                    className="w-full px-4 py-4 bg-black/40 text-white rounded-xl border border-white/5 focus:border-theme-400 focus:outline-none text-sm font-mono relative transition-all"
                  >
                    <option value="" disabled className="text-zinc-500">Select a generated lyric...</option>
                    {lyricsList.map((lyric) => (
                      <option key={lyric.id} value={lyric.id}>
                        {lyric.title} ({lyric.genre.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col items-center mt-8">
                <button onClick={() => scrollToStep(2)} disabled={!selectedLyricId} className="px-6 md:px-8 py-3 rounded-full border border-white/10 bg-white hover:bg-zinc-200 text-black font-semibold font-mono text-[10px] md:text-xs tracking-wider md:tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">
                  Continue Flow <span className="animate-bounce">↓</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* STEP 2: INSTRUMENT GRID */}
        <div id="step-2" className="min-h-screen w-full flex flex-col justify-center items-end py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsRight} className="w-full max-w-2xl">
            <GlassCard className="flex flex-col gap-8 p-10 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                  Phase 02 / Stems
                </span>
              </div>
              <div>
                <label className="text-[10px] tracking-widest font-mono text-zinc-500 uppercase mb-4 block">
                  Select Instrument Stems
                </label>
                <div className="grid grid-cols-3 gap-3">
                {INSTRUMENTS.map((inst) => {
                  const isSelected = selectedInstruments.includes(inst.id);
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => toggleInstrument(inst.id)}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                        isSelected
                          ? 'border-theme-400 bg-theme-500/10 text-white shadow-[0_0_20px_rgba(214,156,23,0.15)] scale-105'
                          : 'border-white/5 bg-black/40 text-zinc-500 hover:border-white/20 hover:text-zinc-300 hover:bg-black/60'
                      }`}
                    >
                      <span className={`text-3xl transition-transform duration-300 ${isSelected ? 'scale-110 drop-shadow-[0_0_10px_rgba(214,156,23,0.5)]' : ''}`}>{inst.icon}</span>
                      <span className="text-[9px] font-mono tracking-widest uppercase mt-1">{inst.name}</span>
                    </button>
                  );
                })}
                </div>
              </div>

              <div className="flex justify-between items-center mt-8">
                <button onClick={() => scrollToStep(1)} className="text-zinc-400 hover:text-white font-mono text-[10px] md:text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
                <button onClick={() => scrollToStep(3)} disabled={selectedInstruments.length === 0} className="px-6 md:px-8 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold font-mono text-[10px] md:text-xs tracking-wider md:tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">
                  Next Stage <span className="animate-bounce">↓</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* STEP 3: STEM CONFIGURATIONS */}
        <div id="step-3" className="min-h-screen w-full flex flex-col justify-center items-start py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsLeft} className="w-full max-w-2xl">
            <GlassCard className="flex flex-col gap-8 p-10 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                  Phase 03 / Mix
                </span>
              </div>
              
              {!selectedInstruments.length ? (
                <div className="py-10 border border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-black/20">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                    Select stems to configure
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedInstruments.map((id) => {
                  const inst = INSTRUMENTS.find((i) => i.id === id);
                  const settings = instrumentSettings[id] || { quality: 'Standard', effect: 'None' };
                  return (
                    <div key={id} className="p-4 rounded-xl border border-white/5 bg-zinc-900/50 backdrop-blur-md flex flex-col gap-4 transition-all hover:bg-zinc-900/80">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-white flex items-center gap-3 text-sm tracking-widest uppercase">
                          <span className="text-xl">{inst?.icon}</span> {inst?.name}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-mono text-zinc-500 block uppercase mb-2">Quality</label>
                          <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                            {['Low', 'Standard', 'High'].map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => handleSettingChange(id, 'quality', q)}
                                className={`flex-1 py-1.5 text-[9px] font-mono rounded-md transition-all uppercase ${
                                  settings.quality === q
                                    ? 'bg-theme-500/20 text-theme-300 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-mono text-zinc-500 block uppercase mb-2">Effect Filter</label>
                          <div className="relative group/select">
                            <div className="absolute -inset-1 bg-gradient-to-r from-theme-500/50 to-purple-600/50 rounded-lg blur opacity-0 group-hover/select:opacity-30 transition duration-500"></div>
                            <select
                              value={settings.effect}
                              onChange={(e) => handleSettingChange(id, 'effect', e.target.value)}
                              className="w-full px-3 py-2 bg-black/40 text-white rounded-lg border border-white/5 focus:border-theme-400 focus:outline-none text-[10px] font-mono uppercase relative transition-all"
                            >
                              <option value="None">None</option>
                              <option value="Reverb">Reverb</option>
                              <option value="Distortion">Distortion</option>
                              <option value="Echo">Echo</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
              <button onClick={() => scrollToStep(2)} className="text-zinc-400 hover:text-white font-mono text-[10px] md:text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                <span>↑</span> Back
              </button>
              <button onClick={() => scrollToStep(4)} disabled={selectedInstruments.length === 0} className="px-6 md:px-8 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold font-mono text-[10px] md:text-xs tracking-wider md:tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">
                Next Stage <span className="animate-bounce">↓</span>
              </button>
            </div>
          </GlassCard>
          </motion.div>
        </div>

        {/* STEP 4: PREVIEW & GENERATE */}
        <div id="step-4" className="min-h-screen w-full flex flex-col justify-center items-center py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsCenter} className="w-full max-w-4xl">
            <GlassCard className="flex flex-col gap-6 p-10 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] tracking-widest font-mono text-theme-400 uppercase flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-theme-400 animate-pulse" />
                  Phase 04 / Composer Preview
                </span>
                {process.env.NEXT_PUBLIC_INSTRUMENTAL_PROVIDER === 'browser-synth' ? (
                  <MockBadge 
                    text="Procedural Synth" 
                    tooltip="Generated client-side using Web Audio Synthesis. Fully customized and unique." 
                  />
                ) : (
                  <MockBadge />
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <button onClick={() => scrollToStep(3)} className="text-zinc-400 hover:text-white font-mono text-[10px] md:text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleCompose}
                disabled={isGenerating || selectedInstruments.length === 0}
                className={`mb-6 w-full px-6 md:px-8 py-4 md:py-5 rounded-full font-bold font-mono text-[10px] md:text-sm tracking-wider md:tracking-widest uppercase transition-all flex items-center justify-center gap-2 md:gap-3 whitespace-nowrap ${
                  isGenerating || selectedInstruments.length === 0
                    ? 'bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed'
                    : 'bg-white hover:bg-zinc-200 text-black hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-600/20 border-t-zinc-500 rounded-full animate-spin" />
                    Synthesizing Beats...
                  </>
                ) : (
                  <>Generate Masterpiece ✨</>
                )}
              </button>

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-white/10 rounded-2xl bg-black/20">
                  <div className="w-12 h-12 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin shadow-[0_0_15px_rgba(214,156,23,0.5)]" />
                  <span className="text-[10px] font-mono text-theme-300 uppercase tracking-widest animate-pulse">
                    Synthesizing stems...
                  </span>
                </div>
              )}

              {!isGenerating && !result && (
                <div className="py-20 border border-dashed border-white/10 rounded-2xl flex items-center justify-center bg-black/20 backdrop-blur-sm">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                    No track composed yet
                  </span>
                </div>
              )}

              {!isGenerating && result && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Active Stem Tags */}
                  <div className="flex flex-wrap gap-2">
                    {result.instruments.map((inst, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-md bg-theme-900/30 border border-theme-500/20 text-[9px] font-mono text-theme-300 uppercase shadow-[0_0_10px_rgba(214,156,23,0.1)]"
                      >
                        {inst.name} <span className="opacity-50 mx-1">/</span> {inst.quality} <span className="opacity-50 mx-1">/</span> {inst.effect}
                      </span>
                    ))}
                  </div>

                  {/* Wavesurfer Player */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                    <WaveformVisualizer audioUrl={result.audioUrl} />
                  </div>

                  <div className="flex gap-4 justify-end mt-2">
                    <button
                      onClick={async () => {
                        setIsDownloading(true);
                        try {
                          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                          const buffer = await fetchAndDecode(result.audioUrl, audioCtx);
                          const mp3Blob = audioBufferToMp3(buffer);
                          saveAs(mp3Blob, `Cadenza_Beat_${result.id.substring(0, 8)}.mp3`);
                          setToastType('success');
                          setToastMessage('MP3 Downloaded Successfully!');
                        } catch (e) {
                          console.error(e);
                          setToastType('error');
                          setToastMessage('Failed to encode MP3.');
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      disabled={isDownloading}
                      className="flex-1 px-6 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 backdrop-blur-md"
                    >
                      {isDownloading ? 'Encoding MP3...' : '📥 Download (.mp3)'}
                    </button>
                    <button
                      onClick={() => router.push(`/studio/voice?instrumentalId=${result.id}`)}
                      className="flex-1 px-6 py-4 rounded-full border border-transparent bg-white hover:bg-zinc-200 text-black font-mono text-[10px] tracking-widest uppercase transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                    >
                      Proceed to Voice <span className="text-sm">→</span>
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}

export default function InstrumentalStudio() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin" />
      </div>
    }>
      <InstrumentalStudioContent />
    </Suspense>
  );
}
