'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import BackgroundImage from '@/components/ui/BackgroundImage';
import GoldWaveSVG from '@/components/ui/GoldWaveSVG';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import PageTransition from '@/components/layout/PageTransition';

export default function LoginPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const cached = sessionStorage.getItem('cadenza_login_email');
    if (!cached) {
      router.push('/auth/login/email');
    } else {
      setEmail(cached);
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;

    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setToastType('error');
        setToastMessage('Invalid email or password. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setToastType('success');
      setToastMessage('Signed in successfully! Redirecting...');
      sessionStorage.removeItem('cadenza_login_email');

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1200);
    } catch (err) {
      setToastType('error');
      setToastMessage('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    setToastType('info');
    setToastMessage('Password reset is coming soon. Please contact support for now.');
  };

  return (
    <PageTransition variant="dissolve" className="flex flex-col h-full w-full relative">
      <BackgroundImage route="/auth/login/password" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <div className="max-w-xl md:mb-12">
          <StepIndicator currentStep={2} totalSteps={2} label="Sign In" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Enter password
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Verify your identity as: <span className="text-white font-mono">{email}</span>
          </p>
        </div>

        {/* Bottom/Right Input Region */}
        <GlassCard className="w-full max-w-sm md:mb-12 bg-obsidian/40 backdrop-blur-md border border-gold-500/20 shadow-2xl p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <AnimatedInput
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[10px] font-mono tracking-widest text-gold-400 hover:text-gold-300 transition-colors uppercase"
            >
              Forgot Password?
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/auth/login/email')}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
              disabled={isSubmitting}
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={!password || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Verifying...' : 'Sign In'}
            </Button>
          </div>
        </form>
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
