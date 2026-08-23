import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { getSpeechAnalyticsApi, SpeechAnalyticsResponse } from '../lib/api';
import { TestResult } from '../types';
import {
  Award,
  ArrowRight,
  FileCheck,
  Mic,
  Users,
  CheckSquare,
  Activity,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  Calendar,
  Zap,
  TrendingUp,
  AlertCircle,
  Briefcase,
  Layers,
  BarChart3,
  Play,
  RotateCcw,
  X
} from 'lucide-react';

export const Dashboard: React.FC = React.memo(() => {
  const {
    user,
    setActiveTab,
    roadmaps,
    recentScores,
    clearTestHistory,
    mentorshipPair,
    setAuthModalOpen,
    setAuthModalMode,
    selectedTargetDrive,
    resumeData,
    mockTests
  } = useApp();

  const [driveFilter, setDriveFilter] = useState<'all' | 'Company Drive' | 'Aptitude' | 'Technical'>('all');
  const [selectedReviewResult, setSelectedReviewResult] = useState<TestResult | null>(null);
  
  // Pagination State (Limit of 3 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 3;

  useEffect(() => {
    setCurrentPage(1);
  }, [driveFilter]);

  const [speechAnalytics, setSpeechAnalytics] = useState<SpeechAnalyticsResponse>({
    wpm: 135,
    confidenceScore: 92,
    starFramework: 'Aligned',
    fillerCount: '0 Detects',
    totalEvaluations: 4,
    featuredPrompts: [
      "Tell me about a technical project challenge at UCEK and how you solved it.",
      "Why do you want to join our core engineering team?"
    ]
  });

  useEffect(() => {
    if (user) {
      getSpeechAnalyticsApi().then(data => {
        setSpeechAnalytics(data);
      }).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mono-card p-8 text-center max-w-md mx-auto space-y-6 my-20 font-sans shadow-2xl relative overflow-hidden">
        <div className="w-14 h-14 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight font-heading">
            UCEK Placement Suite
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Please sign in with your student credentials or select a persona to access your placement readiness portal.
          </p>
        </div>
        <div className="flex justify-center pt-2 relative z-10">
          <button
            onClick={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            className="btn-primary px-8 py-3 text-xs font-bold rounded-full cursor-pointer shadow-lg hover:scale-105 transition-transform"
          >
            Sign In to Portal
          </button>
        </div>
      </div>
    );
  }

  // Helper function to extract test percentage accurately
  const getTestPercentage = (s: typeof recentScores[0]) => {
    if (!s) return 0;
    if (typeof s.accuracy === 'number' && s.accuracy > 0) return s.accuracy;
    if (s.totalQuestions && s.totalQuestions > 0) return Math.round(((s.score || 0) / s.totalQuestions) * 100);
    return s.score || 0;
  };

  // 1. Aptitude Score Calculation from real submitted tests
  const aptitudeTestResults = recentScores.filter(
    s => s && ((s.category || '').toLowerCase().includes('aptitude') || (s.category || '').toLowerCase().includes('company'))
  );
  const aptitudeScore = aptitudeTestResults.length > 0
    ? Math.round(aptitudeTestResults.reduce((acc, s) => acc + getTestPercentage(s), 0) / aptitudeTestResults.length)
    : (recentScores.length > 0 ? Math.round(recentScores.reduce((acc, s) => acc + getTestPercentage(s), 0) / recentScores.length) : 0);

  // 2. Technical Score Calculation from real technical tests
  const technicalTestResults = recentScores.filter(
    s => s && ((s.category || '').toLowerCase().includes('technical') || (s.category || '').toLowerCase().includes('coding'))
  );
  const technicalScore = technicalTestResults.length > 0
    ? Math.round(technicalTestResults.reduce((acc, s) => acc + getTestPercentage(s), 0) / technicalTestResults.length)
    : (recentScores.length > 0 ? Math.round(recentScores.reduce((acc, s) => acc + getTestPercentage(s), 0) / recentScores.length) : 0);

  // 3. ATS Resume Score
  const atsScore = 82;

  // 4. Domain progress calculations
  const userDomain = (user?.domain || '').toLowerCase();
  const currentDomainRoadmap = (roadmaps || []).find(
    r => r && r.name && r.name.toLowerCase() === userDomain
  ) || (roadmaps || []).find(r => r && r.id === 'swe') || (roadmaps || [])[0];

  let totalTopics = 0;
  let doneTopics = 0;
  if (currentDomainRoadmap && Array.isArray(currentDomainRoadmap.modules)) {
    currentDomainRoadmap.modules.forEach(m => {
      if (m && Array.isArray(m.milestones)) {
        m.milestones.forEach(ms => {
          totalTopics++;
          if (ms && ms.completed) doneTopics++;
        });
      }
    });
  }
  const domainPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 6;

  // Real Composite Readiness Score (35% Aptitude + 35% Technical + 20% ATS + 10% Roadmap)
  const calculatedReadinessScore = recentScores.length > 0
    ? Math.round((0.35 * aptitudeScore) + (0.35 * technicalScore) + (0.20 * atsScore) + (0.10 * domainPct))
    : Math.round((0.20 * atsScore) + (0.10 * domainPct));

  const score = Math.min(100, Math.max(0, calculatedReadinessScore));

  const testsTaken = recentScores.length;
  const testsPassed = recentScores.filter(s => s && s.passed).length;

  const filteredScores = [...recentScores].reverse().filter(s => {
    if (!s) return false;
    if (driveFilter === 'all') return true;
    return s.category === driveFilter;
  });

  // Pagination calculation logic
  const totalPages = Math.ceil(filteredScores.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedScores = filteredScores.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12, willChange: 'transform, opacity' },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] }
    }
  };

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 py-4 font-sans max-w-7xl mx-auto transform-gpu"
      >
        {/* 2-COLUMN ASYMMETRIC EXECUTIVE BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN: HERO COMMAND CENTER + 3 PILLARS + HISTORY TABLE (8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* EXECUTIVE HERO COMMAND CENTER (NAKED HEADER) */}
            <motion.div variants={itemVariants} className="py-1 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                
                {/* Profile Brief & Target Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono-badge">
                      <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
                      Batch {user.year} • {user.branch}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-zinc-400 tracking-wide">Welcome Back,</span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading mt-0.5 flex items-center gap-3">
                      {user.name}
                    </h1>
                    
                    {/* MOTIVATIONAL QUOTE */}
                    <p className="text-xs sm:text-sm text-zinc-300/90 leading-snug font-normal max-w-xl md:max-w-2xl tracking-normal italic border-l-2 border-orange-500/70 pl-3.5 my-2 line-clamp-2">
                      “Success in placement comes from relentless consistency. Every roadmap milestone cleared and mock drive completed brings you closer to your dream engineering role.”
                    </p>
                  </div>

                  {/* Target Drive, Domain Badge & Quick Action Links */}
                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2a2e2f] border border-white/10 text-xs text-zinc-300">
                      <Layers className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Domain:</span>
                      <strong className="text-white font-semibold">{user.domain}</strong>
                    </div>

                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2a2e2f] border border-white/10 text-xs text-zinc-300">
                      <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                      <span>Target Drive:</span>
                      <strong className="text-white font-semibold">{selectedTargetDrive}</strong>
                    </div>
                  </div>
                </div>

                {/* READINESS INDEX MULTI-METRIC RADIAL HUB */}
                <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-[#2a2e2f] border border-white/10 rounded-2xl w-full sm:w-44 space-y-2.5 relative">
                  <div className="absolute top-2 right-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  </div>
                  
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="#F97316"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={263.8}
                        strokeDashoffset={263.8 - (263.8 * score) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 850ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-white font-heading tracking-tight">{score}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400">READINESS</span>
                    </div>
                  </div>
                  {/* Sub-breakdown Mini Stats */}
                  <div className="w-full grid grid-cols-3 gap-1 pt-1 border-t border-white/10 text-[10px] text-center">
                    <div>
                      <span className="text-zinc-400 block font-medium">Apt</span>
                      <span className="font-bold text-white">{aptitudeScore}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-medium">Tech</span>
                      <span className="font-bold text-white">{technicalScore}%</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block font-medium">ATS</span>
                      <span className="font-bold text-orange-400">{atsScore}%</span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* 3 PREPARATION BENTO PILLARS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* PILLAR 1: DOMAIN ROADMAP */}
              <motion.div
                variants={itemVariants}
                onClick={() => setActiveTab('roadmap')}
                className="mono-card p-3.5 space-y-2.5 cursor-pointer mono-card-hover group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <span className="mono-badge rounded-full text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">
                    {domainPct}% Done
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-heading group-hover:text-orange-400 transition-colors flex items-center justify-between">
                    Domain Roadmap
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                  </h3>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="w-full bg-zinc-900/90 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                      style={{ width: `${domainPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium block text-right">Active: Microservices Arch</span>
                </div>
              </motion.div>

              {/* PILLAR 2: AI RESUME SUITE */}
              <motion.div
                variants={itemVariants}
                onClick={() => setActiveTab('resumes')}
                className="mono-card p-3.5 space-y-2.5 cursor-pointer mono-card-hover group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <FileCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="mono-badge rounded-full text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold">
                    82% ATS Match
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-heading group-hover:text-orange-400 transition-colors flex items-center justify-between">
                    AI Resume Suite
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                  </h3>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="w-full bg-zinc-900/90 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                      style={{ width: '82%' }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium block text-right">2 missing keywords flagged</span>
                </div>
              </motion.div>

              {/* PILLAR 3: MOCK DRIVE PRACTICE */}
              <motion.div
                variants={itemVariants}
                onClick={() => setActiveTab('tests')}
                className="mono-card p-3.5 space-y-2.5 cursor-pointer mono-card-hover group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <CheckSquare className="w-4 h-4 text-white" />
                  </div>
                  <span className="mono-badge rounded-full text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">
                    {testsPassed}/{testsTaken} Cleared
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-heading group-hover:text-orange-400 transition-colors flex items-center justify-between">
                    Mock Drive Practice
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                  </h3>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="w-full bg-zinc-900/90 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                      style={{ width: `${testsTaken > 0 ? (testsPassed/testsTaken)*100 : 80}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium block text-right">Avg Accuracy: 74%</span>
                </div>
              </motion.div>

            </div>

            {/* RECENT MOCK DRIVE PERFORMANCES TABLE */}
            <motion.div variants={itemVariants} className="mono-card p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                    <h2 className="font-bold text-base text-white font-heading">Recent Mock Drive Performances</h2>
                  </div>
                  <p className="text-xs text-zinc-400">Review past assessment analytics and company cut-off clearances</p>
                </div>

                {/* FILTER TABS & CTA INLINE ON THE RIGHT */}
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
                  <div className="flex items-center bg-[#2a2e2f] p-1 rounded-full border border-white/10 text-xs">
                    {(['all', 'Company Drive', 'Aptitude', 'Technical'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDriveFilter(tab)}
                        className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer active:scale-[0.97] ${
                          driveFilter === tab
                            ? 'bg-[#000000] text-white shadow-sm font-semibold border border-white/10'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {tab === 'all' ? 'All Drives' : tab.replace(' Drive', '')}
                      </button>
                    ))}
                  </div>

                  {recentScores.length > 0 && (
                    <button
                      type="button"
                      onClick={clearTestHistory}
                      className="px-3 py-1.5 rounded-full bg-[#141414] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-all text-xs font-medium cursor-pointer"
                      title="Clear past test attempt history"
                    >
                      Clear History
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('tests')}
                    className="btn-primary py-2 px-4 text-xs font-bold rounded-full cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    Take New Drive
                  </button>
                </div>
              </div>

              {filteredScores.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-[#141414] border border-white/10 rounded-lg">
                  <Activity className="w-9 h-9 text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-400">No mock test sessions found for this filter.</p>
                  <button
                    onClick={() => setDriveFilter('all')}
                    className="text-xs text-orange-400 hover:underline font-medium"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-white/10 rounded-lg bg-[#0d0d0d] shadow-inner">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="bg-[#000000] border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          <th className="p-4 pl-5">Drive Title</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Score</th>
                          <th className="p-4">Accuracy</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 pr-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-xs text-white">
                        {paginatedScores.map((res, idx) => {
                          if (!res) return null;
                          const resIdStr = String(res.id || idx);
                          const resTitleStr = String(res.testTitle || 'Mock Assessment Drive');
                          const resCategoryStr = String(res.category || 'Company Drive');
                          const resAccuracy = res.accuracy ?? 0;

                          return (
                            <tr key={resIdStr} className="hover:bg-[#141414] transition-colors group">
                              <td className="p-4 pl-5 font-bold text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#000000] border border-white/10 text-orange-400 flex items-center justify-center shrink-0">
                                  <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="block font-semibold group-hover:text-orange-400 transition-colors">{resTitleStr}</span>
                                  <span className="text-[10px] text-zinc-500 font-mono">Attempt ID: #{resIdStr.slice(0, 6)}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="mono-badge rounded-full px-3 py-1 bg-[#141414] border border-white/10 text-zinc-200 text-[11px] font-medium">
                                  {resCategoryStr}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-zinc-200">
                                {res.score ?? 0} / {res.totalQuestions ?? 0}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-[#000000] rounded-full h-1.5 overflow-hidden border border-white/10">
                                    <div
                                      className="bg-orange-500 h-full rounded-full"
                                      style={{ width: `${resAccuracy}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-orange-400 text-xs">{resAccuracy}%</span>
                                </div>
                              </td>
                              <td className="p-4">
                                {resTitleStr.includes('DISQUALIFIED') ? (
                                  <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-rose-400" /> DISQUALIFIED
                                  </span>
                                ) : res.passed ? (
                                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> PASSED
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold inline-flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> RETRY
                                  </span>
                                )}
                              </td>
                              <td className="p-4 pr-5 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedReviewResult(res);
                                  }}
                                  className="px-3.5 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] border border-white/10 text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 active:scale-[0.97]"
                                >
                                  Review
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION BAR (Limit: 3 per page) */}
                  {filteredScores.length > ITEMS_PER_PAGE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0d0d0d] border border-white/10 text-xs font-sans">
                      <div className="text-zinc-400 text-xs">
                        Showing <strong className="text-white font-mono">{startIndex + 1}</strong> - <strong className="text-white font-mono">{Math.min(startIndex + ITEMS_PER_PAGE, filteredScores.length)}</strong> / <strong className="text-white font-mono">{filteredScores.length}</strong> drives
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={safeCurrentPage === 1}
                          className="px-3.5 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-[0.97]"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Prev</span>
                        </button>

                        <div className="flex items-center gap-1 px-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                safeCurrentPage === pageNum
                                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                                  : 'bg-[#141414] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/10'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={safeCurrentPage === totalPages}
                          className="px-3.5 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-[0.97]"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

          </div>

          {/* RIGHT COLUMN: PRO AI HR SPEECH SIMULATOR SIDEBAR CONSOLE (4 COLUMNS) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* HR SPEECH SIMULATOR MODULE */}
            <motion.div variants={itemVariants} className="mono-card p-5 sm:p-6 space-y-5 relative overflow-hidden">
              <div className="space-y-5 relative z-10">
                
                {/* Voice Engine Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-center shadow-inner">
                      <Mic className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-white font-heading">HR Speech Simulator</h2>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Practice behavioral & STAR framework questions with real-time speech pace, confidence level, and filler word detection.
                </p>

                {/* LIVE ANALYTICS METRICS 2 METRICS GRID */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-1.5 hover:border-white/20 transition-all">
                    <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Pace</span>
                    <div className="flex items-baseline justify-between">
                      <span className="font-extrabold text-white text-base">{speechAnalytics.wpm} <span className="text-[10px] text-zinc-400 font-normal font-mono">WPM</span></span>
                      <span className="text-[9px] text-emerald-400 font-semibold hidden sm:inline">120-150</span>
                    </div>
                    <div className="w-full bg-[#000000] rounded-full h-1 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-1.5 hover:border-white/20 transition-all">
                    <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Fillers</span>
                    <span className="font-bold text-zinc-200 text-base block">{speechAnalytics.fillerCount}</span>
                    <span className="text-[9px] text-emerald-400 block font-medium">Optimal</span>
                  </div>
                </div>

                {/* QUICK PRACTICE PROMPTS CAROUSEL */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <span>Featured Practice Prompts</span>
                    <span className="text-orange-400 font-mono font-semibold">RECOMMENDED</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {speechAnalytics.featuredPrompts.map((promptText, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-[#2a2e2f] border border-white/10 text-zinc-200 hover:border-orange-500/40 transition-all cursor-pointer group flex items-start gap-2.5 active:scale-[0.98]"
                      >
                        <div className="w-5 h-5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                          <Play className="w-2.5 h-2.5 fill-orange-400" />
                        </div>
                        <p className="text-xs leading-relaxed text-zinc-300 group-hover:text-white transition-colors">
                          "{promptText}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* START PRACTICE ACTION BUTTON */}
              <div className="pt-3 border-t border-white/10 relative z-10">
                <button
                  onClick={() => setActiveTab('interview')}
                  className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Mic className="w-4 h-4 text-black animate-pulse" />
                  <span>Start Practice</span>
                </button>
              </div>

            </motion.div>

          </div>

        </div>
      </motion.div>

      {/* TEST DETAILS REVIEW POPUP MODAL */}
      {createPortal(
        <AnimatePresence>
          {selectedReviewResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans overflow-hidden"
              data-lenis-prevent="true"
              onClick={() => setSelectedReviewResult(null)}
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mono-card p-6 max-w-3xl w-full max-h-[88vh] overflow-y-auto custom-scrollbar relative space-y-6 shadow-2xl border border-white/10 bg-[#0d0d0d]"
              onClick={e => e.stopPropagation()}
            >
              {/* MODAL HEADER */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="mono-badge text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 border-orange-500/20">
                        {selectedReviewResult.category || 'Company Drive'}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Attempt #{String(selectedReviewResult.id || '').slice(0, 8)}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white font-heading mt-1">
                      {selectedReviewResult.testTitle || 'Mock Assessment Drive'}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReviewResult(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* PERFORMANCE BENTO METRICS GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Card 1: Status */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Status</span>
                  <div>
                    {String(selectedReviewResult.testTitle || '').includes('DISQUALIFIED') ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" /> Disqualified
                      </span>
                    ) : selectedReviewResult.passed ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Retry
                      </span>
                    )}
                  </div>
                </div>

                {/* Card 2: Score */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Score</span>
                  <span className="font-extrabold text-white text-base block font-heading">
                    {selectedReviewResult.score ?? 0} <span className="text-xs text-zinc-400 font-normal">/ {selectedReviewResult.totalQuestions ?? 0}</span>
                  </span>
                </div>

                {/* Card 3: Accuracy */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Accuracy</span>
                  <span className="font-extrabold text-orange-400 text-base block font-heading">
                    {selectedReviewResult.accuracy ?? 0}%
                  </span>
                </div>

                {/* Card 4: Date */}
                <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10 space-y-1">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">Date Attempted</span>
                  <span className="font-semibold text-zinc-200 text-xs block font-mono">
                    {selectedReviewResult.date || 'Today'}
                  </span>
                </div>
              </div>

              {/* DETAILED QUESTION BREAKDOWN & ANSWERS */}
              {(() => {
                const selTitleLower = String(selectedReviewResult.testTitle || '').toLowerCase();
                const matchingTest = (mockTests || []).find(
                  t => t && (t.id === selectedReviewResult.testId || (t.title && t.title.toLowerCase() === selTitleLower))
                ) || mockTests[0];

                const questionsList = matchingTest?.questions || [];

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-orange-400" />
                        Detailed Question Analysis & Explanations
                      </h3>
                      <span className="text-[10px] text-zinc-400 font-mono">{questionsList.length} Questions</span>
                    </div>

                    {questionsList.length > 0 ? (
                      <div className="space-y-4">
                        {questionsList.map((q, idx) => {
                          const userSelectedOpt = selectedReviewResult.userAnswers?.[q.id] ?? selectedReviewResult.userAnswers?.[`q${idx + 1}`];
                          const isCorrect = userSelectedOpt === q.correctOption;

                          return (
                            <div key={q.id || idx} className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white font-mono">Q{idx + 1}.</span>
                                    <span className="mono-badge text-[10px] py-0.5 px-2 bg-zinc-900 border-white/10 text-zinc-300">
                                      {q.type}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 capitalize font-mono">[{q.difficulty}]</span>
                                  </div>
                                  <p className="text-xs text-zinc-200 font-medium leading-relaxed">
                                    {q.title}
                                  </p>
                                </div>

                                <div className="shrink-0">
                                  {userSelectedOpt !== undefined ? (
                                    isCorrect ? (
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Correct
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                                        <X className="w-3 h-3 text-rose-400" /> Incorrect
                                      </span>
                                    )
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 text-[10px] font-bold">
                                      Completed
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* OPTIONS LIST */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {q.options.map((optionText, optIdx) => {
                                  const isThisCorrect = optIdx === q.correctOption;
                                  const isThisUserSelected = optIdx === userSelectedOpt;

                                  let optStyle = "bg-[#0d0d0d] border-white/5 text-zinc-300";
                                  if (isThisCorrect) {
                                    optStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold";
                                  } else if (isThisUserSelected && !isThisCorrect) {
                                    optStyle = "bg-rose-500/10 border-rose-500/40 text-rose-300 font-medium";
                                  }

                                  return (
                                    <div
                                      key={optIdx}
                                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${optStyle}`}
                                    >
                                      <span className="leading-snug">{optionText}</span>
                                      {isThisCorrect && (
                                        <span className="text-[10px] font-bold text-emerald-400 shrink-0 font-mono">✓ Correct</span>
                                      )}
                                      {isThisUserSelected && !isThisCorrect && (
                                        <span className="text-[10px] font-bold text-rose-400 shrink-0 font-mono">✗ Your Choice</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* EXPLANATION */}
                              {q.explanation && (
                                <div className="p-3 rounded-lg bg-[#0d0d0d] border border-orange-500/20 text-xs text-zinc-300 space-y-1">
                                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block font-mono">Explanation</span>
                                  <p className="text-zinc-300 leading-relaxed">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl bg-[#141414] border border-white/10 text-center space-y-2">
                        <p className="text-xs text-zinc-300">Detailed question log preview for this assessment drive.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 gap-3">
                <button
                  onClick={() => setSelectedReviewResult(null)}
                  className="px-5 py-2.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Close Review
                </button>

                <button
                  onClick={() => {
                    setSelectedReviewResult(null);
                    setActiveTab('tests');
                  }}
                  className="btn-primary py-2.5 px-6 text-xs font-bold rounded-full cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-black" />
                  <span>Retake Drive in Mock Suite</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
});

export default Dashboard;
