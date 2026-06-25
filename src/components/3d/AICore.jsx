'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTransform } from 'framer-motion';
import { Float, Cylinder, Torus } from '@react-three/drei';

export default function AICore({ scrollYProgress }) {
  const group = useRef();
  
  // Cinematic scroll mapping - much more subtle scale
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 1.4, 1.0]);
  // Positioned lower and slightly offset
  const posX = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0.5, 2.0, -1.5, 0]);
  const posY = useTransform(scrollYProgress, [0, 1], [-1.5, -0.5]);
  
  // Starts angled almost flat (like a turntable), then rotates smoothly
  const rotY = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 3]);
  const rotX = useTransform(scrollYProgress, [0, 1], [Math.PI / 2.2, Math.PI / 2.0]);

  useFrame((state) => {
    if (group.current) {
      group.current.scale.setScalar(scale.get());
      group.current.position.x = posX.get();
      group.current.position.y = posY.get();
      group.current.rotation.y = rotY.get() + state.clock.elapsedTime * 0.2;
      group.current.rotation.x = rotX.get();
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
      <group ref={group}>
        {/* Vinyl Record Base */}
        <Cylinder args={[2, 2, 0.05, 64]}>
          <meshStandardMaterial color="#0a0a0a" roughness={0.3} metalness={0.8} />
        </Cylinder>
        
        {/* Record Grooves (Torus rings to catch the light) */}
        {[1.8, 1.6, 1.4, 1.2, 1.0].map((radius, i) => (
          <Torus key={i} args={[radius, 0.005, 16, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.026, 0]}>
            <meshStandardMaterial color="#222222" roughness={0.1} metalness={0.9} />
          </Torus>
        ))}
        
        {/* Center Label (Pure White for premium contrast) */}
        <Cylinder args={[0.6, 0.6, 0.06, 32]}>
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </Cylinder>
        
        {/* Center Hole */}
        <Cylinder args={[0.05, 0.05, 0.08, 16]}>
          <meshStandardMaterial color="#000000" />
        </Cylinder>
      </group>
      
      {/* Premium Studio Lighting - dramatic, sleek, dark */}
      <spotLight position={[5, 8, 5]} angle={0.4} penumbra={1} color="#ffffff" intensity={200} decay={1.5} />
      <spotLight position={[-5, 5, -5]} angle={0.8} penumbra={1} color="#ffffff" intensity={100} decay={1.5} />
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 1, 3]} intensity={50} decay={2} color="#ffffff" />
    </Float>
  );
}
