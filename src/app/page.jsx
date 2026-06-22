'use client';

import Hero from '@/components/landing/Hero';
import FeatureCards from '@/components/landing/FeatureCards';
import HowItWorks from '@/components/landing/HowItWorks';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Hero />
        <FeatureCards />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

