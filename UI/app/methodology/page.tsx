'use client';

import { Settings, BarChart2, ShieldCheck, Activity, Target, TrendingUp } from 'lucide-react';
import { FadeUp } from '@/components/ui/motion/FadeUp';
import { StaggerChildren, itemVariants } from '@/components/ui/motion/StaggerChildren';
import { TiltCard } from '@/components/ui/TiltCard';
import { motion } from 'motion/react';

export default function MethodologyPage() {
  const criteria = [
    { name: '5Y Returns', weight: '25%', desc: 'Compounded Annual Growth Rate (CAGR) over 5 years vs Benchmark.', icon: <TrendingUp size={24} /> },
    { name: 'Consistency', weight: '25%', desc: 'Percentage of rolling 3-year periods with positive absolute returns.', icon: <Activity size={24} /> },
    { name: 'Sharpe Ratio', weight: '20%', desc: 'Risk-adjusted return efficiency against the risk-free rate.', icon: <Target size={24} /> },
    { name: 'Alpha Generation', weight: '15%', desc: 'Excess return generated over the passive benchmark index.', icon: <BarChart2 size={24} /> },
    { name: 'Risk / Volatility', weight: '15%', desc: 'Downside protection and standard deviation of returns.', icon: <ShieldCheck size={24} /> },
  ];

  const grades = [
    { grade: 'S - Excellent', score: '90-100', color: 'text-amber-400' },
    { grade: 'A - Buy', score: '75-89', color: 'text-emerald-400' },
    { grade: 'B - Hold', score: '55-74', color: 'text-blue-400' },
    { grade: 'C - Underperform', score: '40-54', color: 'text-purple-400' },
    { grade: 'D - Sell', score: '0-39', color: 'text-red-400' },
  ];

  return (
    <main className="flex-grow pt-[100px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-stack-lg min-h-screen">
      <FadeUp distance={40} className="mb-stack-lg">
        <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Scoring Engine</span>
        <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Methodology</h1>
        <p className="text-base text-on-surface-variant max-w-2xl font-light">
          We use a quantitative, rule-based approach to eliminate human bias. Our scoring engine evaluates 10 years of historical data to build a composite risk-adjusted score for every fund.
        </p>
      </FadeUp>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column */}
        <FadeUp delay={0.1}>
          <TiltCard glareEnabled maxTilt={5} className="glass-panel p-8 shadow-2xl rounded-xl h-full">
            <h2 className="text-2xl font-semibold text-on-surface mb-6">Evaluation Criteria</h2>
            <StaggerChildren className="flex flex-col gap-6">
              {criteria.map((item) => (
                <motion.div variants={itemVariants} key={item.name} className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="text-primary mt-1">{item.icon}</div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-on-surface font-bold text-sm">{item.name}</h3>
                      <span className="text-[10px] font-mono tracking-widest text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {item.weight}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </StaggerChildren>
          </TiltCard>
        </FadeUp>

        {/* Right Column */}
        <FadeUp delay={0.2}>
          <TiltCard glareEnabled maxTilt={5} className="glass-panel p-8 shadow-2xl rounded-xl h-full">
            <h2 className="text-2xl font-semibold text-on-surface mb-6">Grading System</h2>
            <StaggerChildren className="flex flex-col gap-4">
              {grades.map(grade => (
                <motion.div variants={itemVariants} key={grade.grade} className="flex justify-between items-center bg-black/40 p-4 rounded border border-white/5 hover:bg-white/5 transition-colors">
                  <span className={`text-xl font-medium font-bold ${grade.color}`}>{grade.grade}</span>
                  <span className="text-xs font-mono tracking-widest text-white/40">{grade.score} PTS</span>
                </motion.div>
              ))}
            </StaggerChildren>
          </TiltCard>
        </FadeUp>
      </div>

      {/* The Pipeline */}
      <FadeUp delay={0.3} className="mt-12 border border-white/10 p-8 shadow-2xl rounded-xl relative overflow-hidden bg-black/40 group">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent group-hover:opacity-20 transition-opacity duration-700"></div>
        <Settings className="text-white/10 absolute -right-4 -bottom-4 w-64 h-64 -rotate-45 group-hover:rotate-45 transition-transform duration-[10s] ease-linear" />
        
        <div className="relative z-10 max-w-4xl">
          <h2 className="text-2xl font-semibold text-on-surface mb-4">The Pipeline</h2>
          <p className="text-sm text-white/60 font-light leading-relaxed mb-6">
            Our Python-based backend fetches raw NAV history directly from AMFI APIs. We use NumPy and Pandas to calculate rolling returns, handle data imputation, and align benchmarks perfectly. 
            The features are then scaled using MinMaxScaler to distribute points evenly across the cohort.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded text-white/80 hover:bg-white/10 transition-colors cursor-default">Python</span>
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded text-white/80 hover:bg-white/10 transition-colors cursor-default">Pandas</span>
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded text-white/80 hover:bg-white/10 transition-colors cursor-default">Scikit-Learn</span>
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded text-white/80 hover:bg-white/10 transition-colors cursor-default">AMFI API</span>
          </div>
        </div>
      </FadeUp>
    </main>
  );
}
