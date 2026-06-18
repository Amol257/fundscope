'use client';

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface FundPoint {
  id: string;
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  name: string;
  grade: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Equity':               '#e8703a',
  'Debt':                 '#5282c2',
  'Hybrid':               '#9e7bd6',
  'Index & ETF':          '#49b0d1',
  'Sectoral & Thematic':  '#e69945',
  'Other':                '#6c757d',
};

// Generate points on a sphere
function getSphericalPosition(radius: number, index: number, total: number): [number, number, number] {
  const phi = Math.acos(1 - (2 * index) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  
  return [
    radius * Math.cos(theta) * Math.sin(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(phi)
  ];
}

interface GlobeDataProps {
  funds: any[];
}

function GlobePoints({ funds }: GlobeDataProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const [hovered, setHovered] = useState<number | null>(null);

  const particles = useMemo<FundPoint[]>(() => {
    const total = Math.min(funds.length, 3000); // Cap for performance
    const radius = 2.5;
    
    return funds.slice(0, total).map((f, i) => {
      const pos = getSphericalPosition(radius + (Math.random() * 0.2 - 0.1), i, total);
      
      const isHighGrade = f.score_grade?.startsWith('S') || f.score_grade?.startsWith('A');
      const baseColorStr = CATEGORY_COLORS[f.category] || CATEGORY_COLORS['Other'];
      const color = new THREE.Color(baseColorStr);
      
      if (isHighGrade) {
        color.lerp(new THREE.Color('#ffffff'), 0.4);
      } else {
        color.lerp(new THREE.Color('#000000'), 0.4);
      }

      return {
        id: f.code,
        position: pos,
        color,
        size: isHighGrade ? 1.5 : 0.8,
        name: f.name,
        grade: f.score_grade || 'N/A'
      };
    });
  }, [funds]);

  useFrame(() => {
    if (meshRef.current) {
      particles.forEach((particle, i) => {
        const isHovered = hovered === i;
        dummy.position.set(...particle.position);
        
        // Scale pulse
        const scale = isHovered ? particle.size * 2 : particle.size;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        meshRef.current!.setColorAt(i, particle.color);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, particles.length]}
        onPointerMove={(e) => {
          e.stopPropagation();
          setHovered(e.instanceId ?? null);
        }}
        onPointerOut={() => setHovered(null)}
      >
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      
      {hovered !== null && particles[hovered] && (
        <Html position={particles[hovered].position} center className="pointer-events-none">
          <div className="bg-[#111]/90 backdrop-blur-md p-3 border border-white/20 rounded-lg shadow-2xl w-48 transition-opacity duration-200">
            <h4 className="text-white text-xs font-serif italic truncate mb-1">{particles[hovered].name}</h4>
            <span className="text-[10px] text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-widest">
              Grade {particles[hovered].grade}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[2.4, 64, 64]} />
      <meshBasicMaterial color="#02040a" transparent opacity={0.8} />
    </mesh>
  );
}

function ScrollFix() {
  const { gl } = useThree();
  useEffect(() => {
    // OrbitControls aggressively sets touchAction='none' which breaks mobile scrolling.
    // We override it here to allow vertical scrolling (pan-y) while keeping horizontal rotation.
    if (gl.domElement) {
      gl.domElement.style.touchAction = 'pan-y';
    }
  }, [gl]);
  return null;
}

export function FundGlobe({ funds }: { funds: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      data-lenis-prevent="true"
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
    >
      <Canvas 
        camera={{ position: [0, 0, 9], fov: 45 }} 
        dpr={[1, 2]}
        eventSource={containerRef}
        eventPrefix="client"
      >
        <ambientLight intensity={0.5} />
        <OrbitControls 
          makeDefault
          enableZoom={true} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
          minDistance={3}
          maxDistance={10}
        />
        <ScrollFix />
        <Atmosphere />
        <GlobePoints funds={funds} />
      </Canvas>
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <span className="text-[9px] uppercase tracking-widest text-white/30 font-mono">Interactive WebGL Topology</span>
      </div>
    </div>
  );
}
