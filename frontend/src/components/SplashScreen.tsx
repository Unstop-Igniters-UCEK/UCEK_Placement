import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

// 7 vertical transition panels with organic, staggered delays and tuned durations
const PANELS = [
  { delay: 0.04, duration: 0.72 },
  { delay: 0.20, duration: 0.75 },
  { delay: 0.28, duration: 0.68 },
  { delay: 0.08, duration: 0.74 },
  { delay: 0.24, duration: 0.70 },
  { delay: 0.12, duration: 0.78 },
  { delay: 0.18, duration: 0.72 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [logoRevealed, setLogoRevealed] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Prevent background scrolling while splash is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    // 1. Initial pure black screen hold (250ms)
    // 2. Logo bottom-to-top reveal (duration 900ms: 250ms -> 1150ms)
    // 3. "Impulse" appears immediately after logo reveal finishes (at 1150ms)
    // 4. Short hold (450ms: 1150ms -> 1600ms)
    // 5. Vertical panels drop transition (starts at 1600ms)
    // 6. Complete and clean unmount (2650ms)

    const revealTimer = setTimeout(() => {
      setLogoRevealed(true);
    }, 250);

    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;

    // Logo reveal finishes at 250ms + 900ms = 1150ms
    const textTimer = setTimeout(() => {
      setShowText(true);

      // Short hold after text appears (450ms)
      holdTimer = setTimeout(() => {
        setIsTransitioning(true);

        // Once the longest panel animation completes (~1050ms after isTransitioning starts)
        exitTimer = setTimeout(() => {
          onComplete();
        }, 1050);
      }, 450);
    }, 1150);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(textTimer);
      if (holdTimer) clearTimeout(holdTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden"
      role="dialog"
      aria-label="Loading Impulse"
    >
      {/* 
        STAGE 4 TRANSITION PANELS:
        Vertical black rectangles covering the viewport.
        Initially at y: 0%. When transitioning, each panel moves downward (y: 101%)
        with distinct staggered delays and smooth easing, organically revealing the landing page underneath.
      */}
      <div className="absolute inset-0 flex w-full h-full pointer-events-none overflow-hidden">
        {PANELS.map((panel, idx) => (
          <motion.div
            key={idx}
            initial={{ y: '0%' }}
            animate={isTransitioning ? { y: '101%' } : { y: '0%' }}
            transition={{
              duration: panel.duration,
              delay: panel.delay,
              ease: [0.65, 0, 0.35, 1],
            }}
            className="h-full flex-1 bg-black transform-gpu"
            style={{
              marginRight: idx < PANELS.length - 1 ? '-1px' : 0,
            }}
          />
        ))}
      </div>

      {/* 
        CENTERED LOGO & BRAND TEXT:
        Positioned in the middle of the viewport.
        Fades out softly right when the panel cascade starts.
      */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={isTransitioning ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4"
      >
        {/* 
          LOGO REVEAL CONTAINER:
          Mathematically framed to content boundaries [406..1659, 415..1579] of splash_logo.png.
          Bottom edge aligns strictly with the bottom of the staircase/steps.
          clipPath reveals from bottom to top over 0.9s.
        */}
        <div
          className="relative w-28 sm:w-32 aspect-[1253/1164] overflow-hidden"
          style={{
            clipPath: logoRevealed ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
            transition: 'clip-path 0.9s cubic-bezier(0.25, 0.1, 0.25, 1.0)',
            WebkitClipPath: logoRevealed ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
          }}
        >
          <img
            src="/splash_logo.png"
            alt="Impulse Splash Logo"
            className="select-none pointer-events-none"
            style={{
              position: 'absolute',
              width: '163.45%', // (2048 / 1253) * 100%
              height: '175.95%', // (2048 / 1164) * 100%
              left: '-32.40%', // -(406 / 1253) * 100%
              top: '-35.65%', // -(415 / 1164) * 100%
              maxWidth: 'none',
              objectFit: 'fill',
            }}
          />
        </div>

        {/* 
          BRAND TEXT "Impulse":
          Strictly 2–3px below the logo container bottom edge (which is the bottom of the staircase).
          Appears cleanly as soon as the logo reveal finishes.
        */}
        <div
          className="mt-[2.5px] text-2xl sm:text-3xl font-normal text-white tracking-tight select-none leading-none h-8 sm:h-9 flex items-center justify-center transition-opacity duration-150"
          style={{
            fontFamily: "'Poppins', sans-serif",
            opacity: showText ? 1 : 0,
          }}
        >
          Impulse
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
