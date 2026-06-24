'use client';

import { SessionProvider } from 'next-auth/react';
import { SignupProvider } from '@/contexts/SignupContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <SignupProvider>
        {children}
      </SignupProvider>
    </SessionProvider>
  );
}
