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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const navLinks = [
    { name: 'Dashboard', path: '/explorer' },
    { name: 'Screener', path: '/screener' },
    { name: 'SIP', path: '/sip' },
    { name: 'Goals', path: '/goals' },
    { name: 'Tax', path: '/tax' },
    { name: 'Benchmarks', path: '/benchmarks' },
    { name: 'Compare', path: '/compare' },
    { name: 'Insights', path: '/insights' },
    { name: 'Shortlist', path: '/shortlist' }
  ];

  return (
    <motion.header 
      variants={{
        visible: { y: 0 },
        hidden: { y: '-100%' }
      }}
      animate={(isMounted && shouldReduceMotion) ? 'visible' : hidden ? 'hidden' : 'visible'}
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
        
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.path || (link.path !== '/' && pathname?.startsWith(link.path));
            return (
              <Link 
                key={link.path} 
                href={link.path} 
                className="relative py-2 group"
              >
                <span className={`relative z-10 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors ${isActive ? 'text-primary' : 'text-on-surface/60 group-hover:text-on-surface'}`}>
                  {link.name}
                </span>
                {isActive && isMounted && !shouldReduceMotion && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
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
            className="md:hidden bg-background border-b border-white/10 px-4 py-4 flex flex-col gap-4 shadow-2xl overflow-hidden"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path !== '/' && pathname?.startsWith(link.path));
              return (
                <Link 
                  key={link.path} 
                  href={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-[11px] font-bold tracking-[0.2em] uppercase py-2 border-b border-white/5 ${isActive ? 'text-primary' : 'text-on-surface opacity-70'}`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link 
              href="/risk-profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[11px] font-bold tracking-[0.2em] uppercase py-2 text-primary"
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
