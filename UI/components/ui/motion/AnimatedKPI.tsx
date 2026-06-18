'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

interface AnimatedKPIProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedKPI({ value, suffix = '', prefix = '', decimals = 0 }: AnimatedKPIProps) {
  const count = useMotionValue(0);
  
  const formatted = useTransform(count, (v) => {
    const rounded = Number(v).toFixed(decimals);
    // Use en-IN for Indian number formatting if no decimals, or standard if decimals exist
    const displayValue = decimals === 0 
      ? parseInt(rounded).toLocaleString('en-IN')
      : rounded;
      
    return `${prefix}${displayValue}${suffix}`;
  });

  useEffect(() => {
    const controls = animate(count, value, { 
      duration: 1.2, 
      ease: 'easeOut' 
    });
    return controls.stop;
  }, [count, value]);

  return <motion.span>{formatted}</motion.span>;
}
