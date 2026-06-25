'use client';

import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTransform } from 'framer-motion';

export default function BoomBoxModel({ scrollYProgress }) {
  const group = useRef();
  
  // The BoomBox model is downloaded to public/models/BoomBox.glb
  const { scene } = useGLTF('/models/BoomBox.glb');

  // Map scroll progress (0 to 1) to 3D transformations
  // Section 1: Center
  // Section 2: Right side (Left text)
  // Section 3: Left side (Right text)
  // Section 4: Center zoomed
  
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [40, 50, 50, 80]);
  const posX = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0, 2, -2, 0]);
  const rotY = useTransform(scrollYProgress, [0, 1], [0, Math.PI * 4]);

  useFrame(() => {
    if (group.current) {
      // Apply transforms
      group.current.scale.setScalar(scale.get());
      group.current.position.x = posX.get();
      group.current.rotation.y = rotY.get();
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/BoomBox.glb');
