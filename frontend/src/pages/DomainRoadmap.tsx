import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Compass,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Code2,
  ExternalLink,
  Clock,
  BookOpen,
  Sparkles,
  Award
} from 'lucide-react';

export const DomainRoadmap: React.FC = () => {
  const { roadmaps, toggleMilestone, user } = useApp();

  const [selectedDomainId, setSelectedDomainId] = useState<string>('swe');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    swe_mod_1: true,
    swe_mod_2: true,
    swe_mod_3: true,
    ds_mod_1: true,
    elec_mod_1: true,
    ui_mod_1: true,
    vlsi_mod_1: true,
    dev_mod_1: true,
    mgmt_mod_1: true
  });

  const activeRoadmap = roadmaps.find(r => r.id === selectedDomainId) || roadmaps[0];

  let totalMilestones = 0;
  let completedMilestones = 0;
  activeRoadmap.modules.forEach(m => {
    m.milestones.forEach(ms => {
      totalMilestones++;
      if (ms.completed) completedMilestones++;
    });
  });

  const completionPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const toggleModuleAccordion = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, transform: 'translateY(10px) scale(0.99)' },
    visible: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      className="space-y-6 py-4 font-sans max-w-7xl mx-auto transform-gpu"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER CARD */}
      <motion.div variants={itemVariants} className="mono-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400">
              <Compass className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Domain Skill Trees & Roadmaps
            </h1>
            <p className="text-xs text-zinc-400">
              Personalized learning progression for <span className="text-white font-bold">{activeRoadmap.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl font-mono">
            <div className="text-right">
              <div className="text-xs text-zinc-400">Total Completion</div>
              <div className="text-xl font-extrabold text-orange-400">{completionPct}%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
              {completedMilestones}/{totalMilestones}
            </div>
          </div>
        </div>

        {/* DOMAIN SWITCHER TABS */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80">
          {roadmaps.map(rm => (
            <button
              key={rm.id}
              onClick={() => setSelectedDomainId(rm.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedDomainId === rm.id
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {rm.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* MODULES TIMELINE */}
      <div className="space-y-4">
        {activeRoadmap.modules.map((mod, modIdx) => {
          const isExpanded = expandedModules[mod.id] ?? true;
          const modDone = mod.milestones.filter(m => m.completed).length;
          const modTotal = mod.milestones.length;
          const modPct = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0;

          return (
            <motion.div
              key={mod.id}
              variants={itemVariants}
              className="mono-card overflow-hidden"
            >
              {/* MODULE HEADER ACCORDION TRIGGER */}
              <div
                onClick={() => toggleModuleAccordion(mod.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/40 transition-colors border-b border-zinc-800/60"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-orange-400">
                    0{modIdx + 1}
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white font-heading">{mod.title}</h2>
                    <p className="text-xs text-zinc-400 font-mono">Level: {mod.level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-mono">
                    <span className="text-zinc-400">{modDone}/{modTotal} Completed</span>
                    <div className="w-20 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${modPct}%` }} />
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                </div>
              </div>

              {/* MODULE MILESTONES LIST */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                    className="p-5 space-y-3 bg-zinc-950/40"
                  >
                    {mod.milestones.map(ms => (
                      <div
                        key={ms.id}
                        onClick={() => toggleMilestone(activeRoadmap.id, mod.id, ms.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          ms.completed
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-zinc-200'
                            : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button className="mt-0.5 shrink-0 text-emerald-400">
                            {ms.completed ? (
                              <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                            )}
                          </button>
                          <div>
                            <h4 className={`text-xs font-bold font-sans ${ms.completed ? 'line-through text-zinc-400' : 'text-white'}`}>
                              {ms.title}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{ms.description}</p>
                          </div>
                        </div>

                        {ms.resources && ms.resources.length > 0 && (
                          <span className="shrink-0 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                            {ms.resources.length} Resources
                          </span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
