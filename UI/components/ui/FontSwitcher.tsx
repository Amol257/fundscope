'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Type, Check } from 'lucide-react';

type FontMode = 'playfair' | 'medio' | 'museum';

export default function FontSwitcher() {
  const [activeFont, setActiveFont] = useState<FontMode>('medio');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load persisted font choice
    try {
      const saved = localStorage.getItem('fundscope_font_preference') as FontMode;
      if (saved && (saved === 'playfair' || saved === 'medio' || saved === 'museum')) {
        setActiveFont(saved);
        applyFontClass(saved);
      } else {
        applyFontClass('medio');
      }
    } catch (e) {
      console.error('Failed to load font preference:', e);
      applyFontClass('medio');
    }
  }, []);

  const applyFontClass = (mode: FontMode) => {
    const root = document.documentElement;
    root.classList.remove('font-mode-playfair', 'font-mode-medio', 'font-mode-museum');
    
    if (mode === 'playfair') {
      root.classList.add('font-mode-playfair');
    } else if (mode === 'medio') {
      root.classList.add('font-mode-medio');
    } else if (mode === 'museum') {
      root.classList.add('font-mode-museum');
    }
  };

  const selectFont = (mode: FontMode) => {
    setActiveFont(mode);
    applyFontClass(mode);
    try {
      localStorage.setItem('fundscope_font_preference', mode);
    } catch (e) {
      console.error('Failed to save font preference:', e);
    }
    setIsOpen(false);
  };

  const fonts = [
    { id: 'playfair', name: 'Playfair Display', desc: 'Default Google Serif' },
    { id: 'medio', name: 'Medio Serif', desc: 'dot colon (Didone style)' },
    { id: 'museum', name: 'LT Museum', desc: 'LyonsType (Classic flare)' }
  ] as const;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-panel p-3 rounded-xl shadow-2xl border border-white/10 w-56 flex flex-col gap-1.5"
          >
            <div className="text-[9px] uppercase tracking-widest text-[#F27D26] font-bold px-2.5 py-1">
              Select Display Font
            </div>
            
            {fonts.map((f) => (
              <button
                key={f.id}
                onClick={() => selectFont(f.id)}
                className="w-full text-left flex items-center justify-between px-2.5 py-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold tracking-wide ${activeFont === f.id ? 'text-[#F27D26]' : 'text-white/80 group-hover:text-white'}`}>
                    {f.name}
                  </span>
                  <span className="text-[9px] text-white/40 font-light font-sans mt-0.5">
                    {f.desc}
                  </span>
                </div>
                {activeFont === f.id && (
                  <Check size={14} className="text-[#F27D26]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:text-primary hover:border-primary/50 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        title="Switch display font"
      >
        <Type size={18} />
      </button>
    </div>
  );
}
