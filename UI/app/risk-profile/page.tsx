'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ShieldCheck, Target, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import fundData from '@/lib/compact-data.json';
import { GradeTag } from '@/components/GradeTag';

export default function RiskProfilePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const questions = [
    {
      title: "What is your primary investment goal?",
      options: [
        { text: "Preserving my capital with stable, low returns", score: 1 },
        { text: "Balanced growth with moderate risk", score: 2 },
        { text: "Maximizing long-term wealth, willing to take high risks", score: 3 }
      ]
    },
    {
      title: "What is your investment time horizon?",
      options: [
        { text: "Less than 3 years", score: 1 },
        { text: "3 to 7 years", score: 2 },
        { text: "More than 7 years", score: 3 }
      ]
    },
    {
      title: "How would you react if your portfolio dropped 20% in a month?",
      options: [
        { text: "Panic and sell everything", score: 1 },
        { text: "Hold steady and wait for recovery", score: 2 },
        { text: "See it as an opportunity and buy more", score: 3 }
      ]
    }
  ];

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    if (step < questions.length) {
      setStep(step + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
  };

  const results = useMemo(() => {
    if (step < questions.length) return null;
    
    const totalScore = answers.reduce((a, b) => a + b, 0);
    
    let profile = '';
    let description = '';
    let allocation = { equity: 0, debt: 0 };
    let recommendedCategory = '';

    if (totalScore <= 4) {
      profile = 'Conservative';
      description = 'You prioritize capital protection over high returns. You prefer stable investments with minimal volatility.';
      allocation = { equity: 30, debt: 70 };
      recommendedCategory = 'Large Cap';
    } else if (totalScore <= 7) {
      profile = 'Moderate';
      description = 'You seek a balance between growth and stability. You can tolerate moderate market fluctuations for better returns.';
      allocation = { equity: 60, debt: 40 };
      recommendedCategory = 'Flexi Cap';
    } else {
      profile = 'Aggressive';
      description = 'You are focused on long-term wealth creation and are comfortable with significant market volatility to achieve higher returns.';
      allocation = { equity: 85, debt: 15 };
      recommendedCategory = 'Small Cap';
    }

    const funds = fundData.funds || [];
    // Sort by score descending and take top 3 in the recommended category
    // If not enough in category, just take top overall
    let recommendedFunds = funds
      .filter(f => (f as any).sub_category === recommendedCategory)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
      
    if (recommendedFunds.length < 3) {
      recommendedFunds = funds.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    return { profile, description, allocation, recommendedCategory, recommendedFunds };
  }, [step, answers]);

  return (
    <main className="flex-grow w-full max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg pt-28 min-h-screen flex flex-col justify-center">
      
      {step < questions.length ? (
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-panel p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase">Question {step + 1} of {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`h-1 w-8 rounded-full ${i <= step ? 'bg-primary' : 'bg-white/10'}`}></div>
              ))}
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-serif italic text-white mb-10 leading-tight relative z-10">
            {questions[step].title}
          </h2>
          
          <div className="space-y-4 relative z-10">
            {questions[step].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt.score)}
                className="w-full text-left p-5 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group flex items-center justify-between"
              >
                <span className="text-white/80 group-hover:text-white text-sm tracking-wide">{opt.text}</span>
                <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </motion.div>
      ) : results ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent pointer-events-none"></div>
          
          <div className="text-center mb-12 relative z-10">
            <span className="text-[10px] font-mono tracking-widest text-primary uppercase mb-4 block">Analysis Complete</span>
            <h2 className="text-5xl font-serif italic text-white mb-4">You are {results.profile}</h2>
            <p className="text-white/60 text-sm max-w-md mx-auto">{results.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 relative z-10">
            <div className="bg-black/30 border border-white/5 p-6 flex flex-col items-center justify-center">
              <h3 className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-6">Suggested Allocation</h3>
              <div className="w-full h-4 flex rounded-full overflow-hidden mb-4">
                <div style={{ width: `${results.allocation.equity}%` }} className="bg-[#3b82f6] h-full"></div>
                <div style={{ width: `${results.allocation.debt}%` }} className="bg-[#10b981] h-full"></div>
              </div>
              <div className="flex justify-between w-full text-xs font-mono">
                <span className="text-[#3b82f6]">{results.allocation.equity}% Equity</span>
                <span className="text-[#10b981]">{results.allocation.debt}% Debt</span>
              </div>
            </div>
            
            <div className="bg-black/30 border border-white/5 p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-[10px] font-bold tracking-widest text-white/50 uppercase mb-2">Primary Focus</h3>
              <div className="text-2xl font-serif italic text-primary mb-2">{results.recommendedCategory} Funds</div>
              <p className="text-xs text-white/40">Best suited for your risk appetite and time horizon.</p>
            </div>
          </div>

          <div className="relative z-10">
            <h3 className="text-lg font-serif italic text-white mb-6 border-b border-white/10 pb-2">Top Fund Matches for You</h3>
            <div className="space-y-4">
              {results.recommendedFunds.map((fund, i) => (
                <Link key={i} href={`/fund/${fund.code}`} className="flex border border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-4 justify-between items-center group">
                  <div>
                    <h4 className="text-white text-sm font-medium mb-1 group-hover:text-primary transition-colors">{fund.name.split(' - ')[0]}</h4>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">{(fund as any).sub_category || fund.category}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-bold text-white">{fund.cagr_5yr?.toFixed(2)}%</div>
                      <div className="text-[9px] uppercase tracking-widest text-white/40">5Y Return</div>
                    </div>
                    <GradeTag grade={fund.score_grade} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center relative z-10">
            <button onClick={reset} className="text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors border-b border-white/20 pb-1">
              Retake Assessment
            </button>
          </div>
        </motion.div>
      ) : null}
      
    </main>
  );
}
