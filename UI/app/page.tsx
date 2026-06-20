'use client';

import { useState, useEffect } from 'react';
import Ticker from '@/components/ui/ticker';
import { ArrowRight, ShieldCheck, BadgeCheck, TrendingUp, AlertTriangle, AreaChart } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion, Variants } from 'motion/react';
import Link from 'next/link';
import fundData from '@/lib/compact-data.json';
import { AnimatedArrowLink } from '@/components/ui/AnimatedArrowLink';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { ParallaxLayer } from '@/components/ui/motion/ParallaxLayer';
import { CountUp } from '@/components/ui/motion/CountUp';
import { TiltCard } from '@/components/ui/TiltCard';
import { useRouter } from 'next/navigation';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { FundGlobe } from '@/components/ui/FundGlobe';
import { HeatmapVisual, MomentumVisual, AnimatedGradesVisual } from '@/components/ui/FeatureCardVisuals';
import { AnimateNumber } from '@/components/ui/animated-blur-number';
import { ScrambleText } from '@/components/ui/motion/ScrambleText';
import { GsapReveal } from '@/components/ui/motion/GsapReveal';

const words1 = ['Is', 'your', 'fund'];
const words2 = ['actually', 'working?'];

const wordVariant: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -15 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { delay: 0.4 + i * 0.1, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }
  }),
};

export default function Home() {
  const funds = fundData.funds || [];
  const topFund = [...funds].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  const router = useRouter();
  
  const fundsWith5YrData = funds.filter(f => f.alpha_5yr !== null);
  const beatingFunds = fundsWith5YrData.filter(f => f.alpha_5yr > 0);
  const beatPercentage = fundsWith5YrData.length > 0 
    ? Math.round((beatingFunds.length / fundsWith5YrData.length) * 100) 
    : 23;

  const topFundName = topFund?.name?.split(' - ')[0] || 'Alpha Growth Fund';
  const topFundScore = Math.round(topFund?.score || 82);
  const topFundReturns = topFund?.cagr_3yr !== null && topFund?.cagr_3yr !== undefined ? Number(topFund.cagr_3yr).toFixed(1) : '18.4';
  const topFundAlpha = topFund?.alpha_5yr !== null && topFund?.alpha_5yr !== undefined ? Number(topFund.alpha_5yr).toFixed(1) : '-1.2';

  const [phase, setPhase] = useState<'loading' | 'reveal' | 'settle'>('loading');
  const [isMounted, setIsMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Parallax background values
  const bgY = useTransform(scrollY, [0, 800], [0, -80]);
  const bgOpacity = useTransform(scrollY, [0, 600], [0.1, 0]);
  const glowY = useTransform(scrollY, [0, 800], [0, -200]);
  const glowScale = useTransform(scrollY, [0, 800], [1, 1.4]);
  const arrowOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (shouldReduceMotion) {
      setPhase('settle');
      return;
    }
    const t1 = setTimeout(() => setPhase('reveal'), 200);
    const t2 = setTimeout(() => setPhase('settle'), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [shouldReduceMotion, isMounted]);

  const isRevealed = phase !== 'loading';
  const isSettled = phase === 'settle';
  const enableMotion = isMounted && !shouldReduceMotion;

  const orbitals = [
    { angle: 0,   delay: 0,    label: 'Sharpe 0.84', color: 'text-primary', duration: 8 },
    { angle: 120, delay: 2.5,  label: 'Alpha +9.9%', color: 'text-success-teal', duration: 12 },
    { angle: 240, delay: 5,    label: 'Score 100', color: 'text-info-blue', duration: 10 },
  ];

  return (
    <>
      <Ticker />
      
      <main className="flex-grow relative w-full flex items-center justify-center pt-16 pb-24 px-margin-mobile md:px-margin-desktop overflow-hidden">
        {/* Full-screen Video Background */}
        {/* Video Background is now handled globally in layout.tsx */}

        {/* Parallax Background Layers — on top of video */}
        {enableMotion ? (
          <>
            <motion.div
              className="absolute inset-0 z-0"
              style={{
                y: bgY,
                opacity: phase === 'loading' ? 0 : bgOpacity,
                transition: phase === 'loading' ? 'none' : 'opacity 0.8s ease',
                backgroundImage: `
                  radial-gradient(circle at center, black, transparent 80%),
                  linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
                `,
                backgroundSize: `100% 100%, 40px 40px, 40px 40px`,
              }}
            />
            
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0"
              style={{ y: glowY, scale: glowScale }}
            />
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-info-blue/10 rounded-full blur-[80px] pointer-events-none z-0"></div>
          </>
        ) : (
          <div 
            className="absolute inset-0 opacity-10 z-0" 
            style={{
              backgroundImage: `radial-gradient(circle at center, black, transparent 80%), linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: `100% 100%, 40px 40px, 40px 40px`,
            }}
          ></div>
        )}

        <div className="flex flex-col items-center justify-center gap-16 w-full max-w-7xl mx-auto relative z-10 pt-16 pb-24">
          <div className="flex flex-col gap-6 text-center items-center relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-white/10 w-fit"
            >
              <span className="w-2 h-2 rounded-full bg-success-teal animate-pulse"></span>
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-on-surface-variant">Live Market Data Active</span>
            </motion.div>
            
            <div className="relative mt-8 perspective-1000 flex flex-col items-center">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 20 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="absolute -top-8 text-[10px] font-mono tracking-widest text-primary uppercase"
              >
                Current Release
              </motion.span>
              
              <h1 
                className="leading-[0.85] font-light italic font-serif mb-8 text-on-surface text-balance"
                style={{ fontSize: 'clamp(2.25rem, 6vw, 6rem)', letterSpacing: '-0.03em' }}
              >
                <span className="flex flex-wrap justify-center items-center gap-x-3 lg:gap-x-6">
                  <motion.span
                    custom={0}
                    variants={enableMotion ? wordVariant : undefined}
                    initial={enableMotion ? "hidden" : { opacity: 1 }}
                    animate={isRevealed && enableMotion ? "visible" : { opacity: 1 }}
                  >
                    {enableMotion ? <ScrambleText text="Is" delay={400} duration={24} /> : "Is"}
                  </motion.span>
                  <motion.span
                    custom={1}
                    variants={enableMotion ? wordVariant : undefined}
                    initial={enableMotion ? "hidden" : { opacity: 1 }}
                    animate={isRevealed && enableMotion ? "visible" : { opacity: 1 }}
                  >
                    {enableMotion ? <ScrambleText text="your" delay={500} duration={24} /> : "your"}
                  </motion.span>
                  
                  {/* Inline Typographic Spell (Glassmorphic Pill) */}
                  <span className="inline-flex items-center justify-center w-20 h-9 sm:w-28 sm:h-11 md:w-36 md:h-14 rounded-full bg-gradient-to-r from-primary/20 to-info-blue/20 border border-white/10 shadow-[0_0_25px_rgba(242,125,38,0.2)] overflow-hidden relative select-none">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                    <TrendingUp size={22} className="text-[#F27D26] animate-pulse" />
                  </span>

                  <motion.span
                    custom={2}
                    variants={enableMotion ? wordVariant : undefined}
                    initial={enableMotion ? "hidden" : { opacity: 1 }}
                    animate={isRevealed && enableMotion ? "visible" : { opacity: 1 }}
                  >
                    {enableMotion ? <ScrambleText text="fund" delay={600} duration={24} /> : "fund"}
                  </motion.span>
                </span>
                <span className="flex flex-wrap justify-center items-center gap-x-3 lg:gap-x-6 not-italic font-bold tracking-[-0.04em] text-primary mt-2">
                  <motion.span
                    custom={3}
                    variants={enableMotion ? wordVariant : undefined}
                    initial={enableMotion ? "hidden" : { opacity: 1 }}
                    animate={isRevealed && enableMotion ? "visible" : { opacity: 1 }}
                  >
                    {enableMotion ? <ScrambleText text="actually" delay={700} duration={24} /> : "actually"}
                  </motion.span>
                  <motion.span
                    custom={4}
                    variants={enableMotion ? wordVariant : undefined}
                    initial={enableMotion ? "hidden" : { opacity: 1 }}
                    animate={isRevealed && enableMotion ? "visible" : { opacity: 1 }}
                  >
                    {enableMotion ? <ScrambleText text="working?" delay={800} duration={24} /> : "working?"}
                  </motion.span>
                </span>
              </h1>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: isRevealed ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="max-w-md text-lg leading-relaxed text-on-surface-variant font-light"
            >
              FundScope scores 5,800 SEBI registered funds on risk adjusted return, alpha generation, and multi horizon performance, so you stop guessing.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isRevealed ? 1 : 0, y: isRevealed ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-col sm:flex-row gap-4 mt-4 w-fit mx-auto"
            >
              <Link href="/explorer" passHref className="w-full sm:w-fit">
                <MagneticButton 
                  className="bg-primary text-on-primary px-8 py-4 rounded hover:bg-primary-container transition-all text-[11px] font-bold tracking-[0.2em] uppercase shadow flex items-center justify-center gap-2 group w-full sm:w-fit"
                >
                  Explore Funds
                  <span className="transition-transform group-hover:translate-x-1 inline-flex"><ArrowRight size={20} /></span>
                </MagneticButton>
              </Link>
              <AnimatedArrowLink href="/sip" className="bg-surface-container text-on-surface px-8 py-4 rounded hover:bg-surface-container-high transition-all text-[11px] font-bold tracking-[0.2em] uppercase shadow border border-white/10 flex items-center justify-center gap-2 w-full sm:w-fit">
                Analyze Portfolio
              </AnimatedArrowLink>
            </motion.div>
          </div>
          
          <div className="w-full h-full flex items-center justify-center relative mt-16 max-w-5xl">
            
            {/* KPI Card 1: Top Left */}
            {isSettled && enableMotion && (
              <motion.div
                className="absolute -left-10 lg:-left-20 -top-8 z-30 glass-panel p-5 opacity-90 backdrop-blur-md hidden md:flex items-center gap-4 border border-white/10 rounded-xl shadow-2xl bg-black/40"
                initial={{ opacity: 0, y: 30, x: 20 }}
                animate={{ opacity: 1, y: [0, -10, 0], x: 0 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="w-10 h-10 rounded-full bg-success-teal/20 flex items-center justify-center text-success-teal">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold font-serif italic">Live Tracking</h4>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">10,000+ Funds</p>
                </div>
              </motion.div>
            )}

            {/* KPI Card 2: Top Right */}
            {isSettled && enableMotion && (
              <motion.div
                className="absolute -right-10 lg:-right-20 -top-16 z-30 glass-panel p-5 opacity-90 backdrop-blur-md hidden md:flex items-center gap-4 border border-white/10 rounded-xl shadow-2xl bg-black/40"
                initial={{ opacity: 0, y: 20, x: -20 }}
                animate={{ opacity: 1, y: [0, 15, 0], x: 0 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="w-10 h-10 rounded-full bg-info-blue/20 flex items-center justify-center text-info-blue">
                  <AreaChart size={20} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold font-serif italic">Avg Market Return</h4>
                  <p className="text-xl text-info-blue font-light">+14.2%</p>
                </div>
              </motion.div>
            )}

            {/* KPI Card 3: Bottom Left */}
            {isSettled && enableMotion && (
              <motion.div
                className="absolute -left-16 lg:-left-28 bottom-12 z-30 glass-panel p-5 opacity-90 backdrop-blur-md hidden md:flex items-center gap-4 border border-white/10 rounded-xl shadow-2xl bg-black/40"
                initial={{ opacity: 0, y: -20, x: 20 }}
                animate={{ opacity: 1, y: [0, 12, 0], x: 0 }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold font-serif italic">Top Sector</h4>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Technology</p>
                </div>
              </motion.div>
            )}

            {/* KPI Card 4: Bottom Right */}
            {isSettled && enableMotion && (
              <motion.div
                className="absolute -right-12 lg:-right-24 bottom-4 z-30 glass-panel p-5 opacity-90 backdrop-blur-md hidden md:flex items-center gap-4 border border-white/10 rounded-xl shadow-2xl bg-black/40"
                initial={{ opacity: 0, y: -30, x: -20 }}
                animate={{ opacity: 1, y: [0, -15, 0], x: 0 }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                <div className="w-10 h-10 rounded-full bg-[#F27D26]/20 flex items-center justify-center text-[#F27D26]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-white text-sm font-bold font-serif italic">Market Volatility</h4>
                  <p className="text-xl text-[#F27D26] font-light">Low Risk</p>
                </div>
              </motion.div>
            )}

            {/* Central Dashboard Graphic */}
            <TiltCard maxTilt={2} glareEnabled className="z-20 w-full h-auto md:h-[500px] max-w-4xl mx-auto flex relative shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden border border-white/10">
              <div className="w-full h-full bg-[#050505]/80 backdrop-blur-xl relative overflow-hidden flex flex-col p-6 md:p-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-success-teal animate-pulse"></div>
                    <h3 className="text-xl md:text-2xl font-serif italic text-white tracking-wide">Latest Market Analysis</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] uppercase tracking-widest text-white/50">Live Sync</span>
                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] uppercase tracking-widest text-primary">API Active</span>
                  </div>
                </div>

                {/* Main Data Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  
                  {/* Left Column: Top Funds List */}
                  <div className="col-span-1 border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6 flex flex-col gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-2">Top 1Y Performers</span>
                    
                    {[...funds].filter(f => typeof f.cagr_1yr === 'number' && !isNaN(f.cagr_1yr)).sort((a, b) => b.cagr_1yr - a.cagr_1yr).slice(0, 4).map((fund, idx) => {
                      const isPos = fund.cagr_1yr >= 0;
                      return (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                        <span className="text-sm font-serif italic text-white/90 truncate mr-2" title={fund.name}>{fund.name.split(' - ')[0].replace(' Fund', '')}</span>
                        <span className={`text-xs font-mono font-bold whitespace-nowrap ${isPos ? 'text-success-teal' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{Number(fund.cagr_1yr).toFixed(1)}%
                        </span>
                      </div>
                    )})}
                  </div>

                  {/* Middle & Right Column: Chart & Metrics */}
                  <div className="col-span-1 md:col-span-2 flex flex-col justify-between pl-0 md:pl-2 gap-6 md:gap-0">
                    
                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Total AUM Tracked</span>
                        <span className="text-2xl font-serif italic text-white">₹45.2T</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 block mb-2">Active Funds</span>
                        <span className="text-2xl font-serif italic text-white">{funds.length.toLocaleString()}</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/10"></div>
                        <span className="text-[9px] uppercase tracking-widest text-primary block mb-2 relative z-10">Last API Sync</span>
                        <span className="text-xl font-serif italic text-white relative z-10">Just Now</span>
                      </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-48 md:h-auto md:flex-grow relative bg-black/20 rounded-xl border border-white/5 overflow-hidden flex items-end">
                      <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 40">
                        {/* Grid lines */}
                        <path d="M0 10 L 100 10 M0 20 L 100 20 M0 30 L 100 30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" fill="none" />
                        
                        {/* Main Trend Line */}
                        <motion.path 
                          animate={{ 
                            d: [
                              "M0 35 Q 10 32, 20 28 T 40 25 T 60 15 T 80 12 T 100 5",
                              "M0 36 Q 10 33, 20 26 T 40 27 T 60 17 T 80 15 T 100 7",
                              "M0 34 Q 10 30, 20 29 T 40 23 T 60 13 T 80 10 T 100 4",
                              "M0 35 Q 10 32, 20 28 T 40 25 T 60 15 T 80 12 T 100 5",
                            ] 
                          }}
                          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                          fill="none" stroke="#F27D26" strokeWidth="1.5"
                          style={{ animation: isSettled ? 'drawLine 2s ease-out 0s both' : 'none' }}
                        ></motion.path>
                        
                        {/* Gradient Fill */}
                        <motion.path 
                          animate={{ 
                            d: [
                              "M0 35 Q 10 32, 20 28 T 40 25 T 60 15 T 80 12 T 100 5 L 100 40 L 0 40 Z",
                              "M0 36 Q 10 33, 20 26 T 40 27 T 60 17 T 80 15 T 100 7 L 100 40 L 0 40 Z",
                              "M0 34 Q 10 30, 20 29 T 40 23 T 60 13 T 80 10 T 100 4 L 100 40 L 0 40 Z",
                              "M0 35 Q 10 32, 20 28 T 40 25 T 60 15 T 80 12 T 100 5 L 100 40 L 0 40 Z",
                            ] 
                          }}
                          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                          fill="url(#chart-gradient)" opacity="0.3"
                        ></motion.path>

                        {/* Live Blinking Dot at the tip */}
                        <motion.circle
                          cx="100"
                          animate={{ cy: [5, 7, 4, 5] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                          r="1.2" fill="#F27D26"
                        />
                        <motion.circle
                          cx="100"
                          animate={{ 
                            cy: [5, 7, 4, 5],
                            r: [1.2, 4, 1.2, 1.2],
                            opacity: [0.8, 0, 0.8, 0.8]
                          }}
                          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                          fill="#F27D26"
                        />
                        
                        <defs>
                          <linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#F27D26"></stop>
                            <stop offset="100%" stopColor="#F27D26" stopOpacity="0"></stop>
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] tracking-widest text-white/30 uppercase font-mono">Aggregated Market Growth (Live)</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* Scroll-Down Indicator */}
        {enableMotion && (
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
            style={{ opacity: arrowOpacity }}
          >
            <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/30">Scroll</span>
            <motion.div
              className="w-px h-16 bg-gradient-to-b from-white/30 to-transparent origin-top"
              animate={{ scaleY: [0, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </main>

      {/* Bento Grid Features & 3D Globe Section */}
      <section className="w-full max-w-7xl mx-auto pt-32 pb-24 px-margin-mobile md:px-margin-desktop relative z-10">
        <div className="mb-20 text-center">
          <h2 className="text-3xl md:text-5xl font-serif italic text-white mb-4 text-balance">Observatory Core Intelligence</h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-base md:text-lg font-light">
            Discover how FundScope transforms raw data into actionable intelligence through cutting-edge visualization and algorithmic grading.
          </p>
        </div>

        <GsapReveal className="grid grid-cols-1 md:grid-cols-3 gap-8 grid-auto-flow-dense">
          {/* WebGL 3D Globe - col-span-2, row-span-2 */}
          <div className="md:col-span-2 md:row-span-2 p-8 rounded-2xl bg-white/5 border border-white/10 glass-panel flex flex-col h-[550px] md:h-[600px] hover:border-primary/30 transition-colors group relative overflow-hidden">
            <div className="absolute top-8 left-8 z-30 max-w-xs space-y-3 pointer-events-none">
              <h3 className="text-2xl font-serif italic text-white group-hover:text-primary transition-colors">3D Data Topology</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                Explore the entire mutual fund universe as an interactive WebGL-rendered globe. Each glowing particle represents a fund, mapping out risk and reward in three dimensions.
              </p>
              <div className="text-[10px] text-primary font-mono tracking-widest uppercase pt-2">
                Drag to rotate • Scroll to zoom
              </div>
            </div>
            <div className="w-full h-full flex-grow relative pt-12">
              <FundGlobe funds={funds} />
            </div>
          </div>

          {/* Live Momentum - col-span-1, row-span-1 */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 glass-panel flex flex-col justify-between h-[270px] md:h-[285px] hover:border-primary/30 transition-colors group relative overflow-hidden">
            <div>
              <h3 className="text-xl font-serif italic mb-2 text-white group-hover:text-primary transition-colors">Live Momentum</h3>
              <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                Watch grades transition in real-time as new market data flows in. Stay ahead of trend reversals.
              </p>
            </div>
            {/* Visual */}
            <div className="w-full h-24 bg-black/20 rounded-xl overflow-hidden border border-white/5 relative flex items-end">
              <MomentumVisual />
            </div>
          </div>

          {/* Algorithmic Grading - col-span-1, row-span-1 */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 glass-panel flex flex-col justify-between h-[270px] md:h-[285px] hover:border-primary/30 transition-colors group relative overflow-hidden">
            <div>
              <h3 className="text-xl font-serif italic mb-2 text-white group-hover:text-primary transition-colors">Proprietary Grading</h3>
              <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                Proprietary multi-factor model evaluating risk-adjusted returns, volatility, and downside capture to assign objective grades.
              </p>
            </div>
            {/* Visual */}
            <div className="w-full h-24 bg-black/20 rounded-xl overflow-hidden border border-white/5 relative flex items-center justify-center">
              <AnimatedGradesVisual />
            </div>
          </div>

          {/* Unprecedented Density - col-span-3, row-span-1 */}
          <div className="md:col-span-3 p-8 rounded-2xl bg-white/5 border border-white/10 glass-panel flex flex-col md:flex-row items-center justify-between gap-8 h-auto md:h-[280px] hover:border-primary/30 transition-colors group relative overflow-hidden">
            <div className="max-w-md space-y-3">
              <h3 className="text-2xl font-serif italic text-white group-hover:text-primary transition-colors">Unprecedented Density</h3>
              <p className="text-sm text-on-surface-variant font-light leading-relaxed">
                We compress thousands of data points into visual heatmaps and momentum indicators, revealing patterns invisible in standard tables.
              </p>
            </div>
            {/* Visual */}
            <div className="w-full md:w-[60%] h-36 bg-black/20 rounded-xl overflow-hidden border border-white/5 relative flex-shrink-0">
              <HeatmapVisual />
            </div>
          </div>
        </GsapReveal>
      </section>
    </>
  );
}
