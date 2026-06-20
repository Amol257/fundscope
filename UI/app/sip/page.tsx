'use client';

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SlidersHorizontal, TrendingUp, Lightbulb, ArrowRight, Percent, Award, Landmark, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { FadeUp } from '@/components/ui/motion/FadeUp';
import fundData from '@/lib/compact-data.json';
import { AnimateNumber } from '@/components/ui/animated-blur-number';

const FundRateSelect = memo(({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void; 
}) => {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#121212] border border-white/20 text-[10px] uppercase tracking-[0.1em] font-medium text-on-surface p-3 outline-none focus:border-[#F27D26] transition-colors"
    >
      <option value="custom">Custom Expected Return</option>
      {(fundData.funds || []).map(f => (
        f.cagr_5yr !== null && (
          <option key={f.code} value={f.cagr_5yr}>
            {f.name.split(' - ')[0]} ({f.cagr_5yr.toFixed(1)}%)
          </option>
        )
      ))}
    </select>
  );
});
FundRateSelect.displayName = 'FundRateSelect';

export default function SIPCalculator() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // SIP Calculator States
  const [selectedFundRate, setSelectedFundRate] = useState('custom');
  const [monthlyInvestment, setMonthlyInvestment] = useState(10000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [timePeriod, setTimePeriod] = useState(10);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [inflationRate, setInflationRate] = useState(6.0);

  // Fee Impact Calculator States
  const [feePrincipal, setFeePrincipal] = useState(1000000); // 10L
  const [feeYears, setFeeYears] = useState(20);
  const [activeFeeRatio, setActiveFeeRatio] = useState(1.8);
  const [assumedGrossReturn, setAssumedGrossReturn] = useState(15.0);

  const handleFundRateChange = useCallback((value: string) => {
    setSelectedFundRate(value);
    if (value !== 'custom') {
      setExpectedReturn(parseFloat(value));
    }
  }, []);

  const formatCurrency = (num: number) => {
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + 'Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + 'L';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  // SIP math memo
  const chartData = useMemo(() => {
    const effectiveReturn = adjustForInflation 
      ? ((1 + (expectedReturn / 100)) / (1 + (inflationRate / 100)) - 1) * 100
      : expectedReturn;
    const monthlyRate = (effectiveReturn / 100) / 12;
    const data = [];

    for (let i = 1; i <= timePeriod; i++) {
      const currentMonths = i * 12;
      const invested = monthlyInvestment * currentMonths;
      const futureValue = monthlyRate === 0 
        ? invested 
        : monthlyInvestment * ((Math.pow(1 + monthlyRate, currentMonths) - 1) / monthlyRate) * (1 + monthlyRate);
      
      data.push({
        year: `Year ${i}`,
        invested: Math.round(invested),
        wealth: Math.round(futureValue),
      });
    }
    return data;
  }, [monthlyInvestment, expectedReturn, timePeriod, adjustForInflation, inflationRate]);

  const totalInvested = monthlyInvestment * timePeriod * 12;
  const expectedWealth = chartData[chartData.length - 1]?.wealth || 0;
  const gains = Math.max(0, expectedWealth - totalInvested);

  // Fee calculation memo
  const feeResults = useMemo(() => {
    const netReturnActive = (assumedGrossReturn - activeFeeRatio) / 100;
    const netReturnIndex = (assumedGrossReturn - 0.1) / 100; // 0.1% index fee

    const activeFundValue = feePrincipal * Math.pow(1 + netReturnActive, feeYears);
    const indexFundValue = feePrincipal * Math.pow(1 + netReturnIndex, feeYears);
    const wealthLost = Math.max(0, indexFundValue - activeFundValue);

    return {
      activeValue: Math.round(activeFundValue),
      indexValue: Math.round(indexFundValue),
      lost: Math.round(wealthLost)
    };
  }, [feePrincipal, feeYears, activeFeeRatio, assumedGrossReturn]);

  return (
    <main className="flex-grow pt-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-24 min-h-screen">
      
      {/* SECTION 1: SIP PROJECTOR */}
      <section className="mb-20">
        <div className="mb-stack-lg text-center md:text-left">
          <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Simulation Module</span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Wealth Projector</h1>
          <p className="text-base text-on-surface-variant max-w-2xl font-light mx-auto md:mx-0">
            Visualize the power of compounding. Adjust your monthly investments and target expected returns to see how your portfolio could grow over time.
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
                <SlidersHorizontal className="text-primary" size={20} />
                Investment Parameters
              </h2>
              
              <div className="space-y-8">
                {/* Select Rate Link */}
                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Link with Mutual Fund Rate</label>
                  <FundRateSelect 
                    value={selectedFundRate}
                    onChange={handleFundRateChange}
                  />
                </div>

                {/* Monthly Investment */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Monthly SIP Amount</label>
                    <span className="text-xl font-medium text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(monthlyInvestment)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" max="100000" step="500" 
                    value={monthlyInvestment} 
                    onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>₹500</span>
                    <span>₹1L</span>
                  </div>
                </div>

                {/* Expected Return */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Expected Return (p.a)</label>
                    <span className="text-xl font-medium text-on-surface">{expectedReturn}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="30" step="0.5" 
                    value={expectedReturn} 
                    onChange={(e) => {
                      setSelectedFundRate('custom');
                      setExpectedReturn(Number(e.target.value));
                    }}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>1%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Time Period */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Time Period</label>
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

                {/* Inflation Toggle */}
                <div className="border-t border-white/10 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#F27D26] block">Adjust for Inflation</label>
                      <p className="text-[9px] text-white/40 mt-1">Show real purchasing power</p>
                    </div>
                    <button 
                      onClick={() => setAdjustForInflation(!adjustForInflation)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-all active:scale-95 ${adjustForInflation ? 'bg-[#F27D26]' : 'bg-white/20'}`}
                    >
                      <motion.div 
                        layout
                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                        animate={{ x: adjustForInflation ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {adjustForInflation && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Expected Inflation</label>
                        <span className="text-xl font-medium text-white">{inflationRate}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="2" max="15" step="0.5" 
                        value={inflationRate} 
                        onChange={(e) => setInflationRate(Number(e.target.value))}
                        className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-[#F27D26]" 
                      />
                      <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                        <span>2%</span>
                        <span>15%</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-[#080808] border border-white/10 p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                <Lightbulb size={60} />
              </div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#F27D26] font-bold mb-4 z-10 relative">The Compounding Gap</h3>
              <p className="text-sm font-light text-white/60 mb-6 relative z-10 leading-relaxed">
                Notice how the wealth line curves sharply upwards in later years? Compounding rewards patience. Small increases in time or return rate create massive wealth gaps over decades.
              </p>
            </motion.div>
          </div>

          {/* Main Visualization Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Total Amount Invested</div>
                <div className="text-4xl font-medium text-on-surface">
                  <AnimateNumber value={totalInvested} format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} locale="en-IN" />
                </div>
                <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 pointer-events-none rounded-bl-full"></div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Estimated Wealth</div>
                <div className="text-4xl font-medium text-primary">
                  <AnimateNumber value={expectedWealth} format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} locale="en-IN" />
                </div>
                <div className="text-[10px] font-mono tracking-widest text-primary mt-3 flex items-center gap-1">
                  <TrendingUp size={14} />
                  +<AnimateNumber value={gains} format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} locale="en-IN" />
                </div>
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 pointer-events-none rounded-bl-full"></div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-8 shadow-2xl flex-grow min-h-[400px] relative"
            >
              <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <h3 className="text-3xl font-semibold text-on-surface leading-none">Wealth Projection Over Time</h3>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40">Fig. 02 // Trajectory</span>
              </div>
              <div className="w-full h-[350px]">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                      itemStyle={{ color: '#3b82f6' }}
                      labelStyle={{ fontFamily: 'var(--font-sans)', fontStyle: 'normal', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'var(--font-sans)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="wealth" name="Estimated Wealth" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorWealth)" isAnimationActive={true} animationDuration={1500} />
                    <Area type="monotone" dataKey="invested" name="Total Invested" stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5 5" fill="none" isAnimationActive={true} animationDuration={1500} />
                  </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading projection...</div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ACTIVE EXPENSE FEE IMPACT CALCULATOR */}
      <section>
        <div className="mb-stack-lg border-t border-white/5 pt-16">
          <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase mb-4 block">Fee Erosion Simulator</span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Active Fee Impact</h1>
          <p className="text-base text-on-surface-variant max-w-2xl font-light">
            Active management funds charge significant fees (often 1.5% - 2.5% p.a.). Calculate how much compounding wealth is lost to management expense ratios compared to a low-cost 0.1% index option.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 shadow-2xl"
            >
              <h2 className="text-xl font-semibold text-on-surface mb-8 flex items-center gap-2 border-b border-white/10 pb-4">
                <Percent className="text-red-400" size={20} />
                Expense Parameters
              </h2>

              <div className="space-y-8">
                {/* Initial Investment */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Initial Investment</label>
                    <span className="text-xl text-red-400 font-bold">{formatCurrency(feePrincipal)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="10000" max="5000000" step="10000" 
                    value={feePrincipal} 
                    onChange={(e) => setFeePrincipal(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-red-400" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>₹10K</span>
                    <span>₹50L</span>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Investment Duration</label>
                    <span className="text-xl font-medium text-on-surface">{feeYears} Years</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" max="40" step="1" 
                    value={feeYears} 
                    onChange={(e) => setFeeYears(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>5 Yrs</span>
                    <span>40 Yrs</span>
                  </div>
                </div>

                {/* Active Expense Ratio */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Active Fund Expense Ratio</label>
                    <span className="text-xl font-medium text-on-surface">{activeFeeRatio.toFixed(2)}% p.a.</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" max="3.0" step="0.05" 
                    value={activeFeeRatio} 
                    onChange={(e) => setActiveFeeRatio(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>0.1%</span>
                    <span>3.0%</span>
                  </div>
                </div>

                {/* Assumed Return */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Assumed Gross Return</label>
                    <span className="text-xl font-medium text-on-surface">{assumedGrossReturn.toFixed(1)}% p.a.</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" max="25" step="0.5" 
                    value={assumedGrossReturn} 
                    onChange={(e) => setAssumedGrossReturn(Number(e.target.value))}
                    className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/40 mt-2 tracking-widest">
                    <span>5%</span>
                    <span>25%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Results Display Area */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-6 shadow-2xl relative flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Index Fund (0.1%)</span>
                  <Landmark className="text-emerald-400" size={16} />
                </div>
                <div>
                  <span className="text-2xl text-emerald-400 font-bold">{formatCurrency(feeResults.indexValue)}</span>
                  <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wider font-mono">Net compounding: {(assumedGrossReturn - 0.1).toFixed(1)}%</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6 shadow-2xl relative flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Active Fund ({activeFeeRatio.toFixed(2)}%)</span>
                  <Wallet className="text-white/40" size={16} />
                </div>
                <div>
                  <span className="text-2xl font-medium text-on-surface">{formatCurrency(feeResults.activeValue)}</span>
                  <p className="text-[9px] text-white/40 mt-1 uppercase tracking-wider font-mono">Net compounding: {(assumedGrossReturn - activeFeeRatio).toFixed(2)}%</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-red-950/20 border border-red-500/20 p-6 shadow-2xl relative flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-red-400">Compounding Lost</span>
                  <Percent className="text-red-400" size={16} />
                </div>
                <div>
                  <span className="text-2xl text-red-400 font-bold">{formatCurrency(feeResults.lost)}</span>
                  <p className="text-[9px] text-red-400/60 mt-1 uppercase tracking-wider font-mono">Eroded by Active Fees</p>
                </div>
              </motion.div>
            </div>

            <FadeUp delay={0.3} className="bg-gradient-to-br from-red-950/10 to-[#080808] border border-red-500/10 p-8 shadow-2xl rounded-xl flex flex-col gap-6 relative overflow-hidden flex-grow">
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_#ef4444)] pointer-events-none"></div>
              
              <div className="flex items-center justify-between flex-col md:flex-row gap-6 z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-red-400" size={18} />
                    <h3 className="text-xl font-semibold text-white/90">Compounding Cost Breakdown</h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed font-light">
                    Over a {feeYears}-year horizon, paying a {activeFeeRatio}% annual fee shrinks your final capital by <strong className="text-red-400">{Math.round((feeResults.lost / feeResults.indexValue) * 100)}%</strong> compared to a Nifty Index fund. This is the direct cost of active fund management.
                  </p>
                </div>
                
                <div className="text-center shrink-0 px-8 py-6 bg-red-500/5 border border-red-500/10 rounded">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-red-400 block font-mono font-bold mb-1">Total Fee Loss</span>
                  <span className="text-3xl text-red-400 font-bold">{formatCurrency(feeResults.lost)}</span>
                </div>
              </div>

              <div className="z-10 mt-auto pt-4 border-t border-red-500/10">
                <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold mb-2">
                  <span className="text-emerald-400">Index Final Value</span>
                  <span className="text-red-400/80">Value Lost to Fees</span>
                </div>
                <div className="w-full h-4 bg-[#121212] rounded overflow-hidden flex border border-white/5">
                  <div 
                    className="h-full bg-emerald-500/60" 
                    style={{ width: `${(feeResults.activeValue / feeResults.indexValue) * 100}%` }}
                  ></div>
                  <div 
                    className="h-full bg-red-500/60 relative" 
                    style={{ width: `${(feeResults.lost / feeResults.indexValue) * 100}%` }}
                  >
                    <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.2)_4px,rgba(0,0,0,0.2)_8px)]"></div>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] font-mono mt-2 text-white/40">
                  <span>{formatCurrency(feeResults.indexValue)} Potential</span>
                  <span>{formatCurrency(feeResults.activeValue)} Actual</span>
                </div>
              </div>
              
              <div className="z-10 mt-4 flex justify-center">
                <Link href="/shortlist" className="group flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] text-red-400 py-3 px-6 rounded transition-all text-[10px] font-bold uppercase tracking-[0.2em]">
                  <span>Find Low-Cost Funds</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </FadeUp>

          </div>
        </div>
      </section>

    </main>
  );
}
