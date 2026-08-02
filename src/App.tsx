import React, { useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { DomainRoadmap } from './pages/DomainRoadmap';
import { AIResumeSuite } from './pages/AIResumeSuite';
import { MockTests } from './pages/MockTests';
import { HRInterviewSimulator } from './pages/HRInterviewSimulator';
import { Mentorship } from './pages/Mentorship';
import { AdminPanel } from './pages/AdminPanel';
import Aurora from './components/Aurora';
import ClickSpark from './components/ClickSpark';
import PixelBlast from './components/PixelBlast';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Lenis from 'lenis';

export function App() {
  const { activeTab, user } = useApp();
  const lenisRef = useRef<Lenis | null>(null);

  // Manual scroll progress for the top progress bar (driven by Lenis events)
  const scrollProgress = useMotionValue(0);
  const scaleX = useSpring(scrollProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // ── Lenis smooth scroll initialisation ───────────────────────────────────────
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      // Expo-out easing — snappy start, buttery deceleration
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.8,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Feed Lenis scroll progress into Framer Motion's spring progress bar
    lenis.on('scroll', ({ progress }: { progress: number }) => {
      scrollProgress.set(progress);
    });

    // Tie Lenis into the browser's native RAF — single unified frame loop
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [scrollProgress]);

  // ── Instant scroll-to-top on tab switch ──────────────────────────────────────
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [activeTab]);

  return (
    <ClickSpark
      sparkColor="#ffffff"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      {/* Framer Motion Spring Scroll Progress Indicator Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#F97316] via-white to-amber-400 z-50 origin-left pointer-events-none"
        style={{ scaleX }}
      />

      <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] flex flex-col font-sans transition-colors overflow-x-hidden relative">
        {/* Persistent Transparent Header */}
        <Header />

        {/* Main Content Area */}
        {!user ? (
          <main className="flex-1 w-full relative z-10">
            <LandingPage />
          </main>
        ) : (
          <>
            {/* Primary Fixed Aurora Background Layer */}
            <div className="fixed inset-0 w-full h-full z-0 pointer-events-none opacity-40">
              <Aurora
                colorStops={["#F97316", "#000000", "#604939"]}
                blend={0.5}
                amplitude={1.0}
                speed={1}
              />
            </div>

            {/* Secondary PixelBlast Background Layer (Placed at bottom, fades out before middle) */}
            <div
              className="fixed bottom-0 left-0 right-0 w-full h-[600px] z-0 pointer-events-none opacity-75 overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)'
              }}
            >
              <PixelBlast
                variant="triangle"
                pixelSize={5}
                color="#F97316"
                patternScale={3}
                patternDensity={1}
                pixelSizeJitter={0}
                enableRipples={false}
                rippleSpeed={0.4}
                rippleThickness={0.12}
                rippleIntensityScale={1.5}
                liquid
                liquidStrength={0.12}
                liquidRadius={1.2}
                liquidWobbleSpeed={5}
                speed={0.45}
                edgeFade={0.28}
                transparent
              />
            </div>

            <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 16, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.99 }}
                  transition={{ duration: 0.35, ease: [0.0, 0.0, 0.2, 1.0] }}
                  className="w-full"
                >
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'roadmap' && <DomainRoadmap />}
                  {activeTab === 'resumes' && <AIResumeSuite />}
                  {activeTab === 'tests' && <MockTests />}
                  {activeTab === 'interview' && <HRInterviewSimulator />}
                  {activeTab === 'mentorship' && <Mentorship />}
                  {activeTab === 'admin' && <AdminPanel />}
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}

        {/* Glassmorphic Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.0, 0.0, 0.2, 1.0] }}
          className="w-full backdrop-blur-md bg-black/40 border-t border-white/10 py-4 text-xs font-mono transition-all relative z-20"
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 text-center">
            <span className="font-bold text-zinc-300 tracking-[0.2em] uppercase text-[11px] font-mono">
              Unstop Igniters Club UCEK
            </span>
          </div>
        </motion.footer>
      </div>
    </ClickSpark>
  );
}

export default App;
