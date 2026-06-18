import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  tooltip?: string;
  delta?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  sparklineData?: number[];
}

export function MetricCard({ 
  label, 
  value, 
  tooltip, 
  delta, 
  icon, 
  className,
  labelClassName,
  valueClassName,
  sparklineData
}: MetricCardProps) {
  
  // Calculate sparkline path
  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    
    const width = 60;
    const height = 24;
    
    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' L ');

    return (
      <svg width={width} height={height} className="opacity-60 ml-auto mt-auto overflow-visible" viewBox={`-2 -2 ${width+4} ${height+4}`}>
        <defs>
          <filter id="glow-spark" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-spark)" />
      </svg>
    );
  };

  return (
    <div className={cn("glass-panel p-4 md:p-6 shadow-2xl relative group", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 flex items-center gap-1", labelClassName)}>
          {label}
          {tooltip && (
            <div className="relative inline-flex ml-1">
              <Info size={12} className="text-white/40 cursor-help hover:text-white/80 transition-colors" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#0c0f1d] border border-white/10 rounded shadow-xl text-xs text-white/80 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {tooltip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#0c0f1d]"></div>
              </div>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-white/20">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-3 relative z-10 w-full">
        <div className={cn("text-2xl md:text-3xl font-serif italic text-on-surface", valueClassName)}>
          {value}
        </div>
        {delta && (
          <div className="text-xs">
            {delta}
          </div>
        )}
        {sparklineData && (
          <div className={cn("ml-auto text-primary", valueClassName)}>
            {renderSparkline()}
          </div>
        )}
      </div>
    </div>
  );
}
