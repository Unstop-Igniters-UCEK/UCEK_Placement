import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export const Mentorship: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4 font-sans max-w-4xl mx-auto transform-gpu">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mono-card p-10 sm:p-14 text-center relative overflow-hidden w-full space-y-6"
      >
        {/* SUBTLE ORANGE GLOW BACKDROP */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/15 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* STATIC HEADER TEXT */}
          <div className="overflow-visible">
            <h1 
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-normal pb-2 pt-1 px-2 text-orange-400 inline-block drop-shadow-sm whitespace-nowrap"
              style={{ fontFamily: "'Syne', -apple-system, sans-serif" }}
            >
              Coming Soon!
            </h1>
          </div>

          <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed font-sans">
            Our 1-on-1 alumni mentorship matching platform is currently under active development. You'll soon be able to connect directly with senior UCEK alumni working at top tech companies.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="btn-primary py-3 px-8 text-xs font-bold rounded-full inline-flex items-center gap-2 cursor-pointer shadow-md hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 text-black" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
