'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

const VIDEO_SRC = '/background-video.mp4';

interface VideoBackgroundProps {
  mode?: 'hero' | 'global';
}

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => setIsLoaded(true);

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);
    
    if (video.readyState >= 2) setIsLoaded(true);

    let rafId: number;
    let isReversing = false;

    const playForward = () => {
      isReversing = false;
      video.play().catch(() => {});
    };

    const playBackward = () => {
      isReversing = true;
      video.pause();
      
      const stepBackward = () => {
        if (!isReversing) return;
        video.currentTime = Math.max(0, video.currentTime - 0.03);
        if (video.currentTime <= 0.1) {
          playForward();
        } else {
          rafId = setTimeout(stepBackward, 30) as unknown as number;
        }
      };
      
      rafId = setTimeout(stepBackward, 30) as unknown as number;
    };

    video.addEventListener('ended', playBackward);
    playForward();

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleCanPlay);
      video.removeEventListener('ended', playBackward);
      if (rafId) clearTimeout(rafId);
    };
  }, []); // Run ONCE for the entire lifecycle

  const videoFilter = 'sepia(0.3) hue-rotate(-10deg) saturate(1.2) brightness(1.1) contrast(1.1)';

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
        style={{ filter: videoFilter }}
        animate={{ opacity: isHomePage ? 0.35 : 0.08 }}
        transition={{ duration: 1.5 }}
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
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
