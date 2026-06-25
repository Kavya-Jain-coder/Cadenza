'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/contexts/SignupContext';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/layout/PageTransition';

export default function PasswordStep() { 
  const router = useRouter();
  const { signupData, updateSignupData } = useSignup();
  const [password, setPassword] = useState(signupData.password || '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });

  useEffect(() => {
    // Basic hand-rolled password strength check
    if (!password) {
      setStrength({ score: 0, label: 'Weak', color: 'bg-red-500' });
      return;
    }

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    let label = 'Weak';
    let color = 'bg-red-500';

    if (score >= 4) {
      label = 'Excellent';
      color = 'bg-emerald-500';
    } else if (score >= 3) {
      label = 'Strong';
      color = 'bg-green-500';
    } else if (score >= 2) {
      label = 'Fair';
      color = 'bg-amber-500';
    }

    setStrength({ score, label, color });
  }, [password]);

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validatePassword()) {
      updateSignupData({ password });
      router.push('/auth/signup/genre-pref');
    }
  };

  return (
    <PageTransition variant="slide-right" className="flex flex-col h-full w-full relative">
      <BackgroundImage route="/auth/signup/password" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <div className="max-w-xl md:mb-12">
          <StepIndicator currentStep={3} totalSteps={4} label="Create Account" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Secure your account
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Create a solid password to protect your original music creations.
          </p>
        </div>

        {/* Bottom/Right Input Region */}
        <GlassCard className="w-full max-w-sm md:mb-12 bg-obsidian/40 backdrop-blur-md border border-theme-500/20 shadow-2xl p-6">
          <form onSubmit={handleNext} className="flex flex-col gap-4">
          <AnimatedInput
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Min. 6 characters"
            required
          />

          {password && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 mb-1">
                <span>STRENGTH: <span className="text-white uppercase">{strength.label}</span></span>
              </div>
              <div className="h-1 bg-void/50 border border-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <AnimatedInput
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Re-enter password"
            required
            error={error}
          />

          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth/signup/email')}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={!password || !confirmPassword || !!error}
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
