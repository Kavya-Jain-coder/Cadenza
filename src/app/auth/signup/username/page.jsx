'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/contexts/SignupContext';
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
    <PageTransition variant="slide-right" className="flex flex-col h-full w-full relative">
            
      <div className="flex-1 flex flex-col md:flex-row justify-between items-start w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <div className="max-w-xl md:mb-12">
          <StepIndicator currentStep={1} totalSteps={4} label="Create Account" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Choose your alias
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            How should the community know you? This will be your unique handle.
          </p>
        </div>

        {/* Bottom/Right Input Region */}
        <GlassCard className="w-full max-w-sm md:mb-12 bg-obsidian/40 backdrop-blur-md border border-theme-500/20 shadow-2xl p-6">
          <form onSubmit={handleNext} className="flex flex-col gap-4">
          <AnimatedInput
            label="Alias / Username"
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError('');
            }}
            onBlur={handleBlur}
            required
            error={error}
          />

          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth')}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
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
      </div>
    </PageTransition>
  );
}
