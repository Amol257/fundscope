'use client';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;     // 0.1 (subtle) to 0.8 (dramatic)
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.3, className }: ParallaxLayerProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
