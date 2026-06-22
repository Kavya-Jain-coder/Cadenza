'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/layout/PageTransition';

export default function LoginEmail() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const cached = sessionStorage.getItem('cadenza_login_email');
    if (cached) setEmail(cached);
  }, []);

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
      sessionStorage.setItem('cadenza_login_email', email.trim());
      router.push('/auth/login/password');
    }
  };

  return (
    <PageTransition variant="slide-left" className="items-center justify-center">
      <BackgroundImage route="/auth/login/email" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <GlassCard className="max-w-md w-full relative z-10">
        <StepIndicator currentStep={1} totalSteps={2} label="Sign In" />

        <h2 className="font-serif text-2xl text-white mb-2 tracking-wide">
          Welcome back
        </h2>
        <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
          Please enter your registered email address to access your creative studio.
        </p>

        <form onSubmit={handleNext}>
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

          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth')}
              className="flex-1"
            >
              ← Cancel
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
    </PageTransition>
  );
}
