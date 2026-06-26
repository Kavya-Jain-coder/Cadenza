'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { VOICE_EFFECTS_PRESETS } from '@/lib/constants';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import WaveformVisualizer from '@/components/ui/WaveformVisualizer';
import VoiceRecorder from '@/components/ui/VoiceRecorder';
import VoiceEffectsPanel from '@/components/ui/VoiceEffectsPanel';
import AudioMixer from '@/components/ui/AudioMixer';
import { fetchAndDecode, audioBufferToMp3 } from '@/lib/audio/audioUtils';
import { saveAs } from 'file-saver';

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
      className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[60px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.5, 1],
        x: [0, -100, 0],
        y: [0, 100, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-zinc-500/10 rounded-full blur-[80px]"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-600/5 rounded-full blur-[60px]"
    />
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
  </div>
);

function VoiceStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const preselectedInstrumentalId = searchParams.get('instrumentalId');

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

  const [instrumentalList, setInstrumentalList] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState(preselectedInstrumentalId || '');
  
  // Decoded buffers
  const [vocalBuffer, setVocalBuffer] = useState(null);
  const [vocalBlob, setVocalBlob] = useState(null);
  const [instrumentalBuffer, setInstrumentalBuffer] = useState(null);
  const [isDecodingInstrumental, setIsDecodingInstrumental] = useState(false);

  // FX & Mixing state
  const [effectsOptions, setEffectsOptions] = useState(null);
  const [mixedAudio, setMixedAudio] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAutoVocal, setIsAutoVocal] = useState(false);

  // Teleprompter & Sync state
  const [lyricsData, setLyricsData] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [recordingTime, setRecordingTime] = useState(0);

  // Vocoder State
  const [voiceFootprint, setVoiceFootprint] = useState(null);
  const [isAutoSinging, setIsAutoSinging] = useState(false);

  // All creations database data
  const [allCreations, setAllCreations] = useState({ lyrics: [], instrumentals: [], tracks: [] });

  // Audio elements & timers
  const instrumentalAudioRef = useRef(null);
  const teleprompterIntervalRef = useRef(null);

  // UI Toast states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [status, router]);

  // Load creations data on mount
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchData = async () => {
      try {
        const [creationsRes, profileRes] = await Promise.all([
          fetch('/api/creations'),
          fetch('/api/user/profile')
        ]);

        if (creationsRes.status === 401) {
          router.push('/auth');
          return;
        }

        const data = await creationsRes.json();
        if (data.error) {
          setToastType('error');
          setToastMessage('Failed to load instrumentals history');
        } else {
          setAllCreations(data);
          const insts = data.instrumentals || [];
          setInstrumentalList(insts);

          if (preselectedInstrumentalId) {
            setSelectedInstId(preselectedInstrumentalId);
            loadLyricsForInstrumental(preselectedInstrumentalId, insts, data.lyrics || []);
          } else if (insts.length > 0) {
            setSelectedInstId(insts[0].id);
            loadLyricsForInstrumental(insts[0].id, insts, data.lyrics || []);
          }
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.voiceFootprint) {
            setVoiceFootprint(profileData.voiceFootprint);
          }
        }
      } catch (e) {
        setToastType('error');
        setToastMessage('Failed to load studio data');
      }
    };

    fetchData();
  }, [status, router, preselectedInstrumentalId]);

  // Decode selected instrumental buffer
  useEffect(() => {
    if (selectedInstId && instrumentalList.length > 0) {
      const loadInstrumentalBuffer = async () => {
        const inst = instrumentalList.find((i) => i.id === selectedInstId);
        if (!inst) return;

        setIsDecodingInstrumental(true);
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const buffer = await fetchAndDecode(inst.audio_url, audioCtx);
          setInstrumentalBuffer(buffer);
        } catch (err) {
          console.error('Error decoding backing track:', err);
          setToastType('error');
          setToastMessage('Failed to load backing track audio buffer.');
        } finally {
          setIsDecodingInstrumental(false);
        }
      };

      loadInstrumentalBuffer();
    }
  }, [selectedInstId, instrumentalList]);

  // Cleanup audio playbacks on unmount
  useEffect(() => {
    return () => {
      if (instrumentalAudioRef.current) {
        instrumentalAudioRef.current.pause();
      }
      if (teleprompterIntervalRef.current) {
        clearInterval(teleprompterIntervalRef.current);
      }
    };
  }, []);

  function loadLyricsForInstrumental(instId, insts, lyrics) {
    const targetInst = insts.find((i) => i.id === instId);
    const lyricId = targetInst?.lyric_id;

    if (lyricId) {
      const lyric = lyrics.find((l) => l.id === lyricId);
      if (lyric) {
        setLyricsData({ title: lyric.title, sections: lyric.sections });
      } else {
        setLyricsData(null);
      }
    } else {
      setLyricsData(null);
    }
  }

  const handleInstrumentalChange = (id) => {
    setSelectedInstId(id);
    loadLyricsForInstrumental(id, instrumentalList, allCreations.lyrics || []);
    setVocalBuffer(null);
    setVocalBlob(null);
    setMixedAudio(null);
    setIsAutoVocal(false);
  };

  const handleRecordingStart = () => {
    const inst = instrumentalList.find((i) => i.id === selectedInstId);
    if (!inst) return;

    let playUrl = inst.audio_url;
    if (!playUrl.startsWith('blob:') && !playUrl.startsWith('data:') && playUrl.startsWith('http')) {
      playUrl = `/api/proxy-audio?url=${encodeURIComponent(playUrl)}`;
    }

    const audio = new Audio(playUrl);
    audio.volume = 0.55;
    audio.play().catch((err) => console.error('Audio playback block:', err));
    instrumentalAudioRef.current = audio;

    setRecordingTime(0);
    setCurrentSectionIndex(0);

    teleprompterIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const next = prev + 1;
        if (instrumentalBuffer && lyricsData) {
          const segmentDuration = instrumentalBuffer.duration / lyricsData.sections.length;
          const activeIdx = Math.floor(next / segmentDuration);
          setCurrentSectionIndex(Math.min(activeIdx, lyricsData.sections.length - 1));
        }
        return next;
      });
    }, 1000);
  };

  const handleRecordingStop = () => {
    if (instrumentalAudioRef.current) {
      instrumentalAudioRef.current.pause();
      instrumentalAudioRef.current = null;
    }
    if (teleprompterIntervalRef.current) {
      clearInterval(teleprompterIntervalRef.current);
      teleprompterIntervalRef.current = null;
    }
  };

  const handleRecordingReset = () => {
    handleRecordingStop();
    setRecordingTime(0);
    setCurrentSectionIndex(-1);
    setVocalBuffer(null);
    setVocalBlob(null);
    setMixedAudio(null);
    setIsAutoVocal(false);
  };

  const handleRecordingComplete = (decodedBuffer, blob) => {
    handleRecordingStop();
    setIsAutoVocal(false);
    setVocalBuffer(decodedBuffer);
    setVocalBlob(blob);
  };

  const handleSaveMixedTrack = async () => {
    if (!mixedAudio) return;

    setIsSaving(true);
    const targetInst = instrumentalList.find((i) => i.id === selectedInstId);

    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyricId: targetInst?.lyric_id || null,
          instrumentalId: selectedInstId || null,
          voiceArchetype: 'user-vocals',
          audioDataUrl: mixedAudio.base64DataUrl,
          effectsApplied: effectsOptions
        })
      });

      const data = await res.json();
      if (data.error) {
        setToastType('error');
        setToastMessage(data.error);
        setIsSaving(false);
        return;
      }

      setToastType('success');
      setToastMessage('Track saved successfully to Creations Dashboard!');
      router.push('/dashboard');
    } catch (e) {
      setToastType('error');
      setToastMessage('Failed to persist final mixed track.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSing = async () => {
    if (!lyricsData || !lyricsData.sections) {
      setToastType('error');
      setToastMessage('No lyrics available to sing.');
      return;
    }

    setIsAutoSinging(true);
    try {
      const allText = lyricsData.sections.map(sec => sec.lines.join('. ')).join('. ');
      
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: allText })
      });

      if (!res.ok) throw new Error('Failed to generate TTS audio');

      const data = await res.json();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (data.audioChunks && data.audioChunks.length > 0) {
        const decodedBuffers = await Promise.all(data.audioChunks.map(async (b64) => {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return await audioCtx.decodeAudioData(bytes.buffer);
        }));

        let totalLength = 0;
        for (const buf of decodedBuffers) totalLength += buf.length;
        
        const finalBuffer = audioCtx.createBuffer(
          decodedBuffers[0].numberOfChannels,
          totalLength,
          decodedBuffers[0].sampleRate
        );
        
        let offset = 0;
        for (const buf of decodedBuffers) {
          for (let channel = 0; channel < finalBuffer.numberOfChannels; channel++) {
            const dest = finalBuffer.getChannelData(channel);
            const srcChannel = channel < buf.numberOfChannels ? channel : 0;
            dest.set(buf.getChannelData(srcChannel), offset);
          }
          offset += buf.length;
        }
        
        setVocalBuffer(finalBuffer);
        setIsAutoVocal(true);
      } else {
        throw new Error('No audio data received');
      }
      
      setToastType('success');
      setToastMessage('Auto-Vocals generated successfully! Scroll down to add FX.');
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to generate Auto-Vocals.');
    } finally {
      setIsAutoSinging(false);
    }
  };

  const renderTeleprompter = () => (
    <GlassCard className="flex flex-col gap-6 p-6 h-[50vh] lg:h-[80vh] max-h-[800px] bg-white/[0.02] border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <span className="text-[10px] tracking-[0.2em] font-mono text-zinc-500 uppercase">
          Vocal Teleprompter
        </span>
        <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/10 text-[9px] font-mono text-white uppercase tracking-wider">
          SYNC MODE
        </span>
      </div>

      <div className="flex flex-col gap-4 flex-grow overflow-hidden">
        {lyricsData ? (
          <>
            <div className="px-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                Song Theme & Lyrics
              </span>
              <h3 className="font-serif text-xl text-white italic">
                &ldquo;{lyricsData.title}&rdquo;
              </h3>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 mt-4 flex-grow scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {lyricsData.sections.map((section, index) => {
                const isHighlighted = index === currentSectionIndex;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all duration-500 ${
                      isHighlighted
                        ? 'border-white/30 bg-white/[0.05] text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-[1.02]'
                        : 'border-white/5 bg-transparent opacity-40 scale-100'
                    }`}
                  >
                    <span className={`text-[9px] font-mono block mb-2 uppercase tracking-widest ${isHighlighted ? 'text-white' : 'text-zinc-500'}`}>
                      {section.label}
                    </span>
                    <p className="text-sm italic leading-relaxed">
                      {section.lines.join(' / ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <span className="text-zinc-600 text-3xl mb-4">🎤</span>
            <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest max-w-[200px] leading-relaxed">
              Select a Backing Track to Load Teleprompter
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );

  return (
    <div className="relative min-h-screen text-white bg-zinc-950 font-sans selection:bg-white/30" ref={containerRef}>
      <BackgroundOrbs />
      
      <div className="max-w-6xl mx-auto px-6 py-24 relative z-10 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left Column: Scrollable Content Steps */}
        <div className="flex-1 flex flex-col w-full">
          
          {/* Step 1: Record Vocals */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-[80vh] flex flex-col justify-center py-12"
          >
            <GlassCard className="flex flex-col gap-8 p-8 md:p-12 bg-white/[0.02] border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase mb-3 block">
                  Stage 1
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-white mb-4 tracking-tight">
                  Record Vocals
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                  Select your backing track session, put on headphones, and tap record to sing.
                </p>
              </div>

              {/* Instrumental Selector */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] tracking-[0.2em] font-mono text-zinc-500 uppercase">
                    Backing Session
                  </label>
                  {selectedInstId && (
                    <button
                      type="button"
                      onClick={() => {
                        const inst = instrumentalList.find((i) => i.id === selectedInstId);
                        const instNames = inst?.instruments?.map(i => i.name).join(',') || '';
                        const lyricId = inst?.lyric_id || '';
                        router.push(`/studio/instrumental?lyricId=${lyricId}&instruments=${instNames}`);
                      }}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white transition-colors underline uppercase tracking-wider"
                    >
                      Modify Beat 🎵
                    </button>
                  )}
                </div>
                <select
                  value={selectedInstId}
                  onChange={(e) => handleInstrumentalChange(e.target.value)}
                  disabled={instrumentalList.length === 0}
                  className="w-full px-5 py-3.5 bg-white/[0.03] text-white rounded-xl border border-white/10 focus:border-white/30 focus:outline-none text-sm font-mono appearance-none"
                >
                  {instrumentalList.map((inst) => (
                    <option key={inst.id} value={inst.id} className="bg-zinc-900">
                      Beat Session: {inst.id.substring(0, 8)}... ({new Date(inst.created_at).toLocaleDateString()})
                    </option>
                  ))}
                  {instrumentalList.length === 0 && (
                    <option value="" className="bg-zinc-900">No backing tracks available</option>
                  )}
                </select>
              </div>

              {/* Mobile Teleprompter */}
              <div className="block lg:hidden w-full mt-2">
                {renderTeleprompter()}
              </div>

              {instrumentalList.length === 0 ? (
                <div className="flex flex-col gap-4 items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <span className="text-zinc-500 font-mono text-[10px] text-center uppercase tracking-widest max-w-[200px]">
                    You need an instrumental session to record vocals.
                  </span>
                  <Button onClick={() => router.push('/studio/instrumental')} className="text-xs px-6 py-3">
                    Create Backing Track
                  </Button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  {isDecodingInstrumental ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Loading backing track...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      <VoiceRecorder
                        onRecordingStart={handleRecordingStart}
                        onRecordingStop={handleRecordingStop}
                        onRecordingReset={handleRecordingReset}
                        onRecordingComplete={handleRecordingComplete}
                      />

                      {/* Auto-Sing Option */}
                      {voiceFootprint && (
                        <div className="border-t border-white/10 pt-6 flex flex-col items-center gap-4">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                            OR USE AI VOCODER
                          </span>
                          <Button
                            variant="secondary"
                            onClick={handleAutoSing}
                            disabled={isAutoSinging || !lyricsData}
                            className="w-full text-xs py-4 border border-white/10 text-white flex justify-center items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05]"
                          >
                            {isAutoSinging ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Generating Vocoder Track...
                              </>
                            ) : (
                              '🤖 Auto-Sing Lyrics'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {vocalBuffer && (
                <div className="flex flex-col items-center mt-8">
                  <button onClick={() => scrollToStep(2)} className="px-6 md:px-8 py-3 rounded-full border border-white/10 bg-white hover:bg-zinc-200 text-black font-semibold font-mono text-[10px] md:text-xs tracking-wider md:tracking-widest uppercase transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">
                    Continue Flow <span className="animate-bounce">↓</span>
                  </button>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Step 2: Voice FX Studio */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`min-h-[80vh] flex flex-col justify-center py-12 transition-opacity duration-700 ${!vocalBuffer ? 'opacity-30 pointer-events-none' : ''}`}
          >
            <GlassCard className="flex flex-col gap-8 p-8 md:p-12 bg-white/[0.02] border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase mb-3 block">
                  Stage 2
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-white mb-4 tracking-tight">
                  Voice FX Studio
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                  Polish your recording with vocal presets, reverb, compressor, equalizer, and pitch shift controls.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <VoiceEffectsPanel
                  vocalBuffer={vocalBuffer}
                  voiceFootprint={voiceFootprint}
                  isAutoVocal={isAutoVocal}
                  onEffectsChange={setEffectsOptions}
                />
              </div>

              <div className="flex justify-between items-center mt-8">
                <button onClick={() => scrollToStep(1)} className="text-zinc-400 hover:text-white font-mono text-[10px] md:text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
                <button onClick={() => scrollToStep(3)} className="px-6 md:px-8 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold font-mono text-[10px] md:text-xs tracking-wider md:tracking-widest uppercase transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] whitespace-nowrap">
                  Next Stage <span className="animate-bounce">↓</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Step 3: Mixing Desk */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "0px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`min-h-screen flex flex-col justify-center py-12 transition-opacity duration-700 ${!vocalBuffer ? 'opacity-30 pointer-events-none' : ''}`}
          >
            <GlassCard className="flex flex-col gap-8 p-8 md:p-12 bg-white/[0.02] border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
              <div>
                <span className="text-[10px] tracking-[0.3em] font-mono text-zinc-500 uppercase mb-3 block">
                  Stage 3
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-white mb-4 tracking-tight">
                  Mixing Desk
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                  Balance the volumes of your vocal track and your backing beat, then export the final mix.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <AudioMixer
                  vocalBuffer={vocalBuffer}
                  instrumentalBuffer={instrumentalBuffer}
                  effectsOptions={effectsOptions}
                  voiceFootprint={voiceFootprint}
                  isAutoVocal={isAutoVocal}
                  onMixComplete={setMixedAudio}
                />
              </div>

              {/* Master Output Preview right inline in Step 3 */}
              {mixedAudio && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 flex flex-col gap-6 pt-8 border-t border-white/10"
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="font-serif text-2xl text-white mb-1">Final Master Mix</h3>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
                        Ready to export • {Math.round(mixedAudio.duration)}s
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                    <WaveformVisualizer audioUrl={mixedAudio.blobUrl} />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsDownloading(true);
                        try {
                          saveAs(mixedAudio.blobUrl, `Cadenza_MasterMix.mp3`);
                          setToastType('success');
                          setToastMessage('MP3 Downloaded Successfully!');
                        } catch (e) {
                          console.error(e);
                          setToastType('error');
                          setToastMessage('Failed to download MP3.');
                        } finally {
                          setIsDownloading(false);
                        }
                      }}
                      disabled={!mixedAudio || isDownloading}
                      className="flex-1 font-bold py-4 bg-white/[0.05] border-white/10 hover:bg-white/[0.1] text-white"
                    >
                      {isDownloading ? 'Encoding MP3...' : '📥 Download Mix (.mp3)'}
                    </Button>
                    <Button
                      onClick={handleSaveMixedTrack}
                      disabled={!mixedAudio || isSaving}
                      className="flex-1 font-bold py-4 bg-white text-black hover:bg-zinc-200"
                    >
                      {isSaving ? 'Saving Master...' : '💾 Save to Dashboard'}
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                <button onClick={() => scrollToStep(2)} className="text-zinc-400 hover:text-white font-mono text-[10px] md:text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
              </div>
            </GlassCard>
          </motion.div>

        </div>

        {/* Right Column: Sticky Teleprompter */}
        <div className="w-full lg:w-96 relative hidden lg:block">
          <div className="sticky top-32">
            {renderTeleprompter()}
          </div>
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

export default function VoiceStudio() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <VoiceStudioContent />
    </Suspense>
  );
}
