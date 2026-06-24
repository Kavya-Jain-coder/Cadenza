'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { INSTRUMENTS } from '@/lib/constants';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import MockBadge from '@/components/ui/MockBadge';
import WaveformVisualizer from '@/components/ui/WaveformVisualizer';
import Toast from '@/components/ui/Toast';
import { generateProceduralBeat } from '@/lib/audio/beatGenerator';
import { audioBufferToMp3, fetchAndDecode } from '@/lib/audio/audioUtils';
import { saveAs } from 'file-saver';

function InstrumentalStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
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
          
          // Auto-select first or preselected lyric genre
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
        // Remove from list & delete settings
        const nextSettings = { ...instrumentSettings };
        delete nextSettings[instId];
        setInstrumentSettings(nextSettings);
        return prev.filter((id) => id !== instId);
      } else {
        // Add to list & populate default settings
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative py-24">
      <BackgroundImage route="/studio/instrumental" />
      <GoldWaveSVG speedMultiplier={0.5} density={3} />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Editor Settings Panel */}
        <GlassCard className="flex flex-col gap-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-mono text-gold-400 uppercase mb-2 block">
              INSTRUMENTAL STUDIO
            </span>
            <h2 className="font-serif text-2xl text-white mb-2">
              Design the soundscape
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Select lyrics and layer instrument stems. Adjust the filters and compression qualities for each element.
            </p>
          </div>

          {/* Select Lyrics */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] tracking-widest font-mono text-gold-400 uppercase">
              Lyric History Target
            </label>
            <select
              value={selectedLyricId}
              onChange={(e) => handleLyricChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-void/60 text-white rounded-lg border border-white/10 focus:border-gold-400 focus:outline-none text-xs font-mono"
            >
              <option value="">No lyrics targeted (standalone beat)</option>
              {lyricsList.map((lyric) => (
                <option key={lyric.id} value={lyric.id}>
                  {lyric.title} ({lyric.genre.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Instruments Pick Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] tracking-widest font-mono text-gold-400 uppercase">
              Select Instrument Stems
            </label>
            <div className="grid grid-cols-3 gap-2">
              {INSTRUMENTS.map((inst) => {
                const isSelected = selectedInstruments.includes(inst.id);
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => toggleInstrument(inst.id)}
                    className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-gold-400 bg-gold-500/10 text-white'
                        : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg">{inst.icon}</span>
                    <span className="text-[9px] font-mono tracking-wider uppercase">{inst.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleCompose}
            disabled={isGenerating || selectedInstruments.length === 0}
            className="w-full mt-4"
          >
            {isGenerating ? 'Synthesizing Beats...' : 'Compose Instrumental ✨'}
          </Button>
        </GlassCard>

        {/* Configuration Panel and Audio Player */}
        <div className="flex flex-col gap-6">
          {/* Stem Parameters */}
          {selectedInstruments.length > 0 && (
            <GlassCard className="flex-grow max-h-[300px] overflow-y-auto">
              <label className="text-[10px] tracking-widest font-mono text-gold-400 uppercase mb-4 block">
                Stem Configurations
              </label>
              <div className="space-y-4">
                {selectedInstruments.map((id) => {
                  const inst = INSTRUMENTS.find((i) => i.id === id);
                  const settings = instrumentSettings[id] || { quality: 'Standard', effect: 'None' };
                  return (
                    <div key={id} className="p-3 rounded-lg border border-white/5 bg-void/20 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-white flex items-center gap-2">
                          <span>{inst?.icon}</span> {inst?.name}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div>
                          <label className="text-[8px] font-mono text-zinc-500 block uppercase mb-1">Quality</label>
                          <div className="flex bg-void/60 rounded p-[2px] border border-white/5">
                            {['Low', 'Standard', 'High'].map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => handleSettingChange(id, 'quality', q)}
                                className={`flex-1 py-1 text-[8px] font-mono rounded transition-colors uppercase ${
                                  settings.quality === q
                                    ? 'bg-gold-500/20 text-gold-300'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[8px] font-mono text-zinc-500 block uppercase mb-1">Effect Filter</label>
                          <select
                            value={settings.effect}
                            onChange={(e) => handleSettingChange(id, 'effect', e.target.value)}
                            className="w-full px-2 py-1 bg-void/60 text-white rounded border border-white/5 focus:outline-none text-[8px] font-mono uppercase"
                          >
                            <option value="None">None</option>
                            <option value="Reverb">Reverb</option>
                            <option value="Distortion">Distortion</option>
                            <option value="Echo">Echo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Composer Preview Output */}
          <GlassCard className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-widest font-mono text-gold-400 uppercase">
                COMPOSER PREVIEW
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

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="w-6 h-6 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  Synthesizing stems...
                </span>
              </div>
            )}

            {!isGenerating && !result && (
              <div className="py-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center bg-void/20">
                <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                  No track composed yet
                </span>
              </div>
            )}

            {!isGenerating && result && (
              <div className="flex flex-col gap-4">
                {/* Active Stem Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {result.instruments.map((inst, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded bg-gold-950/20 border border-gold-500/10 text-[8px] font-mono text-gold-300 uppercase"
                    >
                      {inst.name} ({inst.quality} · {inst.effect})
                    </span>
                  ))}
                </div>

                {/* Wavesurfer Player */}
                <WaveformVisualizer audioUrl={result.audioUrl} />

                <div className="flex gap-3 justify-end mt-2">
                  <Button
                    variant="secondary"
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
                    className="flex-1 text-center"
                  >
                    {isDownloading ? 'Encoding MP3...' : '📥 Download (.mp3)'}
                  </Button>
                  <Button
                    onClick={() => router.push(`/studio/voice?instrumentalId=${result.id}`)}
                    className="flex-1 text-center"
                  >
                    Proceed to Voice Studio →
                  </Button>
                </div>
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

export default function InstrumentalStudio() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
      </div>
    }>
      <InstrumentalStudioContent />
    </Suspense>
  );
}
