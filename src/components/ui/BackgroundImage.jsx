'use client';

import { getBackground } from '@/lib/backgroundRegistry';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export default function BackgroundImage({ route }) {
  const bgPath = getBackground(route);
  
  // Smooth mouse tracking for parallax
  const mouseX = useSpring(0, { stiffness: 40, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse coordinates from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      // Move slightly in opposite direction of mouse
      mouseX.set(x * -15);
      mouseY.set(y * -15);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-obsidian">
      <AnimatePresence mode="wait">
        {bgPath && (
          <motion.div
            key={bgPath}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.6, scale: 1.05, x: mouseX, y: mouseY }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              opacity: { ease: [0.22, 1, 0.36, 1], duration: 1.2 },
              scale: { ease: [0.22, 1, 0.36, 1], duration: 1.2 }
            }}
            className="absolute -inset-10 bg-cover bg-center bg-no-repeat will-change-transform"
            style={{ backgroundImage: `url(${bgPath})` }}
          />
        )}
      </AnimatePresence>
      
      {/* World-class dark luxurious vignettes */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,15,0.85)_100%)] mix-blend-multiply" />
    </div>
  );
}
