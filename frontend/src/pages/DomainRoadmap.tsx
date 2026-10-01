import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Code2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Award,
  Clock,
  Check,
  ArrowRight,
  Layers,
  Cpu
} from 'lucide-react';

interface DomainOption {
  id: string; // Supabase domain UUID
  slug: string;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Exactly the 9 approved domains aligned with database UUIDs & canonical display names
const APPROVED_DOMAINS: DomainOption[] = [
  {
    id: '6a3439d0-e59c-4dbf-b9f0-bf820e4cecc4',
    slug: 'software-engineering',
    name: 'Software Engineering',
    tagline: 'Core DSA, System Architecture, & Web Stack',
    icon: Code2,
    description: 'Master Data Structures & Algorithms, Object-Oriented Design, System Architecture, and modern full-stack web technologies.'
  },
  {
    id: 'e2edc20a-d1e3-45b2-8645-3523e30b8182',
    slug: 'backend-engineering',
    name: 'Backend Engineering',
    tagline: 'APIs, Databases, Cloud Services, & Microservices',
    icon: ExternalLink,
    description: 'Build scalable backend services, master database engineering, distributed caching, and microservice architectures.'
  },
  {
    id: '52ccb07c-a899-4438-b132-52df1498b067',
    slug: 'data-science-data-analytics',
    name: 'Data Science & Data Analytics',
    tagline: 'Python, Statistics, Exploratory Data Analysis, & BI',
    icon: Sparkles,
    description: 'Analyze real-world datasets, build statistical models, create interactive visual dashboards, and extract business insights.'
  },
  {
    id: 'a8da7026-031c-41f7-b872-562157115939',
    slug: 'ai-machine-learning',
    name: 'Artificial Intelligence & Machine Learning',
    tagline: 'Deep Learning, Neural Networks, NLP, & GenAI',
    icon: Cpu,
    description: 'Deep dive into machine learning models, neural networks, natural language processing, computer vision, and generative AI.'
  },
  {
    id: '16f667f2-5c76-4c26-ac17-953d662c17f6',
    slug: 'cybersecurity',
    name: 'Cybersecurity',
    tagline: 'Network Security, Linux, SIEM, & Incident Defense',
    icon: ShieldCheck,
    description: 'Defend enterprise infrastructure, perform threat hunting, analyze logs in a SOC, and master cloud security practices.'
  },
  {
    id: 'f3e8c86a-4360-4326-9c7c-9f72cd3989c3',
    slug: 'ui-ux',
    name: 'UI/UX & Product Design',
    tagline: 'Figma, Design Systems, Wireframing, & UX Research',
    icon: BookOpen,
    description: 'Craft user-centered interfaces, establish robust design systems, conduct usability tests, and build interactive prototypes.'
  },
  {
    id: '97bf14d8-f83c-4984-8ed8-6bd8315b9f8d',
    slug: 'graphic-design',
    name: 'Graphic Design',
    tagline: 'Visual Identity, Typography, Brand Assets, & Media',
    icon: Award,
    description: 'Create compelling visual communications, brand identities, typography guidelines, and digital marketing creative assets.'
  },
  {
    id: '70791c2b-7695-4755-83b4-c4116eee2b29',
    slug: 'video-editing',
    name: 'Video Editing',
    tagline: 'Video Production, Motion Graphics, & Audio Mastering',
    icon: Clock,
    description: 'Produce high-impact video content, master narrative pacing, color grading, sound design, and motion graphics workflows.'
  },
  {
    id: 'd33fe562-080b-4be7-a0ce-9dfc8a7be08d',
    slug: 'core-electronics-embedded-systems',
    name: 'Core Electronics & Embedded Systems',
    tagline: 'Microcontrollers, Embedded C, RTOS, & Circuit Systems',
    icon: Compass,
    description: 'Build foundational embedded software, microcontroller programming, RTOS scheduling, hardware protocols, and IoT integration.'
  }
];

type ModalStep = 'first_select' | 'first_confirmed' | 'info' | 'switch_select' | 'switch_confirmed';

export const DomainRoadmap: React.FC = React.memo(() => {
  const { user, updateUserDomain, setActiveTab } = useApp();

  const hasSelectedDomain = Boolean(user?.domain_id || (user?.hasSelectedDomain && user?.domain));
  const currentDomain = hasSelectedDomain
    ? APPROVED_DOMAINS.find(
        d =>
          (user?.domain_id && d.id === user.domain_id) ||
          (user?.domain && d.name.toLowerCase() === user.domain.toLowerCase()) ||
          (user?.domain && d.slug === user.domain.toLowerCase())
      )
    : null;

  // View state: 'first_select' for new students; 'info' for students with a domain
  const [modalStep, setModalStep] = useState<ModalStep>(hasSelectedDomain ? 'info' : 'first_select');
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync step if user domain selection state updates externally
  useEffect(() => {
    if (!hasSelectedDomain) {
      setModalStep('first_select');
      setSelectedDomainId(null);
    }
  }, [hasSelectedDomain]);

  // Handle first-time domain confirmation
  const handleFirstSelect = async () => {
    if (!selectedDomainId) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const success = await updateUserDomain(selectedDomainId);
      if (success) {
        setModalStep('first_confirmed');
      } else {
        setErrorMessage('Failed to save selected domain. Please try again.');
      }
    } catch (err: any) {
      console.error('[DomainRoadmap] First select error:', err);
      setErrorMessage(err?.message || 'Failed to save selected domain. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle domain change
  const handleSwitchSelect = async () => {
    if (!selectedDomainId) return;
    if (currentDomain && selectedDomainId === currentDomain.id) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const success = await updateUserDomain(selectedDomainId);
      if (success) {
        setModalStep('switch_confirmed');
      } else {
        setErrorMessage('Failed to update domain. Please try again.');
      }
    } catch (err: any) {
      console.error('[DomainRoadmap] Switch select error:', err);
      setErrorMessage(err?.message || 'Failed to update domain. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate to Dashboard
  const handleGotIt = () => {
    setActiveTab('dashboard');
  };

  return (
    <div className="space-y-6 py-4 font-sans max-w-7xl mx-auto min-h-[60vh] flex flex-col justify-center items-center relative">
      {/* BACKGROUND PLACEHOLDER CARD (No student roadmap rendered) */}
      <div className="w-full max-w-xl p-8 rounded-3xl bg-[#0d0d0d] border border-white/10 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
          <Layers className="w-7 h-7 text-orange-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white font-heading">Engineering Domain Pathway</h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            {hasSelectedDomain && currentDomain
              ? `Your active specialization is set to ${currentDomain.name}. Your future faculty guidance and mentorship align with this path.`
              : 'Select your primary engineering specialization path to establish faculty guidance and placement readiness.'}
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
            Domain: <strong className="text-orange-400">{hasSelectedDomain && currentDomain ? currentDomain.name : 'Not Selected'}</strong>
          </span>
        </div>
      </div>

      {/* MODAL OVERLAY IN DOCUMENT.BODY PORTAL */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="domain-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md font-sans overflow-hidden"
              data-lenis-prevent="true"
            >
              {/* ============================================================== */}
              {/* 1. FIRST SELECTION MODAL */}
              {/* ============================================================== */}
              {modalStep === 'first_select' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[min(88dvh,760px)] flex flex-col min-h-0 bg-[#000000] border border-white/15 rounded-3xl shadow-2xl text-white my-auto overflow-hidden"
                >
                  {/* HEADER (NO X/CLOSE BUTTON) */}
                  <div className="shrink-0 p-4 sm:p-5 sm:pb-4 border-b border-white/10 bg-[#000000] relative text-center space-y-1 z-20">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                      <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight font-heading">
                      Choose Your Primary Engineering Path
                    </h2>
                    <p className="text-xs text-zinc-300 leading-relaxed max-w-xl mx-auto">
                      Select your primary specialization to receive aligned faculty and mentor guidance.
                    </p>
                  </div>

                  {/* 9 APPROVED DOMAINS GRID (NOTHING PRESELECTED) */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                      {APPROVED_DOMAINS.map(dom => {
                        const IconComp = dom.icon;
                        const isSelected = selectedDomainId === dom.id;

                        return (
                          <div
                            key={dom.id}
                            onClick={() => setSelectedDomainId(dom.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group relative overflow-hidden active:scale-[0.98] ${
                              isSelected
                                ? 'bg-[#181818] border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)]'
                                : 'bg-[#0d0d0d] hover:bg-[#141414] border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner ${
                                  isSelected
                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                    : 'bg-white/5 border-white/10 text-zinc-300'
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <h3
                                className={`font-extrabold text-sm font-heading transition-colors flex items-center gap-1.5 ${
                                  isSelected ? 'text-orange-400' : 'text-white group-hover:text-orange-400'
                                }`}
                              >
                                {dom.name}
                              </h3>
                              <p className="text-[11px] text-zinc-400 font-mono leading-tight">{dom.tagline}</p>
                            </div>

                            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 pt-1 border-t border-white/5">
                              {dom.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-rose-400 text-center font-medium pt-1">{errorMessage}</p>
                    )}
                  </div>

                  {/* FOOTER ACTION */}
                  <div className="shrink-0 p-3.5 sm:p-4 border-t border-white/10 bg-[#000000] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleFirstSelect}
                      disabled={!selectedDomainId || isSaving}
                      className="btn-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span>Saving Path...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-black" />
                          <span>Confirm Domain Path</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* 2. FIRST-SELECTION CONFIRMATION POPUP */}
              {/* ============================================================== */}
              {modalStep === 'first_confirmed' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 my-auto"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                    <Check className="w-6 h-6 text-orange-400 stroke-[2.5]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white font-heading">Domain Selected</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your primary engineering domain has been selected. You’ll receive one-on-one roadmap guidance and
                      support from your designated mentor or faculty based on this path.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGotIt}
                      className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer shadow-lg"
                    >
                      Got it
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* 3. EXISTING STUDENT OPENING DOMAIN ROADMAP: DOMAIN INFO POPUP */}
              {/* ============================================================== */}
              {modalStep === 'info' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 my-auto"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                    <Layers className="w-6 h-6 text-orange-400" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white font-heading">Your Primary Domain</h3>
                    <div className="inline-block p-3 rounded-2xl bg-[#0d0d0d] border border-white/10 w-full">
                      <span className="text-xs font-bold text-orange-400 font-heading block">
                        {currentDomain ? currentDomain.name : user?.domain || 'Not Selected'}
                      </span>
                      {currentDomain && (
                        <span className="text-[11px] text-zinc-400 font-mono block mt-0.5">
                          {currentDomain.tagline}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                      You’ll receive one-on-one roadmap guidance and support from your designated mentor or faculty based on
                      this path.
                    </p>
                  </div>

                  {/* ACTION BUTTONS (NO X/CLOSE BUTTON) */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDomainId(null);
                        setErrorMessage(null);
                        setModalStep('switch_select');
                      }}
                      className="flex-1 py-2.5 px-4 text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-full cursor-pointer transition-all"
                    >
                      Switch Domain
                    </button>
                    <button
                      type="button"
                      onClick={handleGotIt}
                      className="btn-primary flex-1 py-2.5 px-4 text-xs font-bold rounded-full cursor-pointer shadow-lg"
                    >
                      Got it
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* 4. SWITCH DOMAIN: 9-DOMAIN SELECTOR */}
              {/* ============================================================== */}
              {modalStep === 'switch_select' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[min(88dvh,760px)] flex flex-col min-h-0 bg-[#000000] border border-white/15 rounded-3xl shadow-2xl text-white my-auto overflow-hidden"
                >
                  {/* HEADER (NO X/CLOSE BUTTON) */}
                  <div className="shrink-0 p-4 sm:p-5 sm:pb-4 border-b border-white/10 bg-[#000000] relative text-center space-y-1 z-20">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                      <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight font-heading">
                      Choose Your Primary Engineering Path
                    </h2>
                    <p className="text-xs text-zinc-300 leading-relaxed max-w-xl mx-auto">
                      Select a new domain specialization. Switching your domain will clear your previous progress.
                    </p>
                  </div>

                  {/* 9 APPROVED DOMAINS (CURRENT BADGE ON EXISTING DOMAIN) */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 custom-scrollbar space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                      {APPROVED_DOMAINS.map(dom => {
                        const IconComp = dom.icon;
                        const isCurrent = currentDomain ? currentDomain.id === dom.id : false;
                        const isSelected = selectedDomainId === dom.id;

                        return (
                          <div
                            key={dom.id}
                            onClick={() => {
                              if (!isCurrent) {
                                setSelectedDomainId(dom.id);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 group relative overflow-hidden ${
                              isCurrent
                                ? 'bg-[#121212] border-white/20 cursor-default opacity-85'
                                : isSelected
                                ? 'bg-[#181818] border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)] cursor-pointer active:scale-[0.98]'
                                : 'bg-[#0d0d0d] hover:bg-[#141414] border-white/10 hover:border-white/20 cursor-pointer active:scale-[0.98]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-inner ${
                                  isSelected
                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                                    : 'bg-white/5 border-white/10 text-zinc-300'
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>

                              {/* CURRENT BADGE */}
                              {isCurrent && (
                                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                                  CURRENT
                                </span>
                              )}

                              {isSelected && !isCurrent && (
                                <span className="w-5 h-5 rounded-full bg-orange-500 text-black flex items-center justify-center shrink-0">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <div className="space-y-0.5">
                              <h3
                                className={`font-extrabold text-sm font-heading transition-colors flex items-center gap-1.5 ${
                                  isSelected ? 'text-orange-400' : 'text-white group-hover:text-orange-400'
                                }`}
                              >
                                {dom.name}
                              </h3>
                              <p className="text-[11px] text-zinc-400 font-mono leading-tight">{dom.tagline}</p>
                            </div>

                            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 pt-1 border-t border-white/5">
                              {dom.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-rose-400 text-center font-medium pt-1">{errorMessage}</p>
                    )}
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="shrink-0 p-3.5 sm:p-4 border-t border-white/10 bg-[#000000] flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setModalStep('info')}
                      className="px-5 py-2.5 text-xs font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-full cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchSelect}
                      disabled={!selectedDomainId || (currentDomain && selectedDomainId === currentDomain.id) || isSaving}
                      className="btn-primary px-6 py-2.5 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span>Updating Domain...</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-black" />
                          <span>Confirm Domain Change</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ============================================================== */}
              {/* 5. DOMAIN CHANGE CONFIRMATION POPUP */}
              {/* ============================================================== */}
              {modalStep === 'switch_confirmed' && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto custom-scrollbar bg-[#000000] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 my-auto"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
                    <Check className="w-6 h-6 text-orange-400 stroke-[2.5]" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white font-heading">Domain Changed</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your primary domain has been updated. Your previous roadmap progress has been cleared, and your future
                      guidance will be based on your new domain.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleGotIt}
                      className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer shadow-lg"
                    >
                      Got it
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
});

export default DomainRoadmap;
