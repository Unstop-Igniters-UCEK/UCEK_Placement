import React from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import OrangeBlackGradient from '../components/OrangeBlackGradient';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans relative overflow-hidden flex items-center justify-center p-6 selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* ── Background Layer: Canvas PixelBlast / Orange Black Gradient ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <OrangeBlackGradient />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      </div>

      {/* ── Hero Centerpiece Only ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center space-y-6 max-w-3xl mx-auto"
      >
        {/* Eyebrow Chip */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-inner">
          <Wrench className="w-3.5 h-3.5 text-orange-400" />
          <span>Scheduled Platform Enhancement</span>
          <span className="text-zinc-600">•</span>
          <span className="text-orange-400 font-bold">System Upgrade</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight font-heading leading-[1.1]">
          We're Upgrading <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
            Your Placement Engine
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-400 font-sans leading-relaxed max-w-2xl mx-auto">
          The Impulse Placement Suite is currently undergoing a planned system optimization to deploy faster AI resume evaluation, updated mock test banks, and enhanced mentorship capabilities.
        </p>
      </motion.div>

    </div>
  );
}
