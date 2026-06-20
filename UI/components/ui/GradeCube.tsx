'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Text, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SPRING_HEAVY } from '@/lib/motion';

const GRADE_COLOR: Record<string, string> = {
  S: '#F27D26',       // primary / solar flame
  A: '#1D9E75',       // success-teal
  B: '#378ADD',       // info-blue
  C: '#EF9F27',       // warning-amber
  D: '#E24B4A',       // danger-red
  'N/A': '#6c757d',   // default
};

function Cube({ grade }: { grade: string }) {
  const mesh = useRef<THREE.Group>(null);
  const color = new THREE.Color(GRADE_COLOR[grade] || GRADE_COLOR['N/A']);
  
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(
    new THREE.MeshPhysicalMaterial({ 
      color: color,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9, // This makes it glassy/translucent
      ior: 1.5,
      thickness: 0.5,
      transparent: true,
    })
  );

  // Smooth color transition
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.color.lerp(color, delta * (SPRING_HEAVY.stiffness / SPRING_HEAVY.damping / 2));
    }
  });

  // Revolve animation
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.8;
      mesh.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={1}>
      <group ref={mesh}>
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.15} smoothness={4}>
          <primitive object={materialRef.current} attach="material" />
        </RoundedBox>
        
        {/* Front Face Text */}
        <Text
          position={[0, 0, 0.61]}
          fontSize={0.7}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {grade}
        </Text>
        
        {/* Back Face Text */}
        <Text
          position={[0, 0, -0.61]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.7}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {grade}
        </Text>
      </group>
    </Float>
  );
}

export function GradeCube({ grade }: { grade: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 40 }} className="!w-[72px] !h-[72px]">
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffffff" />
      <Environment preset="city" />
      <Cube grade={grade} />
    </Canvas>
  );
}
