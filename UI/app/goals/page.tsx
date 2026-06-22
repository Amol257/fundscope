'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, TrendingUp, ShieldCheck, ArrowRight, Wallet, Clock, AlertTriangle, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { FadeUp } from '@/components/ui/motion/FadeUp';
import fundData from '@/lib/compact-data.json';
import { AnimateNumber } from '@/components/ui/animated-blur-number';
import Link from 'next/link';

type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

const RISK_PROFILES = {
  conservative: {
    label: 'Conservative',
    return: 8,
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    categories: ['Corporate Bond', 'Banking & PSU Debt', 'Short Duration', 'Money Market', 'Liquid', 'Conservative Hybrid']
  },
  moderate: {
    label: 'Moderate',
    return: 12,
    icon: Wallet,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    categories: ['Large Cap', 'Flexi Cap', 'Focused Fund', 'Balanced Advantage', 'Aggressive Hybrid', 'ELSS (Tax Saver)']
  },
  aggressive: {
    label: 'Aggressive',
    return: 15,
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    categories: ['Mid Cap', 'Small Cap', 'Multi Cap', 'Technology', 'Manufacturing', 'PSU Equity', 'Defence']
  }
};

export default function GoalsCalculator() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [targetCorpus, setTargetCorpus] = useState(10000000); // 1 Cr
  const [timePeriod, setTimePeriod] = useState(10);
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate');

  const formatCurrency = (num: number) => {
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + 'Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + 'L';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  const expectedReturn = RISK_PROFILES[riskProfile].return;

  // Reverse SIP Math
  const requiredSIP = useMemo(() => {
    const monthlyRate = (expectedReturn / 100) / 12;
    const months = timePeriod * 12;
    if (monthlyRate === 0) return targetCorpus / months;
    
    // Target = SIP * [((1 + r)^n - 1) / r] * (1 + r)
    // SIP = Target / ([((1 + r)^n - 1) / r] * (1 + r))
    const compoundFactor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    return targetCorpus / compoundFactor;
  }, [targetCorpus, timePeriod, expectedReturn]);

  const totalInvested = requiredSIP * timePeriod * 12;
  const gains = Math.max(0, targetCorpus - totalInvested);

  // Chart data
  const chartData = useMemo(() => {
    const monthlyRate = (expectedReturn / 100) / 12;
    const data = [];

    for (let i = 1; i <= timePeriod; i++) {
      const currentMonths = i * 12;
      const invested = requiredSIP * currentMonths;
      const futureValue = monthlyRate === 0 
        ? invested 
        : requiredSIP * ((Math.pow(1 + monthlyRate, currentMonths) - 1) / monthlyRate) * (1 + monthlyRate);
      
      data.push({
        year: `Year ${i}`,
        invested: Math.round(invested),
        wealth: Math.round(futureValue),
      });
    }
    return data;
  }, [requiredSIP, expectedReturn, timePeriod]);

  // Recommended Funds
  const recommendedFunds = useMemo(() => {
    const categories = RISK_PROFILES[riskProfile].categories;
    return fundData.funds
      .filter(f => categories.includes(f.sub_category) && (f.score_grade === 'S' || f.score_grade === 'A'))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [riskProfile]);

  return (
    <main className="flex-grow pt-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-24 min-h-screen">
      
      <section className="mb-20">
        <div className="mb-stack-lg text-center md:text-left">
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase mb-4 block">Goal Planning</span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Target SIP Calculator</h1>
          <p className="text-base text-on-surface-variant max-w-2xl font-light mx-auto md:mx-0">
            Work backwards from your financial goals. Set your target corpus, timeline, and risk appetite to find out exactly how much you need to invest every month.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel p-8 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-on-surface mb-8 flex items-center gap-2 border-b border-white/10 pb-4">
                <Target className="text-emerald-400" size={20} />
                Set Your Goal
              </h2>
              
              <div className="space-y-8">
                {/* Target Corpus */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Target Wealth</label>
                    <span className="text-xl font-medium text-emerald-400 font-bold">{formatCurrency(targetCorpus)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100000" max="100000000" step="100000" 
                    value={targetCorpus} 
                    onChange={(e) => setTargetCorpus(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-emerald-400" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>₹1L</span>
                    <span>₹10Cr</span>
                  </div>
                </div>

                {/* Time Period */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Time Horizon</label>
                    <span className="text-xl font-medium text-on-surface">{timePeriod} {timePeriod === 1 ? 'Year' : 'Years'}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="40" step="1" 
                    value={timePeriod} 
                    onChange={(e) => setTimePeriod(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>1 Yr</span>
                    <span>40 Yrs</span>
                  </div>
                </div>

                {/* Risk Profile Selection */}
                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-3 block">Risk Appetite</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(Object.keys(RISK_PROFILES) as RiskProfile[]).map((profile) => {
                      const isActive = riskProfile === profile;
                      const { label, return: expected, color, bg, border, icon: Icon } = RISK_PROFILES[profile];
                      return (
                        <button
                          key={profile}
                          onClick={() => setRiskProfile(profile)}
                          className={`relative p-4 rounded border text-left transition-all ${
                            isActive ? `${bg} ${border} shadow-lg shadow-${color.replace('text-', '')}/10` : 'bg-white/5 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <Icon className={`mb-2 ${isActive ? color : 'text-white/40'}`} size={16} />
                          <div className={`text-xs font-semibold mb-1 ${isActive ? 'text-on-surface' : 'text-white/60'}`}>{label}</div>
                          <div className={`text-[10px] font-mono ${isActive ? color : 'text-white/40'}`}>{expected}% p.a.</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Callout */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`border p-6 relative overflow-hidden ${RISK_PROFILES[riskProfile].bg} ${RISK_PROFILES[riskProfile].border}`}
            >
              <h3 className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-4 z-10 relative ${RISK_PROFILES[riskProfile].color}`}>
                Profile: {RISK_PROFILES[riskProfile].label}
              </h3>
              <p className="text-sm font-light text-white/80 mb-0 relative z-10 leading-relaxed">
                Assuming a <strong className="text-white">{expectedReturn}%</strong> annual return. We recommend investing in {riskProfile === 'conservative' ? 'high-quality debt and hybrid funds' : riskProfile === 'moderate' ? 'large cap and flexi cap equity funds' : 'mid and small cap equity funds'} to achieve this target.
              </p>
            </motion.div>
          </div>

          {/* Main Visualization Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/20 border border-emerald-500/20 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-center"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <Target size={14} /> Required Monthly SIP
                </div>
                <div className="text-5xl font-medium text-on-surface tracking-tight">
                  <AnimateNumber value={requiredSIP} format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} locale="en-IN" />
                </div>
                <div className="text-[9px] font-mono tracking-widest text-emerald-400/60 mt-3 uppercase">
                  Invested over {timePeriod * 12} months
                </div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 pointer-events-none rounded-bl-full"></div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-4">Goal Breakdown</div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">Total Invested</span>
                      <span className="font-mono text-white/90">{formatCurrency(totalInvested)}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded overflow-hidden">
                      <div className="h-full bg-white/40" style={{ width: `${(totalInvested / targetCorpus) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400">Estimated Gains</span>
                      <span className="font-mono text-emerald-400">{formatCurrency(gains)}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500/60" style={{ width: `${(gains / targetCorpus) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 shadow-2xl flex-grow min-h-[350px] relative"
            >
              <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <h3 className="text-2xl font-semibold text-on-surface leading-none">Goal Trajectory</h3>
              </div>
              <div className="w-full h-[250px]">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontFamily: 'var(--font-sans)', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      minTickGap={30}
                      dy={10}
                    />
                    <YAxis 
                      tickFormatter={(val) => formatCurrency(val)}
                      tick={{ fontFamily: 'var(--font-sans)', fontSize: 9, fill: 'rgba(255,255,255,0.4)' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      formatter={(value: any) => [new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value))]}
                      contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontFamily: 'var(--font-medium)', fontStyle: 'italic', fontSize: '18px' }}
                      itemStyle={{ color: '#10b981' }}
                      labelStyle={{ fontFamily: 'var(--font-sans)', fontStyle: 'normal', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}
                    />
                    <Area type="monotone" dataKey="wealth" name="Estimated Wealth" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWealth)" isAnimationActive={true} animationDuration={1000} />
                    <Area type="monotone" dataKey="invested" name="Total Invested" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" fill="none" isAnimationActive={true} animationDuration={1000} />
                  </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading trajectory...</div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recommended Funds */}
      <section className="border-t border-white/5 pt-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-serif italic text-on-surface">Curated for Your Goal</h2>
            <p className="text-sm text-white/50 mt-2 max-w-xl">
              Based on your {RISK_PROFILES[riskProfile].label.toLowerCase()} risk profile, we recommend these top-tier funds to help you achieve your {formatCurrency(targetCorpus)} target.
            </p>
          </div>
          <Link href="/screener" className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            See all funds <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedFunds.map((fund, index) => (
            <motion.div 
              key={fund.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link href={`/fund/${fund.code}`} className="block h-full">
                <div className="glass-panel p-6 shadow-xl hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-4">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40 block mb-2">{fund.sub_category}</span>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
                          {fund.name.split(' - ')[0]}
                        </h3>
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        <div className={`px-2 py-1 text-xs font-bold rounded ${
                          fund.score_grade === 'S' ? 'bg-[#F27D26]/20 text-[#F27D26]' : 
                          fund.score_grade === 'A' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'
                        }`}>
                          Grade {fund.score_grade}
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Score: {fund.score}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5">
                    <div>
                      <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">3Y CAGR</div>
                      <div className="text-sm font-medium text-white">{fund.cagr_3yr ? `${fund.cagr_3yr.toFixed(1)}%` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">5Y CAGR</div>
                      <div className="text-sm font-medium text-white">{fund.cagr_5yr ? `${fund.cagr_5yr.toFixed(1)}%` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">1Y CAGR</div>
                      <div className="text-sm font-medium text-white">{fund.cagr_1yr ? `${fund.cagr_1yr.toFixed(1)}%` : '-'}</div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

    </main>
  );
}
