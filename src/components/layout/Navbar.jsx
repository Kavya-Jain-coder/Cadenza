'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Logo from '@/components/ui/Logo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(pathname);
  
  // Dynamic Scroll State
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    const diff = y - lastYRef.current;
    
    // Hide navbar when scrolling down, show when scrolling up
    if (y > 150 && diff > 10) {
      setHidden(true);
    } else if (diff < -10 || y < 150) {
      setHidden(false);
    }
    
    // Add background blur/opacity when scrolled past top
    setScrolled(y > 50);
    
    lastYRef.current = y;
  });

  if (pathname?.startsWith('/auth')) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth');
    router.refresh();
  };

  const navLinks = [
    { href: '/studio/lyrics', label: 'Lyrics' },
    { href: '/studio/instrumental', label: 'Beats' },
    { href: '/studio/voice', label: 'Voice' },
    { href: '/dashboard', label: 'Library' }
  ];

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: hidden ? -100 : 0, 
        opacity: hidden ? 0 : 1 
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 pt-6 md:pt-8 pointer-events-none flex justify-center transition-all duration-500`}
    >
      <nav 
        className={`pointer-events-auto relative flex items-center justify-between w-full max-w-6xl rounded-full px-4 py-3 md:px-6 md:py-4 transition-all duration-500 ${
          scrolled 
            ? 'bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)]' 
            : 'bg-transparent border border-transparent shadow-none'
        }`}
      >
        
        {/* Subtle inner glow only when scrolled */}
        {scrolled && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-zinc-500/5 via-zinc-400/5 to-zinc-600/5 pointer-events-none" />
        )}

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-zinc-400/50 group-hover:bg-zinc-500/20">
            <Logo className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform duration-500" />
          </div>
          <span className="font-serif text-lg md:text-2xl tracking-widest text-white transition-colors">
            Cadenza
          </span>
        </Link>

        {/* Desktop Links with Sliding Pill */}
        <div className="hidden md:flex items-center space-x-1 relative z-10 bg-white/5 p-1 rounded-full border border-white/5" onMouseLeave={() => setHoveredPath(pathname)}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const isHovered = hoveredPath === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHoveredPath(link.href)}
                className={`relative px-6 py-2.5 rounded-full text-[11px] font-mono tracking-widest uppercase transition-colors z-20 ${
                  isActive || isHovered ? 'text-black font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {link.label}
                {isHovered && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4 relative z-10">
          {session?.user ? (
            <div className="flex items-center gap-4 bg-white/5 rounded-full p-1 pr-4 border border-white/5 transition-colors hover:bg-white/10">
              <div className="w-8 h-8 rounded-full bg-zinc-500/20 flex items-center justify-center border border-zinc-500/30">
                <span className="text-xs font-mono text-zinc-300">{session.user.email.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-[10px] tracking-wider font-mono text-zinc-300 hidden lg:block">
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 text-zinc-400 hover:text-red-400 transition-colors group"
                title="Sign Out"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="group relative px-6 py-2.5 rounded-full bg-white text-black text-[11px] font-mono tracking-widest uppercase overflow-hidden font-bold transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative z-10 transition-colors duration-500">
                Start Creating
              </span>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden relative z-10 p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>

      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute top-[85px] left-4 right-4 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 md:hidden shadow-2xl pointer-events-auto"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`p-4 rounded-xl text-sm font-mono tracking-widest uppercase border transition-all ${
                    pathname === link.href 
                      ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {session?.user ? (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="mt-4 p-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-center font-bold text-sm font-mono tracking-widest uppercase"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="mt-4 p-4 rounded-xl bg-white text-black text-center font-bold text-sm font-mono tracking-widest uppercase"
                >
                  Start Creating
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
