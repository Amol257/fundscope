'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { FadeUp } from '@/components/ui/motion/FadeUp';
import { Activity, BarChart2, TrendingDown, TrendingUp, Search } from 'lucide-react';
import fundData from '@/lib/compact-data.json';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function BenchmarkComparison() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getCategoryForPassive = (name: string, subcat?: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('elss') || lower.includes('tax saver')) return 'Tax Saver (ELSS)';
    if (lower.includes('nifty 50 ') || lower.includes('sensex') || lower.includes('nifty 100') || lower.includes('large cap') || lower.includes('nifty 50')) return 'Large Cap';
    if (lower.includes('midcap') || lower.includes('mid cap') || lower.includes('nifty 150')) return 'Mid Cap';
    if (lower.includes('smallcap') || lower.includes('small cap') || lower.includes('nifty 250')) return 'Small Cap';
    if (lower.includes('flexi') || lower.includes('multi') || lower.includes('500') || lower.includes('nifty 500')) return 'Flexi Cap';
    
    if (subcat === 'Tax Saver (ELSS)') return 'Tax Saver (ELSS)';
    return null;
  };

  // Process data: Group by category
  const benchmarkData = useMemo(() => {
    const groups: Record<string, {
      name: string,
      activeFunds: any[],
      passiveFunds: any[]
    }> = {};

    fundData.funds.forEach(fund => {
      const isPassive = fund.sub_category === 'Index Fund' || String(fund.sub_category).includes('ETF');
      
      let groupName = null;
      if (isPassive) {
        groupName = getCategoryForPassive(String(fund.name), String(fund.sub_category));
      } else {
        if (fund.category === 'Tax Saver (ELSS)') groupName = 'Tax Saver (ELSS)';
        else groupName = String(fund.sub_category);
      }

      if (!groupName) return;

      if (!groups[groupName]) {
        groups[groupName] = {
          name: groupName,
          activeFunds: [],
          passiveFunds: []
        };
      }

      if (isPassive) {
        groups[groupName].passiveFunds.push(fund);
      } else {
        groups[groupName].activeFunds.push(fund);
      }
    });

    const processTimeframe = (g: any, key: string) => {
      const activeWithData = g.activeFunds.filter((f: any) => f[key] != null);
      const passiveWithData = g.passiveFunds.filter((f: any) => f[key] != null);

      if (activeWithData.length === 0 || passiveWithData.length === 0) return null;

      const activeSum = activeWithData.reduce((sum: number, f: any) => sum + f[key], 0);
      const activeAvg = activeSum / activeWithData.length;

      const passiveSum = passiveWithData.reduce((sum: number, f: any) => sum + f[key], 0);
      const passiveAvg = passiveSum / passiveWithData.length;

      const beatCount = activeWithData.filter((f: any) => f[key] > passiveAvg).length;
      const beatRate = (beatCount / activeWithData.length) * 100;

      return { activeAvg, passiveAvg, beatRate, alpha: activeAvg - passiveAvg };
    };

    // Filter, calculate stats, and sort
    const processed = Object.values(groups)
      .filter(g => g.activeFunds.length >= 5 && g.passiveFunds.length >= 1) // Statistical relevance
      .map(g => {
        const tf1Y = processTimeframe(g, 'cagr_1yr');
        const tf3Y = processTimeframe(g, 'cagr_3yr');
        const tf5Y = processTimeframe(g, 'cagr_5yr');
        
        // Find best active fund (fallback to 3Y or 1Y if 5Y not available)
        const activeWithReturns = g.activeFunds.filter((f: any) => f.cagr_5yr != null || f.cagr_3yr != null || f.cagr_1yr != null);
        const bestActive = activeWithReturns.sort((a: any, b: any) => {
            const aVal = a.cagr_5yr ?? a.cagr_3yr ?? a.cagr_1yr ?? -999;
            const bVal = b.cagr_5yr ?? b.cagr_3yr ?? b.cagr_1yr ?? -999;
            return bVal - aVal;
        })[0];

        const alphaToUse = tf5Y ? tf5Y.alpha : (tf3Y ? tf3Y.alpha : (tf1Y ? tf1Y.alpha : 0));

        return {
          benchmark: g.name,
          shortName: g.name,
          macroCategory: g.name,
          activeCount: g.activeFunds.length,
          passiveCount: g.passiveFunds.length,
          tf1Y,
          tf3Y,
          tf5Y,
          alpha: alphaToUse,
          bestActive
        };
      })
      .sort((a, b) => b.activeCount - a.activeCount) // Sort by popularity
      .slice(0, 15); // Top 15 most tracked benchmarks

    return processed;
  }, []);

  // Category Rollup
  const categoryRollup = useMemo(() => {
    const categories: Record<string, { activeCount: number, beatCount: number }> = {};
    
    benchmarkData.forEach(g => {
        if (!categories[g.macroCategory]) {
            categories[g.macroCategory] = { activeCount: 0, beatCount: 0 };
        }
        
        // Use 5Y data for rollup if available, else 3Y
        const tf = g.tf5Y || g.tf3Y;
        if (tf) {
            categories[g.macroCategory].activeCount += g.activeCount;
            categories[g.macroCategory].beatCount += Math.round((tf.beatRate / 100) * g.activeCount);
        }
    });

    return Object.entries(categories)
        .map(([name, data]) => ({
            name,
            beatRate: data.activeCount > 0 ? (data.beatCount / data.activeCount) * 100 : 0,
            activeCount: data.activeCount
        }))
        .filter(c => c.activeCount >= 10 && c.name !== 'Other Index / ETF' && c.name !== 'Other')
        .sort((a, b) => b.activeCount - a.activeCount);
  }, [benchmarkData]);

  // Alpha Leaderboard Data
  const alphaLeaderboard = useMemo(() => {
    const allActiveFunds: any[] = [];
    
    fundData.funds.forEach(fund => {
        if (fund.sub_category === 'Index Fund' || String(fund.sub_category).includes('ETF')) return;
        if (!fund.cagr_5yr) return;

        let groupName = null;
        if (fund.category === 'Tax Saver (ELSS)') groupName = 'Tax Saver (ELSS)';
        else groupName = String(fund.sub_category);

        // Find category 5Y passive avg
        const benchmarkGroup = benchmarkData.find(g => g.benchmark === groupName);
        if (benchmarkGroup && benchmarkGroup.tf5Y) {
            const alpha = fund.cagr_5yr - benchmarkGroup.tf5Y.passiveAvg;
            allActiveFunds.push({ ...fund, alpha, passiveAvg: benchmarkGroup.tf5Y.passiveAvg });
        }
    });

    allActiveFunds.sort((a, b) => b.alpha - a.alpha);
    
    return {
        top: allActiveFunds.slice(0, 5),
        bottom: allActiveFunds.slice(-5).reverse()
    };
  }, [benchmarkData]);

  // Chart Data
  const chartData = useMemo(() => {
    return benchmarkData
      .filter(g => g.tf5Y)
      .map(g => ({
        name: g.shortName.length > 20 ? g.shortName.substring(0, 20) + '...' : g.shortName,
        alpha: Number(g.tf5Y!.alpha.toFixed(2))
      }))
      .sort((a, b) => b.alpha - a.alpha);
  }, [benchmarkData]);

  return (
    <main className="flex-grow pt-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-24 min-h-screen">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#3b82f6] uppercase mb-4 block">Reality Check</span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Active vs Index</h1>
          <p className="text-base text-on-surface-variant max-w-2xl font-light">
            Do active fund managers actually beat the market? We tracked thousands of active funds against their stated benchmarks across 1Y, 3Y, and 5Y horizons to find out where active management adds value.
          </p>
        </div>
      </div>

      {/* Category Rollup */}
      <h3 className="text-xl font-serif italic text-on-surface mb-6">Manager Success Rate by Category (5Y)</h3>
      <div className="flex flex-wrap gap-4 mb-12">
        {categoryRollup.map((cat, i) => (
            <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-6 shadow-2xl relative overflow-hidden flex-1 min-w-[160px] max-w-full">
                <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">{cat.name}</div>
                <div className={`text-3xl font-medium ${cat.beatRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {cat.beatRate.toFixed(1)}%
                </div>
                <div className="text-[9px] text-white/40 font-mono mt-1">beat the index</div>
            </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-stretch">
        {/* Alpha Distribution Chart */}
        <div className="lg:col-span-8 glass-panel p-6 shadow-2xl flex flex-col min-h-[450px]">
            <div className="text-sm uppercase tracking-widest font-bold text-white/60 mb-6 flex items-center gap-2">
                <BarChart2 size={16} /> Average 5Y Alpha by Category
            </div>
            <div className="flex-1 w-full min-h-[350px]">
                {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                            <defs>
                              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                                <stop offset="100%" stopColor="#34d399" stopOpacity={0.3}/>
                              </linearGradient>
                              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f87171" stopOpacity={0.3}/>
                                <stop offset="100%" stopColor="#f87171" stopOpacity={1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fill: '#ffffff40', fontSize: 10 }} 
                                axisLine={false} 
                                tickLine={false} 
                                angle={-45} 
                                textAnchor="end"
                            />
                            <YAxis 
                                tick={{ fill: '#ffffff40', fontSize: 10, fontFamily: 'monospace' }} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                                cursor={{ fill: '#ffffff05' }}
                                contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(value: any) => [`${value > 0 ? '+' : ''}${value}% Alpha`, 'Alpha'] as any}
                            />
                            <ReferenceLine y={0} stroke="#ffffff40" />
                            <Bar dataKey="alpha" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.alpha > 0 ? 'url(#positiveGradient)' : 'url(#negativeGradient)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* Alpha Leaderboard */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            <div className="glass-panel p-6 shadow-2xl flex-1 flex flex-col justify-center bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-sm uppercase tracking-widest font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} /> Top 5 Wealth Creators
                </div>
                <div className="space-y-4">
                    {alphaLeaderboard.top.map((fund, i) => (
                        <Link href={`/fund/${fund.code}`} key={fund.code} className="block group">
                            <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">{fund.name}</div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-white/40 truncate pr-2">{String(fund.sub_category || '').substring(0, 20)}</span>
                                <span className="text-xs font-bold font-mono text-emerald-400 shrink-0">+{fund.alpha.toFixed(2)}% α</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="glass-panel p-6 shadow-2xl flex-1 flex flex-col justify-center bg-red-500/5 border border-red-500/10">
                <div className="text-sm uppercase tracking-widest font-bold text-red-400 mb-4 flex items-center gap-2">
                    <TrendingDown size={16} /> Top 5 Wealth Destroyers
                </div>
                <div className="space-y-4">
                    {alphaLeaderboard.bottom.map((fund, i) => (
                        <Link href={`/fund/${fund.code}`} key={fund.code} className="block group">
                            <div className="text-xs font-semibold text-white group-hover:text-red-400 transition-colors truncate">{fund.name}</div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-white/40 truncate pr-2">{String(fund.sub_category || '').substring(0, 20)}</span>
                                <span className="text-xs font-bold font-mono text-red-400 shrink-0">{fund.alpha.toFixed(2)}% α</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="glass-panel shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Category</th>
              <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Sample Size</th>
              <th className="p-4 text-[10px] uppercase tracking-widest text-emerald-400 font-bold text-center border-l border-white/10 bg-white/5" colSpan={2}>1Y Performance</th>
              <th className="p-4 text-[10px] uppercase tracking-widest text-emerald-400 font-bold text-center border-l border-white/10 bg-white/5" colSpan={2}>3Y Performance</th>
              <th className="p-4 text-[10px] uppercase tracking-widest text-emerald-400 font-bold text-center border-l border-white/10 bg-white/5" colSpan={2}>5Y Performance</th>
            </tr>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="p-2 text-[10px] uppercase tracking-widest text-white/40 font-bold"></th>
              <th className="p-2 text-[10px] uppercase tracking-widest text-white/40 font-bold"></th>
              <th className="p-2 text-[9px] text-white/60 text-center border-l border-white/10">Active Avg vs Index</th>
              <th className="p-2 text-[9px] text-white/60 text-center">Beat %</th>
              <th className="p-2 text-[9px] text-white/60 text-center border-l border-white/10">Active Avg vs Index</th>
              <th className="p-2 text-[9px] text-white/60 text-center">Beat %</th>
              <th className="p-2 text-[9px] text-white/60 text-center border-l border-white/10">Active Avg vs Index</th>
              <th className="p-2 text-[9px] text-white/60 text-center">Beat %</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkData.map((row, i) => (
              <tr key={row.benchmark} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-white/90 text-sm max-w-[250px] truncate">{row.shortName}</div>
                </td>
                <td className="p-4 text-right">
                  <div className="text-[10px] text-white/60 font-mono">{row.activeCount} Active<br/>{row.passiveCount} Index</div>
                </td>
                
                {/* 1Y */}
                <td className="p-4 text-center border-l border-white/5">
                  {row.tf1Y ? (
                      <div>
                          <div className="text-xs font-medium text-white">{row.tf1Y.activeAvg.toFixed(1)}% <span className="text-white/40 text-[10px]">vs {row.tf1Y.passiveAvg.toFixed(1)}%</span></div>
                          <div className={`text-[9px] font-mono mt-1 ${row.tf1Y.alpha > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {row.tf1Y.alpha > 0 ? '+' : ''}{row.tf1Y.alpha.toFixed(2)}% α
                          </div>
                      </div>
                  ) : <span className="text-white/20">-</span>}
                </td>
                <td className="p-4 text-center">
                   {row.tf1Y ? (
                       <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold font-mono ${
                         row.tf1Y.beatRate >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                       }`}>
                         {row.tf1Y.beatRate.toFixed(0)}%
                       </div>
                   ) : <span className="text-white/20">-</span>}
                </td>

                {/* 3Y */}
                <td className="p-4 text-center border-l border-white/5">
                  {row.tf3Y ? (
                      <div>
                          <div className="text-xs font-medium text-white">{row.tf3Y.activeAvg.toFixed(1)}% <span className="text-white/40 text-[10px]">vs {row.tf3Y.passiveAvg.toFixed(1)}%</span></div>
                          <div className={`text-[9px] font-mono mt-1 ${row.tf3Y.alpha > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {row.tf3Y.alpha > 0 ? '+' : ''}{row.tf3Y.alpha.toFixed(2)}% α
                          </div>
                      </div>
                  ) : <span className="text-white/20">-</span>}
                </td>
                <td className="p-4 text-center">
                   {row.tf3Y ? (
                       <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold font-mono ${
                         row.tf3Y.beatRate >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                       }`}>
                         {row.tf3Y.beatRate.toFixed(0)}%
                       </div>
                   ) : <span className="text-white/20">-</span>}
                </td>

                {/* 5Y */}
                <td className="p-4 text-center border-l border-white/5 bg-white/5">
                  {row.tf5Y ? (
                      <div>
                          <div className="text-xs font-medium text-white">{row.tf5Y.activeAvg.toFixed(1)}% <span className="text-white/40 text-[10px]">vs {row.tf5Y.passiveAvg.toFixed(1)}%</span></div>
                          <div className={`text-[9px] font-mono mt-1 ${row.tf5Y.alpha > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {row.tf5Y.alpha > 0 ? '+' : ''}{row.tf5Y.alpha.toFixed(2)}% α
                          </div>
                      </div>
                  ) : <span className="text-white/20">-</span>}
                </td>
                <td className="p-4 text-center bg-white/5">
                   {row.tf5Y ? (
                       <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold font-mono ${
                         row.tf5Y.beatRate >= 50 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                       }`}>
                         {row.tf5Y.beatRate.toFixed(0)}%
                       </div>
                   ) : <span className="text-white/20">-</span>}
                </td>

              </tr>
            ))}
            {benchmarkData.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-white/40 text-sm">
                  Not enough data to calculate benchmarks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
