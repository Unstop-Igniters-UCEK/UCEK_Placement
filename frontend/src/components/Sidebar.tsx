import React from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
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

export const Sidebar: React.FC = () => {
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
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="fixed left-0 top-0 h-screen h-dvh max-h-screen w-64 bg-[#09090b] border-r border-zinc-800/80 flex flex-col justify-between p-4 z-40 select-none shadow-2xl overflow-y-auto no-scrollbar transform-gpu"
            >
              {/* TOP SECTION: Logo icon on left + Close button placed to the right side of the logo */}
              <div className="shrink-0 pt-1 pb-3 px-1 flex items-center justify-between gap-3 border-b border-zinc-800/80 mb-2">
                <div
                  onClick={() => setActiveTab('dashboard')}
                  className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0"
                  title="UCEK Ignite Dashboard"
                >
                  <GraduationCap className="w-5.5 h-5.5 text-black" />
                </div>

                {/* Reserved space for future brand name */}
                <div className="flex-1" />

                {/* Close Button on the right side of the logo */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#18181c] hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                  title="Close Sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* MID SECTION: Top bar navigation elements in rounded button style */}
              <nav className="flex-1 space-y-1.5 py-2 overflow-y-auto no-scrollbar">
                {navItems.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold relative whitespace-nowrap cursor-pointer transition-all active:scale-[0.97] ${
                        isActive
                          ? 'text-black font-extrabold bg-white shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-semibold'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarTabPill"
                          className="absolute inset-0 bg-white rounded-full z-0 shadow-md"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <Icon className={`w-4 h-4 z-10 shrink-0 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                      <span className="tracking-tight z-10 truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* BOTTOM SECTION: User Logo/Profile & Red Rounded Logout Button */}
              <div className="shrink-0 pt-3 border-t border-zinc-800/80 space-y-2.5">
                {/* User Info Tile */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#18181c] border border-zinc-800/80">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4.5 h-4.5 text-zinc-300" />
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer active:scale-[0.97]"
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
};
