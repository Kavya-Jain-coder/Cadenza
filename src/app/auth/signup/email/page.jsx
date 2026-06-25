'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/contexts/SignupContext';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/layout/PageTransition';

export default function EmailStep() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSignup();
  const [email, setEmail] = useState(signupData.email || '');
  const [error, setError] = useState('');

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateEmail(email)) {
      updateSignupData({ email: email.trim() });
      router.push('/auth/signup/password');
    }
  };

  return (
    <PageTransition variant="slide-right" className="flex flex-col h-full w-full relative">
      <BackgroundImage route="/auth/signup/email" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <div className="max-w-xl md:mb-12">
          <StepIndicator currentStep={2} totalSteps={4} label="Create Account" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Where should we reach you?
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Your email is used to log in, recover your password, and verify your account.
          </p>
        </div>

        {/* Bottom/Right Input Region */}
        <GlassCard className="w-full max-w-sm md:mb-12 bg-obsidian/40 backdrop-blur-md border border-theme-500/20 shadow-2xl p-6">
          <form onSubmit={handleNext} className="flex flex-col gap-4">
          <AnimatedInput
            label="Email Address"
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. name@domain.com"
            required
            error={error}
          />

          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth/signup/username')}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={!email || !!error}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </form>
      </GlassCard>
      </div>
    </PageTransition>
  );
}
