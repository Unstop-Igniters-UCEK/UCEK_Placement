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
import { AuthModal } from './components/AuthModal';
import ShapeGrid from './components/ShapeGrid';
import ClickSpark from './components/ClickSpark';
import DotGrid from './components/DotGrid';
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
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Feed Lenis scroll progress into Framer Motion's spring progress bar
    lenis.on('scroll', ({ progress }: { progress: number }) => {
      scrollProgress.set(progress);
    });

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
  }, []);

  // ── Instant scroll-to-top on tab switch ──────────────────────────────────────
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [activeTab]);

  return (
    <>
      {/* Framer Motion Spring Scroll Progress Indicator Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#F97316] via-amber-500 to-amber-300 z-50 origin-left pointer-events-none"
        style={{ scaleX }}
      />

      <AuthModal />
      <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-primary)] flex flex-col font-sans overflow-x-hidden relative">
        {/* Persistent Transparent Header — hidden on admin view (sidebar handles nav) */}
        {activeTab !== 'admin' && <Header />}

        {/* Main Content Area */}
        {!user ? (
          <main className="flex-1 w-full relative z-10">
            <LandingPage />
          </main>
        ) : (
          <>
            {/* Dashboard Background ShapeGrid Layer */}
            <div
              className="fixed inset-0 z-0 opacity-100 overflow-hidden transform-gpu pointer-events-none"
              style={{ transform: 'translateZ(0)' }}
            >
              <ShapeGrid 
                speed={0.1}
                size={51}
                direction="right"
                borderColor="rgba(255, 255, 255, 0.12)"
                hoverColor="#F97316"
                hoverFillColor="#F97316"
                shape="triangle"
                hoverTrailAmount={0}
              />
            </div>



            <main className={`flex-1 w-full mx-auto relative z-10 ${
              activeTab === 'admin' ? 'max-w-none p-0' : 'max-w-[1600px] p-4 sm:p-6 lg:p-8'
            }`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, transform: 'translateY(8px) scale(0.988)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                  exit={{ opacity: 0, transform: 'translateY(-4px) scale(0.992)' }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full transform-gpu"
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="w-full backdrop-blur-md bg-black/40 border-t border-white/10 py-4 text-xs font-mono transition-all relative z-20"
        >
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 text-center">
            <span className="font-bold text-zinc-300 tracking-[0.2em] uppercase text-[11px] font-mono">
              Unstop Igniters Club UCEK
            </span>
          </div>
        </motion.footer>
      </div>
    </>
  );
}

export default App;
