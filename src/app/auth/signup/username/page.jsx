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

export default function UsernameStep() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSignup();
  const [username, setUsername] = useState(signupData.username || '');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateUsername = async (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setError('Username is required');
      return false;
    }
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores are allowed');
      return false;
    }

    setIsValidating(true);
    try {
      const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.error) {
        setError('Verification failed, please try again');
        return false;
      }
      if (!data.available) {
        setError('This username is already taken');
        return false;
      }
      setError('');
      return true;
    } catch (e) {
      setError('Connection error');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleBlur = () => {
    if (username) validateUsername(username);
  };

  const handleNext = async (e) => {
    e.preventDefault();
    const isOk = await validateUsername(username);
    if (isOk) {
      updateSignupData({ username: username.trim() });
      router.push('/auth/signup/email');
    }
  };

  return (
    <PageTransition variant="slide-right" className="items-center justify-center">
      <BackgroundImage route="/auth/signup/username" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <GlassCard className="max-w-md w-full relative z-10">
        <StepIndicator currentStep={1} totalSteps={4} label="Create Account" />

        <h2 className="font-serif text-2xl text-white mb-2 tracking-wide">
          Choose your alias
        </h2>
        <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
          How should the community know you? This will be your unique handle.
        </p>

        <form onSubmit={handleNext}>
          <AnimatedInput
            label="Alias / Username"
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError('');
            }}
            onBlur={handleBlur}
            placeholder="e.g. soundwave_99"
            required
            error={error}
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth')}
              className="flex-1"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={isValidating || !!error || !username}
              className="flex-1"
            >
              {isValidating ? 'Checking...' : 'Next'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </PageTransition>
  );
}
