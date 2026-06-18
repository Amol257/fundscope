'use client';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;       // stagger delay in seconds
  duration?: number;    // default 0.7
  distance?: number;    // px to travel up, default 32
  className?: string;
  once?: boolean;       // animate only first time in view, default true
}

export function FadeUp({
  children, delay = 0, duration = 0.7, distance = 32, className, once = true
}: FadeUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: distance }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
