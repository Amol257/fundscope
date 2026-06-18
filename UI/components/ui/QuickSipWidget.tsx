'use client';

import { useState } from 'react';
import { IndianRupee, Calculator } from 'lucide-react';
import { AnimateNumber } from '@/components/ui/animated-blur-number';

interface QuickSipWidgetProps {
  avgCagr: number; // e.g., 14.5 for 14.5%
}

export function QuickSipWidget({ avgCagr }: QuickSipWidgetProps) {
  const [monthlySip, setMonthlySip] = useState(10000);
  const years = 10;
  
  // Future Value = P * [ ( (1 + r)^n - 1 ) / r ] * (1 + r)
  // where P is monthly SIP, r is monthly rate, n is total months
  const r = (avgCagr / 100) / 12;
  const n = years * 12;
  
  const futureValue = r > 0 
    ? monthlySip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    : monthlySip * n;
    
  const investedAmount = monthlySip * n;
  const wealthGained = futureValue - investedAmount;

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calculator size={18} className="text-white/60" />
          <h3 className="text-sm font-serif italic text-white tracking-wide">10Y SIP Projection</h3>
        </div>
        <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] uppercase tracking-widest text-primary">
          @ {avgCagr.toFixed(1)}% CAGR
        </span>
      </div>

      <div className="flex-grow flex flex-col justify-between">
        <div className="mb-6">
          <label className="text-[10px] text-white/50 uppercase tracking-widest mb-3 flex justify-between">
            <span>Monthly Investment</span>
            <span className="text-white font-mono flex items-center">
              <IndianRupee size={10} className="mr-0.5" />
              {monthlySip.toLocaleString('en-IN')}
            </span>
          </label>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={monthlySip}
            onChange={(e) => setMonthlySip(Number(e.target.value))}
            className="w-full accent-primary h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-[9px] text-white/30 font-mono">
            <span>₹1K</span>
            <span>₹1L</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <span className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Total Invested</span>
            <div className="text-sm font-mono text-white/80 flex items-center">
              <IndianRupee size={12} className="mr-0.5" />
              {investedAmount.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
            <span className="block text-[9px] uppercase tracking-widest text-primary mb-1">Expected Value</span>
            <div className="text-lg font-serif italic text-white flex items-center shadow-text-glow">
              <IndianRupee size={16} className="mr-0.5 text-primary" />
              <AnimateNumber value={futureValue} formatter={(val) => Math.round(val).toLocaleString('en-IN')} />
            </div>
            <span className="text-[10px] text-success-teal font-mono mt-1 block">
              +₹{Math.round(wealthGained).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
