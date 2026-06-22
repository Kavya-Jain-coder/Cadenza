'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/contexts/SignupContext';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
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
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            username: signupData.username,
            genre_preferences: selectedGenres
          }
        }
      });

      if (error) {
        setToastType('error');
        setToastMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      setToastType('success');
      // Supabase auto-login works depending on email verification settings
      if (data?.session) {
        setToastMessage('Account created successfully! Redirecting...');
        clearSignupData();
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } else {
        setToastMessage('Account created! Please check your email for a verification link.');
        clearSignupData();
        setTimeout(() => {
          router.push('/auth/login/email');
        }, 3000);
      }
    } catch (err) {
      setToastType('error');
      setToastMessage('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition variant="scale-pop" className="items-center justify-center">
      <BackgroundImage route="/auth/signup/genre-pref" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <GlassCard className="max-w-md w-full relative z-10">
        <StepIndicator currentStep={4} totalSteps={4} label="Create Account" />

        <h2 className="font-serif text-2xl text-white mb-2 tracking-wide">
          Select your vibe
        </h2>
        <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
          Select at least 2 genres you enjoy. This will personalize your lyric grounding context.
        </p>

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
            className="flex-1"
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
