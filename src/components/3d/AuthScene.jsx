'use client';

import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';
import AudioWave from './AudioWave';

export default function AuthScene() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.2} />
          
          <AudioWave />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[0, 5, 5]} intensity={10} color="#ffffff" penumbra={1} />
        </Suspense>
      </Canvas>
    </div>
  );
}
