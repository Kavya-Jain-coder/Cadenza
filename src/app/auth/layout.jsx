'use client';

import { SignupProvider } from '@/contexts/SignupContext';
import AuthScene from '@/components/3d/AuthScene';

export default function AuthLayout({ children }) {
  return (
    <SignupProvider>
      <div className="relative min-h-screen w-full flex flex-col overflow-hidden isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <AuthScene />
        </div>
        <div className="relative z-50 flex flex-col flex-1 pt-24 pb-12 px-6 lg:px-16 pointer-events-auto">
          {children}
        </div>
      </div>
    </SignupProvider>
  );
}
