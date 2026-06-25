'use client';

import Scene from '@/components/3d/Scene';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import Footer from '@/components/landing/Footer';

// World class text reveal variant
const textRevealVariant = {
  hidden: { y: "100%", opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
  }
};

const TextReveal = ({ children }) => (
  <div className="overflow-hidden">
    <motion.div variants={textRevealVariant}>{children}</motion.div>
  </div>
);

export default function Home() {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  });

  const opacity1 = useTransform(scrollYProgress, [0, 0.15, 0.2], [1, 1, 0]);
  const opacity2 = useTransform(scrollYProgress, [0.2, 0.3, 0.45, 0.55], [0, 1, 1, 0]);
  const opacity3 = useTransform(scrollYProgress, [0.55, 0.65, 0.75, 0.85], [0, 1, 1, 0]);
  const opacity4 = useTransform(scrollYProgress, [0.85, 0.9, 1], [0, 1, 1]);

  const y1 = useTransform(scrollYProgress, [0, 0.2], ["0vh", "-150vh"]);
  const y2 = useTransform(scrollYProgress, [0.2, 0.3, 0.45, 0.55], ["50vh", "0vh", "0vh", "-50vh"]);
  const y3 = useTransform(scrollYProgress, [0.55, 0.65, 0.75, 0.85], ["50vh", "0vh", "0vh", "-50vh"]);
  const y4 = useTransform(scrollYProgress, [0.85, 0.9, 1], ["50vh", "0vh", "0vh"]);
  
  const display1 = useTransform(scrollYProgress, [0, 0.2, 0.21], ["flex", "flex", "none"]);

  return (
    <div className="relative text-white min-h-screen">
      <Scene scrollYProgress={scrollYProgress} />
      
      <div ref={container} className="relative h-[400vh]">
        <div className="sticky top-0 h-screen flex flex-col justify-center items-center overflow-hidden pointer-events-none">
          
          {/* Section 1: Intro */}
          <motion.div 
            style={{ opacity: opacity1, y: y1, display: display1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            <motion.div variants={textRevealVariant} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono tracking-[0.2em] text-zinc-300 uppercase">Cadenza Engine v2.0</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-serif tracking-tight leading-[0.9] mb-6 drop-shadow-2xl">
              <TextReveal>SONIC</TextReveal>
              <TextReveal><span className="text-zinc-500 italic">PERFECTION</span></TextReveal>
            </h1>
          </motion.div>

          {/* Section 2: Instrumental */}
          <motion.div 
            style={{ opacity: opacity2, y: y2 }}
            className="absolute inset-0 flex flex-col items-start justify-center p-8 md:pl-[10%]"
          >
            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif tracking-tight leading-none mb-6">
              High Fidelity<br />
              <span className="text-zinc-500 italic">Instrumentals</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-lg font-light mb-8 pointer-events-auto">
              Generate studio-quality beats in seconds. Full control over tempo, genre, and instrumentation.
            </p>
            <div className="pointer-events-auto">
               <Link href="/studio/instrumental" className="group flex items-center gap-2 text-white border-b border-white/30 hover:border-white transition-colors pb-1 text-lg">
                 Try Instrumental Studio
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
               </Link>
            </div>
          </motion.div>

          {/* Section 3: Vocals */}
          <motion.div 
            style={{ opacity: opacity3, y: y3 }}
            className="absolute inset-0 flex flex-col items-end justify-center text-right p-8 md:pr-[10%]"
          >
            <div className="w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center mb-6 ml-auto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif tracking-tight leading-none mb-6">
              Vocal Synthesis<br />
              <span className="text-zinc-500 italic">On Scroll</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-lg font-light ml-auto mb-8 pointer-events-auto">
              Type your lyrics. Pick a voice profile. Watch as Cadenza breathes life into your words.
            </p>
            <div className="pointer-events-auto">
               <Link href="/studio/voice" className="group flex items-center gap-2 justify-end text-white border-b border-white/30 hover:border-white transition-colors pb-1 text-lg">
                 Try Voice Studio
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
               </Link>
            </div>
          </motion.div>

          {/* Section 4: CTA */}
          <motion.div 
            style={{ opacity: opacity4, y: y4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
          >
            <h2 className="text-6xl md:text-8xl font-serif tracking-tight mb-12">
              Ready to <span className="italic text-zinc-500">create?</span>
            </h2>
            <div className="pointer-events-auto flex flex-col md:flex-row gap-6">
              <Link 
                href="/auth/signup/email"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold font-mono tracking-widest uppercase text-xs overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                <span className="relative z-10">Sign Up Free</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
              <Link 
                href="/auth/login/email"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold font-mono tracking-widest uppercase text-xs transition-all hover:bg-white/10 active:scale-95"
              >
                <span>Login</span>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
      
      {/* Footer */}
      <div className="relative z-10 bg-black">
        <Footer />
      </div>
    </div>
  );
}
