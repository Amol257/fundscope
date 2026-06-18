'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export function HeatmapVisual() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="absolute inset-0 opacity-40 grid grid-cols-8 grid-rows-4 gap-1 p-2">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="rounded-sm" style={{ backgroundColor: `rgba(242, 125, 38, 0.2)` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 opacity-60 grid grid-cols-8 grid-rows-4 gap-1 p-2">
      {Array.from({ length: 32 }).map((_, i) => {
        const baseOpacity = Math.random() * 0.4 + 0.1;
        return (
          <motion.div 
            key={i} 
            className="rounded-sm bg-[#F27D26]"
            initial={{ opacity: baseOpacity }}
            animate={{ opacity: [baseOpacity, baseOpacity + 0.5, baseOpacity] }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "easeInOut" 
            }}
          />
        );
      })}
    </div>
  );
}

export function MomentumVisual() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="w-full h-full relative overflow-hidden flex items-end">
      <svg className="w-full h-24" viewBox="0 0 100 100" preserveAspectRatio="none">
        {mounted && (
          <motion.path 
            d="M0,80 L20,60 L40,70 L60,30 L80,40 L100,10" 
            fill="none" 
            stroke="#F27D26" 
            strokeWidth="2" 
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
          />
        )}
        <path d="M0,80 L20,60 L40,70 L60,30 L80,40 L100,10 L100,100 L0,100 Z" fill="url(#momentum-grad)" opacity="0.2" />
        <defs>
          <linearGradient id="momentum-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F27D26" />
            <stop offset="100%" stopColor="#F27D26" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      {/* Moving vertical scanline */}
      {mounted && (
        <motion.div 
          className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ left: '-10%' }}
          animate={{ left: '110%' }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}

export function AnimatedGradesVisual() {
  const grades = ['S', 'A', 'B', 'C', 'D'];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % grades.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [grades.length]);

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      <div className="relative h-[80px] w-full flex flex-col items-center justify-center">
        {grades.map((grade, index) => {
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex - 1 + grades.length) % grades.length;
          const isNext = index === (currentIndex + 1) % grades.length;

          let yOffset = 100;
          let opacity = 0;
          let scale = 0.8;
          let color = 'text-white/10';

          if (isActive) {
            yOffset = 0;
            opacity = 1;
            scale = 1;
            
            // Color based on grade
            if (grade === 'S') color = 'text-[#e8703a] shadow-text-glow'; // Orange
            else if (grade === 'A') color = 'text-[#e3b734]'; // Yellow
            else if (grade === 'B') color = 'text-[#49c277]'; // Green
            else if (grade === 'C') color = 'text-[#868e96]'; // Gray
            else if (grade === 'D') color = 'text-[#d94c4c]'; // Red
          } else if (isPrev) {
            yOffset = -60;
            opacity = 0.2;
          } else if (isNext) {
            yOffset = 60;
            opacity = 0.2;
          }

          return (
            <motion.div
              key={grade}
              className={`absolute text-6xl font-serif italic ${color}`}
              initial={false}
              animate={{ y: yOffset, opacity, scale }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {grade}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
