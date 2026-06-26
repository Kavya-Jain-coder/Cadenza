'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import StepIndicator from '@/components/ui/StepIndicator';
import AnimatedInput from '@/components/ui/AnimatedInput';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

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
    <div className="flex flex-col h-full w-full relative">
            
      <div className="flex-1 flex flex-col md:flex-row justify-between items-start w-full relative z-10 gap-8 h-full">
        {/* Top/Left Title Region */}
        <motion.div 
          className="max-w-xl md:mb-12"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <StepIndicator currentStep={1} totalSteps={2} label="Sign In" />
          <h2 className="font-serif text-4xl md:text-6xl text-white mb-4 tracking-wide drop-shadow-xl mt-4">
            Welcome back
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed drop-shadow-md">
            Please enter your registered email address to access your creative studio.
          </p>
        </motion.div>

        {/* Bottom/Right Input Region */}
        <motion.div
          className="w-full max-w-sm md:mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
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
              onClick={() => router.push('/auth')}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10"
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
      </motion.div>
      </div>
    </div>
  );
}
