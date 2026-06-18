'use client';

import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

const FUND_NAMES = [
  'HDFC Flexi Cap', 'SBI Small Cap', 'Parag Parikh Flexi', 
  'Nippon India Large', 'Quant Active', 'Mirae Asset Emerging',
  'Kotak Emerging Equity', 'Axis Midcap', 'ICICI Pru Value',
  'DSP Midcap', 'Canara Robeco Bluechip'
];

const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface FeedItem {
  id: string;
  fundName: string;
  oldGrade: string;
  newGrade: string;
  isUpgrade: boolean;
  timeAgo: string;
}

export function MomentumFeed() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate random mock data
  const feedItems = useMemo<FeedItem[]>(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const fundName = getRandomItem(FUND_NAMES);
      const oldGradeIdx = Math.floor(Math.random() * 5) + 1; // 1 to 5
      const isUpgrade = Math.random() > 0.4; // 60% chance of upgrade
      const newGradeIdx = isUpgrade ? oldGradeIdx - 1 : oldGradeIdx + 1;
      
      return {
        id: `feed-${i}`,
        fundName,
        oldGrade: GRADES[oldGradeIdx],
        newGrade: GRADES[newGradeIdx],
        isUpgrade,
        timeAgo: `${Math.floor(Math.random() * 59) + 1}m ago`,
      };
    });
  }, []);

  if (!isMounted) return <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col h-full bg-[#080808]/80 min-h-[300px]"></div>;

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col h-full bg-[#080808]/80">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity size={18} className="text-primary animate-pulse" />
          <h3 className="text-sm font-serif italic text-white tracking-wide">Live Momentum</h3>
        </div>
        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-widest text-white/50">
          Real-Time
        </span>
      </div>

      <div className="relative flex-grow overflow-hidden mask-image-vertical">
        <motion.div 
          className="flex flex-col gap-4 absolute w-full"
          animate={{ y: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        >
          {/* Double list for seamless loop */}
          {[...Array(2)].map((_, listIdx) => (
            <div key={`list-${listIdx}`} className="flex flex-col gap-4">
              {feedItems.map((item, idx) => (
                <div key={`${listIdx}-${item.id}-${idx}`} className="flex items-center justify-between group p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-on-surface font-medium truncate max-w-[180px]">{item.fundName}</span>
                    <span className="text-[10px] text-white/40 font-mono tracking-wider">{item.timeAgo}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-white/50">{item.oldGrade}</span>
                    <div className={`p-1 rounded-full ${item.isUpgrade ? 'bg-success-teal/20 text-success-teal' : 'bg-[#F27D26]/20 text-[#F27D26]'}`}>
                      {item.isUpgrade ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <span className={`text-xs font-mono font-bold ${item.isUpgrade ? 'text-success-teal' : 'text-[#F27D26]'}`}>
                      {item.newGrade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
