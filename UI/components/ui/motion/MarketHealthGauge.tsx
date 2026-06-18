'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useState } from 'react';

interface MarketHealthGaugeProps {
  score: number;
  avgSharpe: number;
  beatRate: number;
  avg3yCagr: number;
}

export function MarketHealthGauge({ score, avgSharpe, beatRate, avg3yCagr }: MarketHealthGaugeProps) {
  const [isMounted, setIsMounted] = useState(false);
  const scoreValue = useMotionValue(0);
  const roundedScore = useTransform(scoreValue, (v) => Math.round(v));

  useEffect(() => {
    setIsMounted(true);
    const controls = animate(scoreValue, score, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1], // Custom spring-like easing
    });
    return () => controls.stop();
  }, [score, scoreValue]);

  // SVG parameters
  const radius = 90;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half circle
  
  // Calculate offset based on motion value if needed, 
  // but for Framer Motion on SVG, we can just animate pathLength
  
  // Define colors based on score
  const getColor = (s: number) => {
    if (s >= 66) return '#4ade80'; // emerald-400
    if (s >= 41) return '#fbbf24'; // amber-400
    return '#f87171'; // red-400
  };

  const currentColor = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative pt-4">
      {/* Gauge Arc */}
      <div className="relative w-[220px] h-[120px] overflow-hidden flex items-end justify-center">
        <svg
          viewBox="0 0 200 110"
          className="w-full h-full overflow-visible absolute bottom-0"
        >
          <defs>
            <filter id="glow-gauge" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="grad-green" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="grad-amber" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="grad-red" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
          {/* Background Arc */}
          <path
            d="M 10 100 A 90 90 0 0 1 190 100"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Foreground Animated Arc */}
          {isMounted && (
            <motion.path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke={score >= 66 ? "url(#grad-green)" : score >= 41 ? "url(#grad-amber)" : "url(#grad-red)"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#glow-gauge)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
        </svg>

        {/* Score Readout */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <motion.span className="text-5xl font-serif italic" style={{ color: currentColor }}>
            {roundedScore}
          </motion.span>
          <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Health Score</span>
        </div>
      </div>

      {/* Sub-indicators */}
      <div className="grid grid-cols-3 gap-2 w-full mt-8">
        <div className="flex flex-col items-center text-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block h-6">Avg Sharpe</span>
          <span className="text-sm font-mono text-white">{avgSharpe.toFixed(2)}</span>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-visible">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(Math.max((avgSharpe + 1) * 50, 0), 100)}%` }}
              transition={{ delay: 0.5, duration: 1 }}
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center text-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block h-6">Beat Rate</span>
          <span className="text-sm font-mono text-white">{beatRate.toFixed(1)}%</span>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-visible">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
              initial={{ width: 0 }}
              animate={{ width: `${beatRate}%` }}
              transition={{ delay: 0.6, duration: 1 }}
            />
          </div>
        </div>
        
        <div className="flex flex-col items-center text-center p-2 rounded-lg bg-white/5 border border-white/5">
          <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block h-6">Avg 3Y CAGR</span>
          <span className="text-sm font-mono text-white">{avg3yCagr.toFixed(1)}%</span>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-visible">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(avg3yCagr * 4, 100)}%` }} // Arbitrary visual scaling for 25% max
              transition={{ delay: 0.7, duration: 1 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
