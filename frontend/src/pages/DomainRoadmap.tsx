import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Compass,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
  Award,
  RotateCcw,
  Code2,
  ExternalLink,
  Clock,
  ArrowRight,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  {
    id: 'swe',
    name: 'Software Engineering',
    tagline: 'Core DSA, System Architecture, & Web Stack',
    icon: Code2,
    color: 'from-orange-500 to-amber-500',
    description: 'Master Data Structures & Algorithms, Object-Oriented Design, System Architecture, and Modern Full-Stack Web Technologies.'
  },
  {
    id: 'ds',
    name: 'Data Science & AI',
    tagline: 'Python, Machine Learning, & Data Analytics',
    icon: Sparkles,
    color: 'from-purple-500 to-indigo-500',
    description: 'Deep dive into Machine Learning algorithms, Data Preprocessing, Feature Engineering, Neural Networks & Generative AI.'
  },
  {
    id: 'elec',
    name: 'Core Electronics & Embedded',
    tagline: 'Microcontrollers, Digital Circuits, & IoT',
    icon: Compass,
    color: 'from-blue-500 to-cyan-500',
    description: 'Build foundations in Microcontroller Programming, RTOS, Sensor Interfacing, Embedded C, and Circuit Systems.'
  },
  {
    id: 'ui',
    name: 'UI/UX & Product Design',
    tagline: 'Figma, Design Systems, & User Research',
    icon: BookOpen,
    color: 'from-pink-500 to-rose-500',
    description: 'Craft user-centric interfaces, design systems, wireframes, interactive prototypes, and usability testing workflows.'
  },
  {
    id: 'vlsi',
    name: 'VLSI & Chip Design',
    tagline: 'Verilog, ASIC Design, & FPGA Systems',
    icon: Award,
    color: 'from-emerald-500 to-teal-500',
    description: 'Understand RTL Synthesis, Verilog/SystemVerilog programming, FPGA prototyping, and Digital IC Verification.'
  },
  {
    id: 'dev',
    name: 'Cloud & DevOps',
    tagline: 'AWS, Docker, Kubernetes, & CI/CD Pipelines',
    icon: ExternalLink,
    color: 'from-amber-500 to-yellow-500',
    description: 'Deploy scaleable cloud infrastructures, container orchestration, automated CI/CD pipelines, and Infrastructure as Code.'
  },
  {
    id: 'mgmt',
    name: 'Management & Consulting',
    tagline: 'Case Studies, Financial Analysis, & Strategy',
    icon: Clock,
    color: 'from-sky-500 to-blue-600',
    description: 'Develop structured problem-solving skills, business case analysis, product management fundamentals, and corporate strategy.'
  }
];

export const DomainRoadmap: React.FC = () => {
  const { roadmaps, toggleMilestone, user, updateUserDomain } = useApp();

  const [isSelectModalOpen, setIsSelectModalOpen] = useState<boolean>(false);
  const [pendingDomain, setPendingDomain] = useState<typeof DOMAIN_OPTIONS[0] | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  // Automatically trigger Domain Selection Popup on first-time visit if user has not confirmed domain
  useEffect(() => {
    if (user && !user.hasSelectedDomain) {
      setIsSelectModalOpen(true);
    }
  }, [user]);

  const activeRoadmap = roadmaps.find(
    r => r.name.toLowerCase() === (user?.domain || '').toLowerCase() || r.id === 'swe'
  ) || roadmaps[0];

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

  const handleConfirmDomain = async () => {
    if (!pendingDomain) return;
    setIsSaving(true);
    try {
      await updateUserDomain(pendingDomain.name);
      setPendingDomain(null);
      setIsSelectModalOpen(false);
    } catch (e) {
      console.error('Failed to update domain:', e);
    } finally {
      setIsSaving(false);
    }
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
      className="space-y-6 py-4 font-sans max-w-7xl mx-auto transform-gpu relative"
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

          <div className="flex items-center gap-4 bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-2xl font-mono shrink-0">
            <div className="text-right">
              <div className="text-xs text-zinc-400">Total Completion</div>
              <div className="text-xl font-extrabold text-orange-400">{completionPct}%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-white">
              {completedMilestones}/{totalMilestones}
            </div>
          </div>
        </div>

        {/* LOCKED SINGLE DOMAIN VIEW & SWITCH BUTTON */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono">Selected Path:</span>
            <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold text-xs font-mono inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              {activeRoadmap.name}
            </span>
          </div>

          <button
            onClick={() => {
              setPendingDomain(null);
              setIsSelectModalOpen(true);
            }}
            className="px-4 py-2 rounded-full bg-[#2a2e2f] hover:bg-[#323637] border border-white/15 text-zinc-200 hover:text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95 shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
            <span>Switch Domain</span>
          </button>
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
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-orange-400">
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
                          <span className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
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

      {/* DOMAIN SELECTION & CONFIRMATION MODAL POPUP */}
      <AnimatePresence>
        {isSelectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md font-sans overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#1b1e1f] border border-white/15 rounded-3xl shadow-2xl text-white my-auto overflow-hidden"
            >
              {/* FIXED PINNED HEADER */}
              <div className="shrink-0 p-5 sm:p-6 border-b border-white/10 bg-[#1b1e1f] relative text-center space-y-1.5 z-20">
                {/* Close button if user already has a domain selected */}
                {user?.hasSelectedDomain && (
                  <button
                    onClick={() => {
                      setPendingDomain(null);
                      setIsSelectModalOpen(false);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                  {!pendingDomain ? <Compass className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5 text-orange-400" />}
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-heading">
                  {!pendingDomain ? 'Choose Your Primary Engineering Path' : 'Confirm Domain Path'}
                </h2>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-xl mx-auto">
                  {!pendingDomain
                    ? 'Select the domain you wish to specialize in. Your skill tree, roadmap milestones, and readiness index will center around this chosen path. You can switch anytime.'
                    : `Are you sure you want to lock in ${pendingDomain.name} as your primary domain?`}
                </p>
              </div>

              {/* SCROLLABLE BODY CONTAINER */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-4">
                {/* STEP 1: DOMAIN GRID SELECTION */}
                {!pendingDomain ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                    {DOMAIN_OPTIONS.map(dom => {
                      const IconComp = dom.icon;
                      const isCurrentActive = (user?.domain || '').toLowerCase() === dom.name.toLowerCase();

                      return (
                        <div
                          key={dom.id}
                          onClick={() => setPendingDomain(dom)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group relative overflow-hidden active:scale-[0.98] ${
                            isCurrentActive
                              ? 'bg-[#222627] border-orange-500/50 shadow-lg'
                              : 'bg-[#222627] hover:bg-[#282d2e] border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                              <IconComp className="w-4 h-4 text-white" />
                            </div>
                            {isCurrentActive && (
                              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-bold uppercase">
                                Current
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="font-extrabold text-sm text-white font-heading group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                              {dom.name}
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                            </h3>
                            <p className="text-[11px] text-zinc-400 font-mono leading-tight">{dom.tagline}</p>
                          </div>

                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 pt-1 border-t border-white/5">
                            {dom.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* STEP 2: CONFIRMATION STEP */
                  <div className="space-y-5 text-center max-w-md mx-auto py-2 pb-4">
                    <div className="p-4 rounded-2xl bg-[#222627] border border-white/10 text-left space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono">Included Roadmap</span>
                      <h4 className="text-sm font-bold text-white">{pendingDomain.name}</h4>
                      <p className="text-xs text-zinc-300 leading-relaxed">{pendingDomain.description}</p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        onClick={() => setPendingDomain(null)}
                        className="btn-secondary flex-1 py-3 text-xs font-bold rounded-full cursor-pointer"
                      >
                        Back to All Domains
                      </button>
                      <button
                        onClick={handleConfirmDomain}
                        disabled={isSaving}
                        className="btn-primary flex-1 py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-1.5 shadow-xl"
                      >
                        {isSaving ? (
                          <span>Saving...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-black" />
                            <span>Confirm & Unlock Path</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
