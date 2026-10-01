import React, { useEffect, useState, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

type SplashPhase = 
  | 'black'       // Step 1: Pitch black screen
  | 'reveal'      // Step 2: Logo reveals from bottom to top
  | 'typing'      // Step 3: "Impulse" types in left-to-right
  | 'pause'       // Step 3.5: Brief pause after typing
  | 'zooming'     // Step 4: Zoom into the white logo artwork
  | 'fade_out'    // Step 5: Pure white smoothly reveals existing landing page
  | 'done';       // Unmount cleanly

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<SplashPhase>('black');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  };

  useEffect(() => {
    // 1. Accessibility: Detect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsReducedMotion(true);
      // Fast path for reduced motion: show logo briefly, quick fade out (~750ms total)
      const t1 = setTimeout(() => setPhase('fade_out'), 500);
      const t2 = setTimeout(() => {
        setPhase('done');
        handleFinish();
      }, 750);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // 2. Standard Cinematic Sequence
    // Step 1: Black intro (~150ms)
    const tReveal = setTimeout(() => {
      setPhase('reveal');
    }, 150);

    // Step 2: Logo reveal bottom -> top (~1050ms duration, starts at 150ms -> finishes at 1200ms)
    const tTyping = setTimeout(() => {
      setPhase('typing');
    }, 1200);

    // Step 3: Impulse typing (~550ms duration, finishes at 1750ms)
    const tPause = setTimeout(() => {
      setPhase('pause');
    }, 1750);

    // Pause briefly (~220ms pause, finishes at 1970ms)
    const tZooming = setTimeout(() => {
      setPhase('zooming');
    }, 1970);

    // Step 4: Zoom through white logo (~880ms duration, finishes at 2850ms)
    const tFadeOut = setTimeout(() => {
      setPhase('fade_out');
    }, 2850);

    // Step 5: Transition into Landing Page (~380ms white fade, finishes at 3230ms)
    const tDone = setTimeout(() => {
      setPhase('done');
      handleFinish();
    }, 3230);

    // Safety fallback: ensure splash never hangs indefinitely under any circumstances
    const tSafety = setTimeout(() => {
      handleFinish();
    }, 4500);

    return () => {
      clearTimeout(tReveal);
      clearTimeout(tTyping);
      clearTimeout(tPause);
      clearTimeout(tZooming);
      clearTimeout(tFadeOut);
      clearTimeout(tDone);
      clearTimeout(tSafety);
    };
  }, []);

  if (phase === 'done') {
    return null;
  }

  // Derive visual states based on phase
  const isLogoRevealed = phase !== 'black';
  const isTypingActive = phase === 'typing' || phase === 'pause' || phase === 'zooming' || phase === 'fade_out';
  const isZoomingActive = phase === 'zooming' || phase === 'fade_out';
  const isFadingToLanding = phase === 'fade_out';

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-350 ${
        isFadingToLanding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#000000',
      }}
      aria-hidden="true"
    >
      {/* Centered Splash Container */}
      <div className="relative flex flex-col items-center justify-center">
        
        {/* LOGO WRAPPER: Bottom-to-Top Reveal & Cinematic Zoom */}
        <div
          className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 flex items-center justify-center will-change-transform will-change-[clip-path]"
          style={{
            transformOrigin: '50% 48%', // Center of the white cap and stair artwork
            transform: isZoomingActive ? 'scale(50)' : 'scale(1)',
            transition: isReducedMotion
              ? 'none'
              : isZoomingActive
              ? 'transform 880ms cubic-bezier(0.65, 0, 0.35, 1)'
              : 'none',
          }}
        >
          <img
            src="/splash_logo.png"
            alt="Impulse"
            className="w-full h-full object-contain pointer-events-none"
            style={{
              // Reveal progressively from bottom of the stairs upward to the hat
              // inset(100% 0% 0% 0%) hides the top 100%, leaving nothing visible.
              // As top inset recedes to 0%, the bottom steps appear first, then middle, then cap!
              clipPath: isReducedMotion
                ? 'inset(0% 0% 0% 0%)'
                : isLogoRevealed
                ? 'inset(0% 0% 0% 0%)'
                : 'inset(100% 0% 0% 0%)',
              transition: isReducedMotion
                ? 'none'
                : isLogoRevealed
                ? 'clip-path 1050ms cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
            }}
          />
        </div>

        {/* "Impulse" TYPOGRAPHY: Smooth left-to-right typing effect */}
        <div
          className="relative mt-5 sm:mt-7 flex items-center justify-center will-change-transform will-change-[opacity]"
          style={{
            transform: isZoomingActive ? 'scale(0.85) translateY(12px)' : 'scale(1) translateY(0px)',
            opacity: isZoomingActive ? 0 : 1,
            transition: isReducedMotion
              ? 'none'
              : isZoomingActive
              ? 'transform 400ms ease-in, opacity 320ms ease-out'
              : 'none',
          }}
        >
          <div className="relative inline-flex items-center">
            <div
              className="overflow-hidden whitespace-nowrap"
              style={{
                width: isReducedMotion ? 'auto' : isTypingActive ? '100%' : '0%',
                transition: isReducedMotion
                  ? 'none'
                  : isTypingActive
                  ? 'width 550ms cubic-bezier(0.25, 1, 0.5, 1)'
                  : 'none',
              }}
            >
              <span
                className="text-2xl sm:text-3xl md:text-4xl text-white font-normal tracking-tight block"
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                }}
              >
                Impulse
              </span>
            </div>

            {/* Subtle clean typing caret at the leading edge while typing */}
            {phase === 'typing' && !isReducedMotion && (
              <span
                className="inline-block w-[2px] h-6 sm:h-7 bg-white shrink-0 ml-0.5 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                style={{ verticalAlign: 'middle' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* WHITE EXPANSION OVERLAY: Seamlessly fills screen as white logo reaches camera */}
      <div
        className="fixed inset-0 pointer-events-none bg-white will-change-[opacity]"
        style={{
          opacity: isZoomingActive ? 1 : 0,
          transition: isReducedMotion
            ? 'none'
            : isZoomingActive
            ? 'opacity 350ms cubic-bezier(0.4, 0, 0.2, 1) 480ms'
            : 'none',
        }}
      />
    </div>
  );
};

export default SplashScreen;
