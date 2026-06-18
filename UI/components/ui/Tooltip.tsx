'use client';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface-container-high border border-white/10 px-4 py-3 text-[11px] text-on-surface-variant leading-relaxed z-50 pointer-events-none"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-surface-container-high" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
