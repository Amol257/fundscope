'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { FadeUp } from '@/components/ui/motion/FadeUp';
import { ShieldCheck, ArrowRight, IndianRupee, PieChart, Landmark, FileText, AlertTriangle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import fundData from '@/lib/compact-data.json';
import Link from 'next/link';

export default function TaxCorner() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<'calculator' | 'elss' | 'comparison'>('elss');

  // ELSS Funds
  const elssFunds = useMemo(() => {
    return fundData.funds
      .filter(f => f.sub_category === 'ELSS (Tax Saver)')
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);
  }, []);

  // Tax Calculator State
  const [principal, setPrincipal] = useState(500000); // 5 Lakhs
  const [years, setYears] = useState(5);
  const [expectedReturn, setExpectedReturn] = useState(15);
  const [isEquity, setIsEquity] = useState(true);
  const [debtTaxSlab, setDebtTaxSlab] = useState(30);

  const [taxRegime, setTaxRegime] = useState<'old' | 'new'>('old');

  const formatCurrency = (num: number) => {
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + 'Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + 'L';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  // Tax Math (Equity vs Debt)
  const taxResults = useMemo(() => {
    // Total value = Principal * (1 + return)^years
    const totalValue = principal * Math.pow(1 + (expectedReturn / 100), years);
    const grossGain = totalValue - principal;
    
    let taxAmount = 0;
    let taxType = '';
    let taxableGain = 0;
    let taxRate = 0;

    if (isEquity) {
      if (years < 1) {
        // STCG Equity: 20% flat
        taxType = 'STCG (Equity)';
        taxableGain = grossGain;
        taxRate = 0.20;
        taxAmount = taxableGain * taxRate;
      } else {
        // LTCG Equity: 12.5% on gains exceeding ₹1.25 Lakh
        taxType = 'LTCG (Equity)';
        taxableGain = Math.max(0, grossGain - 125000);
        taxRate = 0.125;
        taxAmount = taxableGain * taxRate;
      }
    } else {
      // Debt funds (New rules post-2023): Short term capital gains added to income.
      taxType = 'Income Tax Slab (Debt)';
      taxableGain = grossGain;
      taxRate = debtTaxSlab / 100;
      taxAmount = taxableGain * taxRate;
    }

    const netGain = grossGain - taxAmount;
    const netValue = principal + netGain;
    
    // Calculate Post-Tax CAGR
    const postTaxCagr = (Math.pow(netValue / principal, 1 / years) - 1) * 100;

    return {
      grossGain,
      taxAmount,
      taxableGain,
      netGain,
      netValue,
      postTaxCagr,
      taxType,
      taxRate
    };
  }, [principal, years, expectedReturn, isEquity, debtTaxSlab]);

  // Post-Tax Comparison Table Data
  const comparisonData = useMemo(() => {
    // Take top 15 funds across all categories
    return fundData.funds
      .filter(f => f.cagr_5yr && f.category && f.sub_category !== 'ELSS (Tax Saver)') // Excluding ELSS since it has other tax implications occasionally
      .sort((a, b) => (b.cagr_5yr || 0) - (a.cagr_5yr || 0))
      .slice(0, 15)
      .map(fund => {
        const isFundEquity = fund.category === 'Equity' || fund.category === 'Hybrid' || fund.category === 'Solution Oriented';
        const grossReturn = fund.cagr_5yr || 0;
        
        // Simulate a 1 Lakh investment over 5 years
        const simPrincipal = 100000;
        const simYears = 5;
        const totalValue = simPrincipal * Math.pow(1 + (grossReturn / 100), simYears);
        const grossGain = totalValue - simPrincipal;
        
        let taxAmount = 0;
        let taxRateLabel = '';
        if (isFundEquity) {
          const taxableGain = Math.max(0, grossGain - 125000);
          taxAmount = taxableGain * 0.125;
          taxRateLabel = '12.5% LTCG';
        } else {
          taxAmount = grossGain * (debtTaxSlab / 100);
          taxRateLabel = `${debtTaxSlab}% Slab`;
        }
        
        const netValue = totalValue - taxAmount;
        const netReturn = (Math.pow(netValue / simPrincipal, 1 / simYears) - 1) * 100;
        
        return {
          ...fund,
          isEquity: isFundEquity,
          grossReturn,
          netReturn,
          taxRateLabel,
          taxDrag: grossReturn - netReturn
        };
      });
  }, [debtTaxSlab]);

  // Tax Efficiency Ranking
  const taxEfficiency = useMemo(() => {
    let equitySum = 0, equityCount = 0;
    let debtSum = 0, debtCount = 0;

    fundData.funds.forEach(fund => {
      if (!fund.cagr_5yr) return;
      if (fund.category === 'Equity') {
        equitySum += fund.cagr_5yr;
        equityCount++;
      } else if (fund.category === 'Debt') {
        debtSum += fund.cagr_5yr;
        debtCount++;
      }
    });

    const equityGross = equitySum / (equityCount || 1);
    const debtGross = debtSum / (debtCount || 1);

    // Simulate 5Y returns
    const simPrincipal = 100000;
    const eqTotal = simPrincipal * Math.pow(1 + (equityGross / 100), 5);
    const eqTax = Math.max(0, (eqTotal - simPrincipal) - 125000) * 0.125;
    const eqNetCagr = (Math.pow((eqTotal - eqTax) / simPrincipal, 1 / 5) - 1) * 100;

    const dbTotal = simPrincipal * Math.pow(1 + (debtGross / 100), 5);
    const dbTax = (dbTotal - simPrincipal) * (debtTaxSlab / 100);
    const dbNetCagr = (Math.pow((dbTotal - dbTax) / simPrincipal, 1 / 5) - 1) * 100;

    return {
      equityGross, equityNet: eqNetCagr,
      debtGross, debtNet: dbNetCagr
    };
  }, [debtTaxSlab]);

  return (
    <main className="flex-grow pt-28 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-24 min-h-screen">
      <div className="mb-12">
        <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Tax Corner</span>
        <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Tax & Returns</h1>
        <p className="text-base text-on-surface-variant max-w-2xl font-light">
          After-tax returns are the only returns that matter. Discover Section 80C tax-saving funds or calculate the exact tax impact on your capital gains.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('elss')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'elss' ? 'text-primary' : 'text-white/40 hover:text-white/80'}`}
        >
          ELSS (80C Savings)
          {activeTab === 'elss' && (
            <motion.div layoutId="tax-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary"></motion.div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('calculator')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'calculator' ? 'text-primary' : 'text-white/40 hover:text-white/80'}`}
        >
          LTCG / STCG Calculator
          {activeTab === 'calculator' && (
            <motion.div layoutId="tax-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary"></motion.div>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('comparison')}
          className={`pb-2 px-2 text-sm font-bold uppercase tracking-widest transition-colors relative ${activeTab === 'comparison' ? 'text-primary' : 'text-white/40 hover:text-white/80'}`}
        >
          Post-Tax Comparison
          {activeTab === 'comparison' && (
            <motion.div layoutId="tax-tab" className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-primary"></motion.div>
          )}
        </button>
      </div>

      {activeTab === 'elss' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            <div className="lg:col-span-8">
              <div className="glass-panel p-8 shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 opacity-5">
                  <ShieldCheck size={200} />
                </div>
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <IndianRupee size={20} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Section 80C Limit: ₹1.5 Lakhs</span>
                </div>
                <h2 className="text-4xl font-semibold text-on-surface mb-4 relative z-10">Save up to ₹46,800 in Taxes</h2>
                <p className="text-white/60 max-w-xl font-light mb-6 relative z-10">
                  Equity Linked Savings Schemes (ELSS) are mutual funds that invest primarily in equity and offer tax deductions under Section 80C. They come with a mandatory 3-year lock-in period, the lowest among all 80C tax-saving options.
                </p>
                
                <div className="mb-6 z-10 relative">
                  <div className="flex bg-[#121212] border border-white/10 rounded overflow-hidden w-fit">
                    <button 
                      onClick={() => setTaxRegime('old')}
                      className={`px-6 py-2 text-xs font-bold transition-colors ${taxRegime === 'old' ? 'bg-[#F27D26]/20 text-[#F27D26]' : 'text-white/40 hover:bg-white/5'}`}
                    >
                      Old Tax Regime
                    </button>
                    <button 
                      onClick={() => setTaxRegime('new')}
                      className={`px-6 py-2 text-xs font-bold transition-colors ${taxRegime === 'new' ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:bg-white/5'}`}
                    >
                      New Tax Regime
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 relative z-10">
                  <div className="bg-[#121212] border border-white/10 px-4 py-3 rounded">
                    <div className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Max Investment</div>
                    <div className="text-xl font-medium text-white">₹1,50,000</div>
                  </div>
                  {taxRegime === 'old' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded">
                      <div className="text-[9px] text-emerald-400 uppercase tracking-widest mb-1">Max Savings (30% Slab + 4% Cess)</div>
                      <div className="text-xl font-medium text-emerald-400 font-bold">₹46,800</div>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded">
                      <div className="text-[9px] text-red-400 uppercase tracking-widest mb-1">Max Savings</div>
                      <div className="text-xl font-medium text-red-400 font-bold">₹0</div>
                      <div className="text-[10px] text-red-400/80 mt-1 max-w-[200px]">80C deductions are not permitted under the New Tax Regime.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="glass-panel p-6 shadow-xl flex gap-4 items-start">
                <div className="mt-1 text-primary"><Clock size={20} /></div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">3-Year Lock-in</h3>
                  <p className="text-xs text-white/50">Your capital cannot be withdrawn for 3 years, enforcing long-term discipline.</p>
                </div>
              </div>
              <div className="glass-panel p-6 shadow-xl flex gap-4 items-start">
                <div className="mt-1 text-primary"><PieChart size={20} /></div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Equity Exposure</h3>
                  <p className="text-xs text-white/50">Creates wealth through stock market participation, unlike PF or FD.</p>
                </div>
              </div>
              <div className="glass-panel p-6 shadow-xl flex gap-4 items-start">
                <div className="mt-1 text-primary"><Landmark size={20} /></div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">EET Taxation</h3>
                  <p className="text-xs text-white/50">Exempt at investment, Exempt accumulation, but Taxable on withdrawal (LTCG).</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-serif italic text-on-surface mb-6">Top-Rated ELSS Funds</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elssFunds.map((fund, index) => (
              <FadeUp key={fund.code} delay={0.1 * index}>
                <Link href={`/fund/${fund.code}/`} className="block h-full">
                  <div className="glass-panel p-6 shadow-xl hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer h-full flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/40 block mb-2">{fund.category}</span>
                          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2">
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
                    
                    <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-white/5">
                      <div>
                        <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">3Y CAGR</div>
                        <div className="text-sm font-medium text-white">{fund.cagr_3yr ? `${fund.cagr_3yr.toFixed(1)}%` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">5Y CAGR</div>
                        <div className="text-sm font-medium text-emerald-400 font-bold">{fund.cagr_5yr ? `${fund.cagr_5yr.toFixed(1)}%` : '-'}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Expense Ratio</div>
                      <div className="text-sm font-medium text-white">{(fund as any).expense_ratio ? `${(fund as any).expense_ratio}%` : '-'}</div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'calculator' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="glass-panel p-8 shadow-2xl">
                <h2 className="text-xl font-semibold text-on-surface mb-8 flex items-center gap-2 border-b border-white/10 pb-4">
                  <FileText className="text-[#F27D26]" size={20} />
                  Investment Details
                </h2>

                <div className="space-y-8">
                  {/* Fund Type Toggle */}
                  <div>
                    <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-3 block">Fund Category</label>
                    <div className="flex bg-[#121212] border border-white/10 rounded overflow-hidden">
                      <button 
                        onClick={() => setIsEquity(true)}
                        className={`flex-1 py-2 text-xs font-bold transition-colors ${isEquity ? 'bg-[#F27D26]/20 text-[#F27D26]' : 'text-white/40 hover:bg-white/5'}`}
                      >
                        Equity Funds
                      </button>
                      <button 
                        onClick={() => setIsEquity(false)}
                        className={`flex-1 py-2 text-xs font-bold transition-colors ${!isEquity ? 'bg-blue-500/20 text-blue-400' : 'text-white/40 hover:bg-white/5'}`}
                      >
                        Debt / Others
                      </button>
                    </div>
                    <p className="text-[9px] text-white/40 mt-2">
                      {isEquity ? "Gains > ₹1.25L taxed at 12.5% (LTCG)" : "Taxed at applicable income tax slab (regardless of holding period)"}
                    </p>
                  </div>

                  {!isEquity && (
                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}}>
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Your Income Slab</label>
                        <span className="text-xl font-medium text-white">{debtTaxSlab}%</span>
                      </div>
                      <select 
                        value={debtTaxSlab} 
                        onChange={(e) => setDebtTaxSlab(Number(e.target.value))}
                        className="w-full bg-[#121212] border border-white/10 rounded p-2 text-white text-sm"
                      >
                        <option value={10}>10% Slab</option>
                        <option value={20}>20% Slab</option>
                        <option value={30}>30% Slab</option>
                      </select>
                    </motion.div>
                  )}

                  {/* Investment Amount */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Investment Amount</label>
                      <span className="text-xl font-medium text-white">{formatCurrency(principal)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="10000" max="10000000" step="10000" 
                      value={principal} 
                      onChange={(e) => setPrincipal(Number(e.target.value))}
                      className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                    />
                  </div>

                  {/* Years */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Holding Period</label>
                      <span className="text-xl font-medium text-white">{years} Years</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" max="30" step="0.5" 
                      value={years} 
                      onChange={(e) => setYears(Number(e.target.value))}
                      className={`w-full h-px bg-white/20 appearance-none accent-white ${!isEquity ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                      disabled={!isEquity}
                    />
                    {years < 1 && isEquity && (
                      <p className="text-[9px] text-[#F27D26] mt-2 font-mono flex items-center gap-1">
                        <AlertTriangle size={10} /> Short-Term holding implies 20% flat tax
                      </p>
                    )}
                    {!isEquity && (
                      <p className="text-[9px] text-blue-400 mt-2 font-mono flex items-center gap-1">
                        <AlertTriangle size={10} /> Holding period does not affect tax rate for debt funds purchased post-April 2023.
                      </p>
                    )}
                  </div>

                  {/* Return */}
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60">Expected Return</label>
                      <span className="text-xl font-medium text-white">{expectedReturn}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" max="30" step="0.5" 
                      value={expectedReturn} 
                      onChange={(e) => setExpectedReturn(Number(e.target.value))}
                      className="w-full h-px bg-white/20 appearance-none cursor-pointer accent-white" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 shadow-2xl">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Pre-Tax Return (Gross CAGR)</div>
                  <div className="text-3xl font-medium text-white">{expectedReturn.toFixed(1)}%</div>
                  <div className="text-[10px] text-white/40 font-mono mt-1">Nominal performance</div>
                </div>
                <div className="glass-panel p-6 shadow-2xl relative overflow-hidden">
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#F27D26] mb-2">Post-Tax Return (Net CAGR)</div>
                  <div className="text-4xl font-medium text-[#F27D26]">{taxResults.postTaxCagr.toFixed(2)}%</div>
                  <div className="text-[10px] text-[#F27D26]/60 font-mono mt-1 tracking-widest uppercase">Actual Take-Home Return</div>
                  <div className="absolute top-0 right-0 w-12 h-12 bg-[#F27D26]/10 rounded-bl-full"></div>
                </div>
              </div>

              <div className="glass-panel p-8 shadow-2xl flex-grow">
                <h3 className="text-xl font-semibold text-white mb-6 border-b border-white/10 pb-4">Capital Gains Breakdown</h3>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-white/60">Final Corpus Value</span>
                    <span className="text-lg font-mono text-white">{formatCurrency(taxResults.netValue + taxResults.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-white/60">Total Profit (Gross Gain)</span>
                    <span className="text-lg font-mono text-emerald-400">+{formatCurrency(taxResults.grossGain)}</span>
                  </div>
                  
                  {isEquity && years >= 1 && (
                    <div className="flex justify-between items-center py-2 bg-white/5 px-4 rounded border border-white/10">
                      <div>
                        <span className="text-sm text-white/80 block">Tax Exemption</span>
                        <span className="text-[9px] text-white/40">First ₹1,25,000 of LTCG is tax-free</span>
                      </div>
                      <span className="text-sm font-mono text-white">-₹1,25,000</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-white/60">Taxable Gain</span>
                    <span className="text-lg font-mono text-white">{formatCurrency(taxResults.taxableGain)}</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-t border-white/10">
                    <div>
                      <span className="text-sm text-white font-semibold block">Estimated Tax Due</span>
                      <span className="text-[10px] text-red-400 font-mono">{taxResults.taxType} @ {(taxResults.taxRate * 100).toFixed(1)}%</span>
                    </div>
                    <span className="text-2xl font-bold font-mono text-red-400">-{formatCurrency(taxResults.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center py-6 border-t border-white/20 bg-gradient-to-r from-transparent to-[#F27D26]/5 rounded px-4">
                    <span className="text-lg text-white font-bold">Net Profit (Take-Home)</span>
                    <span className="text-3xl font-bold font-mono text-[#F27D26]">{formatCurrency(taxResults.netGain)}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'comparison' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel p-6 shadow-2xl">
              <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">Avg Pre-Tax Equity Return</div>
              <div className="text-3xl font-medium text-white">{taxEfficiency.equityGross.toFixed(2)}%</div>
            </div>
            <div className="glass-panel p-6 shadow-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
              <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-emerald-400 mb-2">Avg Post-Tax Equity Yield</div>
              <div className="text-4xl font-medium text-emerald-400">{taxEfficiency.equityNet.toFixed(2)}%</div>
              <div className="text-[9px] text-emerald-400/60 mt-1">Assuming 5Y hold, 12.5% LTCG</div>
            </div>
            <div className="glass-panel p-6 shadow-2xl border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
              <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-blue-400 mb-2">Avg Post-Tax Debt Yield</div>
              <div className="text-4xl font-medium text-blue-400">{taxEfficiency.debtNet.toFixed(2)}%</div>
              <div className="text-[9px] text-blue-400/60 mt-1 flex justify-between items-center w-full">
                <span>Assuming 5Y hold, slab tax</span>
                <select 
                  value={debtTaxSlab} 
                  onChange={(e) => setDebtTaxSlab(Number(e.target.value))}
                  className="bg-transparent border-none outline-none text-blue-400 font-bold cursor-pointer"
                >
                  <option className="bg-[#121212]" value={10}>10% Slab</option>
                  <option className="bg-[#121212]" value={20}>20% Slab</option>
                  <option className="bg-[#121212]" value={30}>30% Slab</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel shadow-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Fund Name</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Category</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Pre-Tax 5Y CAGR</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Applied Tax</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-[#F27D26] font-bold text-right">Post-Tax 5Y CAGR</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Tax Drag</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <tr key={row.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <Link href={`/fund/${row.code}/`} className="font-medium text-white/90 text-sm hover:text-[#F27D26] transition-colors truncate block max-w-[250px]">
                        {row.name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className={`text-xs font-mono px-2 py-1 inline-flex rounded ${row.isEquity ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {row.sub_category}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-sm font-medium text-white">{row.grossReturn.toFixed(2)}%</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-[10px] text-white/60 font-mono">{row.taxRateLabel}</div>
                    </td>
                    <td className="p-4 text-right bg-[#F27D26]/5">
                      <div className="text-sm font-bold text-[#F27D26]">{row.netReturn.toFixed(2)}%</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-[11px] font-mono text-red-400 flex items-center justify-end gap-1">
                        <TrendingDown size={12} />
                        -{row.taxDrag.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

    </main>
  );
}
