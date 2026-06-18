'use client';

import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface GsapRevealProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  yOffset?: number;
}

export function GsapReveal({ children, className = '', staggerDelay = 0.08, yOffset = 50 }: GsapRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !containerRef.current) return;

    const elements = containerRef.current.children;

    const animation = gsap.fromTo(
      elements,
      { y: yOffset, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: staggerDelay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      }
    );

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [shouldReduceMotion, staggerDelay, yOffset]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
