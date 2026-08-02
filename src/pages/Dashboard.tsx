import React from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
import { motion, Variants } from 'framer-motion';
import {
  TrendingUp,
  Award,
  ArrowRight,
  FileCheck,
  Mic,
  Users,
  CheckSquare,
  Activity,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Zap,
  Target
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

  if (!user) {
    return (
      <div className="backdrop-blur-xl bg-zinc-900/80 border border-zinc-800 p-8 text-center max-w-md mx-auto space-y-5 my-16 rounded-md shadow-2xl font-sans">
        <div className="w-12 h-12 rounded-md bg-white/10 border border-white/15 text-white flex items-center justify-center mx-auto shadow-inner">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">
            UCEK Placement Suite
          </h2>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Please sign in with your student credentials or select a quick demo persona to access your placement dashboard.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              setAuthModalMode('login');
              setAuthModalOpen(true);
            }}
            className="btn-primary px-8 py-3 text-xs font-bold rounded-full"
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
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 py-4 font-sans max-w-7xl mx-auto"
    >
      {/* TOP DASHBOARD METRIC GRID MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: PLAIN WELCOME SECTION + 3 METRICS CARDS (8 Columns) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
          {/* Plain Welcome Header - NO CARD, NO BORDER, PLAIN TEXT & BADGES */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono font-semibold text-zinc-200">
                Batch {user.year} • {user.branch} • UCEK
              </span>

              {score >= 85 ? (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" /> ADVANCED READY ({score}%)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-white" /> IN PROGRESS ({score}%)
                </span>
              )}
            </div>

            {/* WELCOME BACK FIRST, NAME BIG BELOW (SYNE FONT MATCHING LANDING PAGE HERO) */}
            <div className="space-y-1">
              <h2
                className="text-2xl sm:text-3xl font-bold text-zinc-400 tracking-tight leading-tight"
                style={{ fontFamily: "'Syne', -apple-system, sans-serif" }}
              >
                Welcome back,
              </h2>
              <h1
                className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none"
                style={{ fontFamily: "'Syne', -apple-system, sans-serif" }}
              >
                {user.name}
              </h1>
            </div>

            {/* MULTI-LINE DESCRIPTIVE PARAGRAPH FILLING SPACE */}
            <div className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed space-y-2 max-w-2xl pt-1">
              <p>
                Tracking placement readiness for <span className="font-semibold text-white">{user.domain}</span>. Complete domain roadmap milestones, practice HR speech simulations, and clear company mock drives to raise your readiness index score.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 font-mono pt-1">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Target Drive: <strong className="text-white font-semibold font-sans">TCS Ninja & Digital 2026</strong>
                </span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Status: <strong className="text-emerald-400 font-semibold font-sans">On Track</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards Row (Mock Score, Roadmap, Passed) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">

            {/* MOCK SCORE CARD — rising bar chart illustration */}
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#08080a"
              borderRadius={12}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated={false}
              loopAnimation={true}
              loopInitialDelay={120}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
            >
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-sans font-bold tracking-wider">Mock Score</span>
                  <span className="text-2xl font-extrabold text-white">{score * 10}</span>
                </div>
                {/* Rising bar chart illustration */}
                <svg width="52" height="36" viewBox="0 0 52 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 opacity-70">
                  <rect x="1" y="24" width="8" height="11" rx="2" fill="rgba(255,255,255,0.15)"/>
                  <rect x="12" y="18" width="8" height="17" rx="2" fill="rgba(255,255,255,0.25)"/>
                  <rect x="23" y="11" width="8" height="24" rx="2" fill="rgba(255,255,255,0.4)"/>
                  <rect x="34" y="5" width="8" height="30" rx="2" fill="rgba(255,255,255,0.6)"/>
                  <polyline points="5,23 16,17 27,10 38,4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="38" cy="4" r="2.5" fill="white" opacity="0.9"/>
                </svg>
              </div>
            </BorderGlow>

            {/* ROADMAP CARD — segmented progress bar illustration */}
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#08080a"
              borderRadius={12}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated={false}
              loopAnimation={true}
              loopInitialDelay={1870}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
            >
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-sans font-bold tracking-wider">Roadmap</span>
                  <span className="text-2xl font-extrabold text-white">{domainPct}%</span>
                </div>
                {/* Segmented fill bar illustration */}
                <svg width="52" height="36" viewBox="0 0 52 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 opacity-70">
                  {/* Track */}
                  <rect x="2" y="15" width="48" height="7" rx="3.5" fill="rgba(255,255,255,0.08)"/>
                  {/* Fill */}
                  <rect x="2" y="15" width={`${(domainPct / 100) * 48}`} height="7" rx="3.5" fill="rgba(255,255,255,0.55)"/>
                  {/* Segment ticks */}
                  <rect x="13" y="15" width="1" height="7" fill="rgba(0,0,0,0.4)"/>
                  <rect x="25" y="15" width="1" height="7" fill="rgba(0,0,0,0.4)"/>
                  <rect x="37" y="15" width="1" height="7" fill="rgba(0,0,0,0.4)"/>
                  {/* Label dots above */}
                  <circle cx="8" cy="9" r="2.5" fill="rgba(255,255,255,0.7)"/>
                  <circle cx="20" cy="9" r="2.5" fill="rgba(255,255,255,0.45)"/>
                  <circle cx="32" cy="9" r="2.5" fill="rgba(255,255,255,0.2)"/>
                  <circle cx="44" cy="9" r="2.5" fill="rgba(255,255,255,0.1)"/>
                </svg>
              </div>
            </BorderGlow>

            {/* PASSED CARD — checkmark circle illustration */}
            <BorderGlow
              edgeSensitivity={30}
              glowColor="40 80 80"
              backgroundColor="#08080a"
              borderRadius={12}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              animated={false}
              loopAnimation={true}
              loopInitialDelay={3340}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
            >
              <div className="p-4 flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block font-sans font-bold tracking-wider">Passed</span>
                  <span className="text-2xl font-extrabold text-white">{testsPassed}/{testsTaken}</span>
                </div>
                {/* Checkmark circle illustration */}
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 opacity-80">
                  <circle cx="19" cy="19" r="16" stroke="rgba(255,255,255,0.15)" strokeWidth="2"/>
                  <circle cx="19" cy="19" r="16" stroke="rgba(255,255,255,0.5)" strokeWidth="2"
                    strokeDasharray="100.5" strokeDashoffset="25" strokeLinecap="round"
                    style={{ transformOrigin: '19px 19px', transform: 'rotate(-90deg)' }}/>
                  <polyline points="12,19 17,24 26,14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </BorderGlow>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: STACKED ON DESKTOP, SIDE-BY-SIDE ON SHRANK/TABLET SCREEN (4 Columns) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 items-stretch">
          {/* RESUME HEALTH CARD */}
          <motion.div variants={itemVariants} className="h-full">
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
              style={{ height: '100%' }}
            >
              <div className="p-5 space-y-4 flex flex-col justify-between min-h-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-white" />
                    Resume Health
                  </h3>
                  <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold">
                    ATS 82%
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-white/5 border border-white/10 space-y-2 font-sans">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Action Verbs:</span>
                    <span className="font-bold font-mono text-white bg-white/10 px-2 py-0.5 rounded-sm border border-white/20">Strong</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Impact Metrics:</span>
                    <span className="font-bold font-mono text-white bg-white/10 px-2 py-0.5 rounded-sm border border-white/20">Quantify</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('resumes')}
                  className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer"
                >
                  <span>Review Resume</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            </BorderGlow>
          </motion.div>

          {/* MENTORSHIP STATUS CARD (Right below Resume Health) */}
          <motion.div variants={itemVariants} className="h-full">
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
              style={{ height: '100%' }}
            >
              <div className="p-5 space-y-4 flex flex-col justify-between min-h-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white font-sans flex items-center gap-2">
                    <Users className="w-4 h-4 text-white" />
                    Mentorship
                  </h3>
                  <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/15 text-white text-[10px] font-mono font-bold">
                    {mentorshipPair ? 'Active' : 'Unassigned'}
                  </span>
                </div>

                {mentorshipPair ? (
                  <div className="space-y-1 p-3 rounded-sm bg-white/5 border border-white/10 text-xs">
                    <p className="font-bold text-white text-xs">{mentorshipPair.mentorName}</p>
                    <p className="text-zinc-400 text-[11px] font-sans">{mentorshipPair.mentorRole} @ <span className="text-white font-semibold">{mentorshipPair.mentorCompany}</span></p>
                  </div>
                ) : (
                  <div className="text-center py-3 space-y-1 bg-white/5 border border-white/10 rounded-sm">
                    <p className="text-xs text-zinc-400">No active mentor</p>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('mentorship')}
                  className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer"
                >
                  <span>{mentorshipPair ? 'View Session' : 'Find Mentor'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </button>
              </div>
            </BorderGlow>
          </motion.div>
        </div>
      </div>

      {/* INTERVIEW PRACTICE & QUICK ACTIONS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* HR SPEECH SIMULATOR CARD */}
        <div className="lg:col-span-4">
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
            <div className="p-6 space-y-5 flex flex-col justify-between min-h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-sm text-white font-sans">HR Speech Simulator</h3>
                </div>
                <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold">
                  Speech AI
                </span>
              </div>

              <div className="p-3.5 rounded-sm bg-white/5 border border-white/10 space-y-2.5 font-sans">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Sessions Completed:</span>
                  <span className="font-bold font-mono text-white">4</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Pace WPM:</span>
                  <span className="font-bold font-mono text-white">135 (Optimal)</span>
                </div>

                <div className="flex items-center justify-center gap-1.5 h-6 pt-2">
                  <div className="w-1 h-4 bg-white rounded-full animate-pulse"></div>
                  <div className="w-1 h-6 bg-zinc-300 rounded-full animate-pulse delay-75"></div>
                  <div className="w-1 h-3 bg-zinc-400 rounded-full animate-pulse delay-150"></div>
                  <div className="w-1 h-5 bg-white rounded-full animate-pulse delay-200"></div>
                  <div className="w-1 h-2 bg-zinc-300 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('interview')}
                className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-black" />
                <span>Start Practice</span>
              </button>
            </div>
          </BorderGlow>
        </div>

        {/* QUICK ACTIONS 3-COLUMN GRID */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Action 1: Mock Tests Drive */}
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
            <div
              onClick={() => setActiveTab('tests')}
              className="p-5 space-y-4 flex flex-col justify-between cursor-pointer group min-h-full"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-md bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-white text-sm font-sans">Mock Tests Drive</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Timed test simulations across domain & company formats.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white font-bold group-hover:translate-x-0.5 transition-transform">
                <span>{testsTaken} Tests → Start</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </BorderGlow>

          {/* Action 2: AI Resume Suite */}
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
            <div
              onClick={() => setActiveTab('resumes')}
              className="p-5 space-y-4 flex flex-col justify-between cursor-pointer group min-h-full"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-md bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-white text-sm font-sans">AI Resume Suite</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Review, build, & match resume against company JDs.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white font-bold group-hover:translate-x-0.5 transition-transform">
                <span>ATS Check → Go</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </BorderGlow>

          {/* Action 3: Domain Roadmaps */}
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
            <div
              onClick={() => setActiveTab('roadmap')}
              className="p-5 space-y-4 flex flex-col justify-between cursor-pointer group min-h-full"
            >
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-md bg-white/10 border border-white/15 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-white text-sm font-sans">Domain Roadmaps</h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Structured learning paths & milestone progression.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white font-bold group-hover:translate-x-0.5 transition-transform">
                <span>{user.domain} → View</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </BorderGlow>

        </div>

      </div>

      {/* RECENT TEST PERFORMANCE TABLE */}
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
        <section className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-white" />
              <h3 className="font-bold text-sm text-white font-sans">Recent Test Performances</h3>
            </div>

            <button
              onClick={() => setActiveTab('tests')}
              className="btn-primary py-2 px-5 text-xs font-bold rounded-full cursor-pointer"
            >
              Take New Test
            </button>
          </div>

          {recentScores.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-white/5 border border-white/10 rounded-md">
              <Activity className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-xs font-semibold text-zinc-300">No tests logged yet. Start your first mock drive.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/10 rounded-md bg-zinc-950/60">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    <th className="p-3 pl-4">Test Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                  {recentScores.map(res => (
                    <tr key={res.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 pl-4 font-bold text-white">{res.testTitle}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/15 text-[10px] font-mono font-semibold text-zinc-300">
                          {res.category}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-zinc-300 font-mono">{res.score} / {res.totalQuestions}</td>
                      <td className="p-3 font-bold text-white font-mono">{res.accuracy}%</td>
                      <td className="p-3">
                        {res.passed ? (
                          <span className="px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-white text-[10px] font-mono font-bold">
                            PASSED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold">
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
        </section>
      </BorderGlow>

    </motion.div>
  );
};
