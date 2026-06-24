'use client';

import { SignupProvider } from '@/contexts/SignupContext';

export default function AuthLayout({ children }) {
  return (
    <SignupProvider>
      <div className="min-h-screen flex flex-col relative overflow-hidden pt-24 pb-12 px-6 lg:px-16">
        {children}
      </div>
    </SignupProvider>
  );
}
