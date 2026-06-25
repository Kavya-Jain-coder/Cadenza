'use client';

import { SessionProvider } from 'next-auth/react';
import { SignupProvider } from '@/contexts/SignupContext';

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <SignupProvider>
        {children}
      </SignupProvider>
    </SessionProvider>
  );
}
