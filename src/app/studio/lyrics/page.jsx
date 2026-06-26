'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@/lib/config/languages';
import { GENRES } from '@/lib/constants';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Toast from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export default function LyricStudio() {
  const router = useRouter();
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

  const scrollToStep = (stepNum) => {
    const el = document.getElementById(`step-${stepNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGenerate = async () => {
    if (!seedPhrase.trim() || !selectedGenre) {
      setToastType('error');
      setToastMessage('Please fill in the seed phrase and select a genre first.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => scrollToStep(5), 100);

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
        setIsGenerating(false);
        setTimeout(() => scrollToStep(4), 100);
        return;
      }

      setGeneratedLyrics(data);
      setToastType('success');
      setToastMessage('Lyrics generated successfully!');
    } catch (err) {
      setToastType('error');
      setToastMessage('An error occurred during generation.');
      setTimeout(() => scrollToStep(4), 100);
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

  const primaryEase = [0.22, 1, 0.36, 1];
  const motionProps = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: false, amount: 0.5 },
    transition: { ease: primaryEase, duration: 0.8 }
  };

  return (
    <div className="w-full relative bg-void">
      
      {/* STEP 1: LANGUAGE SELECT */}
      <div id="step-1" className="min-h-screen w-full snap-center flex items-center justify-center p-4 relative">
        <motion.div {...motionProps} className="w-full max-w-2xl">
          <GlassCard className="text-center relative">
            <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
              LYRIC STUDIO · STEP 1 OF 4
            </span>
            <h2 className="font-serif text-3xl text-white mb-6">
              Select your lyrical tongue
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-12">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setTimeout(() => scrollToStep(2), 400);
                  }}
                  className={`p-4 rounded-xl border font-mono tracking-wider text-xs uppercase transition-all hover:-translate-y-1 ${
                    language === lang.code
                      ? 'border-theme-400 bg-theme-500/10 text-white shadow-[0_0_15px_rgba(214,156,23,0.2)]'
                      : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button onClick={() => scrollToStep(2)}>Next Step ↓</Button>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-4 opacity-50">Or scroll down</span>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* STEP 2: SEED PHRASE */}
      <div id="step-2" className="min-h-screen w-full snap-center flex items-center justify-center p-4 relative">
        <motion.div {...motionProps} className="w-full max-w-2xl">
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

            <div className="flex justify-between items-center mt-8">
              <Button variant="secondary" onClick={() => scrollToStep(1)}>↑ Back</Button>
              <Button onClick={() => scrollToStep(3)} disabled={!seedPhrase.trim()}>Next Step ↓</Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* STEP 3: GENRE SELECT */}
      <div id="step-3" className="min-h-screen w-full snap-center flex items-center justify-center p-4 relative">
        <motion.div {...motionProps} className="w-full max-w-2xl">
          <GlassCard className="relative overflow-hidden">
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
                  onClick={() => {
                    setSelectedGenre(genre.id);
                    setTimeout(() => scrollToStep(4), 400);
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all hover:-translate-y-1 ${
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

            <div className="flex justify-between items-center">
              <Button variant="secondary" onClick={() => scrollToStep(2)}>↑ Back</Button>
              <Button onClick={() => scrollToStep(4)} disabled={!selectedGenre}>Next Step ↓</Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* STEP 4: GUIDED FOLLOW-UPS */}
      <div id="step-4" className="min-h-screen w-full snap-center flex items-center justify-center p-4 relative">
        <motion.div {...motionProps} className="w-full max-w-2xl">
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
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all hover:-translate-y-0.5 ${
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
                      className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-all hover:-translate-y-0.5 ${
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
                      className={`flex-1 py-2 rounded-lg border text-xs font-mono transition-all hover:-translate-y-0.5 ${
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

            <div className="flex justify-between items-center mt-8">
              <Button variant="secondary" onClick={() => scrollToStep(3)}>↑ Back</Button>
              <Button onClick={handleGenerate} disabled={!seedPhrase.trim() || !selectedGenre}>Generate Lyrics ✨</Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* STEP 5: GENERATION & RESULT */}
      {(isGenerating || generatedLyrics) && (
        <div id="step-5" className="min-h-screen w-full snap-center flex items-center justify-center p-4 relative">
          <motion.div {...motionProps} className="w-full max-w-2xl">
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
                        scrollToStep(1);
                        setSeedPhrase('');
                        setSelectedGenre('');
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
        </div>
      )}

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
