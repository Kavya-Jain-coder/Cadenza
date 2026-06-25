'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AmbientVisualizer() {
  const pathname = usePathname();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (pathname === '/') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor(themeColor) {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 200;
        this.size = Math.random() * 2 + 0.5;
        this.themeColor = themeColor;
        this.speedY = Math.random() * 0.5 + 0.1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.3 + 0.1;
      }
      
      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        
        // Wrap around
        if (this.y < -10) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
        }
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.themeColor}, ${this.opacity})`;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const rootStyle = getComputedStyle(document.documentElement);
      const themeStr = rootStyle.getPropertyValue('--dyn-theme-500').trim() || '249 115 22';
      const themeColor = themeStr.split(' ').join(', ');
      
      const numParticles = Math.floor(window.innerWidth / 20); // Scale with screen
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle(themeColor));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pathname]);

  if (pathname === '/') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-40 opacity-40 mix-blend-screen"
      aria-hidden="true"
    />
  );
}
