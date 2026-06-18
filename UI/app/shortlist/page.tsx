'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Plus, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import fundData from '@/lib/compact-data.json';

export default function ShortlistPage() {
  // Filter only Buy (A) and Strong Buy (S) funds
  const recommendedFunds = (fundData.funds || []).filter(f => 
    f.score_grade && (f.score_grade.startsWith('S') || f.score_grade.startsWith('A'))
  );

  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('fundscope_shortlist');
      if (saved) {
        setPortfolio(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load shortlist', e);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('fundscope_shortlist', JSON.stringify(portfolio));
    }
  }, [portfolio, isMounted]);

  const addToPortfolio = (fund: any) => {
    if (!portfolio.find(f => f.code === fund.code)) {
      setPortfolio([...portfolio, fund]);
    }
  };

  const removeFromPortfolio = (code: string) => {
    setPortfolio(portfolio.filter(f => f.code !== code));
  };

  // Calculate portfolio metrics
  const avgCagr = portfolio.length > 0 
    ? portfolio.reduce((acc, f) => acc + (f.cagr_5yr || 0), 0) / portfolio.length 
    : 0;

  return (
    <main className="flex-grow pt-[100px] px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full pb-stack-lg min-h-screen">
      <div className="mb-stack-lg">
        <span className="text-[10px] font-mono tracking-widest text-[#F27D26] uppercase mb-4 block">Curated Selection</span>
        <h1 className="text-5xl md:text-7xl font-serif italic text-on-surface mb-4 tracking-tighter">Shortlist</h1>
        <p className="text-base text-on-surface-variant max-w-2xl font-light">
          Only the highest-graded funds (Strong Buy & Buy) make it to this list. Build a mock portfolio below to simulate blended expected returns.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Funds Table */}
        <div className="xl:col-span-8 glass-panel p-6 shadow-2xl rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Fund</th>
                  <th className="py-4 px-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal">Category</th>
                  <th className="py-4 px-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal text-right">Grade</th>
                  <th className="py-4 px-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal text-right">5Y CAGR</th>
                  <th className="py-4 px-2 text-[10px] uppercase tracking-[0.2em] text-white/40 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recommendedFunds.map((fund, i) => {
                  const gradeLetter = fund.score_grade.split(' - ')[0];
                  const isInPortfolio = portfolio.some(f => f.code === fund.code);
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={fund.code} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-4 px-2">
                        <Link href={`/fund/${fund.code}/`} className="font-medium text-on-surface hover:text-primary transition-colors">
                          {fund.name.split(' - ')[0]}
                        </Link>
                      </td>
                      <td className="py-4 px-2 text-[10px] uppercase tracking-widest text-white/60">{(fund as any).sub_category || fund.category}</td>
                      <td className={`py-4 px-2 text-right font-medium font-bold ${gradeLetter === 'S' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {gradeLetter}
                      </td>
                      <td className="py-4 px-2 text-right text-primary font-medium">
                        {fund.cagr_5yr !== null ? `${fund.cagr_5yr.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button 
                          onClick={() => addToPortfolio(fund)}
                          disabled={isInPortfolio}
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center transition-all ${
                            isInPortfolio 
                              ? 'bg-white/10 text-white/30 cursor-not-allowed' 
                              : 'bg-primary/20 text-primary hover:bg-primary hover:text-black'
                          }`}
                        >
                          {isInPortfolio ? <ShieldCheck size={14} /> : <Plus size={14} />}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Portfolio Builder Panel */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 shadow-2xl rounded-xl sticky top-28">
            <h3 className="text-xl font-semibold text-on-surface mb-6">Portfolio Builder</h3>
            
            {portfolio.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-lg bg-black/20">
                <ShieldCheck size={32} className="text-white/20 mb-3" />
                <p className="text-sm text-white/40 font-light text-center px-4">
                  Add funds from the shortlist to build a mock portfolio.
                </p>
              </div>
            ) : !isMounted ? null : (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Blended 5Y Expected Return</span>
                  <span className="text-3xl font-medium text-primary">{avgCagr.toFixed(2)}%</span>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {portfolio.map(fund => (
                    <div key={fund.code} className="flex justify-between items-center bg-black/40 p-3 rounded border border-white/5">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-xs font-medium text-white truncate">{fund.name.split(' - ')[0]}</p>
                        <p className="text-[9px] uppercase text-white/40 mt-1">{fund.cagr_5yr?.toFixed(2)}% CAGR</p>
                      </div>
                      <button 
                        onClick={() => removeFromPortfolio(fund.code)}
                        className="text-white/20 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                <Link 
                  href="/sip" 
                  className="mt-4 w-full bg-primary text-black py-3 rounded flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-primary-container transition-colors"
                >
                  Analyze in SIP <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
