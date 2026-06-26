'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Icosahedron, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring } from 'framer-motion';

function AudioWaveformCore({ showcaseScroll, catalogScroll }) {
  const group = useRef();
  const innerCore = useRef();
  const instancedMeshRef = useRef();
  
  const NUM_BARS = 128;
  const RADIUS = 4.5;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Box geometry that scales outward from its base
  const barGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 0.15, 0.4);
    geo.translate(0.5, 0, 0); 
    return geo;
  }, []);

  const smoothScroll = useSpring(showcaseScroll, {
    stiffness: 40,
    damping: 15,
    restDelta: 0.001
  });

  const smoothCatalog = useSpring(catalogScroll || 0, {
    stiffness: 40,
    damping: 15,
    restDelta: 0.001
  });

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const scroll = smoothScroll ? smoothScroll.get() : 0;
    const catScroll = smoothCatalog ? smoothCatalog.get() : 0;
    
    // Smoothly damp the mouse position for a softer ripple effect
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;

    if (instancedMeshRef.current) {
      for (let i = 0; i < NUM_BARS; i++) {
        const angle = (i / NUM_BARS) * Math.PI * 2;
        
        // 1. Base Audio wave
        const wave1 = Math.sin(angle * 4 + time * 2) * 0.5;
        const wave2 = Math.cos(angle * 8 - time * 3) * 0.25;
        const wave3 = Math.sin(angle * 16 + time * 6) * 0.15;
        const baseAudio = Math.max(0, wave1 + wave2 + wave3);
        
        // 2. Hover interaction
        const barX = Math.cos(angle);
        const barY = Math.sin(angle);
        const distToMouse = Math.sqrt(Math.pow(barX - pointerX, 2) + Math.pow(barY - pointerY, 2));
        const hoverSpike = Math.max(0, 1.2 - distToMouse * 1.5) * 3;
        
        // 3. Scroll interaction - when scrolling down, the bass drops and the waveform gets chaotic
        const scrollBass = scroll * (Math.abs(Math.sin(time * 15 + i)) * 3);
        
        const barLength = 0.5 + baseAudio * 2 + hoverSpike + scrollBass;
        
        dummy.position.set(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0);
        dummy.rotation.set(0, 0, angle);
        dummy.scale.set(barLength, 1, 1);
        dummy.updateMatrix();
        
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (innerCore.current) {
      // Pulse like a beating heart / bass speaker core
      const beat = 1 + Math.sin(time * 12) * 0.02 + Math.sin(time * 24) * 0.01;
      const scrollExpand = 1 + scroll * 0.4;
      const scale = beat * scrollExpand;
      innerCore.current.scale.set(scale, scale, scale);
      innerCore.current.rotation.x = time * 0.2;
      innerCore.current.rotation.y = time * 0.3;
    }

    if (group.current) {
      // Base rotation
      group.current.rotation.z = time * 0.05;
      
      // Mouse Parallax
      const targetRotX = pointerY * 0.3;
      const targetRotY = pointerX * 0.3;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotX, 0.05);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY, 0.05);
      
      // Scrollytelling Transform: 
      // Moves from a floating ring in the background to a 3D floor that wraps around the cards
      const targetZ = THREE.MathUtils.lerp(-8, 3, scroll);
      const targetScrollRotX = THREE.MathUtils.lerp(0, Math.PI * 0.4, scroll);
      
      // When the catalog section starts coming into view, drop the entire model deep down!
      // -4 from showcase scroll, and an additional -15 when catalog scrolls up.
      const safeCatScroll = isNaN(catScroll) ? 0 : catScroll;
      const showcaseY = THREE.MathUtils.lerp(0, -4, scroll);
      const catalogY = THREE.MathUtils.lerp(0, -15, safeCatScroll);
      const targetY = showcaseY + catalogY;
      
      group.current.position.z = targetZ;
      group.current.position.y = targetY;
      group.current.rotation.x += targetScrollRotX; 
    }
  });

  return (
    <group ref={group}>
      <instancedMesh ref={instancedMeshRef} args={[barGeometry, null, NUM_BARS]}>
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.9} 
        />
      </instancedMesh>
      
      <mesh ref={innerCore}>
        <Icosahedron args={[2, 2]}>
          <MeshDistortMaterial 
            color="#000000" 
            distort={0.4} 
            speed={3} 
            roughness={0.1} 
            metalness={1}
          />
        </Icosahedron>
      </mesh>
    </group>
  );
}

export default function DashboardScene({ showcaseScroll, catalogScroll }) {
  return (
    <div className="fixed inset-0 w-full h-full -z-20 pointer-events-none">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={45} />
        
        {/* Environment adds gorgeous realistic reflections to the metal materials */}
        <Environment preset="city" />
        
        <AudioWaveformCore showcaseScroll={showcaseScroll} catalogScroll={catalogScroll} />
        
        <ambientLight intensity={0.5} color="#ffffff" />
        <spotLight position={[10, 15, 10]} angle={0.4} penumbra={1} color="#ffffff" intensity={300} decay={1.5} />
        <spotLight position={[-10, -10, -10]} angle={0.8} penumbra={1} color="#ffffff" intensity={200} decay={1.5} />
        <pointLight position={[0, 5, 5]} intensity={100} color="#e4e4e7" decay={2} />
      </Canvas>
    </div>
  );
}
