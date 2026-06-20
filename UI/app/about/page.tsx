'use client';

import { Github, Code2, Database, LayoutTemplate, LineChart, FileCode2 } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="flex-grow w-full max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pt-28 min-h-screen">
      <div className="mb-stack-lg">
        <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Project Origin</span>
        <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-6 tracking-tighter">About FundScope</h1>
        <p className="text-lg text-on-surface-variant max-w-2xl font-light leading-relaxed">
          An end-to-end analytical pipeline designed to demystify mutual fund performance, risk, and true alpha. 
          Built from the ground up as a comprehensive portfolio project demonstrating full-stack engineering and data science capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-panel p-8 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <Database className="text-[#3b82f6]" size={24} />
            <h2 className="text-2xl font-semibold text-white">Backend Pipeline</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            The data engine is written entirely in Python. It fetches historical NAV data directly from the official AMFI (Association of Mutual Funds in India) public API, calculates compound annual growth rates, analyzes standard deviation to determine volatility, and scores funds using Min-Max scaling across multiple risk and return dimensions.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Python 3</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Pandas</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">SQLite / JSON</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Requests</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <LayoutTemplate className="text-[#10b981]" size={24} />
            <h2 className="text-2xl font-semibold text-white">Frontend Architecture</h2>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            The user interface is built with the latest Next.js 15 App Router. It employs a premium dark aesthetic with high-performance client-side rendering for complex mathematical visualizations. Real-time metrics like Maximum Drawdown, Calmar Ratio, Sortino Ratio, and SIP XIRR are computed directly in the browser to offload server processing.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Next.js 15</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">React 19</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Tailwind CSS</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Recharts</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/50">Framer Motion</span>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="glass-panel p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#F27D26] via-transparent to-transparent pointer-events-none"></div>
        
        <FileCode2 size={48} className="text-[#F27D26] mb-6 opacity-80" />
        <h2 className="text-3xl font-semibold text-white mb-4 relative z-10">Open Source Portfolio Project</h2>
        <p className="text-white/60 max-w-xl mb-8 relative z-10 leading-relaxed">
          FundScope was created to demonstrate the ability to architect, build, and deploy a full-stack analytical web application. 
          The entire source code, including the Python data processing pipeline and the Next.js frontend, is available on GitHub.
        </p>
        
        <a 
          href="https://github.com/Amol257/fundscope" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 font-medium hover:bg-white/90 transition-colors relative z-10"
        >
          <Github size={18} />
          View Source on GitHub
        </a>
      </motion.div>
    </main>
  );
}
