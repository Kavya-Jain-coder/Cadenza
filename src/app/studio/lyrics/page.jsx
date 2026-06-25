'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@/lib/config/languages';
import { GENRES } from '@/lib/constants';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Toast from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export default function LyricStudio() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState('en');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  
  // Guided follow-ups
  const [mood, setMood] = useState('Nostalgic');
  const [tempo, setTempo] = useState('Mid');
  const [structure, setStructure] = useState('verse-chorus-verse');
  const [rhymeDensity, setRhymeDensity] = useState('moderate');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleNextStep = () => {
    if (step === 1 && !language) return;
    if (step === 2 && !seedPhrase.trim()) return;
    if (step === 3 && !selectedGenre) return;
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStep(5); // Transition to result display step

    try {
      const res = await fetch('/api/lyrics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          seedPhrase,
          genre: selectedGenre,
          mood,
          tempo,
          structure,
          rhymeDensity
        })
      });

      const data = await res.json();
      if (res.status === 401) {
        router.push('/auth');
        return;
      }

      if (data.error) {
        setToastType('error');
        setToastMessage(data.error);
        setStep(4); // Go back to form
        setIsGenerating(false);
        return;
      }

      setGeneratedLyrics(data);
      setToastType('success');
      setToastMessage('Lyrics generated successfully!');
    } catch (err) {
      setToastType('error');
      setToastMessage('An error occurred during generation.');
      setStep(4);
    } finally {
      setIsGenerating(false);
    }
  };

  // Editable lines handler
  const handleLineChange = (sectionIdx, lineIdx, newValue) => {
    setGeneratedLyrics((prev) => {
      if (!prev) return prev;
      const updatedSections = [...prev.sections];
      updatedSections[sectionIdx].lines[lineIdx] = newValue;
      return { ...prev, sections: updatedSections };
    });
  };

  const handleDownloadDocx = async () => {
    if (!generatedLyrics) return;

    const children = [];
    
    children.push(
      new Paragraph({
        text: generatedLyrics.title || 'Untitled Creation',
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 }
      })
    );

    generatedLyrics.sections.forEach(section => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: section.label, bold: true, color: "888888" })
          ],
          spacing: { before: 200, after: 100 }
        })
      );

      section.lines.forEach(line => {
        children.push(
          new Paragraph({
            text: line,
            spacing: { after: 50 }
          })
        );
      });
    });

    const doc = new Document({
      sections: [{ children }]
    });

    try {
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Cadenza_Lyrics_${(generatedLyrics.title || 'Untitled').replace(/\s+/g, '_')}.docx`);
      setToastType('success');
      setToastMessage('Lyrics Downloaded Successfully!');
    } catch (e) {
      console.error(e);
      setToastType('error');
      setToastMessage('Failed to create DOCX.');
    }
  };

  // Easing presets
  const primaryEase = [0.22, 1, 0.36, 1];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative py-20">
            
      <div className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: LANGUAGE SELECT */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ease: primaryEase, duration: 0.5 }}
            >
              <GlassCard className="text-center">
                <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
                  LYRIC STUDIO · STEP 1 OF 4
                </span>
                <h2 className="font-serif text-3xl text-white mb-6">
                  Select your lyrical tongue
                </h2>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-4 rounded-xl border font-mono tracking-wider text-xs uppercase transition-all ${
                        language === lang.code
                          ? 'border-theme-400 bg-theme-500/10 text-white shadow-[0_0_15px_rgba(214,156,23,0.2)]'
                          : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleNextStep}>Next Step →</Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 2: SEED PHRASE */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ease: primaryEase, duration: 0.5 }}
            >
              <GlassCard>
                <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
                  LYRIC STUDIO · STEP 2 OF 4
                </span>
                <h2 className="font-serif text-3xl text-white mb-2">
                  What's the song about?
                </h2>
                <p className="text-zinc-400 text-xs mb-6">
                  Type a theme, story, or list of words to inspire the AI lyricist.
                </p>

                <AnimatedInput
                  label="Seed Idea / Theme"
                  id="seedPhrase"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  placeholder="e.g. A neon-lit cafe at midnight, fading memories, finding hope"
                  required
                />

                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="secondary" onClick={handlePrevStep}>Back</Button>
                  <Button onClick={handleNextStep} disabled={!seedPhrase.trim()}>Next Step →</Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 3: GENRE SELECT */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ease: primaryEase, duration: 0.5 }}
            >
              <GlassCard className="relative overflow-hidden">
                {/* Visual backdrop of energetic pool image inside card as section backdrop */}
                <div
                  className="absolute inset-0 bg-cover bg-center -z-10 opacity-10 pointer-events-none"
                  style={{ backgroundImage: `url(/background_images/3301.jpg)` }}
                />

                <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
                  LYRIC STUDIO · STEP 3 OF 4
                </span>
                <h2 className="font-serif text-3xl text-white mb-6">
                  Choose a style genre
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {GENRES.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => setSelectedGenre(genre.id)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        selectedGenre === genre.id
                          ? 'border-theme-400 bg-theme-500/10 text-white shadow-[0_0_15px_rgba(214,156,23,0.2)] scale-[1.02]'
                          : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl">{genre.icon}</span>
                      <span className="text-[10px] font-mono tracking-wider uppercase">{genre.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={handlePrevStep}>Back</Button>
                  <Button onClick={handleNextStep} disabled={!selectedGenre}>Next Step →</Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 4: GUIDED FOLLOW-UPS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ease: primaryEase, duration: 0.5 }}
            >
              <GlassCard>
                <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
                  LYRIC STUDIO · STEP 4 OF 4
                </span>
                <h2 className="font-serif text-3xl text-white mb-6">
                  Tailor the aesthetic
                </h2>

                <div className="space-y-6">
                  {/* Mood Select */}
                  <div>
                    <span className="block text-[10px] tracking-widest font-mono text-theme-400 uppercase mb-2">Mood</span>
                    <div className="flex flex-wrap gap-2">
                      {['Happy', 'Sad', 'Angry', 'Nostalgic', 'Romantic'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMood(m)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            mood === m
                              ? 'border-theme-400 bg-theme-500/10 text-white'
                              : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tempo Select */}
                  <div>
                    <span className="block text-[10px] tracking-widest font-mono text-theme-400 uppercase mb-2">Tempo</span>
                    <div className="flex gap-2">
                      {['Slow', 'Mid', 'Fast'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTempo(t)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-all ${
                            tempo === t
                              ? 'border-theme-400 bg-theme-500/10 text-white'
                              : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Structure Select */}
                  <div>
                    <span className="block text-[10px] tracking-widest font-mono text-theme-400 uppercase mb-2">Structure</span>
                    <div className="flex gap-2">
                      {[
                        { id: 'verse-chorus-verse', name: 'Verse-Chorus-Verse' },
                        { id: 'freeform', name: 'Freeform' },
                        { id: 'verse-only', name: 'Verse Only' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStructure(s.id)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-all ${
                            structure === s.id
                              ? 'border-theme-400 bg-theme-500/10 text-white'
                              : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-8">
                  <Button variant="secondary" onClick={handlePrevStep}>Back</Button>
                  <Button onClick={handleGenerate}>Generate Lyrics ✨</Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* STEP 5: GENERATION & RESULT */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ease: primaryEase, duration: 0.5 }}
              className="w-full"
            >
              {isGenerating ? (
                <GlassCard className="text-center py-16">
                  <div className="flex justify-center mb-6">
                    <div className="flex items-end gap-[3px] h-10">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-[3px] bg-theme-400 rounded-full"
                          animate={{
                            height: [8, 36, 8]
                          }}
                          transition={{
                            duration: 0.5 + i * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-serif text-xl text-white mb-2">Composing your masterpiece...</h3>
                  <p className="text-zinc-500 text-xs font-mono tracking-widest uppercase">
                    Analyzing style grounding corpus
                  </p>
                </GlassCard>
              ) : (
                <GlassCard className="w-full">
                  <div className="flex justify-between items-center border-b border-theme-500/10 pb-4 mb-6">
                    <div>
                      <span className="text-[9px] font-mono text-theme-400 tracking-widest uppercase block mb-1">
                        AI GENERATED LYRICS
                      </span>
                      <h2 className="font-serif text-2xl text-white">
                        {generatedLyrics?.title || 'Untitled Creation'}
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={handleDownloadDocx}
                        className="py-2 px-4"
                      >
                        📥 Download (.docx)
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setGeneratedLyrics(null);
                          setStep(1);
                        }}
                        className="py-2 px-4"
                      >
                        Create New
                      </Button>
                      <Button
                        onClick={() => router.push(`/studio/instrumental?lyricId=${generatedLyrics?.id}`)}
                        className="py-2 px-4"
                      >
                        Compose Instrumental →
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
                    {generatedLyrics?.sections.map((section, sIdx) => (
                      <div key={sIdx} className="p-4 rounded-xl border border-white/5 bg-void/20">
                        <span className="text-[10px] font-mono text-theme-400 tracking-wider uppercase block mb-3">
                          {section.label}
                        </span>
                        <div className="space-y-2">
                          {section.lines.map((line, lIdx) => (
                            <input
                              key={lIdx}
                              type="text"
                              value={line}
                              onChange={(e) => handleLineChange(sIdx, lIdx, e.target.value)}
                              className="w-full bg-transparent text-sm text-zinc-300 hover:text-white focus:text-white focus:outline-none border-b border-transparent hover:border-white/10 focus:border-theme-400/50 py-1 transition-all"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
