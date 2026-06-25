'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function DataNetwork() {
  const group = useRef();
  const count = 100;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      temp.push({ x, y, z, speed: Math.random() * 0.2 + 0.1 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    particles.forEach((particle, i) => {
      dummy.position.set(
        particle.x + Math.sin(time * particle.speed) * 2,
        particle.y + Math.cos(time * particle.speed * 0.8) * 1.5,
        particle.z + Math.sin(time * particle.speed * 1.2) * 2
      );
      dummy.rotation.set(time * particle.speed, time * particle.speed, 0);
      dummy.scale.setScalar(0.5);
      dummy.updateMatrix();
      
      group.current.setMatrixAt(i, dummy.matrix);
    });
    group.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <instancedMesh ref={group} args={[null, null, count]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.2} 
          metalness={1} 
          emissive="#ffffff"
          emissiveIntensity={0.1}
          transparent
          opacity={0.3}
        />
      </instancedMesh>
    </Float>
  );
}

export default function DashboardScene() {
  return (
    <div className="fixed inset-0 w-full h-full -z-20 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 2]}>
        <Environment preset="studio" environmentIntensity={0.1} />
        
        <DataNetwork />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={50} decay={2} color="#ffffff" />
      </Canvas>
    </div>
  );
}
