import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  User,
  LogOut,
  LayoutDashboard,
  Compass,
  FileText,
  CheckSquare,
  Mic,
  Users,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    user,
    logoutUser,
    activeTab,
    setActiveTab
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = user?.role === 'admin' ? [
    { id: 'admin', label: 'Admin Dashboard', icon: ShieldCheck },
    { id: 'dashboard', label: 'Student View', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Domain Roadmap', icon: Compass },
    { id: 'resumes', label: 'AI Resume Suite', icon: FileText },
    { id: 'tests', label: 'Mock Tests', icon: CheckSquare },
    { id: 'interview', label: 'HR Interview', icon: Mic },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Domain Roadmap', icon: Compass },
    { id: 'resumes', label: 'AI Resume Suite', icon: FileText },
    { id: 'tests', label: 'Mock Tests', icon: CheckSquare },
    { id: 'interview', label: 'HR Interview', icon: Mic },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 w-full bg-transparent font-sans transition-all transform-gpu"
    >
      {/* TOP BRAND BAR */}
      <div className={`w-full mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 ${
        activeTab === 'admin' ? 'justify-end md:pl-72 max-w-none' : 'justify-between max-w-[1600px]'
      }`}>
        {/* White Logo Section Only (Hidden on Admin Panel) */}
        {activeTab !== 'admin' && (
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-black" />
            </div>
          </div>
        )}

        {/* Action Controls - USER AVATAR ONLY (Pushed to far right) */}
        {user && (
          <div className="flex items-center shrink-0 ml-auto">

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-700/80 overflow-hidden cursor-pointer shadow-sm"
                title={user.name}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-zinc-200" />
                )}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    transition={{ duration: 0.12 }}
                    style={{ transformOrigin: 'top right' }}
                    className="absolute right-0 mt-2 w-60 rounded-xl bg-zinc-900/95 border border-zinc-800 shadow-2xl p-3 z-50 space-y-3 text-white backdrop-blur-xl transform-gpu"
                  >
                    <div className="flex items-center gap-3 pb-2.5 border-b border-zinc-800">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4.5 h-4.5 text-zinc-300" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1 text-zinc-400 font-mono">
                      <div className="flex justify-between">
                        <span>Readiness Score:</span>
                        <span className="text-orange-400 font-bold">{user.readinessScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Domain:</span>
                        <span className="text-zinc-200 truncate max-w-[120px]">{user.domain}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logoutUser();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 border border-zinc-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* CENTERED TAB NAVIGATION (Student workspace views only) */}
      {user && activeTab !== 'admin' && (
        <div className="w-full flex justify-center px-4 pb-2 pt-0">
          <nav className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg max-w-full overflow-x-auto no-scrollbar">
            {navItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs relative whitespace-nowrap cursor-pointer transition-colors active:scale-95 ${
                    isActive
                      ? 'text-black font-extrabold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10 font-semibold'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeHeaderTabPill"
                      className="absolute inset-0 bg-white rounded-full z-0 shadow-md"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 z-10 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span className="text-xs tracking-tight z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </motion.header>
  );
};
