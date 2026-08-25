import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Sparkles,
  Clock,
  Radio,
  CheckCircle2,
  RefreshCw,
  Bell,
  Mail,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  ArrowRight,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import OrangeBlackGradient from '../components/OrangeBlackGradient';

// Status items for the system modules
const SYSTEM_MODULES = [
  {
    name: 'AI Resume Suite',
    status: 'Upgrading Engine',
    progress: 92,
    icon: Sparkles,
    color: 'from-orange-500 to-amber-500',
    detail: 'Integrating updated ATS evaluation models',
  },
  {
    name: 'Mock Test Simulator',
    status: 'Database Ready',
    progress: 100,
    icon: Cpu,
    color: 'from-emerald-500 to-teal-400',
    detail: 'Indexing question banks & scoring pipelines',
  },
  {
    name: 'HR Interview Engine',
    status: 'Tuning Latency',
    progress: 88,
    icon: Zap,
    color: 'from-amber-500 to-orange-400',
    detail: 'Optimizing real-time audio evaluation prompt buffers',
  },
  {
    name: 'Alumni Mentorship',
    status: 'Final Verification',
    progress: 95,
    icon: Layers,
    color: 'from-sky-500 to-blue-400',
    detail: 'Updating mentor availability and session calendar',
  },
];

export default function Maintenance() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState('Just now');

  // Simulated countdown timer (1h 45m 22s)
  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 45,
    seconds: 22,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 3000);
  };

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastChecked(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans relative overflow-x-hidden flex flex-col justify-between selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* ── Background Layer: Canvas PixelBlast / Orange Black Gradient ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <OrangeBlackGradient />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />
      </div>

      {/* ── Top Header Navigation Bar ── */}
      <header className="relative z-20 w-full border-b border-white/10 bg-[#000000]/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-[1px] shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              <div className="w-full h-full bg-[#0a0a0f] rounded-[11px] flex items-center justify-center">
                <span className="font-extrabold text-orange-400 text-lg font-heading tracking-tighter">I</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-white tracking-tight font-heading">
                  IMPULSE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold uppercase tracking-wider">
                  v2.5 Release Prep
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block font-mono">
                University College of Engineering Kariavattom (UCEK)
              </p>
            </div>
          </div>

          {/* System Status Badge */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider">Maintenance Mode</span>
            </div>
          </div>

        </div>
      </header>

      {/* ── Main Hero & Content Body ── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 flex flex-col justify-center space-y-12">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          {/* Eyebrow Chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-inner">
            <Wrench className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" />
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

          {/* Countdown Clock Cards */}
          <div className="pt-4 flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#121217]/90 border border-white/10 min-w-[76px] sm:min-w-[90px] backdrop-blur-xl shadow-2xl">
              <span className="text-2xl sm:text-4xl font-extrabold font-mono text-white">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">Hours</span>
            </div>
            <span className="text-2xl font-bold text-orange-500/60 font-mono">:</span>
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#121217]/90 border border-white/10 min-w-[76px] sm:min-w-[90px] backdrop-blur-xl shadow-2xl">
              <span className="text-2xl sm:text-4xl font-extrabold font-mono text-orange-400">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">Mins</span>
            </div>
            <span className="text-2xl font-bold text-orange-500/60 font-mono">:</span>
            <div className="flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-[#121217]/90 border border-white/10 min-w-[76px] sm:min-w-[90px] backdrop-blur-xl shadow-2xl">
              <span className="text-2xl sm:text-4xl font-extrabold font-mono text-amber-300">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">Secs</span>
            </div>
          </div>
        </motion.div>

        {/* ── System Upgrade Progress Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#121217]/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

          {/* Module Grid Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                <h2 className="text-lg font-bold text-white font-heading">Module Optimization Pipeline</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Real-time status breakdown of Impulse core services.</p>
            </div>

            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-zinc-300 transition-all cursor-pointer active:scale-95 disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking System...' : 'Refresh Status'}</span>
              <span className="text-[10px] text-zinc-500 font-mono ml-1">({lastChecked})</span>
            </button>
          </div>

          {/* Module Status Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYSTEM_MODULES.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className="bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 space-y-3 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm font-heading">{mod.name}</h3>
                        <p className="text-xs text-zinc-400">{mod.detail}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                      {mod.progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mod.progress}%` }}
                      transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                      className={`h-full bg-gradient-to-r ${mod.color} rounded-full`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      {mod.status}
                    </span>
                    <span className="text-zinc-400">{mod.progress === 100 ? 'Complete' : 'In Progress'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Action Box: Get Notified on Completion ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-br from-[#16161d] to-[#0f0f14] border border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto shadow-xl"
        >
          <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mx-auto">
            <Bell className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white font-heading">Get Notified When We Launch</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Enter your college email address to receive an immediate alert as soon as Impulse services are back online.
            </p>
          </div>

          {subscribed ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> You're on the list! We'll notify you as soon as upgrade completes.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@uck.ac.in"
                className="w-full bg-[#0a0a0f] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-zinc-600 font-sans"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 shadow-lg shadow-orange-500/20 font-button"
              >
                <span>Notify Me</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </motion.div>

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-20 w-full border-t border-white/10 bg-[#000000]/80 backdrop-blur-xl py-6 px-6 text-xs text-zinc-400 font-mono">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-zinc-300 tracking-wider uppercase text-[11px]">
              Unstop Igniters Club UCEK
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Official Placement & Career Readiness Portal — UCEK Kariavattom
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              System Status: Active Upgrade
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
