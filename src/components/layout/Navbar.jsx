'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/ui/Logo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Hide Navbar in Auth routes
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth');
    router.refresh();
  };

  const navLinks = [
    { href: '/studio/lyrics', label: 'Lyric Studio' },
    { href: '/studio/instrumental', label: 'Instrumental Studio' },
    { href: '/studio/voice', label: 'Voice Studio' },
    { href: '/dashboard', label: 'My Creations' }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-5xl rounded-full border border-theme-500/20 bg-obsidian/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="font-serif text-xl tracking-wider text-white hover:text-theme-300 transition-colors flex items-center gap-3">
                <Logo className="w-8 h-8" />
                <span>Cadenza</span>
              </Link>
            </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[10px] tracking-widest font-mono uppercase transition-colors relative py-1 ${
                    isActive ? 'text-theme-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-theme-400"
                      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] tracking-wider font-mono text-zinc-500 lowercase">
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-red-300 text-[9px] font-mono tracking-widest uppercase transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 rounded bg-gradient-to-r from-theme-600 to-theme-500 text-white text-[9px] font-mono tracking-widest uppercase hover:from-theme-500 hover:to-theme-400 transition-all font-bold"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white p-2 rounded focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.3 }}
            className="md:hidden border-t border-theme-500/10 bg-void/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 rounded-md text-xs font-mono tracking-widest uppercase transition-colors ${
                      isActive ? 'bg-theme-500/10 text-theme-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-white/5 px-3 flex flex-col gap-2">
                {session?.user ? (
                  <>
                    <div className="text-[10px] font-mono text-zinc-500 lowercase py-1">
                      Logged in as: {session.user.email}
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-center py-2 border border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-[10px] font-mono tracking-widest uppercase rounded"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-2 bg-gradient-to-r from-theme-600 to-theme-500 hover:from-theme-500 hover:to-theme-400 text-white text-[10px] font-mono tracking-widest uppercase rounded font-bold"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </div>
  );
}
