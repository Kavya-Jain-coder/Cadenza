'use client';

import GlassCard from '../ui/GlassCard';
import { motion } from 'framer-motion';

export default function FeatureCards() {
  const features = [
    {
      title: 'Lyric Studio',
      icon: '✨',
      description: 'Generate structured rhyming songs using Groq API LLMs. Grounded locally by genre and mood reference corpuses.'
    },
    {
      title: 'Instrumental Studio',
      icon: '🥁',
      description: 'Layer backing tracks and audio stems. Tweak reverb, echo, and distortion parameters per element.'
    },
    {
      title: 'Voice Studio',
      icon: '🎙️',
      description: 'Synthesize combined songs using vocal archetype models. Follows along with highlighted active lyrics.'
    }
  ];

  return (
    <section id="features" className="relative py-24 px-4 overflow-hidden min-h-screen flex items-center justify-center">
      {/* Background Image specific to features route/hash */}
      <div
        className="absolute inset-0 bg-cover bg-center -z-20 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'url(/background_images/fantasy-dj-illustration.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian/85 to-obsidian -z-10" />

      <div className="max-w-7xl mx-auto w-full relative z-10 select-none">
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.25em] font-mono text-gold-400 uppercase mb-2 block">
            Capabilities
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-wide">
            Creative Modules
          </h2>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.6 } }
              }}
            >
              <GlassCard
                animate={false} // Disable default glasscard animation so stagger controls it
                className="flex flex-col gap-4 text-center items-center p-8 border border-gold-500/10 hover:border-gold-500/30 transition-all hover:scale-[1.02] hover:-translate-y-1 h-full"
                hoverGlow
              >
                <div className="w-16 h-16 rounded-full bg-gold-950/20 border border-gold-500/20 flex items-center justify-center text-3xl mb-2 text-gold-400 shadow-[0_0_15px_rgba(188,124,10,0.1)]">
                  {feature.icon}
                </div>
                <h3 className="font-serif text-xl text-white tracking-wider">{feature.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-xs">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
