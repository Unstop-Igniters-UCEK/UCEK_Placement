import React from 'react';
import { GraduationCap, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border-glass)] bg-[#05080f] py-8 mt-16 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-200">
              Unstop Igniters • University College of Engineering Kariavattom (UCEK)
            </p>
            <p className="text-[11px] text-slate-500">
              Placement Cell & Career Development Platform © {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Live AI Speech & Mock Drive Engine Online
          </span>
          <span className="text-slate-500">|</span>
          <span className="flex items-center gap-1 text-slate-400">
            Crafted with <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" /> for UCEK Campus Recruitment
          </span>
        </div>
      </div>
    </footer>
  );
};
