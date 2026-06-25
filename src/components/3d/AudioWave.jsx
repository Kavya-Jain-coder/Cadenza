'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';

export default function AudioWave() {
  const mesh = useRef();
  const count = 80;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < count; i++) {
      // Spread out along the X axis
      const x = (i - count / 2) * 0.12;
      
      // Simulate audio frequencies using combined sine waves
      const freq1 = Math.sin(time * 2.5 + x * 1.5) * 0.5;
      const freq2 = Math.sin(time * 1.2 + x * 0.8) * 0.3;
      const freq3 = Math.sin(time * 4.0 + x * 2.5) * 0.2;
      
      const height = Math.abs(freq1 + freq2 + freq3) + 0.1;
      
      // Curve them slightly in Z axis to embrace the user
      const z = -Math.abs(x) * 0.2 - 2;
      
      dummy.position.set(x, height / 2 - 1.5, z);
      dummy.scale.set(1, height * 2.5, 1);
      dummy.updateMatrix();
      
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
      <instancedMesh ref={mesh} args={[null, null, count]}>
        <boxGeometry args={[0.04, 1, 0.04]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.9} 
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </instancedMesh>
    </Float>
  );
}
