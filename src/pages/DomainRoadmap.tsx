import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
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
  BookOpen
} from 'lucide-react';

const easeOut: [number, number, number, number] = [0.0, 0.0, 0.2, 1.0];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } }
};

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

  return (
    <motion.div
      className="space-y-5 py-2 font-sans"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants}>
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="#08080a"
          borderRadius={12}
          glowRadius={40}
          glowIntensity={1}
          coneSpread={25}
          animated={false}
          colors={['#c084fc', '#f472b6', '#38bdf8']}
        >
          <section className="p-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-white" />
                  <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold tracking-wider">
                    Skill Progression
                  </span>
                </div>
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Domain Skill Trees &amp; Roadmaps
                </h1>
                <p className="text-xs text-zinc-400 font-sans">
                  Personalized learning progression for{' '}
                  <span className="text-white font-bold">{activeRoadmap.name}</span>.
                </p>
              </div>

              {/* Progress mini-card */}
              <div className="p-3 rounded-sm bg-white/5 border border-white/10 min-w-[220px] space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-300 font-sans">Track Progress</span>
                  <span className="text-white font-extrabold">{completionPct}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 text-right font-sans">
                  {completedMilestones} of {totalMilestones} completed
                </p>
              </div>
            </div>
          </section>
        </BorderGlow>
      </motion.div>

      {/* DOMAIN SELECTOR */}
      <motion.div variants={itemVariants}>
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {roadmaps.map(rm => {
            const isSelected = rm.id === selectedDomainId;
            const isUserDomain = user?.domain.toLowerCase().includes(rm.name.toLowerCase().split(' ')[0]);
            return (
              <button
                key={rm.id}
                onClick={() => setSelectedDomainId(rm.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                <span>{rm.name}</span>
                {isUserDomain && (
                  <span className="px-1.5 py-0 rounded-full text-[9px] font-mono font-bold bg-white/20 text-white border border-white/20">
                    Track
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* MODULE ACCORDION STACK */}
      <div className="space-y-3">
        {activeRoadmap.modules.map((mod, modIdx) => {
          const isExpanded = !!expandedModules[mod.id];
          const modCompletedCount = mod.milestones.filter(m => m.completed).length;

          return (
            <motion.div key={mod.id} variants={itemVariants}>
              <BorderGlow
                edgeSensitivity={30}
                glowColor="40 80 80"
                backgroundColor="#08080a"
                borderRadius={12}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#c084fc', '#f472b6', '#38bdf8']}
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModuleAccordion(mod.id)}
                  className="p-4 cursor-pointer flex items-center justify-between transition-colors hover:bg-white/[0.02] select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-sm bg-white/10 border border-white/15 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {String(modIdx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-white">{mod.title}</h3>
                        <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/15 text-[9px] font-mono font-semibold text-zinc-300">
                          {mod.level}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {modCompletedCount} / {mod.milestones.length} Milestones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mini progress ring */}
                    <svg width="28" height="28" viewBox="0 0 28 28" className="shrink-0">
                      <circle cx="14" cy="14" r="11" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" fill="none"/>
                      <circle
                        cx="14" cy="14" r="11"
                        stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" fill="none"
                        strokeDasharray={69.1}
                        strokeDashoffset={69.1 * (1 - modCompletedCount / Math.max(mod.milestones.length, 1))}
                        strokeLinecap="round"
                        style={{ transformOrigin: '14px 14px', transform: 'rotate(-90deg)' }}
                      />
                    </svg>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Milestones */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-2.5 border-t border-white/[0.06]">
                        {mod.milestones.map((ms) => (
                          <div
                            key={ms.id}
                            className={`p-3 rounded-sm border transition-all ${
                              ms.completed
                                ? 'bg-white/[0.03] border-white/10'
                                : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMilestone(activeRoadmap.id, mod.id, ms.id);
                                }}
                                className="mt-0.5 transition-transform hover:scale-110 cursor-pointer"
                                title="Toggle milestone completion"
                              >
                                {ms.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <Circle className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                                )}
                              </button>

                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <h4 className={`font-bold text-xs ${ms.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                    {ms.title}
                                  </h4>
                                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-zinc-500" />
                                    ~{ms.estimatedHours} hrs
                                  </span>
                                </div>

                                <p className="text-xs text-zinc-400 leading-relaxed">{ms.description}</p>

                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {ms.keyConcepts.map((concept, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[9px] font-mono font-semibold text-zinc-300"
                                    >
                                      {concept}
                                    </span>
                                  ))}
                                </div>

                                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs border-t border-white/[0.06] mt-1">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1 font-mono">
                                    <BookOpen className="w-3 h-3 text-zinc-500" /> Links:
                                  </span>
                                  {ms.resources.map((res, rIdx) => (
                                    <a
                                      key={rIdx}
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-sm border border-white/10 transition-colors font-semibold"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {res.type === 'doc' && <FileText className="w-3 h-3 text-zinc-500" />}
                                      {res.type === 'video' && <Video className="w-3 h-3 text-zinc-500" />}
                                      {res.type === 'practice' && <Code2 className="w-3 h-3 text-zinc-500" />}
                                      <span>{res.name}</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </BorderGlow>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
