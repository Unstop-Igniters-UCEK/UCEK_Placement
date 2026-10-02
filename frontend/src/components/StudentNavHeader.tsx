import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Pencil,
  Bell,
  FileCheck2
} from 'lucide-react';
import { MockTestNotification } from '../lib/api';
import { EditProfileModal } from './EditProfileModal';

export const StudentNavHeader: React.FC = React.memo(() => {
  const {
    user,
    logoutUser,
    activeTab,
    setActiveTab,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    markNotificationAsRead,
    setHighlightedTestId
  } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userCardOpen, setUserCardOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [popupNotifications, setPopupNotifications] = useState<MockTestNotification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Click-outside listener to close notification popup on desktop
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
        setPopupNotifications([]);
      }
    };
    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  const handleToggleNotifications = () => {
    setNotificationOpen(prev => {
      const next = !prev;
      if (next) {
        // Display the latest notifications (maximum 3)
        const toDisplay = notifications.slice(0, 3);
        setPopupNotifications(toDisplay);
        // Treat displayed notification(s) as read/seen and remove from active list
        if (notifications.length > 0) {
          markNotificationsAsRead();
        }
      } else {
        setPopupNotifications([]);
      }
      return next;
    });
  };

  if (!user || user.role === 'admin') return null;

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roadmap', label: 'Domain Roadmap', icon: Compass },
    { id: 'resumes', label: 'AI Resume Suite', icon: FileText },
    { id: 'tests', label: 'Mock Tests', icon: CheckSquare },
    { id: 'interview', label: 'HR Interview', icon: Mic },
  ];

  const activeItem = studentNavItems.find(item => item.id === activeTab) || studentNavItems[0];
  const ActiveIcon = activeItem?.icon || LayoutDashboard;

  return (
    <div className="w-full relative z-30 font-sans">
      {/* 1. STUDENT DASHBOARD HEADER */}
      <header className="sticky top-0 z-40 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl w-full mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Impulse Logo / Icon */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
            title="Return to Dashboard"
          >
            <img
              src="/new_logo.png"
              alt="Impulse Logo"
              className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform shrink-0"
            />
            <span
              className="text-xl sm:text-2xl font-normal text-white tracking-tight group-hover:text-orange-400 transition-colors hidden sm:inline"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
            >
              Impulse
            </span>
          </div>

          {/* Center: Navigation Pill (Desktop & Mobile) */}
          <div className="flex-1 min-w-0 flex justify-center items-center px-1 sm:px-2">
            {/* Desktop: Horizontal Pill Navigation Bar */}
            <nav className="hidden lg:inline-flex items-center gap-1 p-1.5 rounded-full bg-[#0d0d12]/80 backdrop-blur-xl border border-white/10 shadow-xl">
              {studentNavItems.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-[0.97] ${
                      isActive
                        ? 'text-black font-extrabold'
                        : 'text-zinc-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeStudentNavPill"
                        className="absolute inset-0 bg-white rounded-full z-0 shadow-md"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 z-10 shrink-0 ${isActive ? 'text-black' : 'text-zinc-300'}`} />
                    <span className="z-10 tracking-tight whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile: Pill-shaped Dropdown Navigation */}
            <div className="relative lg:hidden w-full max-w-[200px] sm:max-w-sm mx-auto min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(prev => !prev)}
                className="w-full flex items-center justify-between gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#0d0d12]/90 backdrop-blur-xl border border-white/15 text-white shadow-xl cursor-pointer active:scale-[0.98] transition-all min-w-0"
              >
                <div className="flex items-center gap-1.5 sm:gap-2.5 truncate min-w-0">
                  <ActiveIcon className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs font-bold truncate text-white min-w-0">{activeItem?.label || 'Select Page'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${mobileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {mobileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full left-0 right-0 mt-2 z-50 p-1.5 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-1"
                    >
                      {studentNavItems.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] ${
                              isActive
                                ? 'bg-white text-black font-extrabold shadow-sm'
                                : 'text-zinc-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                            <span className="truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Notification Button + Standalone User Logo + Logout Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notification Button + Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full bg-zinc-900 border border-white/20 hover:border-white/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center overflow-visible cursor-pointer transition-all duration-200 active:scale-95 shadow-md group shrink-0"
                title="Notifications"
                aria-label="Mock Test Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white transition-colors" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-black text-[10px] font-extrabold flex items-center justify-center shadow-lg border-2 border-black font-mono">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popup */}
              <AnimatePresence>
                {notificationOpen && (
                  <>
                    {/* Click-away backdrop overlay on mobile */}
                    <div
                      className="fixed inset-0 z-40 md:hidden"
                      onClick={() => {
                        setNotificationOpen(false);
                        setPopupNotifications([]);
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full right-0 mt-3 w-72 sm:w-80 p-3 sm:p-4 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 text-left pointer-events-auto"
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-400" />
                          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight font-heading">
                            Notifications
                          </h3>
                        </div>
                        {popupNotifications.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-semibold text-orange-400 font-mono">
                            {popupNotifications.length} New
                          </span>
                        )}
                      </div>

                      {popupNotifications.length === 0 ? (
                        <div className="py-6 px-3 text-center space-y-1.5">
                          <Bell className="w-5 h-5 text-zinc-600 mx-auto" />
                          <p className="text-xs font-medium text-zinc-400">No new notifications</p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            Mock tests published in this session appear here
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {popupNotifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                setNotificationOpen(false);
                                setPopupNotifications([]);
                                setHighlightedTestId(n.id);
                                setActiveTab('tests');
                              }}
                              className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 transition-all cursor-pointer group flex items-start gap-2.5"
                            >
                              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                <FileCheck2 className="w-4 h-4 text-orange-400" />
                              </div>
                              <div className="overflow-hidden min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-orange-400 tracking-wider uppercase font-mono">
                                  New Mock Test Available
                                </p>
                                <h4 className="text-xs font-semibold text-white truncate group-hover:text-orange-300 transition-colors">
                                  {n.title}
                                </h4>
                                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                  Available for your department/year
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Standalone User Logo Container (No surrounding outer pill/circle) */}
            <div
              className="relative"
              onMouseEnter={() => setUserCardOpen(true)}
              onMouseLeave={() => setUserCardOpen(false)}
            >
              <button
                type="button"
                onClick={() => setUserCardOpen(prev => !prev)}
                className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full bg-zinc-900 border border-white/20 hover:border-white/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 shadow-md group shrink-0"
                title="View Profile Details"
                aria-label="Student Profile"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white transition-colors" />
                )}
              </button>

              {/* User Details Floating Card (Hover on desktop, click on mobile) */}
              <AnimatePresence>
                {userCardOpen && (
                  <>
                    {/* Click-away backdrop overlay on mobile */}
                    <div
                      className="fixed inset-0 z-40 md:hidden"
                      onClick={() => setUserCardOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full right-0 mt-3 w-64 sm:w-72 p-4 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 text-left pointer-events-auto"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{user.name}</h4>
                            <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                          </div>
                        </div>

                        {/* Edit Profile Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setUserCardOpen(false);
                            setEditModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-orange-500 hover:text-black text-zinc-300 font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
                          title="Edit Profile"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="pt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Role</span>
                          <span className="font-semibold text-white capitalize px-2 py-0.5 rounded-full bg-white/10 text-[10px]">
                            {user.role === 'mentee' ? 'Student' : user.role}
                          </span>
                        </div>

                        {(user.branch || user.year) && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Academic</span>
                            <span className="font-medium text-zinc-200">
                              {user.branch ? user.branch : ''}
                              {user.branch && user.year ? ' • ' : ''}
                              {user.year ? (user.year.toLowerCase().includes('year') ? user.year : `Year ${user.year}`) : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Logout Button */}
            <button
              onClick={logoutUser}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-950/30 shrink-0"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
});

export default StudentNavHeader;
