'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

export interface HeatmapRow {
  category: string;
  cagr1y: number | null;
  cagr3y: number | null;
  cagr5y: number | null;
}

interface CategoryHeatmapProps {
  data: HeatmapRow[];
}

export function CategoryHeatmap({ data }: CategoryHeatmapProps) {
  // Find min and max for color interpolation to make it dynamic
  let min = 0;
  let max = 25; // default max
  
  const allValues = data.flatMap(r => [r.cagr1y, r.cagr3y, r.cagr5y].filter(v => v !== null) as number[]);
  if (allValues.length > 0) {
    min = Math.min(...allValues);
    max = Math.max(...allValues);
  }

  // Ensure reasonable bounds
  if (min > 0) min = 0;
  if (max < 15) max = 15;

  const getInterpolatedStyles = (value: number | null) => {
    if (value === null) return { backgroundColor: 'rgba(255,255,255,0.02)' };
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    // Hue: 0 is red, 45 is orange/yellow, 130 is green
    const hue = ratio * 130; 
    
    const color1 = `hsla(${hue}, 80%, 45%, 0.8)`;
    const color2 = `hsla(${hue}, 90%, 25%, 0.9)`;
    const glowColor = `hsla(${hue}, 80%, 45%, 0.3)`;

    return { 
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
      boxShadow: `0 0 12px ${glowColor}, inset 0 1px 1px rgba(255,255,255,0.2)`,
      border: `1px solid rgba(255,255,255,0.05)`
    };
  };

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } }
  };

  const rowVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } }
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 gap-2 mb-2 pb-2 border-b border-white/10 text-[10px] uppercase tracking-widest text-white/50 text-right pr-2">
        <div className="text-left pl-2">Category</div>
        <div>1Y CAGR</div>
        <div>3Y CAGR</div>
        <div>5Y CAGR</div>
      </div>

      {/* Grid Body */}
      <motion.div 
        className="flex-grow overflow-y-auto scrollbar-hide pr-2 flex flex-col gap-1.5"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {data.map((row, i) => (
          <motion.div key={row.category} variants={rowVariants}>
            <Link 
              href={`/screener?category=${encodeURIComponent(row.category)}`}
              className="grid grid-cols-4 gap-2 group hover:bg-white/5 p-1.5 rounded-md transition-colors"
            >
              <motion.div variants={cellVariants} className="text-xs font-serif italic flex items-center pl-1 text-white/80 group-hover:text-white truncate">
                {row.category.replace('Sectoral & Thematic', 'Sectoral')}
              </motion.div>
              
              <motion.div variants={cellVariants}
                className="rounded text-xs font-mono flex items-center justify-center py-1.5 transition-all group-hover:opacity-100 opacity-90"
                style={getInterpolatedStyles(row.cagr1y)}
              >
                {row.cagr1y !== null ? `${row.cagr1y.toFixed(1)}%` : '-'}
              </motion.div>
              
              <motion.div variants={cellVariants}
                className="rounded text-xs font-mono flex items-center justify-center py-1.5 transition-all group-hover:opacity-100 opacity-90"
                style={getInterpolatedStyles(row.cagr3y)}
              >
                {row.cagr3y !== null ? `${row.cagr3y.toFixed(1)}%` : '-'}
              </motion.div>
              
              <motion.div variants={cellVariants}
                className="rounded text-xs font-mono flex items-center justify-center py-1.5 transition-all group-hover:opacity-100 opacity-90"
                style={getInterpolatedStyles(row.cagr5y)}
              >
                {row.cagr5y !== null ? `${row.cagr5y.toFixed(1)}%` : '-'}
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
