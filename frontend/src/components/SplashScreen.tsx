import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

// 7 vertical transition panels with organic, calibrated stagger delays and tuned drop durations
const PANELS = [
  { delay: 0.04, duration: 0.70 },
  { delay: 0.18, duration: 0.72 },
  { delay: 0.26, duration: 0.66 },
  { delay: 0.08, duration: 0.74 },
  { delay: 0.22, duration: 0.68 },
  { delay: 0.12, duration: 0.76 },
  { delay: 0.16, duration: 0.70 },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
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
    // Reduced motion fast path: brief hold and soft fade out (600ms total)
    if (shouldReduceMotion) {
      setLogoRevealed(true);
      setShowText(true);
      const reducedTimer = setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          onComplete();
        }, 220);
      }, 500);
      return () => clearTimeout(reducedTimer);
    }

    // Refined Choreography Sequence:
    // 1. Initial pure black hold (200ms)
    // 2. Logo bottom-to-top reveal (720ms duration: 200ms -> 920ms)
    // 3. "Impulse" text emerges with subtle rise (starts at 840ms with 80ms overlap, completes at 1140ms)
    // 4. Balanced hold of complete lockup (580ms: 1140ms -> 1720ms)
    // 5. Vertical panels drop cascade (starts at 1720ms)
    // 6. Complete and clean unmount (2550ms)

    const revealTimer = setTimeout(() => {
      setLogoRevealed(true);
    }, 200);

    // Text emerges slightly before logo reveal fully locks into place (anticipatory stagger)
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 840);

    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;

    holdTimer = setTimeout(() => {
      setIsTransitioning(true);

      // Once the longest panel animation completes (~830ms after isTransitioning starts)
      exitTimer = setTimeout(() => {
        onComplete();
      }, 850);
    }, 1720);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(textTimer);
      if (holdTimer) clearTimeout(holdTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [onComplete, shouldReduceMotion]);

  // Reduced motion render
  if (shouldReduceMotion) {
    return (
      <div
        className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none transition-opacity duration-200 ${
          isTransitioning ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        role="dialog"
        aria-label="Loading Impulse"
      >
        <div className="relative w-28 sm:w-32 aspect-[1253/1164] overflow-hidden">
          <img
            src="/splash_logo.png"
            alt="Impulse Splash Logo"
            className="select-none pointer-events-none"
            style={{
              position: 'absolute',
              width: '163.45%',
              height: '175.95%',
              left: '-32.40%',
              top: '-35.65%',
              maxWidth: 'none',
              objectFit: 'fill',
            }}
          />
        </div>
        <div
          className="mt-[4px] -translate-x-[4px] text-2xl sm:text-3xl font-medium text-white tracking-tight select-none leading-none h-8 sm:h-9 flex items-center justify-center"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Impulse
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-auto select-none overflow-hidden"
      role="dialog"
      aria-label="Loading Impulse"
    >
      {/* 
        STAGE 4 TRANSITION PANELS:
        Vertical black rectangles covering the viewport.
        Hardware-accelerated translateY(101%) with organic stagger delays
        and calibrated cubic-bezier(0.76, 0, 0.24, 1) curtain drop easing.
      */}
      <div className="absolute inset-0 flex w-full h-full pointer-events-none overflow-hidden">
        {PANELS.map((panel, idx) => (
          <motion.div
            key={idx}
            initial={{ transform: 'translate3d(0, 0%, 0)' }}
            animate={
              isTransitioning
                ? { transform: 'translate3d(0, 101%, 0)' }
                : { transform: 'translate3d(0, 0%, 0)' }
            }
            transition={{
              duration: panel.duration,
              delay: panel.delay,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="h-full flex-1 bg-black will-change-transform backface-hidden"
            style={{
              marginRight: idx < PANELS.length - 1 ? '-1px' : 0,
              transformOrigin: 'top center',
            }}
          />
        ))}
      </div>

      {/* 
        CENTERED LOGO & BRAND TEXT:
        Dissolves gracefully with a subtle 0.97 scale and slight lift as the curtain drops.
      */}
      <motion.div
        initial={{ opacity: 1, transform: 'scale(1) translate3d(0, 0, 0)' }}
        animate={
          isTransitioning
            ? { opacity: 0, transform: 'scale(0.97) translate3d(0, -4px, 0)' }
            : { opacity: 1, transform: 'scale(1) translate3d(0, 0, 0)' }
        }
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4 will-change-transform"
      >
        {/* 
          LOGO REVEAL CONTAINER:
          Framed strictly to the bounding box of the splash logo art.
          Smooth clipPath wipe from bottom to top with strong ease-out cubic-bezier(0.16, 1, 0.3, 1).
        */}
        <div
          className="relative w-28 sm:w-32 aspect-[1253/1164] overflow-hidden will-change-[clip-path]"
          style={{
            clipPath: logoRevealed ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)',
            transition: 'clip-path 720ms cubic-bezier(0.16, 1, 0.3, 1)',
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
          Optical alignment with logo center of mass, 4px spacing below staircase.
          Reveals with subtle upward float (4px -> 0) and smooth opacity fade.
        */}
        <div
          className="mt-[4px] -translate-x-[4px] text-2xl sm:text-3xl font-medium text-white tracking-tight select-none leading-none h-8 sm:h-9 flex items-center justify-center will-change-transform"
          style={{
            fontFamily: "'Poppins', sans-serif",
            opacity: showText ? 1 : 0,
            transform: showText ? 'translate3d(0, 0, 0)' : 'translate3d(0, 5px, 0)',
            transition: 'opacity 280ms cubic-bezier(0.23, 1, 0.32, 1), transform 280ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          Impulse
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;

