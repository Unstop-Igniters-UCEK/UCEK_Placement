import React from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import SideRays from './SideRays';
import {
  User,
  LogOut,
  LayoutDashboard,
  Compass,
  FileText,
  CheckSquare,
  Mic,
  Users,
  ShieldCheck,
  GraduationCap,
  X
} from 'lucide-react';

export const Sidebar: React.FC = React.memo(() => {
  const { user, logoutUser, activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useApp();

  if (!user) return null;

  const navItems = user.role === 'admin' ? [
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
    <>
      {/* FLOATING OPEN BUTTON (Small rounded button with bar logo on the left of dashboard when sidebar is closed) */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 w-11 h-11 rounded-full bg-white text-black border border-white/20 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
            title="Open Navigation Menu"
          >
            <GraduationCap className="w-6 h-6 text-black" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* DYNAMIC COLLAPSIBLE SIDEBAR PANEL */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 h-full h-[100dvh] max-h-[100dvh] w-72 max-w-[85vw] bg-[#050505]/90 backdrop-blur-xl border-r border-[#2d3132]/80 flex flex-col justify-between p-4 sm:p-5 pb-6 sm:pb-5 z-50 select-none shadow-2xl overflow-hidden transform-gpu"
            >
              {/* Animated SideRays Background (Sidebar Only) */}
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden w-full h-full">
                <SideRays
                  speed={1.8}
                  rayColor1="#F97316"
                  rayColor2="#F97316"
                  intensity={1.5}
                  spread={0.5}
                  origin="top-left"
                  tilt={21}
                  saturation={1.65}
                  blend={0.16}
                  falloff={1.1}
                  opacity={1}
                />
              </div>

              {/* TOP SECTION: Logo icon on left + Close button placed to the right side of the logo */}
              <div className="relative z-10 shrink-0 pt-1 pb-3 px-1 flex items-center justify-between gap-3 border-b border-white/10 mb-1">
                <div
                  onClick={() => {
                    setActiveTab('dashboard');
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-lg shadow-orange-500/10 cursor-pointer hover:scale-105 transition-transform shrink-0"
                  title="UCEK Ignite Dashboard"
                >
                  <GraduationCap className="w-5.5 h-5.5 text-black" />
                </div>

                {/* Reserved space for future brand name */}
                <div className="flex-1" />

                {/* Close Button on the right side of the logo */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-white/15 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm"
                  title="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* MID SECTION: Top bar navigation elements in rounded button style */}
              <nav className="relative z-10 flex-1 min-h-0 space-y-1 sm:space-y-1.5 py-2 overflow-y-auto no-scrollbar">
                {navItems.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold relative whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] ${isActive
                        ? 'text-black font-extrabold bg-white shadow-lg shadow-white/10'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10 font-semibold backdrop-blur-xs'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarTabPill"
                          className="absolute inset-0 bg-white rounded-full z-0 shadow-md"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <Icon className={`w-4 h-4 z-10 shrink-0 ${isActive ? 'text-black' : 'text-zinc-300'}`} />
                      <span className="tracking-tight z-10 truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* BOTTOM SECTION: User Logo/Profile & Red Rounded Logout Button */}
              <div className="relative z-10 shrink-0 pt-2.5 sm:pt-3 border-t border-white/10 space-y-2 sm:space-y-2.5">
                {/* User Info Tile */}
                <div className="flex items-center gap-3 p-2 sm:p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-md">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-950 border border-white/15 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-zinc-300" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user.branch} • Year {user.year}</p>
                  </div>
                </div>

                {/* Red Rounded Logout Button (Preserved) */}
                <button
                  onClick={logoutUser}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/30 transition-all cursor-pointer active:scale-[0.97]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

export default Sidebar;
