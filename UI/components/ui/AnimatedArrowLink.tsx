import { motion } from 'motion/react';
import Link from 'next/link';
import React from 'react';

export function AnimatedArrowLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-primary ${className}`}>
      <span>{children}</span>
      <motion.span
        className="inline-block"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        →
      </motion.span>
    </Link>
  );
}
