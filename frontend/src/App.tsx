import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './components/AuthModal';
import OrangeBlackGradient from './components/OrangeBlackGradient';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Lenis from 'lenis';

import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loaded page modules to reduce initial JavaScript parse time
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DomainRoadmap = lazy(() => import('./pages/DomainRoadmap'));
const AIResumeSuite = lazy(() => import('./pages/AIResumeSuite'));
const MockTests = lazy(() => import('./pages/MockTests'));
const HRInterviewSimulator = lazy(() => import('./pages/HRInterviewSimulator'));
const Mentorship = lazy(() => import('./pages/Mentorship'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

export function App() {
  const { activeTab, user, sidebarOpen } = useApp();
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
        {/* Header shown only on Landing Page / Unauthenticated */}
        {!user && <Header />}

        {/* Static Sidebar shown for Logged-In User */}
        {user && <Sidebar />}

        {/* Main Content Area */}
        {!user ? (
          <main className="flex-1 w-full relative z-10">
            <LandingPage />
          </main>
        ) : (
          <>
            {/* Dashboard 21st.dev Static Orange-Black Gradient Background Layer */}
            <div
              className={`fixed inset-0 z-0 opacity-100 overflow-hidden transform-gpu pointer-events-none transition-all duration-300 ${
                sidebarOpen ? 'pl-0 lg:pl-72' : 'pl-0'
              }`}
              style={{ transform: 'translateZ(0)' }}
            >
              <OrangeBlackGradient />
            </div>

            <main className={`flex-1 w-full relative z-10 transition-all duration-300 ${
              sidebarOpen ? 'pl-0 lg:pl-72' : 'pl-0'
            } ${
              activeTab === 'admin' ? 'p-0' : 'p-4 sm:p-6 lg:p-8'
            }`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, transform: 'translateY(8px) scale(0.988)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
                  exit={{ opacity: 0, transform: 'translateY(-4px) scale(0.992)' }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full transform-gpu max-w-[1600px] mx-auto"
                >
                  <ErrorBoundary>
                    <Suspense fallback={null}>
                      {activeTab === 'dashboard' && <Dashboard />}
                      {activeTab === 'roadmap' && <DomainRoadmap />}
                      {activeTab === 'resumes' && <AIResumeSuite />}
                      {activeTab === 'tests' && <MockTests />}
                      {activeTab === 'interview' && <HRInterviewSimulator />}
                      {activeTab === 'mentorship' && <Mentorship />}
                      {activeTab.startsWith('admin') && <AdminPanel />}
                    </Suspense>
                  </ErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className={`w-full bg-[#000000] border-t border-white/10 py-4 text-xs font-mono transition-all duration-300 relative z-20 ${
            user && sidebarOpen ? 'pl-0 lg:pl-72' : 'pl-0'
          }`}
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
