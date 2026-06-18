'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

const TICKER_DATA = [
  { name: 'HDFC Flexi Cap', value: '₹1,452.30', change: 1.2, isUp: true },
  { name: 'SBI Small Cap', value: '₹182.45', change: 0.4, isUp: false },
  { name: 'Parag Parikh Flexi', value: '₹72.10', change: 0.8, isUp: true },
  { name: 'Mirae Asset Emerging', value: '₹124.90', change: 2.1, isUp: true },
  { name: 'Nippon India Large Cap', value: '₹89.55', change: 0.1, isUp: false },
  { name: 'ICICI Pru Value Discovery', value: '₹385.20', change: 1.5, isUp: true },
];

export default function Ticker() {
  return (
    <motion.div 
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="pt-20 w-full z-40 bg-background border-b border-white/10 relative overflow-hidden"
    >
      <div className="relative overflow-hidden whitespace-nowrap bg-[#080808]">
        
        <motion.div 
          className="flex flex-nowrap w-max hover:[animation-play-state:paused]"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {/* Double content for seamless loop */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex flex-nowrap">
              {TICKER_DATA.map((item, index) => (
                <div key={`${i}-${index}`} className="flex items-center gap-6 px-12 py-3 border-r border-white/10">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">{item.name}</span>
                  <span className="text-sm font-medium text-on-surface">{item.value}</span>
                  <span className={`text-[10px] font-mono tracking-widest flex items-center ${item.isUp ? 'text-success-teal' : 'text-[#F27D26]'}`}>
                    {item.change}%
                    {item.isUp ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </motion.div>

        {/* Fade gradients */}
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-[#080808] to-transparent pointer-events-none z-10"></div>
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-[#080808] to-transparent pointer-events-none z-10"></div>
      </div>
    </motion.div>
  );
}
