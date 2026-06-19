'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Scale, TrendingUp, Info, HelpCircle, ShieldCheck, ArrowRightLeft, FileCode2, Download } from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import fundData from '@/lib/data.json';
import { maxDrawdown, calmarRatio, sortinoRatio, captureRatios, sipXirr } from '@/lib/metrics';

export default function ComparePage() {
  const funds = useMemo(() => fundData.funds || [], []);
  
  // To prevent the browser from crashing with 14,000+ native <option> elements,
  // we limit the compare dropdowns to the top 200 funds by score.
  const topFunds = useMemo(() => {
    return [...funds].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 200);
  }, [funds]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('fundscope_compare');
      if (saved) {
        const compareList = JSON.parse(saved);
        if (compareList.length > 0 && compareList[0].code) {
          setCodeA(compareList[0].code);
        }
        if (compareList.length > 1 && compareList[1].code) {
          setCodeB(compareList[1].code);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Set default selections
  const [codeA, setCodeA] = useState(topFunds[0]?.code || '');
  const [codeB, setCodeB] = useState(topFunds[1]?.code || '');

  const fundA = useMemo(() => funds.find(f => f.code === codeA), [funds, codeA]);
  const fundB = useMemo(() => funds.find(f => f.code === codeB), [funds, codeB]);

  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    if (!fundA || !fundB) return;
    setIsExporting(true);
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    try {
      const element = document.getElementById('compare-content');
      if (!element) throw new Error("Content not found");
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#050505' });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FundScope-Compare-${fundA.code}-vs-${fundB.code}.pdf`);
      toast.success('PDF Downloaded!', { id: 'pdf-toast' });
    } catch (err) {
      console.error(err);
      toast.error('PDF Export failed', { id: 'pdf-toast' });
    } finally {
      setIsExporting(false);
    }
  };

  // Aligned NAV timeline calculations
  const alignedChartData = useMemo(() => {
    if (!fundA || !fundB) return [];
    if (!fundA.nav_history.length || !fundB.nav_history.length) return [];

    const histA = fundA.nav_history;
    const histB = fundB.nav_history;

    const startA = new Date(histA[0].date);
    const startB = new Date(histB[0].date);
    
    // Common start date is the maximum of both start dates
    const commonStartDate = startA > startB ? startA : startB;
    const commonStartDateStr = commonStartDate.toISOString().split('T')[0];

    // Find baseline NAVs on or closest to the common start date
    const getBaseNAV = (history: any[]) => {
      let closestPt = history[0];
      let minDiff = Infinity;
      history.forEach((pt: any) => {
        const diff = Math.abs(new Date(pt.date).getTime() - commonStartDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = pt;
        }
      });
      return closestPt.nav;
    };

    const baseNavA = getBaseNAV(histA);
    const baseNavB = getBaseNAV(histB);

    // Map using dates from the fund with the longer history after commonStartDate
    const referenceHist = histA.filter((pt: any) => new Date(pt.date) >= commonStartDate);

    return referenceHist.map((pt: any) => {
      const targetTime = new Date(pt.date).getTime();

      // Find closest NAV in history B
      let closestB = histB[0];
      let minD = Math.abs(new Date(closestB.date).getTime() - targetTime);
      histB.forEach((b: any) => {
        const d = Math.abs(new Date(b.date).getTime() - targetTime);
        if (d < minD) {
          minD = d;
          closestB = b;
        }
      });

      const normA = (pt.nav / baseNavA) * 100;
      const normB = closestB ? (closestB.nav / baseNavB) * 100 : null;
      
      const dateObj = new Date(pt.date);
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      return {
        date: pt.date,
        displayDate: displayDate,
        [fundA.name.split(' - ')[0]]: parseFloat(normA.toFixed(1)),
        [fundB.name.split(' - ')[0]]: normB !== null ? parseFloat(normB.toFixed(1)) : null
      };
    });
  }, [fundA, fundB]);

  const dualDnaData = useMemo(() => {
    if (!fundA || !fundB) return [];

    const getDNA = (fund: any) => {
      const returnsMark = Math.min(100, Math.max(10, ((fund.cagr_5yr || 0) / 25) * 100));
      const consistencyMark = fund.consistency_3yr || 50;
      const sharpeMark = Math.min(100, Math.max(10, ((fund.sharpe_ratio || 0) / 1.6) * 100));
      const alphaMark = Math.min(100, Math.max(10, (((fund.alpha_5yr || 0) + 5) / 15) * 100));
      const defensiveMark = Math.min(100, Math.max(10, ((22 - (fund.volatility || 15)) / 18) * 100));
      return { returnsMark, consistencyMark, sharpeMark, alphaMark, defensiveMark };
    };

    const dnaA = getDNA(fundA);
    const dnaB = getDNA(fundB);

    return [
      { subject: 'Returns (5Y)', A: Math.round(dnaA.returnsMark), B: Math.round(dnaB.returnsMark), fullMark: 100 },
      { subject: 'Consistency', A: Math.round(dnaA.consistencyMark), B: Math.round(dnaB.consistencyMark), fullMark: 100 },
      { subject: 'Sharpe Efficiency', A: Math.round(dnaA.sharpeMark), B: Math.round(dnaB.sharpeMark), fullMark: 100 },
      { subject: 'Active Alpha', A: Math.round(dnaA.alphaMark), B: Math.round(dnaB.alphaMark), fullMark: 100 },
      { subject: 'Risk Defence', A: Math.round(dnaA.defensiveMark), B: Math.round(dnaB.defensiveMark), fullMark: 100 }
    ];
  }, [fundA, fundB]);

  const advancedA = useMemo(() => {
    if (!fundA || !fundA.nav_history.length) return null;
    const benchHistory = ((fundData as any).benchmarks || {})[fundA.benchmark] || [];
    const mdd = maxDrawdown(fundA.nav_history);
    const calmar = calmarRatio(fundA.cagr_5yr || 0, mdd);
    const sortino = sortinoRatio(fundA.nav_history, fundA.cagr_5yr || 0, 7.0);
    const capture = captureRatios(fundA.nav_history, benchHistory);
    const xirr = sipXirr(fundA.nav_history, 10000);
    return { mdd, calmar, sortino, capture, xirr };
  }, [fundA]);

  const advancedB = useMemo(() => {
    if (!fundB || !fundB.nav_history.length) return null;
    const benchHistory = ((fundData as any).benchmarks || {})[fundB.benchmark] || [];
    const mdd = maxDrawdown(fundB.nav_history);
    const calmar = calmarRatio(fundB.cagr_5yr || 0, mdd);
    const sortino = sortinoRatio(fundB.nav_history, fundB.cagr_5yr || 0, 7.0);
    const capture = captureRatios(fundB.nav_history, benchHistory);
    const xirr = sipXirr(fundB.nav_history, 10000);
    return { mdd, calmar, sortino, capture, xirr };
  }, [fundB]);

  const getGradeClass = (grade: string) => {
    const letter = grade.split(' - ')[0];
    switch (letter) {
      case 'S': return 'text-amber-400';
      case 'A': return 'text-emerald-400';
      case 'B': return 'text-blue-400';
      case 'C': return 'text-purple-400';
      case 'D': return 'text-red-400';
      default: return 'text-white/40';
    }
  };

  return (
    <main id="compare-content" className="flex-grow pt-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-24 min-h-screen">
      {/* Page Header */}
      <div className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Comparison Engine</span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Compare Funds</h1>
          <p className="text-base text-on-surface-variant max-w-2xl font-light">
            Align inception dates and compare compound historical returns, volatility, risk-adjusted Sharpe ratios, and active alpha metrics.
          </p>
        </div>
        <button onClick={exportPDF} disabled={isExporting} className="px-6 py-3 border border-white/20 hover:bg-white/5 active:scale-[0.98] text-white text-[10px] uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2 self-start md:self-end shrink-0">
          <Download size={14} />
          {isExporting ? "Exporting..." : "Download Report"}
        </button>
      </div>

      {/* Select Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 bg-gradient-to-br from-[#1a1a1a] to-[#080808] border border-white/10 p-8 shadow-2xl">
        {/* Dropdown A */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/50 block">Primary Asset (Fund A)</label>
          <select 
            value={codeA}
            onChange={(e) => setCodeA(e.target.value)}
            className="w-full bg-[#121212] border border-white/20 text-[11px] uppercase tracking-[0.1em] font-medium text-on-surface p-3.5 outline-none focus:border-[#F27D26]"
          >
            {topFunds.map(f => (
              <option key={f.code} value={f.code} disabled={f.code === codeB}>
                [{(f as any).sub_category || f.category}] {f.name.split(' - ')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown B */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/50 block">Comparison Asset (Fund B)</label>
          <select 
            value={codeB}
            onChange={(e) => setCodeB(e.target.value)}
            className="w-full bg-[#121212] border border-white/20 text-[11px] uppercase tracking-[0.1em] font-medium text-on-surface p-3.5 outline-none focus:border-[#F27D26]"
          >
            {topFunds.map(f => (
              <option key={f.code} value={f.code} disabled={f.code === codeA}>
                [{(f as any).sub_category || f.category}] {f.name.split(' - ')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      {fundA && fundB ? (
        <div className="space-y-12">
          
          {/* Aligned Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 shadow-2xl h-[400px] relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 relative z-10">
              <div>
                <h3 className="text-2xl font-semibold text-on-surface flex items-center gap-2">
                  <ArrowRightLeft className="text-primary" size={20} /> Comparative Compound Growth
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Both baselined to 100 on common start date</p>
              </div>
            </div>
            <div className="w-full h-[320px] relative z-10">
              {alignedChartData.length > 0 && isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={alignedChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="displayDate" 
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }} 
                      dy={10} 
                      minTickGap={45}
                    />
                    <YAxis 
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)' }}
                      dx={-5}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '11px' }}
                      labelStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '15px' }} />
                    <Area type="monotone" name={fundA.name.split(' - ')[0]} dataKey={fundA.name.split(' - ')[0]} stroke="#3b82f6" strokeWidth={2} fill="rgba(59, 130, 246, 0.03)" isAnimationActive={true} animationDuration={1500} />
                    <Area type="monotone" name={fundB.name.split(' - ')[0]} dataKey={fundB.name.split(' - ')[0]} stroke="#fbbf24" strokeWidth={2} fill="rgba(251, 191, 36, 0.03)" isAnimationActive={true} animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                  Calculating overlapping historical periods...
                </div>
              )}
            </div>
          </motion.div>

          {/* Dual Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 shadow-2xl h-[500px] relative overflow-hidden flex flex-col items-center"
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
            <h3 className="text-2xl font-semibold text-on-surface mb-2 self-start flex items-center gap-2">
              <Scale className="text-primary" size={20} /> Comparative Fund DNA
            </h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest self-start mb-6">Normalized performance dimensions</p>
            <div className="w-full flex-grow relative z-10 -mt-8">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dualDnaData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name={fundA.name.split(' - ')[0]} dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} dot={{ r: 3, fill: '#3b82f6' }} isAnimationActive={true} animationDuration={1500} />
                    <Radar name={fundB.name.split(' - ')[0]} dataKey="B" stroke="#fbbf24" strokeWidth={2} fill="#fbbf24" fillOpacity={0.2} dot={{ r: 3, fill: '#fbbf24' }} isAnimationActive={true} animationDuration={1500} />
                    <Tooltip contentStyle={{ borderRadius: '0', backgroundColor: '#0c0f1d', border: '1px solid rgba(255,255,255,0.1)', color: '#f2f2f2', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">Loading chart...</div>
              )}
            </div>
          </motion.div>

          {/* Metric Comparison Table */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 shadow-2xl relative overflow-hidden overflow-x-auto"
          >
            <table className="w-full border-collapse text-left min-w-[600px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 font-medium text-lg">
                  <th className="p-6 text-on-surface">Analysis Parameter</th>
                  <th className="p-6 text-[#3b82f6]">{fundA.name.split(' - ')[0]}</th>
                  <th className="p-6 text-[#fbbf24]">{fundB.name.split(' - ')[0]}</th>
                </tr>
              </thead>
              <tbody className="text-sm font-light text-white/80">
                {[
                  { label: 'Category', valA: (fundA as any).sub_category || fundA.category, valB: (fundB as any).sub_category || fundB.category },
                  { label: 'AMFI Scheme Code', valA: fundA.code, valB: fundB.code },
                  { 
                    label: 'Composite Score / Grade', 
                    valA: `${fundA.score} (${fundA.score_grade.split(' - ')[0]})`, 
                    valB: `${fundB.score} (${fundB.score_grade.split(' - ')[0]})`,
                    classA: getGradeClass(fundA.score_grade),
                    classB: getGradeClass(fundB.score_grade),
                    bold: true
                  },
                  { label: '5-Year CAGR', valA: fundA.cagr_5yr !== null ? `${Number(fundA.cagr_5yr).toFixed(2)}%` : 'N/A', valB: fundB.cagr_5yr !== null ? `${Number(fundB.cagr_5yr).toFixed(2)}%` : 'N/A', bold: true },
                  { label: '3-Year CAGR', valA: fundA.cagr_3yr !== null ? `${Number(fundA.cagr_3yr).toFixed(2)}%` : 'N/A', valB: fundB.cagr_3yr !== null ? `${Number(fundB.cagr_3yr).toFixed(2)}%` : 'N/A' },
                  { label: '1-Year CAGR', valA: fundA.cagr_1yr !== null ? `${Number(fundA.cagr_1yr).toFixed(2)}%` : 'N/A', valB: fundB.cagr_1yr !== null ? `${Number(fundB.cagr_1yr).toFixed(2)}%` : 'N/A' },
                  { label: 'SIP XIRR (5Y)', valA: advancedA && advancedA.xirr !== null ? `${Number(advancedA.xirr).toFixed(2)}%` : 'N/A', valB: advancedB && advancedB.xirr !== null ? `${Number(advancedB.xirr).toFixed(2)}%` : 'N/A' },
                  { label: 'Sharpe Ratio (Return Efficiency)', valA: fundA.sharpe_ratio !== null ? Number(fundA.sharpe_ratio).toFixed(3) : 'N/A', valB: fundB.sharpe_ratio !== null ? Number(fundB.sharpe_ratio).toFixed(3) : 'N/A' },
                  { label: 'Annualised Volatility (Risk)', valA: fundA.volatility !== null ? `${Number(fundA.volatility).toFixed(2)}%` : 'N/A', valB: fundB.volatility !== null ? `${Number(fundB.volatility).toFixed(2)}%` : 'N/A' },
                  { label: 'Max Drawdown', valA: advancedA ? `${Number(advancedA.mdd).toFixed(2)}%` : 'N/A', valB: advancedB ? `${Number(advancedB.mdd).toFixed(2)}%` : 'N/A' },
                  { label: 'Calmar Ratio', valA: advancedA && advancedA.calmar !== null ? Number(advancedA.calmar).toFixed(3) : 'N/A', valB: advancedB && advancedB.calmar !== null ? Number(advancedB.calmar).toFixed(3) : 'N/A' },
                  { label: 'Sortino Ratio', valA: advancedA && advancedA.sortino !== null ? Number(advancedA.sortino).toFixed(3) : 'N/A', valB: advancedB && advancedB.sortino !== null ? Number(advancedB.sortino).toFixed(3) : 'N/A' },
                  { label: 'Active Alpha vs Index (5Y)', valA: fundA.alpha_5yr !== null ? `${Number(fundA.alpha_5yr).toFixed(2)}%` : 'N/A', valB: fundB.alpha_5yr !== null ? `${Number(fundB.alpha_5yr).toFixed(2)}%` : 'N/A' },
                  { label: 'Upside Capture Ratio', valA: advancedA && advancedA.capture.upside !== null ? `${Number(advancedA.capture.upside).toFixed(1)}%` : 'N/A', valB: advancedB && advancedB.capture.upside !== null ? `${Number(advancedB.capture.upside).toFixed(1)}%` : 'N/A' },
                  { label: 'Downside Capture Ratio', valA: advancedA && advancedA.capture.downside !== null ? `${Number(advancedA.capture.downside).toFixed(1)}%` : 'N/A', valB: advancedB && advancedB.capture.downside !== null ? `${Number(advancedB.capture.downside).toFixed(1)}%` : 'N/A' },
                  { label: 'Rolling 3Y Return Consistency', valA: (fundA as any).consistency_3yr !== undefined && (fundA as any).consistency_3yr !== null ? `${Number((fundA as any).consistency_3yr).toFixed(1)}%` : 'N/A', valB: (fundB as any).consistency_3yr !== undefined && (fundB as any).consistency_3yr !== null ? `${Number((fundB as any).consistency_3yr).toFixed(1)}%` : 'N/A' },
                  { 
                    label: 'Recommendation Status', 
                    valA: fundA.score_grade.split(' - ')[0] === 'S' ? 'Strong Buy' : fundA.score_grade.split(' - ')[0] === 'A' ? 'Buy' : fundA.score_grade.split(' - ')[0] === 'B' ? 'Hold' : 'Under Review / Avoid', 
                    valB: fundB.score_grade.split(' - ')[0] === 'S' ? 'Strong Buy' : fundB.score_grade.split(' - ')[0] === 'A' ? 'Buy' : fundB.score_grade.split(' - ')[0] === 'B' ? 'Hold' : 'Under Review / Avoid',
                    bold: true
                  },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white/50">{row.label}</td>
                    <td className={`p-4 ${row.classA || ''} ${row.bold ? 'font-bold' : ''}`}>{row.valA}</td>
                    <td className={`p-4 ${row.classB || ''} ${row.bold ? 'font-bold' : ''}`}>{row.valB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

        </div>
      ) : (
        <div className="text-center py-12 text-white/40">Select two funds above to start analysis.</div>
      )}
    </main>
  );
}
