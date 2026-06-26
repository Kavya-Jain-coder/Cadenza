'use client';

import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';
import AICore from './AICore';

export default function Scene({ scrollYProgress }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#050508']} />
        
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.2} />
          <ambientLight intensity={0.1} />
          
          <AICore scrollYProgress={scrollYProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
