'use client';

import { SignupProvider } from '@/contexts/SignupContext';

export default function AuthLayout({ children }) {
  return (
    <SignupProvider>
      <div className="min-h-screen flex flex-col justify-center items-center relative py-12 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </SignupProvider>
  );
}
