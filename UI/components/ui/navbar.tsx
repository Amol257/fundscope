'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, Search, Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion, useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { MagneticButton } from '@/components/ui/MagneticButton';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  const categories = [
    {
      name: 'Analyze',
      links: [
        { name: 'Dashboard', path: '/explorer', desc: 'Explore mutual funds database' },
        { name: 'Screener', path: '/screener', desc: 'Filter funds by your preferences' },
        { name: 'Compare', path: '/compare', desc: 'Side-by-side fund comparison' },
        { name: 'Benchmarks', path: '/benchmarks', desc: 'Track benchmark index performance' },
        { name: 'Insights', path: '/insights', desc: 'Market intelligence & analytics' }
      ]
    },
    {
      name: 'Plan & Tax',
      links: [
        { name: 'SIP Planner', path: '/sip', desc: 'Simulate systemic investment growth' },
        { name: 'Goal Planner', path: '/goals', desc: 'Map out targets and future goals' },
        { name: 'Tax Saver', path: '/tax', desc: 'Optimize ELSS fund planning' }
      ]
    },
    {
      name: 'My Portfolio',
      links: [
        { name: 'Portfolio Tracker', path: '/portfolio', desc: 'Track your live mutual fund holdings' },
        { name: 'Shortlist', path: '/shortlist', desc: 'Bookmarked and watched funds' },
        { name: 'Risk Profile', path: '/risk-profile', desc: 'Find your risk tolerance score' }
      ]
    }
  ];

  const toggleMobileCategory = (cat: string) => {
    setMobileExpanded(mobileExpanded === cat ? null : cat);
  };

  return (
    <motion.header 
      variants={{
        visible: { y: 0 },
        hidden: { y: '-100%' }
      }}
      animate={(isMounted && shouldReduceMotion) || isMobileMenuOpen ? 'visible' : hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent border-transparent'}`}
    >
      <div className="flex justify-between items-center px-4 md:px-8 h-20 w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 relative z-10 group">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary transition-transform group-hover:scale-110">
            <TrendingUp size={20} className="font-bold" />
          </div>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">FundScope</div>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center">
          {categories.map((category) => {
            const hasActiveLink = category.links.some(link => 
              pathname === link.path || (link.path !== '/' && pathname?.startsWith(link.path))
            );
            return (
              <div 
                key={category.name}
                className="relative py-4"
                onMouseEnter={() => setActiveDropdown(category.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button 
                  className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors cursor-pointer ${hasActiveLink ? 'text-primary' : 'text-on-surface/60 hover:text-on-surface'}`}
                >
                  {category.name}
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === category.name ? 'rotate-180 text-primary' : 'text-white/40'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {activeDropdown === category.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, x: '-50%' }}
                      exit={{ opacity: 0, y: 10, x: '-50%' }}
                      transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                      style={{ transformOrigin: 'top center' }}
                      className="absolute left-1/2 mt-3 w-80 glass-panel bg-[#090b14]/95 backdrop-blur-lg border border-white/10 p-5 shadow-2xl rounded-2xl z-50 flex flex-col gap-1"
                    >
                      {category.links.map((link) => {
                        const isActive = pathname === link.path || (link.path !== '/' && pathname?.startsWith(link.path));
                        return (
                          <Link 
                            key={link.path} 
                            href={link.path}
                            className="group flex flex-col gap-1 hover:bg-white/5 p-3 rounded-lg transition-all"
                          >
                            <span className={`text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${isActive ? 'text-primary' : 'text-white/90 group-hover:text-primary'}`}>
                              {link.name}
                            </span>
                            <span className="text-[10px] text-white/40 leading-relaxed font-light font-sans">
                              {link.desc}
                            </span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-4 relative z-50">
          <Link href="/screener" className="hidden md:flex text-on-surface-variant hover:text-primary transition-all duration-200 p-2 cursor-pointer">
            <Search size={20} />
          </Link>
          <div className="hidden md:block">
            <Link href="/risk-profile" passHref>
              <MagneticButton className="bg-primary text-on-primary px-6 py-2.5 rounded hover:bg-primary-container transition-all text-[11px] font-bold tracking-[0.2em] uppercase cursor-pointer">
                Get Started
              </MagneticButton>
            </Link>
          </div>
          <button 
            className="text-on-surface-variant hover:text-primary transition-all duration-200 p-2 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-background border-b border-white/10 px-4 py-4 flex flex-col gap-2 shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            {categories.map((category) => (
              <div key={category.name} className="border-b border-white/5 pb-2">
                <button
                  onClick={() => toggleMobileCategory(category.name)}
                  className="w-full text-left flex justify-between items-center py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase text-on-surface opacity-80"
                >
                  {category.name}
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileExpanded === category.name ? 'rotate-180 text-primary' : 'text-white/40'}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {mobileExpanded === category.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pl-4 flex flex-col gap-2 mt-2 pb-2 overflow-hidden"
                    >
                      {category.links.map((link) => {
                        const isActive = pathname === link.path || (link.path !== '/' && pathname?.startsWith(link.path));
                        return (
                          <Link 
                            key={link.path} 
                            href={link.path} 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`text-[10px] font-bold tracking-[0.15em] uppercase py-2.5 ${isActive ? 'text-primary' : 'text-white/60'}`}
                          >
                            {link.name}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            <Link 
              href="/risk-profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[11px] font-bold tracking-[0.2em] uppercase py-3 text-primary border-b border-white/5"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
