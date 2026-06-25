'use client';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Write',
      description: 'Start with a core theme and select your target language. Generate structured song lyrics grounded in style guidelines.'
    },
    {
      step: '02',
      title: 'Compose',
      description: 'Layer instrument elements like drums, bass, synth, and piano. Fine-tune production effect filters per stem.'
    },
    {
      step: '03',
      title: 'Sing',
      description: 'Choose a vocal tone from our legal-safe artist archetypes. Render and export your complete mixed AI song.'
    }
  ];

  return (
    <section className="py-24 px-4 bg-void/30 border-y border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto w-full relative z-10 select-none">
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.25em] font-mono text-theme-400 uppercase mb-2 block">
            Production Flow
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-white tracking-wide">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 relative p-6 rounded-xl border border-white/5 bg-void/50 hover:border-theme-500/10 transition-colors">
              <span className="font-mono text-4xl font-bold text-theme-500/20">{item.step}</span>
              <h3 className="font-serif text-lg text-white tracking-wider uppercase mb-1">{item.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
