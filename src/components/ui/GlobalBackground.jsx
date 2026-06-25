'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function GlobalBackground() {
  const pathname = usePathname();
  
  // The landing page handles its own intense 3D background.
  // We don't want this global background to interfere with it.
  if (pathname === '/') return null;

  return (
    <div className="fixed inset-0 w-full h-full -z-50 pointer-events-none overflow-hidden bg-void">
      {/* Animated deep gradients */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle, rgba(var(--dyn-theme-500), 0.25) 0%, rgba(var(--dyn-theme-900), 0) 70%)',
          filter: 'blur(80px)'
        }}
      />
      
      <motion.div 
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          rotate: [0, -90, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(var(--dyn-theme-400), 0.2) 0%, rgba(10, 10, 30, 0) 70%)',
          filter: 'blur(80px)'
        }}
      />
      
      {/* Deep void vignette overlay to darken edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,8,0.8)_100%)] pointer-events-none" />
    </div>
  );
}
