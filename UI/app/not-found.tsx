'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const basePath = '/fundscope';
      
      if (!pathname.startsWith(basePath + '/') && pathname !== basePath) {
        const ignoredPrefixes = ['/_next', '/api', '/public', '/favicon.ico'];
        const shouldRedirect = !ignoredPrefixes.some(prefix => pathname.startsWith(prefix));
        
        if (shouldRedirect) {
          let targetPath = '';
          if (pathname === '/' || pathname === '') {
            targetPath = `${basePath}/`;
          } else {
            const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
            targetPath = `${basePath}${normalizedPath}`;
          }
          window.location.replace(targetPath);
        }
      }
    }
  }, [router]);
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md"
      >
        {/* Big 404 */}
        <motion.div
          className="text-[120px] font-bold leading-none tracking-tighter font-mono-data"
          style={{
            background: 'linear-gradient(135deg, #F27D26, #d96d1f)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          404
        </motion.div>

        <h1 className="text-2xl font-semibold text-on-surface mt-2 mb-3">
          Page Not Found
        </h1>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Home size={16} />
            Go Home
          </Link>
          <Link
            href="/explorer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-medium text-sm hover:bg-surface-container-highest transition-colors border border-outline-variant"
          >
            <Search size={16} />
            Explore Funds
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
