import React from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import GradientBlinds from '../components/GradientBlinds';

export const Mentorship: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-2 sm:px-4 font-sans max-w-4xl mx-auto transform-gpu relative">
      {/* FULL-SCREEN GRADIENT BLINDS WEBGL BACKGROUND (ALL ORANGE) */}
      <div className="fixed inset-0 z-0 opacity-70 pointer-events-none overflow-hidden">
        <GradientBlinds
          gradientColors={['#F97316', '#EA580C', '#FF8C00']}
          color1="#F97316"
          color2="#F97316"
          angle={20}
          noise={0.5}
          blindCount={16}
          blindMinWidth={60}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>

      {/* SINGLE TRANSPARENT GLASSMORPHIC HERO CARD */}
      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 sm:p-14 text-center relative overflow-hidden rounded-3xl border border-white/20 bg-black/40 backdrop-blur-md shadow-2xl space-y-6"
        >
          {/* SEMI HEADING / EYEBROW BADGE (TITLE CASE "Coming Soon!") */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs sm:text-sm font-extrabold normal-case font-heading drop-shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Coming Soon!</span>
          </div>

          {/* HEADING WITH YELLOW/ORANGE GRADIENT ON MENTORSHIP */}
          <div className="space-y-3">
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight font-heading drop-shadow-md"
              style={{ fontFamily: "'Syne', -apple-system, sans-serif" }}
            >
              1-on-1 Alumni <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 drop-shadow-sm">
                Mentorship
              </span>{' '}
              Portal
            </h1>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-xl mx-auto font-sans drop-shadow-sm">
              Our 1-on-1 alumni mentorship matching platform is currently under active development. You'll soon be able to connect directly with senior UCEK alumni working at top tech companies.
            </p>
          </div>

          {/* ACTION BUTTON (WHITE PILL BUTTON) */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="py-3 px-8 rounded-full bg-white hover:bg-zinc-100 text-xs font-extrabold text-black transition-all cursor-pointer inline-flex items-center gap-2 active:scale-[0.98] shadow-xl hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 text-black" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
