'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setToastType('error');
        setToastMessage(error.message);
        setIsSubmitting(false);
        return;
      }

      setToastType('success');
      setToastMessage('Signed in successfully! Redirecting...');
      sessionStorage.removeItem('cadenza_login_email');

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    } catch (err) {
      setToastType('error');
      setToastMessage('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setToastType('error');
      setToastMessage('Email address not found. Please try again.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setToastType('error');
        setToastMessage(error.message);
      } else {
        setToastType('success');
        setToastMessage(`Password reset link sent to ${email}`);
      }
    } catch (err) {
      setToastType('error');
      setToastMessage('Unable to request password reset.');
    }
  };

  return (
    <PageTransition variant="dissolve" className="items-center justify-center">
      <BackgroundImage route="/auth/login/password" />
      <GoldWaveSVG speedMultiplier={0.8} density={2} />

      <GlassCard className="max-w-md w-full relative z-10">
        <StepIndicator currentStep={2} totalSteps={2} label="Sign In" />

        <h2 className="font-serif text-2xl text-white mb-2 tracking-wide">
          Enter password
        </h2>
        <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
          Verify your identity as: <span className="text-white font-mono">{email}</span>
        </p>

        <form onSubmit={handleLogin}>
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
              className="flex-1"
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
