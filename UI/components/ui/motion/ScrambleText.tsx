'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface ScrambleTextProps {
  text: string;
  delay?: number; // Delay in ms before starting the scramble
  className?: string;
  duration?: number; // Total frames
}

export function ScrambleText({ text, delay = 0, className = '', duration = 24 }: ScrambleTextProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsDone(true);
      return;
    }

    const el = elementRef.current;
    if (!el) return;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
      let frame = 0;
      const totalFrames = duration;

      intervalId = setInterval(() => {
        el.textContent = text
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' ';
            if (frame / totalFrames > i / text.length) return char;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');
        
        if (++frame > totalFrames) {
          clearInterval(intervalId);
          setIsDone(true);
        }
      }, 35);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [text, delay, shouldReduceMotion, duration]);

  return (
    <span ref={elementRef} className={className}>
      {shouldReduceMotion || isDone ? text : text.replace(/./g, '—')}
    </span>
  );
}
