'use client';

import { ShieldCheck, Info, AlertTriangle, HeartCrack, HelpCircle, ArrowLeft, TrendingUp, Percent, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { GradeTag } from '@/components/GradeTag';
import { AnimateNumber } from '@/components/ui/animated-blur-number';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { maxDrawdown, calmarRatio, sortinoRatio, captureRatios, sipXirr, rollingReturns } from '@/lib/metrics';
import { MetricCard } from '@/components/MetricCard';
import { StaggerChildren, itemVariants } from '@/components/ui/motion/StaggerChildren';
import { TiltCard } from '@/components/ui/TiltCard';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface FundDetailClientProps {
  fund: any;
  benchHistory: any[];
  benchName: string;
}

export default function FundDetailClient({ fund, benchHistory, benchName }: FundDetailClientProps) {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);


  const [isInCompare, setIsInCompare] = useState(false);
  const [isInShortlist, setIsInShortlist] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    if (!fund) return;
    setIsExporting(true);
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    try {
      const element = document.getElementById('fund-detail-content');
      if (!element) throw new Error("Content not found");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#050505' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fund.name.split(' - ')[0]}-Report.pdf`);
      toast.success('PDF Downloaded!', { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error('PDF Export failed', { id: 'pdf-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    try {
      const compareSaved = localStorage.getItem('fundscope_compare');
      if (compareSaved) {
        const compareList = JSON.parse(compareSaved);
        if (fund && compareList.find((f: any) => f.code === fund.code)) setIsInCompare(true);
      }
      
      const shortlistSaved = localStorage.getItem('fundscope_shortlist');
      if (shortlistSaved) {
        const shortlistList = JSON.parse(shortlistSaved);
        if (fund && shortlistList.find((f: any) => f.code === fund.code)) setIsInShortlist(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [fund]);

  const toggleCompare = () => {
    if (!fund) return;
    try {
      const saved = localStorage.getItem('fundscope_compare');
      let compareList = saved ? JSON.parse(saved) : [];
      if (isInCompare) {
        compareList = compareList.filter((f: any) => f.code !== fund.code);
        setIsInCompare(false);
      } else {
        if (compareList.length >= 3) {
          toast.error('You can only compare up to 3 funds.');
          return;
        }
        compareList.push(fund);
        setIsInCompare(true);
      }
      localStorage.setItem('fundscope_compare', JSON.stringify(compareList));
      window.dispatchEvent(new Event('compareUpdated'));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleShortlist = () => {
    if (!fund) return;
    try {
      const saved = localStorage.getItem('fundscope_shortlist');
      let shortlistList = saved ? JSON.parse(saved) : [];
      if (isInShortlist) {
        shortlistList = shortlistList.filter((f: any) => f.code !== fund.code);
        setIsInShortlist(false);
      } else {
        shortlistList.push(fund);
        setIsInShortlist(true);
      }
      localStorage.setItem('fundscope_shortlist', JSON.stringify(shortlistList));
    } catch (e) {
      console.error(e);
    }
  };

  // Aligned compound returns normalization
  const chartData = useMemo(() => {
    if (!fund || !fund.nav_history || fund.nav_history.length === 0) return [];
    
    const navHistory = fund.nav_history;
    
    const startNav = navHistory[0].nav;
    const startDateStr = navHistory[0].date;
    const startDate = new Date(startDateStr);

    // Find closest benchmark starting price to align baseline
    let closestBenchPt: any = null;
    let minTimeDiff = Infinity;
    
    benchHistory.forEach((b: any) => {
      const diff = Math.abs(new Date(b.date).getTime() - startDate.getTime());
      if (diff < minTimeDiff) {
        minTimeDiff = diff;
        closestBenchPt = b;
      }
    });

    const startBenchPrice = closestBenchPt ? closestBenchPt.price : null;

    // Map and align date point by date point
    return navHistory.map((pt: any) => {
      const targetTime = new Date(pt.date).getTime();
      
      // Find closest index point in time
      let closest: any = null;
      let minD = Infinity;
      
      if (benchHistory && benchHistory.length > 0) {
        closest = benchHistory[0];
        minD = Math.abs(new Date(closest.date).getTime() - targetTime);
        
        benchHistory.forEach((b: any) => {
          const d = Math.abs(new Date(b.date).getTime() - targetTime);
          if (d < minD) {
            minD = d;
            closest = b;
          }
        });
      }
      
      const normNav = (pt.nav / startNav) * 100;
      const normBench = closest && startBenchPrice ? (closest.price / startBenchPrice) * 100 : null;
      
      const dateObj = new Date(pt.date);
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      return {
        date: pt.date,
        displayDate: displayDate,
        fund: parseFloat(normNav.toFixed(1)),
        benchmark: normBench !== null ? parseFloat(normBench.toFixed(1)) : null
      };
    });
  }, [fund]);

  // Compute Radar Chart (Fund DNA) based on normalized performance metrics
  const dnaData = useMemo(() => {
    if (!fund) return [];
    
    // Scale 5Y return between 0% and 25%
    const returnsMark = Math.min(100, Math.max(10, ((fund.cagr_5yr || 0) / 25) * 100));
    // Consistency is already 0-100%
    const consistencyMark = (fund as any).consistency_3yr || 50;
    // Scale Sharpe Ratio between 0.0 and 1.6
    const sharpeMark = Math.min(100, Math.max(10, ((fund.sharpe_ratio || 0) / 1.6) * 100));
    // Scale Alpha between -5% and +10%
    const alphaMark = Math.min(100, Math.max(10, (((fund.alpha_5yr || 0) + 5) / 15) * 100));
    // Scale Volatility (Lower volatility = Higher defence mark. Volatility between 22% and 4%)
    const defensiveMark = Math.min(100, Math.max(10, ((22 - (fund.volatility || 15)) / 18) * 100));

    return [
      { subject: 'Returns (5Y)', A: Math.round(returnsMark), fullMark: 100 },
      { subject: 'Consistency', A: Math.round(consistencyMark), fullMark: 100 },
      { subject: 'Sharpe Efficiency', A: Math.round(sharpeMark), fullMark: 100 },
      { subject: 'Active Alpha', A: Math.round(alphaMark), fullMark: 100 },
      { subject: 'Risk Defence', A: Math.round(defensiveMark), fullMark: 100 }
    ];
  }, [fund]);

  // Compute advanced metrics
  const advancedMetrics = useMemo(() => {
    if (!fund || !fund.nav_history || fund.nav_history.length === 0) return null;
    const navHistory = fund.nav_history;
    
    const mdd = maxDrawdown(navHistory);
    const calmar = calmarRatio(fund.cagr_5yr || 0, mdd);
    const sortino = sortinoRatio(navHistory, fund.cagr_5yr || 0, 7.0);
    const capture = captureRatios(navHistory, benchHistory);
    const xirr = sipXirr(navHistory, 10000);
    
    // Rolling returns
    const roll1Y = rollingReturns(navHistory, 1);
    const roll3Y = rollingReturns(navHistory, 3);
    
    return { mdd, calmar, sortino, capture, xirr, roll1Y, roll3Y };
  }, [fund]);

  const [activeRollingTab, setActiveRollingTab] = useState<'1Y' | '3Y'>('3Y');

  // Handlers for dynamic recommendations
  const getRecommendation = (gradeLetter: string) => {
    switch (gradeLetter) {
      case 'S':
        return {
          title: 'Strong Buy',
          desc: 'Excellent composite score. Outperforms index and peers with top-tier returns, superior volatility management, and consistent compound gains. Recommended for core portfolio allocation.',
          color: 'text-amber-400 bg-amber-400/5 border-amber-400/20',
          icon: <ShieldCheck className="text-amber-400 shrink-0" size={32} />
        };
      case 'A':
        return {
          title: 'Buy',
          desc: 'High performance efficiency. Strong active alpha generation and healthy Sharpe ratio. Highly suitable for periodic SIP wealth building.',
          color: 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20',
          icon: <ShieldCheck className="text-emerald-400 shrink-0" size={32} />
        };
      case 'B':
        return {
          title: 'Hold',
          desc: 'Average risk-adjusted returns matching the benchmark. If you already hold this fund, continue; however, consider routing new capital to higher-graded options.',
          color: 'text-blue-400 bg-blue-400/5 border-blue-400/20',
          icon: <Info className="text-blue-400 shrink-0" size={32} />
        };
      case 'C':
        return {
          title: 'Review / Underperform',
          desc: 'Below average return efficiency and negative active alpha. Compound returns are lagging behind passive indexes. Consider reallocation.',
          color: 'text-purple-400 bg-purple-400/5 border-purple-400/20',
          icon: <AlertTriangle className="text-purple-400 shrink-0" size={32} />
        };
      case 'D':
      case 'N/A':
        return {
          title: 'Avoid / Sell',
          desc: 'Consistently underperforms its category and benchmark index. High expense fee drag combined with inefficient active management. Prefer passive index options.',
          color: 'text-red-400 bg-red-400/5 border-red-400/20',
          icon: <HeartCrack className="text-red-400 shrink-0" size={32} />
        };
      default:
        return {
          title: 'Hold',
          desc: 'Performance indicators are within standard margins.',
          color: 'text-white/60 bg-white/5 border-white/10',
          icon: <HelpCircle className="text-white/40 shrink-0" size={32} />
        };
    }
  };

  if (!fund) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pt-28 min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="text-danger-red mb-4" size={48} />
        <h1 className="text-4xl font-serif italic text-on-surface mb-2">Fund Not Found</h1>
        <p className="text-on-surface-variant mb-6">The requested scheme code is not in our database.</p>
        <Link href="/explorer" className="bg-primary text-black px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary-container active:scale-95 transition-all">
          Back to Explorer
        </Link>
      </main>
    );
  }

  const gradeLetter = fund.score_grade !== 'N/A' ? fund.score_grade.split(' - ')[0] : 'N/A';
  const rec = getRecommendation(gradeLetter);
  const volRating = (fund.volatility || 0) < 10 ? 'Low' : (fund.volatility || 0) < 16 ? 'Moderate' : 'High';

  return (
    <StaggerChildren id="fund-detail-content" className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pt-28 min-h-screen">
      
      {/* Back Button */}
      <motion.button 
        variants={itemVariants}
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-white/50 hover:text-primary mb-8 transition-colors uppercase group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back
      </motion.button>

      {/* Hero Section */}
      <motion.section variants={itemVariants} className="mb-stack-lg flex flex-col lg:flex-row justify-between items-start lg:items-end gap-stack-md">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase">Mutual Fund</span>
            <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase">•</span>
            <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase">{fund.category}</span>
            {(fund as any).sub_category && (fund as any).sub_category !== fund.category && (
              <>
                <span className="text-[10px] font-mono tracking-widest text-white/30 uppercase">›</span>
                <span className="text-[10px] font-mono tracking-widest text-white/60 uppercase">{(fund as any).sub_category}</span>
              </>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif italic text-on-surface mb-2 tracking-tighter">
            {fund.name.split(' - ')[0]}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
            AMFI Code: {fund.code} • Benchmark Index: {benchName} ({fund.benchmark})
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <button onClick={exportPDF} disabled={isExporting} className="px-4 py-2 border border-white/20 hover:bg-white/5 text-white rounded text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2">
              <Download size={14} />
              {isExporting ? "Exporting..." : "Download PDF"}
            </button>
            <button onClick={toggleCompare} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] uppercase tracking-[0.2em] font-bold transition-colors">
              {isInCompare ? "- Remove from Compare" : "+ Add to Compare"}
            </button>
            <button onClick={toggleShortlist} className="px-4 py-2 bg-primary/20 hover:bg-primary text-primary hover:text-black rounded text-[10px] uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2">
              <ShieldCheck size={14} />
              {isInShortlist ? "Remove from Shortlist" : "Add to Shortlist"}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-6 self-start lg:self-end mt-6 lg:mt-0">
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">Analyser Score</span>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-6xl font-serif italic text-primary">{gradeLetter}</span>
              <div className="flex flex-col items-start gap-1">
                <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center relative bg-surface-container-low">
                  <span className="text-xs font-mono font-bold text-white/80">{fund.score !== null ? <AnimateNumber value={Math.round(fund.score)} /> : 'N/A'}</span>
                </div>
                <GradeTag grade={fund.score_grade} className="text-[10px]" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Timeline Chart */}
          <motion.div variants={itemVariants} className="h-[500px]">
            <TiltCard className="block h-full" maxTilt={3} glareEnabled={true}>
              <div className="glass-panel p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-white/10 pb-4 relative z-10 gap-2">
                  <div>
                    <h2 className="text-3xl font-serif italic text-on-surface">Normalized Return Growth</h2>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Growth of ₹100 invested on starting date</p>
                  </div>
                  <div className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase">
                    {(fund as any).data_from} to {(fund as any).data_to}
                  </div>
                </div>
                
                <div className="flex-grow w-full mt-2 relative z-10">
                  {chartData.length > 0 ? (
                    isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFund" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="displayDate" 
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }} 
                          dy={10} 
                          minTickGap={40}
                        />
                        <YAxis 
                          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}
                          dx={-5}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '12px' }}
                          labelStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '10px' }} />
                        <Area type="monotone" name={fund.name.split(' - ')[0]} dataKey="fund" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFund)" style={{ filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.5))' }} isAnimationActive={true} animationDuration={1500} />
                        <Area type="monotone" name={`Index: ${benchName}`} dataKey="benchmark" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 4" fill="none" style={{ filter: 'drop-shadow(0px 0px 4px rgba(248, 113, 113, 0.4))' }} isAnimationActive={true} animationDuration={1500} />
                      </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading chart...</div>
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-white/5 rounded-lg backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                      <TrendingUp className="text-[#F27D26] mb-3 opacity-80" size={36} />
                      <h4 className="text-lg font-serif italic text-white/95 mb-2">Historical Charting Limited</h4>
                      <p className="text-xs text-white/60 max-w-md leading-relaxed font-light">
                        Interactive historical charting and advanced risk simulations are fully enabled for our <strong className="text-primary font-medium">32 handpicked index and active funds</strong>. 
                        To see full timeline charts, check out the primary selections in the <Link href="/shortlist" className="text-primary underline hover:text-white transition-colors">Shortlist</Link> or run comparisons in the <Link href="/compare" className="text-primary underline hover:text-white transition-colors">Comparison Engine</Link>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TiltCard>
          </motion.div>

          {/* Rolling Returns Chart */}
          {advancedMetrics && (advancedMetrics.roll1Y.length > 0 || advancedMetrics.roll3Y.length > 0) && (
            <motion.div variants={itemVariants} className="h-[400px]">
              <TiltCard className="block h-full" maxTilt={3} glareEnabled={true}>
                <div className="glass-panel p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 relative z-10">
                    <div>
                      <h3 className="text-xl font-serif italic text-on-surface">Rolling Returns</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Consistency over time</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveRollingTab('1Y')}
                        className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded transition-colors ${activeRollingTab === '1Y' ? 'bg-primary text-black font-bold' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        1Y
                      </button>
                      <button 
                        onClick={() => setActiveRollingTab('3Y')}
                        className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded transition-colors ${activeRollingTab === '3Y' ? 'bg-primary text-black font-bold' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        3Y
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-grow w-full relative z-10">
                    {isMounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activeRollingTab === '1Y' ? advancedMetrics.roll1Y : advancedMetrics.roll3Y} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                          <XAxis 
                            dataKey="date" 
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }} 
                            dy={10} 
                            minTickGap={40}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                          />
                          <YAxis 
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}
                            dx={-5}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '12px' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          />
                          <defs>
                            <linearGradient id="rollingGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            name={`${activeRollingTab} Rolling CAGR`} 
                            dataKey="rolling" 
                            stroke="#8b5cf6" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#rollingGrad)" 
                            isAnimationActive={true} 
                            animationDuration={1500} 
                            style={{ filter: 'drop-shadow(0px 0px 8px rgba(139, 92, 246, 0.5))' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading chart...</div>
                    )}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          )}
        </div>

        {/* Right Column: Key Stats & Radar Chart */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="h-full">
              <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
                <MetricCard 
                  label="5Y CAGR" 
                  value={fund.cagr_5yr !== null ? `${fund.cagr_5yr.toFixed(2)}%` : 'N/A'} 
                  valueClassName="text-primary"
                  className="h-full"
                />
              </TiltCard>
            </motion.div>
            <motion.div variants={itemVariants} className="h-full">
              <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
                <MetricCard 
                  label="Sharpe Ratio" 
                  value={fund.sharpe_ratio !== null ? fund.sharpe_ratio.toFixed(3) : 'N/A'} 
                  tooltip="Sharpe Ratio = (Fund Return − 7.0% risk-free rate) / Volatility. Above 0.5 is considered good for Indian equity funds."
                  className="h-full"
                />
              </TiltCard>
            </motion.div>
            <motion.div variants={itemVariants} className="h-full">
              <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
                <MetricCard 
                  label="Active Alpha (5Y)" 
                  value={fund.alpha_5yr !== null ? (fund.alpha_5yr >= 0 ? '+' : '') + fund.alpha_5yr.toFixed(2) + '%' : 'N/A'} 
                  valueClassName={fund.alpha_5yr !== null && fund.alpha_5yr >= 0 ? 'text-emerald-400' : 'text-red-400'}
                  className="h-full"
                />
              </TiltCard>
            </motion.div>
            <motion.div variants={itemVariants} className="h-full">
              <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
                <MetricCard 
                  label="Volatility" 
                  value={fund.volatility !== null ? `${fund.volatility.toFixed(1)}%` : 'N/A'} 
                  delta={`(${volRating})`}
                  valueClassName="text-white/60 text-xl"
                  className="h-full"
                />
              </TiltCard>
            </motion.div>
          </div>

          {/* Radar Chart (DNA) */}
          <motion.div variants={itemVariants} className="h-[340px]">
            <TiltCard className="block h-full" maxTilt={5} glareEnabled={true}>
              <div className="glass-panel p-6 flex flex-col items-center justify-center h-full shadow-2xl relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
                <h3 className="text-[9px] uppercase tracking-[0.2em] text-white/50 mb-4 self-start font-bold">Fund DNA</h3>
                <div className="w-full h-full -mt-2">
                  {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dnaData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 8, fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Fund Score" dataKey="A" stroke="#3b82f6" strokeWidth={1.5} fill="#3b82f6" fillOpacity={0.12} dot={{ r: 2, fill: '#3b82f6' }} style={{ filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.4))' }} isAnimationActive={true} animationDuration={1500} />
                      <Tooltip contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '11px' }} />
                    </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">Loading DNA...</div>
                  )}
                </div>
              </div>
            </TiltCard>
          </motion.div>
          
        </div>
      </div>

      {/* Recommendation Card & Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Recommendation Panel */}
        <motion.div variants={itemVariants} className="h-full">
          <TiltCard className="block h-full" maxTilt={3} glareEnabled={false}>
            <div className={`border p-8 flex flex-col gap-4 shadow-2xl rounded-xl h-full ${rec.color}`}>
              <div className="flex items-center gap-4">
                {rec.icon}
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">Recommendation</span>
                  <span className="text-2xl font-serif italic font-bold">{rec.title}</span>
                </div>
              </div>
              <p className="text-sm font-light leading-relaxed text-white/80">{rec.desc}</p>
            </div>
          </TiltCard>
        </motion.div>

        {/* Statistical Consistency Summary */}
        <motion.div variants={itemVariants} className="h-full">
          <TiltCard className="block h-full" maxTilt={3} glareEnabled={true}>
            <div className="glass-panel p-8 flex flex-col justify-between shadow-2xl rounded-xl h-full">
              <div>
                <h3 className="text-xl font-serif italic text-on-surface mb-2 flex items-center gap-2">
                  <Percent size={18} className="text-[#F27D26]" /> Rolling Return Consistency
                </h3>
                <p className="text-xs text-white/50 leading-relaxed font-light mb-4">
                  This measures the percentage of historical 3-year rolling return periods that yielded a positive return over the last 10 years. Higher consistency indicates robust defensive qualities.
                </p>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4 mt-auto">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">3Y Rolling Consistency</span>
                  <span className="text-3xl font-serif italic text-primary font-bold">{(fund as any).consistency_3yr !== undefined && (fund as any).consistency_3yr !== null ? Number((fund as any).consistency_3yr).toFixed(1) + '%' : 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 block">Category Rank</span>
                  <span className="text-3xl font-serif italic text-on-surface font-bold">#{(fund as any).rank_in_category || 'N/A'}</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>

      {/* Advanced Metrics */}
      {advancedMetrics && (
        <motion.div variants={itemVariants} className="mt-6 mb-6">
          <h3 className="text-xl font-serif italic text-on-surface mb-4">Advanced Risk & Returns</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
              <MetricCard 
                label="Max Drawdown" 
                value={`${advancedMetrics.mdd.toFixed(2)}%`}
                valueClassName="text-red-400"
                tooltip="Maximum observed loss from a peak to a trough before a new peak is attained."
                className="h-full"
              />
            </TiltCard>
            <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
              <MetricCard 
                label="Sortino Ratio" 
                value={advancedMetrics.sortino !== null ? advancedMetrics.sortino.toFixed(2) : 'N/A'}
                tooltip="Measures risk-adjusted return relative to downside volatility only. Higher is better."
                className="h-full"
              />
            </TiltCard>
            <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
              <MetricCard 
                label="Calmar Ratio" 
                value={advancedMetrics.calmar !== null ? advancedMetrics.calmar.toFixed(2) : 'N/A'}
                tooltip="Ratio of 5Y CAGR to Maximum Drawdown. Measures return relative to maximum drawdown risk."
                className="h-full"
              />
            </TiltCard>
            <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
              <MetricCard 
                label="SIP XIRR" 
                value={advancedMetrics.xirr !== null ? `${advancedMetrics.xirr.toFixed(2)}%` : 'N/A'}
                valueClassName="text-emerald-400"
                tooltip="Expected Annualized Return for a ₹10,000 monthly SIP over the available historical period."
                className="h-full"
              />
            </TiltCard>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
              <MetricCard 
                label="Upside Capture" 
                value={advancedMetrics.capture.upside !== null ? `${advancedMetrics.capture.upside.toFixed(1)}%` : 'N/A'}
                valueClassName={advancedMetrics.capture.upside !== null && advancedMetrics.capture.upside > 100 ? "text-emerald-400" : "text-white/80"}
                tooltip="Percentage of market gains captured by the fund when the benchmark goes UP. >100% means it outperforms in bull markets."
                className="h-full"
              />
            </TiltCard>
            <TiltCard maxTilt={5} glareEnabled={false} className="h-full">
              <MetricCard 
                label="Downside Capture" 
                value={advancedMetrics.capture.downside !== null ? `${advancedMetrics.capture.downside.toFixed(1)}%` : 'N/A'}
                valueClassName={advancedMetrics.capture.downside !== null && advancedMetrics.capture.downside < 100 ? "text-emerald-400" : "text-red-400"}
                tooltip="Percentage of market losses captured by the fund when the benchmark goes DOWN. <100% means it falls less than the market."
                className="h-full"
              />
            </TiltCard>
          </div>
        </motion.div>
      )}

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Score Breakdown Card */}
        <motion.div variants={itemVariants} className="h-full">
          <TiltCard className="block h-full" maxTilt={3} glareEnabled={true}>
            <div className="glass-panel p-8 flex flex-col shadow-2xl rounded-xl h-full">
              <h3 className="text-xl font-serif italic text-on-surface mb-6 flex items-center gap-2">
                Score Breakdown
              </h3>
              <div className="flex flex-col gap-5 flex-grow justify-center">
                {dnaData.map((item, idx) => (
                  <div key={item.subject} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">{item.subject}</span>
                      <span className="text-xs font-serif italic text-on-surface">{item.A}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.A}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 + (idx * 0.1) }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Benchmark Comparison Table */}
        <motion.div variants={itemVariants} className="h-full">
          <TiltCard className="block h-full" maxTilt={3} glareEnabled={false}>
            <div className="glass-panel p-8 flex flex-col shadow-2xl rounded-xl h-full">
              <h3 className="text-xl font-serif italic text-on-surface mb-6 flex items-center gap-2">
                Benchmark Comparison
              </h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Period</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal text-right">Fund CAGR</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal text-right">Benchmark ({benchName})</th>
                      <th className="py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal text-right">Alpha</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-white/5">
                      <td className="py-4 text-on-surface">1 Year</td>
                      <td className="py-4 text-right font-serif italic text-primary">{fund.cagr_1yr !== null ? `${Number(fund.cagr_1yr).toFixed(2)}%` : 'N/A'}</td>
                      <td className="py-4 text-right font-serif italic text-white/60">N/A</td>
                      <td className="py-4 text-right font-serif italic text-white/60">-</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-4 text-on-surface">3 Years</td>
                      <td className="py-4 text-right font-serif italic text-primary">{fund.cagr_3yr !== null ? `${Number(fund.cagr_3yr).toFixed(2)}%` : 'N/A'}</td>
                      <td className="py-4 text-right font-serif italic text-white/60">N/A</td>
                      <td className="py-4 text-right font-serif italic text-white/60">-</td>
                    </tr>
                    <tr>
                      <td className="py-4 text-on-surface">5 Years</td>
                      <td className="py-4 text-right font-serif italic text-primary">{fund.cagr_5yr !== null ? `${Number(fund.cagr_5yr).toFixed(2)}%` : 'N/A'}</td>
                      <td className="py-4 text-right font-serif italic text-white/80">{(fund as any).bench_5yr !== undefined && (fund as any).bench_5yr !== null ? `${Number((fund as any).bench_5yr).toFixed(2)}%` : 'N/A'}</td>
                      <td className={`py-4 text-right font-serif italic font-bold ${fund.alpha_5yr !== null && Number(fund.alpha_5yr) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fund.alpha_5yr !== null ? `${Number(fund.alpha_5yr) >= 0 ? '+' : ''}${Number(fund.alpha_5yr).toFixed(2)}%` : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-auto pt-6 text-[9px] uppercase tracking-[0.2em] text-white/40">
                Note: Benchmark data currently available for 5-year annualized periods.
              </p>
            </div>
          </TiltCard>
        </motion.div>

      </div>

    </StaggerChildren>
  );
}
