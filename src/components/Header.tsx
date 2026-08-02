import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
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
  ShieldCheck
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Domain Roadmap', icon: Compass },
    { id: 'resumes', label: 'AI Resume Suite', icon: FileText },
    { id: 'tests', label: 'Mock Tests', icon: CheckSquare },
    { id: 'interview', label: 'HR Interview Simulator', icon: Mic },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 w-full bg-transparent border-none font-sans transition-all"
    >
      
      {/* TOP BRAND BAR */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Logo Section - ONLY APP LOGO ICON */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-md bg-white text-black flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-black" />
          </div>
        </div>

        {/* Action Controls - USER AVATAR ICON ONLY */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/15 backdrop-blur-md overflow-hidden"
                title={user.name}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-[#111115]/95 border border-white/15 shadow-2xl p-2.5 z-50 space-y-2 backdrop-blur-xl">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[9px] text-zinc-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logoutUser();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg btn-secondary text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* CENTERED GLASSMORPHISM TAB NAVIGATION - ENCLOSED IN ROUNDED RECTANGLE */}
      {user && (
        <div className="w-full flex justify-center px-4 py-2">
          <nav className="inline-flex items-center gap-1.5 p-1.5 rounded-full backdrop-blur-xl bg-black/60 border border-white/15 shadow-2xl shadow-black/80 max-w-full overflow-x-auto no-scrollbar">
            {navItems.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all relative whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-extrabold shadow-md scale-[1.02]'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10 font-bold'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span className="text-xs tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </motion.header>
  );
};
