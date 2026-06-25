'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { VOICE_EFFECTS_PRESETS } from '@/lib/constants';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import WaveformVisualizer from '@/components/ui/WaveformVisualizer';
import VoiceRecorder from '@/components/ui/VoiceRecorder';
import VoiceEffectsPanel from '@/components/ui/VoiceEffectsPanel';
import AudioMixer from '@/components/ui/AudioMixer';
import StepIndicator from '@/components/ui/StepIndicator';
import { fetchAndDecode, audioBufferToMp3 } from '@/lib/audio/audioUtils';
import { saveAs } from 'file-saver';

function VoiceStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const preselectedInstrumentalId = searchParams.get('instrumentalId');

  // Step state: 1 = Setup & Record, 2 = Voice FX Studio, 3 = Mixing Desk
  const [step, setStep] = useState(1);

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
    // Reset any existing recording when track changes
    setVocalBuffer(null);
    setVocalBlob(null);
    setMixedAudio(null);
    setIsAutoVocal(false);
  };

  // Karaoke player sync triggers
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

  // Pause instrumental playback when switching steps
  useEffect(() => {
    handleRecordingStop();
  }, [step]);

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
      // Extract all lyric text
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
        // Decode all chunks
        const decodedBuffers = await Promise.all(data.audioChunks.map(async (b64) => {
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return await audioCtx.decodeAudioData(bytes.buffer);
        }));

        // Concatenate buffers
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
      setToastMessage('Auto-Vocals generated successfully!');
      setStep(2); // Move to FX stage
    } catch (err) {
      console.error(err);
      setToastType('error');
      setToastMessage('Failed to generate Auto-Vocals.');
    } finally {
      setIsAutoSinging(false);
    }
  };

    return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative py-24 bg-obsidian text-white">
      <BackgroundImage route="/studio/voice" />
      <GoldWaveSVG speedMultiplier={0.3} density={2.5} />

      <div className="w-full max-w-4xl relative z-10">
        {/* Step Indicator */}
        <StepIndicator 
          currentStep={step} 
          totalSteps={3} 
          label={
            step === 1 ? "Record Vocals" : 
            step === 2 ? "Voice Studio Effects" : 
            "Mixing & Mastering"
          } 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mt-4">
          
          {/* Main Controls Panel (Left Card) */}
          <GlassCard className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="flex flex-col gap-5 flex-grow"
                >
                  <div>
                    <span className="text-[9px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-1 block">
                      Step 1 of 3
                    </span>
                    <h2 className="font-serif text-2xl text-white mb-2">
                      Record Your Vocal Take
                    </h2>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Select your backing track session, put on headphones, and tap record to sing.
                    </p>
                  </div>

                  {/* Instrumental Selector */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] tracking-widest font-mono text-theme-400 uppercase">
                        Select backing session
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
                          className="text-[9px] font-mono text-theme-400 hover:text-white transition-colors underline uppercase tracking-wider cursor-pointer"
                        >
                          Modify Beat 🎵
                        </button>
                      )}
                    </div>
                    <select
                      value={selectedInstId}
                      onChange={(e) => handleInstrumentalChange(e.target.value)}
                      disabled={instrumentalList.length === 0}
                      className="w-full px-4 py-2.5 bg-void/60 text-white rounded-lg border border-white/10 focus:border-theme-400 focus:outline-none text-xs font-mono"
                    >
                      {instrumentalList.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          Beat Session: {inst.id.substring(0, 8)}... ({new Date(inst.created_at).toLocaleDateString()})
                        </option>
                      ))}
                      {instrumentalList.length === 0 && (
                        <option value="">No backing tracks available</option>
                      )}
                    </select>
                  </div>

                  {instrumentalList.length === 0 ? (
                    <div className="flex flex-col gap-4 items-center justify-center p-8 border border-dashed border-white/10 rounded-xl bg-void/25">
                      <span className="text-zinc-500 font-mono text-[9px] text-center uppercase tracking-wider">
                        You need an instrumental session to record vocals.
                      </span>
                      <Button onClick={() => router.push('/studio/instrumental')} className="text-xs">
                        Create Backing Track 🎵
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Voice Recorder Component */}
                      <div className="p-4 rounded-xl border border-white/5 bg-void/20">
                        {isDecodingInstrumental ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <div className="w-6 h-6 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin" />
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                              Loading backing track...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            <VoiceRecorder
                              onRecordingStart={handleRecordingStart}
                              onRecordingStop={handleRecordingStop}
                              onRecordingReset={handleRecordingReset}
                              onRecordingComplete={handleRecordingComplete}
                            />

                            {/* Auto-Sing Option */}
                            {voiceFootprint && (
                              <div className="border-t border-white/10 pt-4 flex flex-col items-center gap-3">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                                  OR USE YOUR VOICE FOOTPRINT
                                </span>
                                <Button
                                  variant="secondary"
                                  onClick={handleAutoSing}
                                  disabled={isAutoSinging || !lyricsData}
                                  className="w-full text-xs py-3 border border-theme-500/30 text-theme-400 flex justify-center items-center gap-2 bg-theme-950/20 hover:bg-theme-950/40"
                                >
                                  {isAutoSinging ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin" />
                                      Generating Vocoder Track...
                                    </>
                                  ) : (
                                    '🤖 Auto-Sing Lyrics (Vocoder)'
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Advance to Step 2 */}
                      <Button
                        disabled={!vocalBuffer}
                        onClick={() => setStep(2)}
                        className="w-full mt-2 font-bold"
                      >
                        Proceed to Voice FX Studio →
                      </Button>
                    </>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="flex flex-col gap-5 flex-grow"
                >
                  <div>
                    <span className="text-[9px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-1 block">
                      Step 2 of 3
                    </span>
                    <h2 className="font-serif text-2xl text-white mb-2">
                      Voice FX Studio
                    </h2>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Polish your recording with vocal presets, reverb, compressor, equalizer, and pitch shift controls.
                    </p>
                  </div>

                  {/* Effects Panel Component */}
                  <div className="p-4 rounded-xl border border-white/5 bg-void/20">
                    <VoiceEffectsPanel
                      vocalBuffer={vocalBuffer}
                      voiceFootprint={voiceFootprint}
                      isAutoVocal={isAutoVocal}
                      onEffectsChange={setEffectsOptions}
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(1)}
                      className="flex-1 text-zinc-400 border border-white/10 hover:border-white/20"
                    >
                      ← Back to Record
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1 font-bold"
                    >
                      Next: Mixing Desk →
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  className="flex flex-col gap-5 flex-grow"
                >
                  <div>
                    <span className="text-[9px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-1 block">
                      Step 3 of 3
                    </span>
                    <h2 className="font-serif text-2xl text-white mb-2">
                      Mixing Desk
                    </h2>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Balance the volumes of your vocal track and your backing beat, then export the final mix.
                    </p>
                  </div>

                  {/* Audio Mixer Component */}
                  <div className="p-4 rounded-xl border border-white/5 bg-void/20">
                    <AudioMixer
                      vocalBuffer={vocalBuffer}
                      instrumentalBuffer={instrumentalBuffer}
                      effectsOptions={effectsOptions}
                      voiceFootprint={voiceFootprint}
                      isAutoVocal={isAutoVocal}
                      onMixComplete={setMixedAudio}
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(2)}
                      className="text-zinc-400 border border-white/10 hover:border-white/20"
                    >
                      ← Back to FX
                    </Button>
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
                      className="flex-1 font-bold border border-white/10 hover:border-white/20"
                    >
                      {isDownloading ? 'Encoding MP3...' : '📥 Download Mix (.mp3)'}
                    </Button>
                    <Button
                      onClick={handleSaveMixedTrack}
                      disabled={!mixedAudio || isSaving}
                      className="flex-1 font-bold"
                    >
                      {isSaving ? 'Saving Master...' : '💾 Save to Dashboard'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Context Monitor (Right Card: Teleprompter / Visualizer Monitor) */}
          <GlassCard className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[9px] tracking-widest font-mono text-theme-400 uppercase">
                {step === 3 && mixedAudio ? "Master Output Preview" : "Vocal Teleprompter"}
              </span>
              <span className="px-2 py-0.5 rounded bg-theme-950/20 border border-theme-500/10 text-[8px] font-mono text-theme-300 uppercase">
                {step === 1 ? "REC STATE" : step === 2 ? "VIRTUAL STUDIO" : "FINAL MASTER"}
              </span>
            </div>

            {/* If step 3 is mixed, show final Master player */}
            {step === 3 && mixedAudio ? (
              <div className="flex flex-col gap-4 py-8 justify-center flex-grow">
                <div className="text-center">
                  <span className="px-2 py-0.5 rounded bg-green-950/20 border border-green-500/20 text-[9px] font-mono text-green-400 uppercase">
                    Ready to persist
                  </span>
                  <h3 className="font-serif text-lg text-white mt-2 mb-1">Your Completed Creation</h3>
                  <p className="text-zinc-500 text-[10px]">Length: {Math.round(mixedAudio.duration)} seconds • Stereo WAV</p>
                </div>

                <div className="p-4 rounded-lg bg-void/40 border border-white/5">
                  <WaveformVisualizer audioUrl={mixedAudio.blobUrl} />
                </div>
              </div>
            ) : (
              /* Otherwise, show Teleprompter lyrics scroll */
              <div className="flex flex-col gap-3 flex-grow justify-start">
                {lyricsData ? (
                  <>
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                        Song Theme & Lyrics
                      </span>
                      <h3 className="font-serif text-lg text-white italic">
                        &ldquo;{lyricsData.title}&rdquo;
                      </h3>
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 mt-2 flex-grow">
                      {lyricsData.sections.map((section, index) => {
                        const isHighlighted = index === currentSectionIndex;
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border transition-all duration-300 ${
                              isHighlighted
                                ? 'border-theme-400 bg-theme-500/10 text-white shadow-[0_0_10px_rgba(214,156,23,0.1)] scale-[1.01]'
                                : 'border-white/5 bg-void/25 opacity-30 scale-95'
                            }`}
                          >
                            <span className="text-[8px] font-mono text-theme-400 block mb-1 uppercase tracking-wider">
                              {section.label}
                            </span>
                            <p className="text-xs italic leading-relaxed text-zinc-300">
                              {section.lines.join(' / ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-white/10 rounded-xl bg-void/25 flex-grow">
                    <span className="text-zinc-600 text-2xl mb-2">🎤</span>
                    <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest max-w-[200px] leading-relaxed">
                      Select a Backing Track with Lyrics to Load Teleprompter
                    </span>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
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
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-theme-400/20 border-t-theme-400 rounded-full animate-spin" />
      </div>
    }>
      <VoiceStudioContent />
    </Suspense>
  );
}
