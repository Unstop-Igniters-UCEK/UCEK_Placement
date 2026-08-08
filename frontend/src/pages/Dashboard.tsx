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
  Calendar
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

  const [speechAnalytics, setSpeechAnalytics] = useState<SpeechAnalyticsResponse>({
    wpm: 135,
    confidenceScore: 92,
    starFramework: 'Aligned',
    fillerCount: '0 Detects',
    totalEvaluations: 0,
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
      <div className="mono-card p-8 text-center max-w-md mx-auto space-y-5 my-16 font-sans">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight font-heading">
            UCEK Placement Suite
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Please sign in with your student credentials or select a quick demo persona to access your placement dashboard.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            className="btn-primary px-8 py-3 text-xs font-bold rounded-full cursor-pointer"
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, transform: 'translateY(10px) scale(0.99)' },
    visible: {
      opacity: 1,
      transform: 'translateY(0px) scale(1)',
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 py-4 font-sans max-w-7xl mx-auto transform-gpu"
    >
      {/* 2-COLUMN ASYMMETRIC BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: HERO WELCOME + ACTION TILES + HISTORY TABLE (8 COLUMNS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* HERO WELCOME PANEL */}
          <motion.div variants={itemVariants} className="mono-card p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 blur-[90px] rounded-full pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="space-y-3.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300">
                    Batch {user.year} • {user.branch}
                  </span>

                  {score >= 80 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Placement Ready
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-[11px] font-semibold text-orange-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> In Progress
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-zinc-400">Welcome back,</p>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading mt-0.5">
                    {user.name}
                  </h1>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  Tracking placement readiness for <span className="font-semibold text-white">{user.domain}</span>. Complete milestones, practice HR speech simulations, and clear company mock drives to raise your readiness index score.
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" /> Target Drive: <strong className="text-white font-semibold">TCS Ninja & Digital 2026</strong>
                  </span>
                </div>
              </div>

              {/* READINESS INDEX CIRCLE GAUGE */}
              <div className="shrink-0 flex flex-col items-center justify-center p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl w-full sm:w-36 space-y-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#18181b" strokeWidth="8" fill="transparent" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F97316"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * score) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-white font-heading">{score}%</span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">READINESS</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">Index Score</span>
              </div>
            </div>
          </motion.div>

          {/* 3 CORE PREPARATION TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              variants={itemVariants}
              onClick={() => setActiveTab('roadmap')}
              className="mono-card p-5 space-y-3 cursor-pointer group hover:border-orange-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-orange-400">{domainPct}%</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm font-heading group-hover:text-orange-400 transition-colors">Domain Roadmap</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  {doneTopics}/{totalTopics} milestones completed.
                </p>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${domainPct}%` }} />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              onClick={() => setActiveTab('resumes')}
              className="mono-card p-5 space-y-3 cursor-pointer group hover:border-orange-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCheck className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-orange-400">82% Match</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm font-heading group-hover:text-orange-400 transition-colors">AI Resume Suite</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  ATS score & STAR bullet builder.
                </p>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: '82%' }} />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              onClick={() => setActiveTab('tests')}
              className="mono-card p-5 space-y-3 cursor-pointer group hover:border-orange-500/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-orange-400">{testsPassed}/{testsTaken} Cleared</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm font-heading group-hover:text-orange-400 transition-colors">Mock Drive Practice</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                  Timed technical & aptitude rounds.
                </p>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${testsTaken > 0 ? (testsPassed/testsTaken)*100 : 0}%` }} />
              </div>
            </motion.div>
          </div>

          {/* RECENT MOCK DRIVES HISTORY TABLE */}
          <motion.div variants={itemVariants} className="mono-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-orange-400" />
                <h2 className="font-bold text-sm text-white font-heading">Recent Mock Drive Performances</h2>
              </div>

              <button
                onClick={() => setActiveTab('tests')}
                className="btn-primary py-2 px-4 text-xs font-bold rounded-full cursor-pointer"
              >
                Take New Drive
              </button>
            </div>

            {recentScores.length === 0 ? (
              <div className="py-10 text-center space-y-2 bg-zinc-950/50 border border-zinc-800/80 rounded-xl">
                <Activity className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-xs font-semibold text-zinc-400">No mock test sessions recorded yet. Launch your first drive.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-zinc-800/80 rounded-xl bg-zinc-950/60">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="p-3.5 pl-4">Drive Title</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Score</th>
                      <th className="p-3.5">Accuracy</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs text-white">
                    {recentScores.map(res => (
                      <tr key={res.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-white">{res.testTitle}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300">
                            {res.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-zinc-300">{res.score} / {res.totalQuestions}</td>
                        <td className="p-3.5 font-bold text-orange-400">{res.accuracy}%</td>
                        <td className="p-3.5">
                          {res.passed ? (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                              PASSED
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-bold">
                              RETRY
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR MODULES (4 COLUMNS - FULL HEIGHT STRETCH) */}
        <div className="lg:col-span-4 h-full flex flex-col">
          
          {/* HR SPEECH SIMULATOR QUICK PRACTICE CARD */}
          <motion.div variants={itemVariants} className="mono-card p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-6 h-full">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-orange-400" />
                  <h2 className="font-bold text-base text-white font-heading">HR Speech Simulator</h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-orange-400">
                  Speech AI
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Practice HR behavioral questions with real-time speech fluency, pace (WPM), and confidence evaluation.
              </p>

              {/* LIVE ANALYTICS METRICS GRID */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Speech Pace</span>
                  <span className="font-bold text-white text-sm">{speechAnalytics.wpm} WPM</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Confidence</span>
                  <span className="font-bold text-emerald-400 text-sm">{speechAnalytics.confidenceScore}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">STAR Framework</span>
                  <span className="font-bold text-orange-400 text-sm">{speechAnalytics.starFramework}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block font-medium">Filler Count</span>
                  <span className="font-bold text-zinc-200 text-sm">{speechAnalytics.fillerCount}</span>
                </div>
              </div>

              {/* QUICK PRACTICE PROMPTS */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Featured Practice Prompts</span>
                <div className="space-y-2 text-xs">
                  {speechAnalytics.featuredPrompts.map((promptText, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-zinc-300">
                      "{promptText}"
                    </div>
                  ))}
                </div>
              </div>
            </div>


            <div className="pt-4 border-t border-zinc-800/80">
              <button
                onClick={() => setActiveTab('interview')}
                className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Mic className="w-4 h-4 text-black" />
                <span>Launch Speech Practice</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
