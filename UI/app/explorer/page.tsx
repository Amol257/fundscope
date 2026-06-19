'use client';

import { TrendingUp, BarChart3, Award, Database, ArrowRight, Activity, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import fundData from '@/lib/compact-data.json';
import { MetricCard } from '@/components/MetricCard';
import { ParallaxLayer } from '@/components/ui/motion/ParallaxLayer';
import { StaggerChildren, itemVariants } from '@/components/ui/motion/StaggerChildren';
import { TiltCard } from '@/components/ui/TiltCard';
import { AnimatedKPI } from '@/components/ui/motion/AnimatedKPI';
import { MarketHealthGauge } from '@/components/ui/motion/MarketHealthGauge';
import { CategoryHeatmap, HeatmapRow } from '@/components/ui/CategoryHeatmap';
import { MiniBubbleMap, BubbleData } from '@/components/ui/MiniBubbleMap';
import { MomentumFeed } from '@/components/ui/MomentumFeed';
import { QuickSipWidget } from '@/components/ui/QuickSipWidget';
import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, ScatterChart, Scatter, ZAxis, Legend, Sector
} from 'recharts';

// ── Cohesive color palette matching the dark premium UI ──
const CATEGORY_COLORS: Record<string, string> = {
  'Equity':               '#e8703a',  // Soft orange
  'Debt':                 '#5282c2',  // Muted blue
  'Hybrid':               '#9e7bd6',  // Soft purple
  'Index & ETF':          '#49b0d1',  // Muted sky blue
  'Sectoral & Thematic':  '#e69945',  // Soft amber
  'Close-Ended & FMP':    '#868e96',  // Soft gray
  'Tax Saver (ELSS)':     '#4bc295',  // Muted emerald
  'Fund of Funds':        '#db74a6',  // Soft pink
  'Solution-Oriented':    '#dbbb3b',  // Soft yellow
  'International':        '#38b2a5',  // Soft teal
  'Other':                '#6c757d',  // Gray
};

const GRADE_COLORS: Record<string, string> = {
  'S': '#e8703a',
  'A': '#e3b734',
  'B': '#49c277',
  'C': '#868e96',
  'D': '#d94c4c'
};

export default function ExplorerPage() {
  const funds = fundData.funds || [];
  const [barPeriod, setBarPeriod] = useState<'1Y' | '3Y' | '5Y'>('5Y');
  const [top6Filter, setTop6Filter] = useState('All');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const kpis = useMemo(() => {
    const totalFunds = funds.length;
    
    const fundsWith5yCagr = funds.filter(f => f.cagr_5yr !== null && f.cagr_5yr !== undefined);
    const avgCagr5y = fundsWith5yCagr.length > 0 
      ? fundsWith5yCagr.reduce((acc, f) => acc + Number(f.cagr_5yr), 0) / fundsWith5yCagr.length 
      : 0;

    const fundsWith3yCagr = funds.filter(f => f.cagr_3yr !== null && f.cagr_3yr !== undefined);
    const avgCagr3y = fundsWith3yCagr.length > 0 
      ? fundsWith3yCagr.reduce((acc, f) => acc + Number(f.cagr_3yr), 0) / fundsWith3yCagr.length 
      : 0;

    const fundsWith1yCagr = funds.filter(f => f.cagr_1yr !== null && f.cagr_1yr !== undefined);
    const avgCagr1y = fundsWith1yCagr.length > 0 
      ? fundsWith1yCagr.reduce((acc, f) => acc + Number(f.cagr_1yr), 0) / fundsWith1yCagr.length 
      : 0;

    const categoryCounts: Record<string, number> = {};
    const categoryReturns: Record<string, { sum: number, count: number }> = {};
    const gradeDistribution: Record<string, number> = {
      'S': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0
    };
    
    let highestReturnFund = funds[0];

    for (const f of funds) {
      // Broad category counts
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
      
      // Category average returns (broad categories)
      let cagrField: 'cagr_1yr' | 'cagr_3yr' | 'cagr_5yr' = 'cagr_5yr';
      if (barPeriod === '1Y') cagrField = 'cagr_1yr';
      if (barPeriod === '3Y') cagrField = 'cagr_3yr';
      
      if (f[cagrField] !== null && f[cagrField] !== undefined) {
        if (!categoryReturns[f.category]) {
          categoryReturns[f.category] = { sum: 0, count: 0 };
        }
        categoryReturns[f.category].sum += Number(f[cagrField]);
        categoryReturns[f.category].count += 1;
      }
      
      if (f.cagr_5yr !== null && f.cagr_5yr !== undefined) {
        if (!highestReturnFund || Number(f.cagr_5yr) > Number(highestReturnFund.cagr_5yr || 0)) {
          highestReturnFund = f;
        }
      }

      // Grades
      if (f.score_grade) {
        const letter = f.score_grade.split(' - ')[0];
        if (gradeDistribution[letter] !== undefined) {
          gradeDistribution[letter] += 1;
        }
      }
    }

    const topCategory = Object.keys(categoryCounts).length > 0 
      ? Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b)
      : "N/A";

    const sGradeFunds = funds.filter(f => f.score_grade?.startsWith('S')).length;

    // Top 6 funds by score
    const topFunds = [...funds].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6);

    // ── Market Health ──
    const fundsWithSharpe = funds.filter(f => f.sharpe_ratio !== null && f.sharpe_ratio !== undefined);
    const avgSharpe = fundsWithSharpe.length > 0 
      ? fundsWithSharpe.reduce((acc, f) => acc + Number(f.sharpe_ratio), 0) / fundsWithSharpe.length 
      : 0;

    const fundsWithAlpha = funds.filter(f => f.alpha_5yr !== null && f.alpha_5yr !== undefined);
    const beatRate = fundsWithAlpha.length > 0
      ? (fundsWithAlpha.filter(f => Number(f.alpha_5yr) > 0).length / fundsWithAlpha.length) * 100
      : 0;

    const normalizedSharpe = Math.min(Math.max((avgSharpe + 1) * 50, 0), 100);
    const normalizedCagr = Math.min(Math.max(avgCagr3y * 4, 0), 100);
    const sOrAPercent = funds.length > 0 ? (funds.filter(f => f.score_grade?.startsWith('S') || f.score_grade?.startsWith('A')).length / funds.length) * 100 : 0;
    
    const marketHealthScore = (normalizedSharpe * 0.40) + (sOrAPercent * 0.35) + (normalizedCagr * 0.25);

    // ── Aggregations for Heatmap & Bubble Map ──
    const catStats: Record<string, { count: number; cagr1ySum: number; cagr1yCount: number; cagr3ySum: number; cagr3yCount: number; cagr5ySum: number; cagr5yCount: number; volSum: number; volCount: number; }> = {};

    for (const f of funds) {
      if (!catStats[f.category]) {
        catStats[f.category] = { count: 0, cagr1ySum: 0, cagr1yCount: 0, cagr3ySum: 0, cagr3yCount: 0, cagr5ySum: 0, cagr5yCount: 0, volSum: 0, volCount: 0 };
      }
      catStats[f.category].count += 1;
      if (f.cagr_1yr !== null && f.cagr_1yr !== undefined) { catStats[f.category].cagr1ySum += Number(f.cagr_1yr); catStats[f.category].cagr1yCount += 1; }
      if (f.cagr_3yr !== null && f.cagr_3yr !== undefined) { catStats[f.category].cagr3ySum += Number(f.cagr_3yr); catStats[f.category].cagr3yCount += 1; }
      if (f.cagr_5yr !== null && f.cagr_5yr !== undefined) { catStats[f.category].cagr5ySum += Number(f.cagr_5yr); catStats[f.category].cagr5yCount += 1; }
      if (f.volatility !== null && f.volatility !== undefined) { catStats[f.category].volSum += Number(f.volatility); catStats[f.category].volCount += 1; }
    }

    const heatmapData: HeatmapRow[] = Object.entries(catStats)
      .filter(([name]) => name !== 'Other')
      .map(([name, stats]) => ({
        category: name,
        cagr1y: stats.cagr1yCount > 0 ? stats.cagr1ySum / stats.cagr1yCount : null,
        cagr3y: stats.cagr3yCount > 0 ? stats.cagr3ySum / stats.cagr3yCount : null,
        cagr5y: stats.cagr5yCount > 0 ? stats.cagr5ySum / stats.cagr5yCount : null,
      }))
      .sort((a, b) => (b.cagr5y || 0) - (a.cagr5y || 0));

    const bubbleMapData: BubbleData[] = Object.entries(catStats)
      .filter(([name]) => name !== 'Other')
      .map(([name, stats]) => ({
        name,
        volatility: stats.volCount > 0 ? stats.volSum / stats.volCount : 0,
        return: stats.cagr5yCount > 0 ? stats.cagr5ySum / stats.cagr5yCount : 0,
        count: stats.count,
        color: CATEGORY_COLORS[name] || '#6b7280'
      }))
      .filter(d => d.volatility > 0 && d.return !== 0);

    // ── Chart 1: Bar chart — Avg 5Y Return by Broad Category ──
    const barChartData = Object.entries(categoryReturns)
      .filter(([name]) => name !== 'Other')
      .map(([name, data]) => ({
        name: name.length > 18 ? name.substring(0, 16) + '…' : name,
        fullName: name,
        avgReturn: Number((data.sum / data.count).toFixed(2)),
        color: CATEGORY_COLORS[name] || '#6b7280'
      }))
      .sort((a, b) => b.avgReturn - a.avgReturn);

    // ── Chart 2: Donut — Category Distribution (fund count) ──
    const categoryPieData = Object.entries(categoryCounts)
      .filter(([name]) => name !== 'Other')
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#6b7280'
      }))
      .sort((a, b) => b.value - a.value);

    // ── Chart 3: Grade Distribution ──
    const gradeData = Object.entries(gradeDistribution)
      .map(([name, value]) => ({ 
        name, 
        value,
        percentage: ((value / totalFunds) * 100).toFixed(1)
      }))
      .filter(item => item.value > 0);

    // ── Chart 4: Top 10 funds by 5Y return (horizontal bar) ──
    const top10ReturnsData = [...funds]
      .filter(f => f.cagr_5yr !== null)
      .sort((a, b) => Number(b.cagr_5yr) - Number(a.cagr_5yr))
      .slice(0, 10)
      .map(f => ({
        name: (f.name?.split(' - ')[0] || f.name).substring(0, 22),
        return: Number(Number(f.cagr_5yr).toFixed(2)),
        category: f.category,
        color: CATEGORY_COLORS[f.category] || '#F27D26'
      }));

    return {
      totalFunds,
      avgCagr5y,
      avgCagr3y,
      avgCagr1y,
      topCategory,
      sGradeFunds,
      topFunds,
      highestReturnFund,
      barChartData,
      categoryPieData,
      gradeData,
      top10ReturnsData,
      marketHealthScore,
      avgSharpe,
      beatRate,
      heatmapData,
      bubbleMapData
    };
  }, [funds, barPeriod]);

  const filteredTopFunds = useMemo(() => {
    let filtered = funds;
    if (top6Filter !== 'All') {
      filtered = funds.filter(f => f.category === top6Filter);
    }
    return [...filtered].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 6);
  }, [funds, top6Filter]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
      const title = payload[0].payload?.fullName || payload[0].payload?.name || label || payload[0].name;
      return (
        <div className="bg-[#111] p-3 border border-white/15 text-xs rounded-lg shadow-2xl backdrop-blur-xl">
          <p className="font-bold text-white mb-1.5">{title}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-primary font-mono text-[11px]">
              {formatter ? formatter(p.value, p.name, p) : `${p.name}: ${p.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Legend for pie
  const CustomPieLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {payload.map((entry: any, index: number) => {
          const isActive = entry.value === top6Filter;
          return (
            <div 
              key={index} 
              className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => {
                if (isActive) setTop6Filter('All');
                else setTop6Filter(entry.value);
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[9px] text-white uppercase tracking-wider">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <main className="flex-grow pt-[100px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-stack-lg min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="mb-8">
        <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Dashboard Overview</span>
        <ParallaxLayer speed={0.15}>
          <h1 className="text-5xl md:text-6xl font-serif italic text-on-surface mb-2 tracking-tighter">Market Overview</h1>
        </ParallaxLayer>
        <p className="text-base text-on-surface-variant max-w-2xl font-light mt-4">
          Key performance indicators and market statistics at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <StaggerChildren className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        <motion.div variants={itemVariants} className="h-full">
          <MetricCard 
            label="Total Funds Tracked" 
            value={<AnimatedKPI value={kpis.totalFunds} />} 
            icon={<Database size={20} />}
            tooltip="Total number of mutual funds in our database"
            className="h-full"
            sparklineData={[10, 15, 12, 18, 22, 28, 32, 38, 45, 52, kpis.totalFunds]}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <MetricCard 
            label="S-Grade Funds" 
            value={<AnimatedKPI value={kpis.sGradeFunds} />} 
            icon={<Award size={20} />}
            tooltip="Number of funds with an exceptional 'S' grade rating"
            valueClassName="text-amber-400"
            className="h-full"
            sparklineData={[5, 8, 12, 10, 15, 18, 22, 20, 25, 28, kpis.sGradeFunds]}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <MetricCard 
            label="Avg 5Y CAGR" 
            value={<AnimatedKPI value={kpis.avgCagr5y} suffix="%" decimals={2} />} 
            icon={<TrendingUp size={20} />}
            tooltip="Average 5-year Compound Annual Growth Rate across all funds"
            valueClassName="text-emerald-400"
            className="h-full"
            sparklineData={[12, 13.5, 11, 14, 15.2, 14.8, 16, 17.5, 16.8, kpis.avgCagr5y]}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <MetricCard 
            label="Avg 3Y CAGR" 
            value={<AnimatedKPI value={kpis.avgCagr3y} suffix="%" decimals={2} />} 
            icon={<Activity size={20} />}
            tooltip="Average 3-year Compound Annual Growth Rate across all funds"
            valueClassName="text-blue-400"
            className="h-full"
            sparklineData={[8, 10, 12.5, 11, 14, 15, 14.5, 16, 17.2, kpis.avgCagr3y]}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <MetricCard 
            label="Avg 1Y CAGR" 
            value={<AnimatedKPI value={kpis.avgCagr1y} suffix="%" decimals={2} />} 
            icon={<TrendingUp size={20} />}
            tooltip="Average 1-year Compound Annual Growth Rate across all funds"
            valueClassName="text-amber-400"
            className="h-full"
            sparklineData={[5, 8, 11, 15, 12, 18, 22, 28, 25, kpis.avgCagr1y]}
          />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <MetricCard 
            label="Highest Return" 
            value={<AnimatedKPI value={Number(kpis.highestReturnFund?.cagr_5yr || 0)} suffix="%" decimals={1} />} 
            icon={<Percent size={20} />}
            tooltip={`Highest 5Y return: ${kpis.highestReturnFund?.name?.split(' - ')[0]}`}
            valueClassName="text-primary"
            className="h-full"
            sparklineData={[25, 28, 35, 42, 38, 45, 52, 65, 78, Number(kpis.highestReturnFund?.cagr_5yr || 0)]}
          />
        </motion.div>
      </StaggerChildren>

      {/* Row 1: Heatmap + Market Health */}
      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Category Heatmap */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400/40 to-transparent" />
          <h2 className="text-lg font-serif italic text-white mb-1">Category Heatmap</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-5">Average Return by Category & Horizon</p>
          <div className="flex-grow w-full overflow-hidden">
            <CategoryHeatmap data={kpis.heatmapData} />
          </div>
        </motion.div>

        {/* Market Health Gauge */}
        <motion.div variants={itemVariants} className="glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-amber-400/40 to-transparent" />
          <h2 className="text-lg font-serif italic text-white mb-1">Market Health</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Overall Universe Quality</p>
          <div className="flex-grow w-full">
            <MarketHealthGauge 
              score={kpis.marketHealthScore} 
              avgSharpe={kpis.avgSharpe} 
              beatRate={kpis.beatRate} 
              avg3yCagr={kpis.avgCagr3y} 
            />
          </div>
        </motion.div>
        
      </StaggerChildren>

      {/* Row 2: Bar Chart + Category Distribution Donut */}
      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Bar Chart: Avg Return by Broad Category */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F27D26] via-[#F27D26]/40 to-transparent" />
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-lg font-serif italic text-white mb-1">Average {barPeriod} Return by Category</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Broad category performance comparison</p>
            </div>
            <div className="flex bg-white/5 rounded-md p-1 border border-white/10">
              {['1Y', '3Y', '5Y'].map(p => (
                <button
                  key={p}
                  onClick={() => setBarPeriod(p as any)}
                  className={`px-3 py-1 text-[10px] font-mono rounded transition-all active:scale-95 cursor-pointer ${barPeriod === p ? 'bg-[#F27D26] text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-grow w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <filter id="glow-bar" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {kpis.barChartData.map((entry, i) => (
                      <linearGradient key={`catGrad-${i}`} id={`catGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.15} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                    dy={8}
                    interval={0}
                    angle={-15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <RechartsTooltip 
                    content={<CustomTooltip formatter={(val: any) => `${val}% avg return`} />} 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  />
                  <Bar dataKey="avgReturn" radius={[6, 6, 0, 0]} maxBarSize={50} filter="url(#glow-bar)">
                    {kpis.barChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={`url(#catGrad-${index})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Donut: Category Distribution */}
        <motion.div variants={itemVariants} className="glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] via-[#a78bfa]/40 to-transparent" />
          <h2 className="text-lg font-serif italic text-white mb-1">Category Distribution</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Fund count by type</p>
          <div className="flex-grow w-full relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="glow-pie" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {kpis.categoryPieData.map((entry, i) => (
                      <linearGradient key={`pieGrad-${i}`} id={`pieGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={kpis.categoryPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={1}
                    filter="url(#glow-pie)"
                    {...{
                      activeIndex: kpis.categoryPieData.findIndex(d => d.name === top6Filter),
                      activeShape: renderActiveShape
                    } as any}
                    onClick={(data: any) => {
                      if (data?.name === top6Filter) setTop6Filter('All');
                      else setTop6Filter(data?.name || 'All');
                    }}
                    className="cursor-pointer outline-none"
                  >
                    {kpis.categoryPieData.map((entry, index) => (
                      <Cell key={`pie-${index}`} fill={`url(#pieGrad-${index})`} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip formatter={(val: any) => `${val} funds`} />} />
                  <Legend content={<CustomPieLegend />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-2xl font-serif text-white">{kpis.totalFunds.toLocaleString()}</span>
              <span className="text-[8px] uppercase tracking-widest text-white/40">Funds</span>
            </div>
          </div>
        </motion.div>
      </StaggerChildren>

      {/* Row 3: Volatility Bubble Map + Grade Distribution + Top 10 */}
      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        
        {/* Volatility Bubble Map */}
        <motion.div variants={itemVariants} className="glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-blue-400/40 to-transparent" />
          <h2 className="text-lg font-serif italic text-white mb-1">Volatility vs Return</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-3">Risk-adjusted Performance</p>
          <div className="flex-grow w-full">
            <MiniBubbleMap data={kpis.bubbleMapData} />
          </div>
        </motion.div>

        {/* Grade Distribution Bar */}
        <motion.div variants={itemVariants} className="glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-emerald-400/40 to-transparent" />
          <h2 className="text-lg font-serif italic text-white mb-1">Fund Grade Distribution</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-5">Quality rating breakdown</p>
          <div className="flex-grow w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <filter id="glow-grade" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {kpis.gradeData.map((entry, i) => {
                      const c = GRADE_COLORS[entry.name] || '#6b7280';
                      return (
                        <linearGradient key={`gradeGrad-${i}`} id={`gradeGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c} stopOpacity={1} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.12} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 'bold' }}
                    dy={8}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <RechartsTooltip 
                    content={<CustomTooltip formatter={(val: any, name: any, props: any) => `${val.toLocaleString()} funds (${props.payload.percentage}%)`} />} 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60} filter="url(#glow-grade)">
                    {kpis.gradeData.map((entry, index) => (
                      <Cell key={`grade-${index}`} fill={`url(#gradeGrad-${index})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Top 10 Funds by 5Y Return */}
        <motion.div variants={itemVariants} className="glass-panel p-6 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col h-[380px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-emerald-400/30 to-transparent" />
          <h2 className="text-lg font-serif italic text-white mb-1">Top 10 Funds by 5Y Return</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-5">Highest performing funds</p>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.top10ReturnsData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <filter id="glow-top" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  {kpis.top10ReturnsData.map((entry, i) => (
                    <linearGradient key={`topGrad-${i}`} id={`topGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} vertical={true} />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 9 }}
                  width={140}
                  interval={0}
                />
                <RechartsTooltip content={<CustomTooltip formatter={(val: any) => `${val}% CAGR`} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="return" radius={[0, 6, 6, 0]} barSize={18} filter="url(#glow-top)">
                  {kpis.top10ReturnsData.map((entry, index) => (
                    <Cell key={`top-${index}`} fill={`url(#topGrad-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </StaggerChildren>

      {/* Row 4: Momentum Feed + SIP Widget */}
      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <motion.div variants={itemVariants} className="lg:col-span-2 h-[380px]">
          <MomentumFeed />
        </motion.div>
        <motion.div variants={itemVariants} className="h-[380px]">
          <QuickSipWidget avgCagr={kpis.avgCagr5y} />
        </motion.div>
      </StaggerChildren>

      {/* Top Funds Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-white mb-1">Top Rated Funds</h2>
          <p className="text-xs text-white/50 font-mono">Highest scoring funds across categories</p>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['All', 'Equity', 'Debt', 'Hybrid', 'Index & ETF'].map(cat => (
            <button
              key={cat}
              onClick={() => setTop6Filter(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 border cursor-pointer ${top6Filter === cat ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30'}`}
            >
              {cat}
            </button>
          ))}
          <Link href="/screener" className="ml-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors whitespace-nowrap">
            View All <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTopFunds.map((fund, i) => {
          const gradeLetter = fund.score_grade !== 'N/A' && fund.score_grade ? fund.score_grade.split(' - ')[0] : 'N/A';
          const cleanName = fund.name.split(' - ')[0];

          return (
            <motion.div 
              layout 
              layoutId={`fund-card-${fund.code}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              variants={itemVariants} 
              key={fund.code || i} 
              className="h-full"
            >
              <TiltCard className="block h-full" maxTilt={5}>
                <Link href={`/fund/${fund.code}/`} className="glass-panel p-6 h-full flex flex-col gap-4 border border-white/10 hover:border-primary/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group cursor-pointer">
                  <div className="flex justify-between items-start z-10 gap-2">
                    <div className="flex-1">
                      <span className="inline-block text-[#F27D26] font-mono tracking-widest text-[9px] uppercase mb-1">
                        {(fund as any).sub_category || fund.category}
                      </span>
                      <h3 className="text-lg font-serif italic text-on-surface leading-tight group-hover:text-primary transition-colors duration-300">
                        {cleanName}
                      </h3>
                    </div>
                    <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-lg font-serif italic z-10 relative text-amber-400">{gradeLetter}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-2 pt-4 mt-auto border-t border-white/10 z-10">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-0.5">Score</p>
                      <p className="text-sm font-serif italic text-on-surface">
                        {fund.score !== null ? fund.score : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-0.5">5Y CAGR</p>
                      <p className="text-sm font-serif italic text-primary">
                        {fund.cagr_5yr !== null ? Number(fund.cagr_5yr).toFixed(2) + '%' : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          );
        })}
      </StaggerChildren>
    </main>
  );
}
