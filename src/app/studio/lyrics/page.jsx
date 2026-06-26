'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LANGUAGES } from '@/lib/config/languages';
import { GENRES } from '@/lib/constants';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Toast from '@/components/ui/Toast';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Premium Background Orbs for the Awwwards aesthetic
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
      className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] mix-blend-screen"
    />
    <motion.div
      animate={{
        scale: [1, 1.5, 1],
        x: [0, -100, 0],
        y: [0, 100, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-zinc-500/10 rounded-full blur-[150px] mix-blend-screen"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-600/5 rounded-full blur-[100px] mix-blend-screen"
    />
    {/* Optional subtle noise overlay */}
    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
  </div>
);

import { useLenis } from 'lenis/react';

export default function LyricStudio() {
  const router = useRouter();
  const lenis = useLenis();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  
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

  const handleGenerate = async () => {
    if (!seedPhrase.trim() || !selectedGenre) {
      setToastType('error');
      setToastMessage('Please fill in the seed phrase and select a genre first.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => scrollToStep(5), 200);

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
      setTimeout(() => scrollToStep(5), 200);
    } catch (err) {
      setToastType('error');
      setToastMessage('An error occurred during generation.');
      setTimeout(() => scrollToStep(4), 100);
    } finally {
      setIsGenerating(false);
    }
  };

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
          className="w-[50vw] h-[50vw] rounded-full border-[1px] border-theme-500/30 mix-blend-screen"
        />
        <motion.div 
          style={{ 
            rotate: useTransform(scrollYProgress, [0, 1], [0, -180]),
            scale: useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.7, 1.1]),
            opacity: useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 0.2, 0.2, 0])
          }}
          className="absolute w-[35vw] h-[35vw] rounded-full border-[1px] border-white/20 mix-blend-screen"
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* STEP 1: LANGUAGE SELECT */}
        <div id="step-1" className="min-h-screen w-full flex flex-col justify-center items-start py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsLeft} className="w-full max-w-2xl">
            <GlassCard className="text-center p-10 md:p-16 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                  Phase 01 / Linguistics
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-6xl text-white mb-12 drop-shadow-2xl">
                Select your lyrical tongue
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-16">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setTimeout(() => scrollToStep(2), 400);
                    }}
                    className={`px-4 py-8 rounded-2xl border transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden ${
                      language === lang.code
                        ? 'border-theme-400/50 bg-gradient-to-b from-theme-500/20 to-theme-600/5 text-white shadow-[0_10px_30px_rgba(214,156,23,0.15)] scale-105'
                        : 'border-white/5 bg-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10 hover:shadow-xl'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 transition-opacity duration-500 ${language === lang.code ? 'opacity-100' : 'group-hover:opacity-30'}`} />
                    <span className="relative z-10 text-lg md:text-xl font-mono tracking-widest">{lang.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center">
                <button onClick={() => scrollToStep(2)} className="px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono text-xs tracking-widest uppercase transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md">
                  Continue Flow <span className="animate-bounce">↓</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* STEP 2: SEED PHRASE */}
        <div id="step-2" className="min-h-screen w-full flex flex-col justify-center items-end py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsRight} className="w-full max-w-2xl">
            <GlassCard className="p-10 md:p-16 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                  Phase 02 / Inspiration
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 drop-shadow-2xl">
                What's the story?
              </h2>
              <p className="text-zinc-400 text-sm md:text-base font-light mb-10 max-w-xl">
                Describe your theme, story, or list of words to inspire the Cadenza engine. The more vivid the imagery, the better the lyrics.
              </p>

              <div className="relative mb-12 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-theme-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <AnimatedInput
                    label="Seed Idea / Theme"
                    id="seedPhrase"
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    placeholder="e.g. A neon-lit cafe at midnight, fading memories, finding hope"
                    required
                    className="text-lg py-6 bg-zinc-900/80 backdrop-blur-xl border-white/10"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => scrollToStep(1)} className="text-zinc-400 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
                <button 
                  onClick={() => scrollToStep(3)} 
                  disabled={!seedPhrase.trim()}
                  className="px-8 py-4 rounded-full bg-theme-500 hover:bg-theme-400 text-black font-semibold font-mono text-xs tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(214,156,23,0.3)]"
                >
                  Next Stage <span>↓</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* STEP 3: GENRE SELECT */}
        <div id="step-3" className="min-h-screen w-full flex flex-col justify-center items-start py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsLeft} className="w-full max-w-2xl">
            <GlassCard className="relative overflow-hidden p-10 md:p-16 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div
                className="absolute inset-0 bg-cover bg-center -z-10 opacity-[0.05] pointer-events-none mix-blend-screen"
                style={{ backgroundImage: `url(/background_images/3301.jpg)` }}
              />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                  Phase 03 / Sonic Profile
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-6xl text-white mb-12 drop-shadow-2xl">
                Choose a style genre
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                {GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => {
                      setSelectedGenre(genre.id);
                      setTimeout(() => scrollToStep(4), 400);
                    }}
                    className={`p-6 md:p-8 rounded-3xl border flex flex-col items-center justify-center gap-4 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden ${
                      selectedGenre === genre.id
                        ? 'border-theme-400/50 bg-gradient-to-br from-theme-500/20 to-purple-500/10 text-white shadow-[0_15px_40px_rgba(214,156,23,0.2)] scale-105'
                        : 'border-white/5 bg-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 transition-opacity duration-500 ${selectedGenre === genre.id ? 'opacity-100' : 'group-hover:opacity-30'}`} />
                    <span className="relative z-10 text-4xl md:text-5xl group-hover:scale-110 transition-transform duration-500">{genre.icon}</span>
                    <span className="relative z-10 text-[11px] font-mono tracking-[0.2em] uppercase mt-2">{genre.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => scrollToStep(2)} className="text-zinc-400 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
                <button 
                  onClick={() => scrollToStep(4)} 
                  disabled={!selectedGenre}
                  className="px-8 py-4 rounded-full bg-theme-500 hover:bg-theme-400 text-black font-semibold font-mono text-xs tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-[0_0_20px_rgba(214,156,23,0.3)]"
                >
                  Next Stage <span>↓</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* STEP 4: GUIDED FOLLOW-UPS */}
        <div id="step-4" className="min-h-screen w-full flex flex-col justify-center items-end py-24 px-4 sm:px-8 lg:px-16">
          <motion.div {...motionPropsRight} className="w-full max-w-2xl">
            <GlassCard className="p-10 md:p-16 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-theme-400 animate-pulse shadow-[0_0_12px_rgba(214,156,23,0.8)]" />
                <span className="text-[11px] tracking-[0.3em] font-mono text-theme-400 uppercase">
                  Phase 04 / Nuance
                </span>
              </div>
              <h2 className="font-serif text-4xl md:text-6xl text-white mb-12 drop-shadow-2xl">
                Tailor the aesthetic
              </h2>

              <div className="space-y-10 mb-16">
                {/* Mood Select */}
                <div>
                  <span className="block text-xs tracking-[0.2em] font-mono text-zinc-500 uppercase mb-4">Core Emotion / Mood</span>
                  <div className="flex flex-wrap gap-3">
                    {['Happy', 'Sad', 'Angry', 'Nostalgic', 'Romantic'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMood(m)}
                        className={`px-5 py-2.5 rounded-full border text-sm font-mono transition-all duration-300 ${
                          mood === m
                            ? 'border-theme-400 bg-theme-500/20 text-white shadow-[0_0_15px_rgba(214,156,23,0.2)]'
                            : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempo Select */}
                <div>
                  <span className="block text-xs tracking-[0.2em] font-mono text-zinc-500 uppercase mb-4">Rhythmic Pacing / Tempo</span>
                  <div className="flex gap-3">
                    {['Slow', 'Mid', 'Fast'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTempo(t)}
                        className={`flex-1 py-3 rounded-full border text-sm font-mono transition-all duration-300 ${
                          tempo === t
                            ? 'border-theme-400 bg-theme-500/20 text-white shadow-[0_0_15px_rgba(214,156,23,0.2)]'
                            : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Structure Select */}
                <div>
                  <span className="block text-xs tracking-[0.2em] font-mono text-zinc-500 uppercase mb-4">Song Architecture / Structure</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[
                      { id: 'verse-chorus-verse', name: 'Verse-Chorus-Verse' },
                      { id: 'freeform', name: 'Freeform' },
                      { id: 'verse-only', name: 'Verse Only' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStructure(s.id)}
                        className={`flex-1 py-3 px-4 rounded-full border text-sm font-mono transition-all duration-300 ${
                          structure === s.id
                            ? 'border-theme-400 bg-theme-500/20 text-white shadow-[0_0_15px_rgba(214,156,23,0.2)]'
                            : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => scrollToStep(3)} className="text-zinc-400 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors flex items-center gap-2">
                  <span>↑</span> Back
                </button>
                <button 
                  onClick={handleGenerate} 
                  disabled={!seedPhrase.trim() || !selectedGenre}
                  className="px-10 py-4 rounded-full bg-gradient-to-r from-theme-500 to-theme-400 hover:from-theme-400 hover:to-theme-300 text-black font-bold font-mono text-sm tracking-widest uppercase transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-3 shadow-[0_0_30px_rgba(214,156,23,0.4)]"
                >
                  Generate Masterpiece <span>✨</span>
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* STEP 5: GENERATION & RESULT */}
        {(isGenerating || generatedLyrics) && (
          <div id="step-5" className="min-h-screen w-full flex flex-col justify-center items-center py-24 px-4 sm:px-8 lg:px-16">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ ease: primaryEase, duration: 1.2 }}
              className="w-full max-w-4xl"
            >
              {isGenerating ? (
                <GlassCard className="text-center py-24 border-theme-400/30 bg-theme-900/10 shadow-[0_0_50px_rgba(214,156,23,0.1)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-theme-500/5 to-transparent pointer-events-none" />
                  <div className="flex justify-center mb-8 relative z-10">
                    <div className="flex items-end gap-1.5 h-16">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-theme-400 rounded-full shadow-[0_0_10px_rgba(214,156,23,0.8)]"
                          animate={{
                            height: [12, 64, 12]
                          }}
                          transition={{
                            duration: 0.8 + Math.random() * 0.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="font-serif text-3xl md:text-4xl text-white mb-4 relative z-10">Composing your masterpiece</h3>
                  <p className="text-theme-400/80 text-sm font-mono tracking-[0.2em] uppercase relative z-10">
                    Analyzing style grounding corpus...
                  </p>
                </GlassCard>
              ) : (
                <GlassCard className="w-full p-8 md:p-12 border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 mb-8 gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                        <span className="text-[11px] font-mono text-green-400 tracking-[0.3em] uppercase block">
                          AI GENERATED SUCCESS
                        </span>
                      </div>
                      <h2 className="font-serif text-4xl md:text-5xl text-white drop-shadow-xl">
                        {generatedLyrics?.title || 'Untitled Creation'}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleDownloadDocx}
                        className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-mono text-xs tracking-widest uppercase transition-all hover:-translate-y-0.5 flex items-center gap-2"
                      >
                        📥 Save (.docx)
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedLyrics(null);
                          scrollToStep(1);
                          setSeedPhrase('');
                          setSelectedGenre('');
                        }}
                        className="px-5 py-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-xs tracking-widest uppercase transition-all hover:-translate-y-0.5"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8 pb-4">
                    {generatedLyrics?.sections.map((section, sIdx) => (
                      <div key={sIdx} className="p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <span className="text-xs font-mono text-theme-400 tracking-[0.2em] uppercase block mb-6 relative z-10">
                          {section.label}
                        </span>
                        <div className="space-y-3 relative z-10">
                          {section.lines.map((line, lIdx) => (
                            <input
                              key={lIdx}
                              type="text"
                              value={line}
                              onChange={(e) => handleLineChange(sIdx, lIdx, e.target.value)}
                              className="w-full bg-transparent text-lg md:text-xl font-serif text-zinc-300 hover:text-white focus:text-white focus:outline-none border-b border-transparent hover:border-white/10 focus:border-theme-400/50 py-1 transition-all"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                     <button
                        onClick={() => router.push(`/studio/instrumental?lyricId=${generatedLyrics?.id}`)}
                        className="px-8 py-4 rounded-full bg-white text-black hover:bg-theme-100 font-bold font-mono text-sm tracking-widest uppercase transition-all hover:scale-105 flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      >
                        Compose Instrumental <span>→</span>
                      </button>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          </div>
        )}
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
