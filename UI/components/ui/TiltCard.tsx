'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { MouseEvent, useRef } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;     // degrees, default 10
  glareEnabled?: boolean;
}

export function TiltCard({ children, className, maxTilt = 10, glareEnabled = false }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 200, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 200, damping: 20, mass: 0.5 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const glareX = useTransform(springX, [-0.5, 0.5], ['-20%', '120%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['-20%', '120%']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02, z: 20 }}
      transition={{ scale: { duration: 0.2 } }}
    >
      {children}

      {/* Glare overlay */}
      {glareEnabled && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: 0.06, borderRadius: 'inherit' }}
        >
          <motion.div
            className="absolute w-40 h-40 rounded-full bg-white blur-2xl"
            style={{ left: glareX, top: glareY, translateX: '-50%', translateY: '-50%' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
