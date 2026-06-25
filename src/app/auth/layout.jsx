'use client';

import { SignupProvider } from '@/contexts/SignupContext';
import AuthScene from '@/components/3d/AuthScene';

export default function AuthLayout({ children }) {

  return (
    <SignupProvider>
      <AuthScene />
      <div className="min-h-screen flex flex-col relative overflow-hidden pt-24 pb-12 px-6 lg:px-16 z-10 pointer-events-auto">
        {children}
      </div>
    </SignupProvider>
  );
}
