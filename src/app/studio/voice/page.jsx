'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VOICE_ARCHETYPES } from '@/lib/constants';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import MockBadge from '@/components/ui/MockBadge';
import Toast from '@/components/ui/Toast';
import WaveformVisualizer from '@/components/ui/WaveformVisualizer';

function VoiceStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const preselectedInstrumentalId = searchParams.get('instrumentalId');

  const [instrumentalList, setInstrumentalList] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState(preselectedInstrumentalId || '');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  
  // Dynamic lyrics sync state
  const [lyricsData, setLyricsData] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [audioDuration, setAudioDuration] = useState(0);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Load instrumentals on mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      // Load user's instrumental history
      const { data: insts, error: instError } = await supabase
        .from('instrumentals')
        .select('id, created_at, lyric_id')
        .order('created_at', { ascending: false });

      if (instError) {
        setToastType('error');
        setToastMessage('Failed to load instrumentals history');
      } else {
        setInstrumentalList(insts || []);
        if (preselectedInstrumentalId) {
          setSelectedInstId(preselectedInstrumentalId);
          fetchLyricsForInstrumental(preselectedInstrumentalId);
        } else if (insts.length > 0) {
          setSelectedInstId(insts[0].id);
          fetchLyricsForInstrumental(insts[0].id);
        }
      }
    };

    fetchData();
  }, [supabase, router, preselectedInstrumentalId]);

  const fetchLyricsForInstrumental = async (instId) => {
    const targetInst = instrumentalList.find((i) => i.id === instId);
    const lyricId = targetInst?.lyric_id;
    
    if (lyricId) {
      const { data, error } = await supabase
        .from('lyrics')
        .select('title, sections')
        .eq('id', lyricId)
        .single();

      if (!error && data) {
        setLyricsData(data);
      }
    } else {
      setLyricsData(null);
    }
  };

  const handleInstrumentalChange = (id) => {
    setSelectedInstId(id);
    fetchLyricsForInstrumental(id);
  };

  const handleGenerate = async () => {
    if (!selectedArchetype) {
      setToastType('error');
      setToastMessage('Please select a voice archetype');
      return;
    }

    setIsGenerating(true);
    setResult(null);

    const targetInst = instrumentalList.find((i) => i.id === selectedInstId);

    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyricId: targetInst?.lyric_id || null,
          instrumentalId: selectedInstId || null,
          voiceArchetype: selectedArchetype
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
      setToastMessage('Voice applied and mixed successfully!');
    } catch (e) {
      setToastType('error');
      setToastMessage('Failed to apply voice model.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Set up duration and trigger dynamic lyrics syncing based on current time
  const handleWaveReady = (wsInstance) => {
    setAudioDuration(wsInstance.getDuration());

    wsInstance.on('audioprocess', () => {
      const currentTime = wsInstance.getCurrentTime();
      const duration = wsInstance.getDuration();
      
      if (lyricsData && lyricsData.sections.length > 0) {
        // Divide duration equally across lyric sections
        const segmentDuration = duration / lyricsData.sections.length;
        const activeIndex = Math.floor(currentTime / segmentDuration);
        setCurrentSectionIndex(activeIndex);
      }
    });

    wsInstance.on('finish', () => {
      setCurrentSectionIndex(-1);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative py-24">
      <BackgroundImage route="/studio/voice" />
      <GoldWaveSVG speedMultiplier={0.5} density={3} />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Settings Panel */}
        <GlassCard className="flex flex-col gap-6">
          <div>
            <span className="text-[10px] tracking-[0.25em] font-mono text-gold-400 uppercase mb-2 block">
              VOICE STUDIO
            </span>
            <h2 className="font-serif text-2xl text-white mb-2">
              Select a vocal signature
            </h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Match your backing track with a generic legal-safe voice archetype. Adjust the dynamics and tone templates.
            </p>
          </div>

          {/* Instrumental Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] tracking-widest font-mono text-gold-400 uppercase">
              Select Backing Instrumental
            </label>
            <select
              value={selectedInstId}
              onChange={(e) => handleInstrumentalChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-void/60 text-white rounded-lg border border-white/10 focus:border-gold-400 focus:outline-none text-xs font-mono"
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

          {/* Voice Archetype Pick Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] tracking-widest font-mono text-gold-400 uppercase">
              Voice Archetype List
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {VOICE_ARCHETYPES.map((arch) => {
                const isSelected = selectedArchetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setSelectedArchetype(arch.id)}
                    className={`w-full p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'border-gold-400 bg-gold-500/10 text-white shadow-[0_0_15px_rgba(214,156,23,0.15)]'
                        : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{arch.icon}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{arch.name}</span>
                      <span className="text-[9px] text-zinc-400 leading-normal">{arch.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedArchetype || !selectedInstId}
            className="w-full mt-4"
          >
            {isGenerating ? 'Mixing vocals...' : 'Compose Track ✨'}
          </Button>
        </GlassCard>

        {/* Combined Output Player Panel */}
        <div className="flex flex-col gap-6">
          <GlassCard className="flex flex-col gap-4 flex-grow">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-[10px] tracking-widest font-mono text-gold-400 uppercase">
                Studio Monitor
              </span>
              <MockBadge text="Mocked Preview" tooltip="Vocal archetypes are mapped to template files. High fidelity AI voice synthesis models coming soon." />
            </div>

            {isGenerating && (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  Rendering vocal track...
                </span>
              </div>
            )}

            {!isGenerating && !result && (
              <div className="py-20 border border-dashed border-white/10 rounded-xl flex items-center justify-center bg-void/20">
                <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
                  Ready to mix vocal layers
                </span>
              </div>
            )}

            {!isGenerating && result && (
              <div className="flex flex-col gap-4">
                {/* Active settings badge */}
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-gold-950/20 border border-gold-500/10 text-[8px] font-mono text-gold-300 uppercase">
                    VOCALS: {VOICE_ARCHETYPES.find((v) => v.id === result.voiceArchetype)?.name}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    Mixed {new Date(result.metadata.synthesized_at).toLocaleTimeString()}
                  </span>
                </div>

                {/* Wavesurfer sound render */}
                <WaveformVisualizer audioUrl={result.audioUrl} onReady={handleWaveReady} />

                {/* Synced Lyrics Highlighting */}
                {lyricsData && (
                  <div className="mt-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                      Synced Teleprompter
                    </span>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {lyricsData.sections.map((section, index) => {
                        const isHighlighted = index === currentSectionIndex;
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border transition-all duration-300 ${
                              isHighlighted
                                ? 'border-gold-400 bg-gold-500/10 text-white shadow-[0_0_10px_rgba(214,156,23,0.1)]'
                                : 'border-white/5 bg-void/25 opacity-40'
                            }`}
                          >
                            <span className="text-[8px] font-mono text-gold-400 block mb-1 uppercase tracking-wider">
                              {section.label}
                            </span>
                            <p className="text-xs italic leading-relaxed text-zinc-300">
                              {section.lines.join(' / ')}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end mt-4">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full text-center"
                  >
                    View in My Creations Dashboard
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

export default function VoiceStudio() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-obsidian">
        <div className="w-8 h-8 border-2 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
      </div>
    }>
      <VoiceStudioContent />
    </Suspense>
  );
}

