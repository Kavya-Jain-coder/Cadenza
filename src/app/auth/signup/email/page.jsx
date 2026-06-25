'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignup } from '@/contexts/SignupContext';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/layout/PageTransition';
import { motion } from 'framer-motion';

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
    <PageTransition variant="dissolve" className="flex flex-col h-full w-full relative">
            
      <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-end w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <motion.div 
          className="max-w-xl md:mb-12"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.4 }}
        >
          <StepIndicator currentStep={2} totalSteps={4} label="Create Account" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Where should we reach you?
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Your email is used to log in, recover your password, and verify your account.
          </p>
        </motion.div>

        {/* Bottom/Right Input Region */}
        <motion.div
          className="w-full max-w-sm md:mb-12"
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
        <GlassCard className="w-full bg-obsidian/40 backdrop-blur-md border border-theme-500/20 shadow-2xl p-6">
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
        </motion.div>
      </div>
    </PageTransition>
  );
}
