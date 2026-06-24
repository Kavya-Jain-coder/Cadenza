'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useSignup } from '@/contexts/SignupContext';
import { GENRES } from '@/lib/constants';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import PageTransition from '@/components/layout/PageTransition';

export default function GenrePrefStep() {
  const router = useRouter();
  const { signupData, clearSignupData } = useSignup();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const toggleGenre = (genreId) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleFinish = async (e) => {
    e.preventDefault();
    if (selectedGenres.length < 2) {
      setToastType('error');
      setToastMessage('Please select at least 2 genres');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create user account via API
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          genrePreferences: selectedGenres
        })
      });

      const signupResult = await signupRes.json();

      if (!signupRes.ok) {
        setToastType('error');
        setToastMessage(signupResult.error || 'Failed to create account');
        setIsSubmitting(false);
        return;
      }

      // 2. Auto-login via NextAuth credentials
      const loginResult = await signIn('credentials', {
        email: signupData.email,
        password: signupData.password,
        redirect: false
      });

      if (loginResult?.error) {
        setToastType('error');
        setToastMessage('Account created but auto-login failed. Please log in manually.');
        clearSignupData();
        setTimeout(() => {
          router.push('/auth/login/email');
        }, 2000);
        return;
      }

      setToastType('success');
      setToastMessage('Account created successfully! Redirecting...');
      clearSignupData();
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      setToastType('error');
      setToastMessage('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition variant="scale-pop" className="flex flex-col h-full w-full relative">
      <BackgroundImage route="/auth/signup/genre-pref" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <div className="max-w-xl md:mb-12">
          <StepIndicator currentStep={4} totalSteps={4} label="Create Account" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Select your vibe
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Select at least 2 genres you enjoy. This will personalize your lyric grounding context.
          </p>
        </div>

        {/* Bottom/Right Input Region */}
        <GlassCard className="w-full max-w-sm md:mb-12 bg-obsidian/40 backdrop-blur-md border border-gold-500/20 shadow-2xl p-6">
          <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto pr-1">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'border-gold-400 bg-gold-500/10 text-white shadow-[0_0_15px_rgba(214,156,23,0.15)]'
                    : 'border-white/10 bg-void/40 text-zinc-400 hover:border-white/20'
                }`}
              >
                <span className="text-lg">{genre.icon}</span>
                <span className="text-xs font-mono tracking-wider uppercase">{genre.name}</span>
              </button>
            );
          })}
        </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth/signup/password')}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
              disabled={isSubmitting}
            >
              ← Back
            </Button>
            <Button
              onClick={handleFinish}
              disabled={selectedGenres.length < 2 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Finish'}
            </Button>
          </div>
        </GlassCard>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </PageTransition>
  );
}
