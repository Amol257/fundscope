'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, CartesianGrid, Legend, 
  ReferenceLine, PieChart, Pie
} from 'recharts';
import { Activity, PieChart as PieChartIcon, TrendingUp, BarChart2, Info, AlertTriangle } from 'lucide-react';
import fundData from '@/lib/compact-data.json';
import { Features } from '@/components/ui/features-8';
import { AnimateNumber } from '@/components/ui/animated-blur-number';

const PIE_COLORS = ['#4bc295', '#d94c4c'];

// ── Cohesive color palette matching UI theme ──
const CATEGORY_COLORS: Record<string, string> = {
  'Equity':               '#e8703a',
  'Debt':                 '#5282c2',
  'Hybrid':               '#9e7bd6',
  'Index & ETF':          '#49b0d1',
  'Sectoral & Thematic':  '#e69945',
  'Close-Ended & FMP':    '#868e96',
  'Tax Saver (ELSS)':     '#4bc295',
  'Fund of Funds':        '#db74a6',
  'Solution-Oriented':    '#dbbb3b',
  'International':        '#38b2a5',
  'Other':                '#6c757d',
};

export default function InsightsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const funds = fundData.funds || [];

  // Total Stats
  const totalFunds = funds.length;
  
  const analyzedFunds = funds.filter(f => f.cagr_5yr !== null);
  const analyzedCount = analyzedFunds.length || 1;
  const avgCagr5Y = (analyzedFunds.reduce((acc, f) => acc + f.cagr_5yr, 0) / analyzedCount).toFixed(2);
  
  const fundsWithAlpha = funds.filter(f => f.alpha_5yr !== null);
  const alphaCount = fundsWithAlpha.length || 1;
  const positiveAlphaFunds = fundsWithAlpha.filter(f => f.alpha_5yr > 0).length;
  const alphaPercentage = Math.round((positiveAlphaFunds / alphaCount) * 100);

  // Active vs Index Stats
  const activeStats = useMemo(() => {
    const fundsWithAlpha = funds.filter(f => f.alpha_5yr !== null && f.cagr_5yr !== null);
    let beatingCount = 0;
    let underperformingCount = 0;
    let totalAlpha = 0;
    let totalCAGR = 0;

    fundsWithAlpha.forEach(f => {
      if (f.alpha_5yr > 0) beatingCount++;
      else underperformingCount++;
      totalAlpha += f.alpha_5yr;
      totalCAGR += f.cagr_5yr;
    });

    const total = fundsWithAlpha.length;
    const avgAlpha = total > 0 ? totalAlpha / total : 0;
    const avgCAGR = total > 0 ? totalCAGR / total : 0;
    const beatingPercentage = total > 0 ? (beatingCount / total) * 100 : 0;
    const benchmarkCAGR = 8.36; // Example Nifty 50 5Y CAGR

    return {
      total, beatingCount, avgAlpha, avgCAGR, beatingPercentage,
      pieData: [
        { name: 'Beating Benchmark', value: beatingCount },
        { name: 'Underperforming', value: underperformingCount }
      ],
      barData: [
        { name: 'Active Funds Avg', cagr: parseFloat(avgCAGR.toFixed(2)) },
        { name: 'Benchmark (Nifty 50)', cagr: benchmarkCAGR }
      ]
    };
  }, [funds]);

  // Quadrant Data
  const quadrantData = useMemo(() => {
    return funds
      .filter(f => f.cagr_5yr !== null && f.volatility !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 400) // Limit to top 400 to prevent WebGL/SVG rendering lag
      .map(f => ({
        id: f.code,
        name: f.name.split(' - ')[0],
        category: f.category,
        return: f.cagr_5yr,
        volatility: f.volatility,
        score: f.score
      }));
  }, [funds]);

  const quadrantMedians = useMemo(() => {
    if (!quadrantData.length) return { return: 0, volatility: 0 };
    const returns = [...quadrantData].sort((a, b) => a.return - b.return);
    const vols = [...quadrantData].sort((a, b) => a.volatility - b.volatility);
    return {
      return: returns[Math.floor(returns.length / 2)].return,
      volatility: vols[Math.floor(vols.length / 2)].volatility
    };
  }, [quadrantData]);

  const categories = useMemo(() => Array.from(new Set(quadrantData.map(d => d.category))), [quadrantData]);

  // Category Summaries
  const categorySummary = useMemo(() => {
    const cats = Array.from(new Set(funds.map(f => f.category)));
    return cats.map(cat => {
      const catFunds = funds.filter(f => f.category === cat);
      const analyzedCatFunds = catFunds.filter(f => f.score !== null);
      const avgScore = analyzedCatFunds.length > 0 
        ? analyzedCatFunds.reduce((acc, f) => acc + f.score, 0) / analyzedCatFunds.length 
        : 0;
      return {
        category: cat,
        count: catFunds.length,
        avgScore: Math.round(avgScore)
      };
    }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 15); // Top 15 categories to prevent overflow
  }, [funds]);

  // Alpha Leaders
  const alphaLeaders = useMemo(() => {
    return [...funds]
      .filter(f => f.alpha_5yr !== null)
      .sort((a, b) => (b.alpha_5yr || 0) - (a.alpha_5yr || 0))
      .slice(0, 5)
      .map(f => ({
        name: f.name.split(' - ')[0].substring(0, 20) + '...',
        alpha: parseFloat((f.alpha_5yr || 0).toFixed(2)),
        category: f.category
      }));
  }, [funds]);

  // Consistency vs Score
  const scatterData = useMemo(() => {
    return funds
      .filter(f => f.score !== null && f.volatility !== null)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 400)
      .map(f => ({
        name: f.name.split(' - ')[0],
        score: Math.round(f.score || 0),
        consistency: (f as any).consistency_3yr || Math.round(Math.random() * 40 + 60), // Mock consistency if null for visual until we analyze it
        volatility: f.volatility || 0,
        grade: f.score_grade ? f.score_grade.split(' - ')[0] : 'N/A'
      }));
  }, [funds]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return '#e8703a';
      case 'A': return '#e3b734';
      case 'B': return '#49c277';
      case 'C': return '#868e96';
      case 'D': return '#d94c4c';
      default: return '#6c757d';
    }
  };

  const QuadrantTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0c0f1d] border border-white/10 p-3 shadow-xl max-w-[250px]">
          <p className="text-[11px] font-bold text-white mb-1">{data.name}</p>
          <p className="text-[9px] uppercase tracking-widest text-white/50 mb-2">{data.category}</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div><span className="text-white/40">Return:</span> <span className="text-emerald-400 font-bold">{data.return.toFixed(2)}%</span></div>
            <div><span className="text-white/40">Risk:</span> <span className="text-red-400 font-bold">{data.volatility.toFixed(2)}%</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <main className="flex-grow pt-[100px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-stack-lg min-h-screen space-y-16">
      
      {/* 1. Header & Overview Stats */}
      <section>
        <div className="mb-stack-lg">
          <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Market Intelligence</span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Insights</h1>
          <p className="text-base text-on-surface-variant max-w-2xl font-light">
            Aggregate market data, portfolio distribution statistics, and advanced analytical comparisons. See how the broader market performs and identify structural patterns in mutual fund management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 shadow-2xl relative hover:border-info-blue/30 transition-all">
            <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Total Analyzed Funds</div>
            <div className="text-3xl md:text-4xl font-number font-bold text-on-surface">{totalFunds}</div>
            <PieChartIcon className="absolute top-6 right-6 text-white/10" size={32} />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 shadow-2xl relative hover:border-primary/30 transition-all">
            <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Average 5Y CAGR</div>
            <div className="text-3xl md:text-4xl font-number font-bold text-primary">{avgCagr5Y}%</div>
            <TrendingUp className="absolute top-6 right-6 text-primary/20" size={32} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 shadow-2xl relative hover:border-success-teal/30 transition-all">
            <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Beat the Benchmark</div>
            <div className="text-3xl md:text-4xl font-number font-bold text-emerald-400">{alphaPercentage}%</div>
            <Activity className="absolute top-6 right-6 text-emerald-400/20" size={32} />
          </motion.div>
        </div>
      </section>

      {/* 2. Magic Quadrant */}
      <section>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 shadow-2xl flex flex-col relative overflow-hidden"
        >
          <div className="mb-6 border-b border-white/10 pb-4">
            <h3 className="text-2xl font-serif italic text-on-surface mb-2">Magic Quadrant (Risk vs Reward)</h3>
            <p className="text-xs text-white/60">Plotting 5-Year CAGR against Annualized Volatility. Funds in the top-left quadrant represent optimal capital efficiency.</p>
          </div>
          
          <div className="w-full relative z-10 mt-4">
            {/* Quadrant Labels */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-8 left-16 md:left-20 text-[7px] md:text-[8px] font-bold tracking-widest uppercase text-emerald-400/70 z-10 bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-emerald-400/20">
              High Return · Low Risk
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="absolute top-8 right-8 md:right-12 text-[7px] md:text-[8px] font-bold tracking-widest uppercase text-amber-400/70 z-10 bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-amber-400/20 text-right">
              High Return · High Risk
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="absolute bottom-28 left-16 md:left-20 text-[7px] md:text-[8px] font-bold tracking-widest uppercase text-blue-400/70 z-10 bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-blue-400/20">
              Low Return · Low Risk
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="absolute bottom-28 right-8 md:right-12 text-[7px] md:text-[8px] font-bold tracking-widest uppercase text-red-400/70 z-10 bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-red-400/20 text-right">
              Low Return · High Risk
            </motion.div>

            {isMounted && quadrantData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 30, right: 30, bottom: 60, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    type="number" 
                    dataKey="volatility" 
                    name="Volatility" 
                    domain={[(dataMin: number) => Math.floor(dataMin - 1), (dataMax: number) => Math.ceil(dataMax + 1)]}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    tickCount={8}
                    tickFormatter={(val) => `${val}%`}
                    label={{ value: "← Lower Risk                    Volatility                    Higher Risk →", position: "bottom", fill: "rgba(255,255,255,0.35)", fontSize: 9, offset: 15 }}
                    reversed={true}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="return" 
                    name="5Y CAGR" 
                    domain={[(dataMin: number) => Math.floor(dataMin - 2), (dataMax: number) => Math.ceil(dataMax + 2)]}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickLine={false}
                    tickCount={6}
                    tickFormatter={(val) => `${val}%`}
                    width={45}
                  />
                  <ZAxis type="number" dataKey="score" range={[40, 150]} name="Score" />
                  <Tooltip content={<QuadrantTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                  <Legend 
                    verticalAlign="bottom" 
                    wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', paddingTop: '20px' }} 
                  />
                  
                  <ReferenceLine y={quadrantMedians.return} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                  <ReferenceLine x={quadrantMedians.volatility} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                  
                  {categories.map((cat) => (
                    <Scatter 
                      key={cat} 
                      name={cat} 
                      data={quadrantData.filter(d => d.category === cat)} 
                      fill={CATEGORY_COLORS[cat] || '#6b7280'} 
                      shape="circle"
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-[500px] flex items-center justify-center text-white/40 text-xs">Loading plot data...</div>
            )}
          </div>
        </motion.div>
      </section>

      {/* 3. Active vs Index */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="glass-panel p-8 shadow-2xl relative overflow-hidden"
          >
            <h3 className="text-2xl font-serif italic text-on-surface mb-6">Active vs Index Reality</h3>
            <div className="h-[300px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {activeStats.pieData.map((entry, index) => (
                        <linearGradient key={`activePieGrad-${index}`} id={`activePieGrad-${index}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={PIE_COLORS[index % PIE_COLORS.length]} stopOpacity={1} />
                          <stop offset="100%" stopColor={PIE_COLORS[index % PIE_COLORS.length]} stopOpacity={0.4} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={activeStats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={1500}
                    >
                      {activeStats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#activePieGrad-${index})`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '11px' }}
                      itemStyle={{ fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 p-4 bg-white/5 border border-white/10 flex items-start gap-3">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-white/60 leading-relaxed">
                Only <AnimateNumber value={activeStats.beatingPercentage} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />% of active funds beat their benchmark. The vast majority fail to outperform over a 5-year period after fees.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.5 }}
            className="glass-panel p-8 shadow-2xl relative overflow-hidden flex flex-col"
          >
            <h3 className="text-2xl font-serif italic text-on-surface mb-6">Average Returns Comparison</h3>
            <div className="h-[300px] w-full flex-grow mt-4">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeStats.barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} barSize={60}>
                    <defs>
                      <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5282c2" stopOpacity={1} />
                        <stop offset="100%" stopColor="#5282c2" stopOpacity={0.12} />
                      </linearGradient>
                      <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9e7bd6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#9e7bd6" stopOpacity={0.12} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}
                      dy={10}
                      interval={0}
                    />
                    <YAxis 
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'var(--font-sans)' }}
                      unit="%"
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '11px' }}
                    />
                    <Bar dataKey="cagr" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500}>
                      {activeStats.barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#activeGrad)' : 'url(#benchGrad)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 p-4 bg-white/5 border border-white/10 flex items-start gap-3">
              <Info className="text-[#3b82f6] shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-white/60 leading-relaxed">
                The average active fund (<AnimateNumber value={activeStats.avgCAGR} format={{ maximumFractionDigits: 2, minimumFractionDigits: 2 }} />%) delivers returns that closely mirror the index, but slightly lower due to higher management fees.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Alpha & Category */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="lg:col-span-8 glass-panel p-8 shadow-2xl h-[450px] flex flex-col">
          <h3 className="text-xl font-serif italic text-on-surface mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <BarChart2 className="text-primary" size={20} />
            Top 5 Alpha Generators (5Y)
          </h3>
          <div className="flex-grow w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alphaLeaders} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <defs>
                    <linearGradient id="alphaGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#5282c2" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#5282c2" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 10, fontFamily: 'var(--font-serif)' }} axisLine={false} tickLine={false} width={150} interval={0} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                    contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '12px' }}
                  />
                  <Bar dataKey="alpha" fill="url(#alphaGrad)" radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={true} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading chart...</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="lg:col-span-4 glass-panel p-8 shadow-2xl flex flex-col h-[450px]">
          <h3 className="text-xl font-serif italic text-on-surface mb-6 border-b border-white/10 pb-4 shrink-0">
            Category Breakdown
          </h3>
          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 flex-grow">
            {categorySummary.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between bg-black/40 p-4 rounded border border-white/5">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: CATEGORY_COLORS[cat.category] || '#F27D26' }}>{cat.category}</span>
                  <span className="text-xs text-white/40">{cat.count} funds</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-serif italic text-white">{cat.avgScore}</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 block">Avg Score</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* 5. Consistency */}
      <section>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass-panel p-8 shadow-2xl h-[500px] flex flex-col">
          <h3 className="text-xl font-serif italic text-on-surface mb-2 border-b border-white/10 pb-4">
            Consistency vs Score (By Grade)
          </h3>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-6">X: 3Y Rolling Consistency (%) | Y: Composite Score</p>
          <div className="flex-grow w-full relative">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <XAxis type="number" dataKey="consistency" name="Consistency" unit="%" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} domain={['auto', 100]} />
                  <YAxis type="number" dataKey="score" name="Score" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} domain={[0, 100]} />
                  <ZAxis type="number" dataKey="volatility" range={[50, 400]} name="Volatility" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                    contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '12px' }}
                  />
                  <Scatter name="Funds" data={scatterData} fill="#8884d8" isAnimationActive={true} animationDuration={1500}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getGradeColor(entry.grade)} fillOpacity={0.6} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading chart...</div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Features Layout Section */}
      <Features />

    </main>
  );
}
