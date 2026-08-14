import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { getSpeechAnalyticsApi, SpeechAnalyticsResponse } from '../lib/api';
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
  RotateCcw
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    user,
    setActiveTab,
    roadmaps,
    recentScores,
    mentorshipPair,
    setAuthModalOpen,
    setAuthModalMode
  } = useApp();

  const [driveFilter, setDriveFilter] = useState<'all' | 'Company Drive' | 'Aptitude' | 'Technical'>('all');

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
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
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

  const score = user.readinessScore;

  // Domain progress calculations
  const currentDomainRoadmap = roadmaps.find(
    r => r.name.toLowerCase() === user.domain.toLowerCase() || r.id === 'swe'
  );
  let totalTopics = 0;
  let doneTopics = 0;
  if (currentDomainRoadmap) {
    currentDomainRoadmap.modules.forEach(m => {
      m.milestones.forEach(ms => {
        totalTopics++;
        if (ms.completed) doneTopics++;
      });
    });
  }
  const domainPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 68;

  const testsTaken = recentScores.length;
  const testsPassed = recentScores.filter(s => s.passed).length;

  const filteredScores = recentScores.filter(s => {
    if (driveFilter === 'all') return true;
    return s.category === driveFilter;
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
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
          
          {/* EXECUTIVE HERO COMMAND CENTER PANEL */}
          <motion.div variants={itemVariants} className="mono-card p-6 sm:p-8 relative overflow-hidden group">
            {/* Background Glow Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/12 blur-[100px] rounded-full pointer-events-none group-hover:bg-orange-500/18 transition-all duration-700" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              
              {/* Profile Brief & Target Info */}
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-badge">
                    <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
                    Batch {user.year} • {user.branch}
                  </span>

                  {score >= 80 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Tier 1 Placement Ready
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[11px] font-semibold text-orange-400 flex items-center gap-1.5 backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-orange-400 status-pulse-orange" />
                      Readiness In Progress
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">Welcome back,</span>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading mt-0.5 flex items-center gap-3">
                    {user.name}
                  </h1>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                  Tracking readiness for <strong className="text-white font-bold underline decoration-orange-500/50 underline-offset-4">{user.domain}</strong>. Complete roadmaps, refine STAR bullets, and practice AI HR speech simulations to maximize placement offers.
                </p>

                {/* Target Drive Badge & Quick Action Links */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-300">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Target Drive:</span>
                    <strong className="text-white font-semibold">TCS Ninja & Digital 2026</strong>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setActiveTab('resumes')}
                      className="px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-orange-400" />
                      ATS Scan
                    </button>
                    <button
                      onClick={() => setActiveTab('tests')}
                      className="px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      Quick Test
                    </button>
                  </div>
                </div>
              </div>

              {/* READINESS INDEX MULTI-METRIC RADIAL HUB */}
              <div className="shrink-0 flex flex-col items-center justify-center p-5 bg-gradient-to-b from-zinc-950/90 to-zinc-900/80 border border-zinc-800/90 rounded-lg w-full sm:w-44 space-y-3 shadow-2xl relative">
                <div className="absolute top-2 right-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                </div>
                
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Outer Glowing Ring */}
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
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-white font-heading tracking-tight">{score}%</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400">READINESS</span>
                  </div>
                </div>

                {/* Sub-breakdown Mini Stats */}
                <div className="w-full grid grid-cols-3 gap-1 pt-1 border-t border-zinc-800/80 text-[10px] text-center">
                  <div>
                    <span className="text-zinc-400 block font-medium">Apt</span>
                    <span className="font-bold text-white">85%</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Tech</span>
                    <span className="font-bold text-white">70%</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">ATS</span>
                    <span className="font-bold text-orange-400">82%</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* 3 PREPARATION BENTO PILLARS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* PILLAR 1: DOMAIN ROADMAP */}
            <motion.div
              variants={itemVariants}
              onClick={() => setActiveTab('roadmap')}
              className="mono-card p-5 space-y-4 cursor-pointer mono-card-hover group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="mono-badge text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">
                  {domainPct}% Done
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base font-heading group-hover:text-orange-400 transition-colors flex items-center justify-between">
                  Domain Roadmap
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  {doneTopics} of {totalTopics} milestones cleared in Software Engineering.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-zinc-900/90 rounded-full h-2 overflow-hidden p-0.5 border border-zinc-800">
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
              className="mono-card p-5 space-y-4 cursor-pointer mono-card-hover group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="mono-badge text-emerald-400 bg-emerald-500/10 border-emerald-500/20 font-bold">
                  82% ATS Match
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base font-heading group-hover:text-orange-400 transition-colors flex items-center justify-between">
                  AI Resume Suite
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  STAR Bullet generator & missing keyword detector.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-zinc-900/90 rounded-full h-2 overflow-hidden p-0.5 border border-zinc-800">
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
              className="mono-card p-5 space-y-4 cursor-pointer mono-card-hover group relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="mono-badge text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">
                  {testsPassed}/{testsTaken} Cleared
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base font-heading group-hover:text-orange-400 transition-colors flex items-center justify-between">
                  Mock Drive Practice
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  Timed company tests & aptitude assessment rounds.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-zinc-900/90 rounded-full h-2 overflow-hidden p-0.5 border border-zinc-800">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-400" />
                  <h2 className="font-bold text-base text-white font-heading">Recent Mock Drive Performances</h2>
                </div>
                <p className="text-xs text-zinc-400">Review past assessment analytics and company cut-off clearances</p>
              </div>

              {/* FILTER TABS & CTA */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80 text-xs">
                  {(['all', 'Company Drive', 'Aptitude', 'Technical'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDriveFilter(tab)}
                      className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                        driveFilter === tab
                          ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tab === 'all' ? 'All Drives' : tab.replace(' Drive', '')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab('tests')}
                  className="btn-primary py-2 px-4 text-xs font-bold rounded-full cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  Take New Drive
                </button>
              </div>
            </div>

            {filteredScores.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-zinc-950/40 border border-zinc-800/60 rounded-lg">
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
              <div className="overflow-x-auto border border-zinc-800/80 rounded-lg bg-zinc-950/70 shadow-inner">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-zinc-900/90 border-b border-zinc-800/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="p-4 pl-5">Drive Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Score</th>
                      <th className="p-4">Accuracy</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs text-white">
                    {filteredScores.map(res => (
                      <tr key={res.id} className="hover:bg-zinc-900/50 transition-colors group">
                        <td className="p-4 pl-5 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 text-orange-400 flex items-center justify-center shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-semibold group-hover:text-orange-400 transition-colors">{res.testTitle}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Attempt ID: #{res.id.slice(0, 6)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="mono-badge">
                            {res.category}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-zinc-200">
                          {res.score} / {res.totalQuestions}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                              <div
                                className="bg-orange-500 h-full rounded-full"
                                style={{ width: `${res.accuracy}%` }}
                              />
                            </div>
                            <span className="font-bold text-orange-400 text-xs">{res.accuracy}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {res.passed ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> PASSED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold inline-flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> RETRY
                            </span>
                          )}
                        </td>
                        <td className="p-4 pr-5 text-right">
                          <button
                            onClick={() => setActiveTab('tests')}
                            className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-300 hover:text-white transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            Review
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
          
          {/* UPCOMING CAMPUS DRIVE DEADLINES BANNER */}
          <motion.div variants={itemVariants} className="mono-card p-5 bg-gradient-to-r from-orange-500/10 via-zinc-900/90 to-zinc-900/90 border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/40">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm font-heading">Upcoming Drive: Accenture National Tech Round</h4>
                  <span className="mono-badge text-orange-400 border-orange-500/30">Registration Closes in 2 Days</span>
                </div>
                <p className="text-xs text-zinc-400">Target cut-off: 75% Aptitude + STAR HR interview clearance.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('tests')}
              className="btn-secondary text-xs px-4 py-2 shrink-0"
            >
              Verify Eligibility
            </button>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: PRO AI HR SPEECH SIMULATOR SIDEBAR CONSOLE (4 COLUMNS) */}
        <div className="lg:col-span-4 h-full flex flex-col space-y-6">
          
          {/* HR SPEECH SIMULATOR MODULE */}
          <motion.div variants={itemVariants} className="mono-card p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6 h-full relative overflow-hidden border-orange-500/20">
            {/* Ambient Background Shimmer */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="space-y-6 relative z-10">
              
              {/* Voice Engine Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-inner">
                    <Mic className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-white font-heading">HR Speech Simulator</h2>
                    <span className="text-[10px] text-zinc-400 font-mono">Real-time Audio Fluency Engine</span>
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-end gap-1 h-6 px-2 py-1 bg-zinc-950/80 rounded-md border border-zinc-800">
                  <span className="w-1 bg-orange-500 rounded-full animate-wave-1" />
                  <span className="w-1 bg-orange-400 rounded-full animate-wave-2" />
                  <span className="w-1 bg-amber-400 rounded-full animate-wave-3" />
                  <span className="w-1 bg-orange-500 rounded-full animate-wave-4" />
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Practice behavioral & STAR framework questions with real-time speech pace, confidence level, and filler word detection.
              </p>

              {/* LIVE ANALYTICS METRICS 2x2 GRID */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-md bg-zinc-950/80 border border-zinc-800/90 space-y-1 shadow-sm">
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Speech Pace</span>
                  <div className="flex items-baseline justify-between">
                    <span className="font-extrabold text-white text-base">{speechAnalytics.wpm}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">120-150 Ideal</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-md bg-zinc-950/80 border border-zinc-800/90 space-y-1 shadow-sm">
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Confidence</span>
                  <div className="flex items-baseline justify-between">
                    <span className="font-extrabold text-emerald-400 text-base">{speechAnalytics.confidenceScore}%</span>
                    <span className="text-[10px] text-zinc-400 font-mono">High</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${speechAnalytics.confidenceScore}%` }} />
                  </div>
                </div>

                <div className="p-3.5 rounded-md bg-zinc-950/80 border border-zinc-800/90 space-y-1 shadow-sm">
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">STAR Alignment</span>
                  <span className="font-bold text-orange-400 text-sm block">{speechAnalytics.starFramework}</span>
                  <span className="text-[10px] text-zinc-400 block">Situation & Action Detected</span>
                </div>

                <div className="p-3.5 rounded-md bg-zinc-950/80 border border-zinc-800/90 space-y-1 shadow-sm">
                  <span className="text-[10px] text-zinc-400 block font-medium uppercase tracking-wider">Filler Count</span>
                  <span className="font-bold text-zinc-200 text-sm block">{speechAnalytics.fillerCount}</span>
                  <span className="text-[10px] text-emerald-400 block font-medium">Optimal Clarity</span>
                </div>
              </div>

              {/* QUICK PRACTICE PROMPTS CAROUSEL */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <span>Featured Practice Prompts</span>
                  <span className="text-orange-400 font-mono">AI Recommended</span>
                </div>
                <div className="space-y-2 text-xs">
                  {speechAnalytics.featuredPrompts.map((promptText, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-md bg-zinc-950/60 border border-zinc-800/70 text-zinc-200 hover:border-orange-500/40 transition-all cursor-pointer group flex items-start gap-2.5"
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

            {/* LAUNCH SPEECH SIMULATOR ACTION BUTTON */}
            <div className="pt-4 border-t border-zinc-800/80 relative z-10">
              <button
                onClick={() => setActiveTab('interview')}
                className="btn-primary w-full py-3.5 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Mic className="w-4 h-4 text-black animate-pulse" />
                <span>Launch Speech Simulator</span>
              </button>
            </div>

          </motion.div>

          {/* ALUMNI MENTOR CONNECTOR SIDEBAR CARD */}
          <motion.div variants={itemVariants} className="mono-card p-5 space-y-3 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-zinc-800/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white font-heading">Alumni Mentorship</h3>
              </div>
              <span className="mono-badge text-emerald-400 border-emerald-500/30">Active Match</span>
            </div>

            {mentorshipPair ? (
              <div className="p-3 rounded-md bg-zinc-950/70 border border-zinc-800/70 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{mentorshipPair.mentorName}</span>
                  <span className="text-[10px] text-zinc-400">{mentorshipPair.mentorRole} • {mentorshipPair.mentorCompany}</span>
                </div>
                <button
                  onClick={() => setActiveTab('mentorship')}
                  className="text-xs text-orange-400 font-semibold hover:underline"
                >
                  Chat
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect with verified UCEK alumni at Google, TCS, and Accenture for mock interviews.
              </p>
            )}

            <button
              onClick={() => setActiveTab('mentorship')}
              className="btn-secondary w-full py-2 text-xs font-semibold"
            >
              Book Mentor Mock Round
            </button>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
};
