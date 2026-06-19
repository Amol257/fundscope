'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

const VIDEO_SRC = '/fundscope/background-video.mp4';

interface VideoBackgroundProps {
  mode?: 'hero' | 'global';
}

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/' || pathname === '/fundscope' || pathname === '/fundscope/';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Explicitly enforce attributes programmatically to bypass aggressive mobile restrictions
    video.muted = true;
    video.playsInline = true;
    
    // Attempt playback immediately
    video.play().catch((err) => {
      console.warn("Autoplay was prevented by browser security policy:", err);
    });

    const handleCanPlay = () => setIsLoaded(true);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);
    
    if (video.readyState >= 2) {
      setIsLoaded(true);
    }

    // Safety fallback timer for mobile: force fade-in after 1 second
    // even if media events are deferred/throttled to keep the UI layout/overlays visible.
    const fallbackTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);

    return () => {
      clearTimeout(fallbackTimer);
      if (video) {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleCanPlay);
      }
    };
  }, []); // Run ONCE for the entire lifecycle

  return (
    <motion.div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 1.8, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <motion.video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ opacity: isHomePage ? 0.35 : 0.08 }}
        transition={{ duration: 1.5 }}
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      {/* Hardware-friendly color overlay that replaces the expensive CSS filter */}
      <div 
        className="absolute inset-0 bg-[#f27d26]/10 mix-blend-color pointer-events-none"
        style={{ opacity: isHomePage ? 0.6 : 0.2 }}
      />

      {/* Hero Overlays for Home Page */}
      <motion.div 
        animate={{ opacity: isHomePage ? 1 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(180deg, rgba(242,125,38,0.06) 0%, transparent 50%, rgba(242,125,38,0.04) 100%)',
            mixBlendMode: 'overlay',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(12,12,12,0.7)_100%)] z-[2]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0c0c0c] to-transparent z-[3]" />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#0c0c0c]/60 to-transparent z-[3]" />
      </motion.div>

      {/* Global mode faint glow */}
      <motion.div
        animate={{ opacity: isHomePage ? 0 : 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(242,125,38,0.02) 0%, transparent 60%)',
        }}
      />
    </motion.div>
  );
}
