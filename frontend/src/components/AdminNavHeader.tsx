import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  LogOut,
  LayoutDashboard,
  CheckSquare,
  UserPlus,
  ChevronDown,
  Bell,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type { AdminPasswordResetRequest } from '../types';
import {
  getAdminPasswordResetRequestsApi,
  resetStudentPasswordAdminApi,
  regenerateStudentPasswordAdminApi,
  resolvePasswordResetRequestApi,
} from '../lib/api';

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export const AdminNavHeader: React.FC = React.memo(() => {
  const { user, logoutUser, activeTab, setActiveTab } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userCardOpen, setUserCardOpen] = useState(false);

  // Notification bell & password reset request state
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [resetRequests, setResetRequests] = useState<AdminPasswordResetRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isResettingId, setIsResettingId] = useState<string | null>(null);

  // Success modal state
  const [activeSuccessModal, setActiveSuccessModal] = useState<{
    temporaryPassword: string;
    studentName: string;
    studentEmail: string;
    requestId: string;
    studentId?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch pending password reset requests from backend
  const loadPendingRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const data = await getAdminPasswordResetRequestsApi();
      setResetRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      console.warn('Failed to load admin password reset requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  // Fetch pending password reset requests once on admin mount
  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingRequests();
    }
  }, [user?.role, loadPendingRequests]);

  // Handle outside click to close notification dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    if (notificationOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [notificationOpen]);

  const handleToggleNotifications = () => {
    setNotificationOpen(prev => !prev);
  };

  const handleResetPassword = async (requestId: string) => {
    setActionError(null);
    setIsResettingId(requestId);
    try {
      const res = await resetStudentPasswordAdminApi(requestId);
      setActiveSuccessModal({
        temporaryPassword: res.temporaryPassword,
        studentName: res.studentName,
        studentEmail: res.studentEmail,
        requestId: res.requestId,
        studentId: res.studentId,
      });
      setCopied(false);
      setNotificationOpen(false);
      // Immediately remove resolved request from state so bell badge and list update without refetching
      setResetRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      setActionError(err.message || 'Failed to reset password');
    } finally {
      setIsResettingId(null);
    }
  };

  const handleRegeneratePassword = async () => {
    if (!activeSuccessModal) return;
    setActionError(null);
    setIsRegenerating(true);
    try {
      const targetId = activeSuccessModal.studentId || activeSuccessModal.requestId;
      const res = await regenerateStudentPasswordAdminApi(targetId);
      setActiveSuccessModal(prev => prev ? {
        ...prev,
        temporaryPassword: res.temporaryPassword,
        studentId: res.studentId || prev.studentId,
      } : null);
      setCopied(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to regenerate password');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyPassword = () => {
    if (!activeSuccessModal?.temporaryPassword) return;
    navigator.clipboard.writeText(activeSuccessModal.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDoneModal = async () => {
    if (!activeSuccessModal) return;
    const reqId = activeSuccessModal.requestId;
    setIsResolving(true);
    try {
      await resolvePasswordResetRequestApi(reqId);
    } catch (err) {
      console.warn('Failed to resolve request on backend:', err);
    } finally {
      setIsResolving(false);
      setActiveSuccessModal(null);
      setResetRequests(prev => prev.filter(r => r.id !== reqId));
    }
  };

  if (!user || user.role !== 'admin') return null;

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Admin Dashboard',     icon: LayoutDashboard },
    { id: 'admin-tests',     label: 'Mock Tests',          icon: CheckSquare },
    { id: 'admin-roles',     label: 'Student Onboarding',  icon: UserPlus },
  ];

  const activeItem = adminNavItems.find(item => item.id === activeTab) || adminNavItems[0];
  const ActiveIcon = activeItem?.icon || LayoutDashboard;

  return (
    <div className="w-full relative z-30 font-sans">
      {/* ADMIN TOP HEADER */}
      <header className="sticky top-0 z-40 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left: Impulse Logo */}
          <div
            onClick={() => setActiveTab('admin-dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            title="Return to Admin Dashboard"
          >
            <img
              src="/new_logo.png"
              alt="Impulse Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform shrink-0"
            />
            <span
              className="text-xl sm:text-2xl font-normal text-white tracking-tight group-hover:text-orange-400 transition-colors hidden sm:inline"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
            >
              Impulse
            </span>
          </div>

          {/* Center: Navigation Pill */}
          <div className="flex-1 flex justify-center items-center px-2">
            {/* Desktop: Horizontal Pill Navigation */}
            <nav className="hidden lg:inline-flex items-center gap-1 p-1.5 rounded-full bg-[#0d0d12]/80 backdrop-blur-xl border border-white/10 shadow-xl">
              {adminNavItems.map(tab => {
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
                        layoutId="activeAdminNavPill"
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

            {/* Mobile: Pill Dropdown Navigation */}
            <div className="relative lg:hidden w-full max-w-xs sm:max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setMobileOpen(prev => !prev)}
                className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-[#0d0d12]/90 backdrop-blur-xl border border-white/15 text-white shadow-xl cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <ActiveIcon className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs font-bold truncate text-white">{activeItem?.label || 'Select Page'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${mobileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {mobileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMobileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full left-0 right-0 mt-2 z-50 p-1.5 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/15 shadow-2xl space-y-1"
                    >
                      {adminNavItems.map(tab => {
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

          {/* Right: Notifications Bell + User menu + Logout */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Notification Bell Button + Dropdown Panel */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative w-10 h-10 rounded-full bg-zinc-900 border border-white/20 hover:border-white/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center overflow-visible cursor-pointer transition-all duration-200 active:scale-95 shadow-md group"
                title="Password Reset Requests"
                aria-label="Admin Notifications"
              >
                <Bell className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                {resetRequests.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-black text-[10px] font-extrabold flex items-center justify-center shadow-lg border-2 border-black font-mono">
                    {resetRequests.length > 9 ? '9+' : resetRequests.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {notificationOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 md:hidden"
                      onClick={() => setNotificationOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full right-0 mt-3 w-80 sm:w-96 p-3 sm:p-4 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 text-left pointer-events-auto max-h-[80vh] flex flex-col"
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-400" />
                          <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight font-sans">
                            Password Reset Requests
                          </h3>
                        </div>
                        {resetRequests.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-semibold text-orange-400 font-mono">
                            {resetRequests.length} Pending
                          </span>
                        )}
                      </div>

                      {/* Action Error if any */}
                      {actionError && (
                        <div className="p-2 mb-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                          {actionError}
                        </div>
                      )}

                      {/* Request List or Empty State */}
                      <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                        {isLoadingRequests && resetRequests.length === 0 ? (
                          <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                            <span>Checking requests...</span>
                          </div>
                        ) : resetRequests.length === 0 ? (
                          <div className="py-8 px-3 text-center space-y-1.5">
                            <Bell className="w-5 h-5 text-zinc-600 mx-auto" />
                            <p className="text-xs font-medium text-zinc-400">No pending reset requests</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              Student help requests will appear here in real-time
                            </p>
                          </div>
                        ) : (
                          resetRequests.map(req => (
                            <div
                              key={req.id}
                              className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all space-y-2.5"
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-400 font-mono tracking-wider uppercase">
                                <KeyRound className="w-3 h-3 text-orange-400 shrink-0" />
                                <span>Password Change Request</span>
                              </div>

                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-white truncate font-sans">
                                    {req.name || 'Student'}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 truncate font-mono">
                                    {req.email}
                                  </p>
                                  {(req.department || req.year) && (
                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                      {[req.department, req.year].filter(Boolean).join(' • ')}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-400 font-mono shrink-0 pt-0.5">
                                  Requested {formatRelativeTime(req.created_at)}
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={isResettingId === req.id}
                                onClick={() => handleResetPassword(req.id)}
                                className="w-full py-2 px-3 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 hover:border-orange-500/50 text-orange-300 hover:text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                              >
                                {isResettingId === req.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <KeyRound className="w-3.5 h-3.5" />
                                    <span>Reset Password</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar / profile card */}
            <div
              className="relative"
              onMouseEnter={() => setUserCardOpen(true)}
              onMouseLeave={() => setUserCardOpen(false)}
            >
              <button
                type="button"
                onClick={() => setUserCardOpen(prev => !prev)}
                className="w-10 h-10 rounded-full bg-zinc-900 border border-white/20 hover:border-white/60 hover:bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 active:scale-95 shadow-md group"
                title="Admin Profile"
                aria-label="Admin Profile"
              >
                <User className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
              </button>

              <AnimatePresence>
                {userCardOpen && (
                  <>
                    <div className="fixed inset-0 z-40 md:hidden" onClick={() => setUserCardOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full right-0 mt-3 w-64 sm:w-72 p-4 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 text-left pointer-events-auto"
                    >
                      <div className="flex items-center gap-3 pb-3 border-b border-white/10 overflow-hidden min-w-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">{user.name}</h4>
                          <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="pt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Role</span>
                          <span className="font-semibold text-orange-400 capitalize px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-mono">
                            TPO Admin
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Logout */}
            <button
              onClick={logoutUser}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-950/30"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Admin Reset Success Modal */}
      <AnimatePresence>
        {activeSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md bg-[#0d0d12] border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-left relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                      Password Reset Successful
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Temporary credential issued for student
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDoneModal}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student details */}
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                <div className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
                  Student Account
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white">
                  {activeSuccessModal.studentName}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  {activeSuccessModal.studentEmail}
                </div>
              </div>

              {/* Temporary Password Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-orange-500/40 text-center font-mono font-bold text-lg tracking-[0.25em] text-orange-400 select-all shadow-inner">
                    {activeSuccessModal.temporaryPassword}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="px-3.5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
                    title="Copy Password"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Send this 5-character temporary password to the student. They will be forced to choose a permanent password immediately upon logging in.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={handleRegeneratePassword}
                  className="px-3 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  title="Generate another password if this one was lost"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? 'Generating...' : 'Generate New'}</span>
                </button>

                <button
                  type="button"
                  disabled={isResolving}
                  onClick={handleDoneModal}
                  className="btn-primary px-6 py-2.5 text-xs font-bold rounded-full cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isResolving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>Finishing...</span>
                    </>
                  ) : (
                    <span>Done</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AdminNavHeader;
