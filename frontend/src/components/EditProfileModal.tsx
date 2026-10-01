import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Loader2, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomSelect } from './CustomSelect';
import { getDepartmentsApi, changePasswordApi } from '../lib/api';

const UCEK_ALLOWED_DEPTS = ['CSE', 'ECE', 'IT'];

const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year'
];

// Helper to normalize any historical / full department strings to canonical code
const normalizeDeptCode = (raw?: string): string => {
  if (!raw) return 'CSE';
  const u = raw.trim().toUpperCase();
  if (u === 'CSE' || u.includes('COMPUTER') || u.includes('CS')) return 'CSE';
  if (u === 'ECE' || u.includes('ELECTRONIC') || u.includes('EC')) return 'ECE';
  if (u === 'IT' || u.includes('INFORMATION')) return 'IT';
  return raw;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useApp();

  // Active view: 'profile' or 'password'
  const [view, setView] = useState<'profile' | 'password'>('profile');

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [branch, setBranch] = useState(normalizeDeptCode(user?.branch || (user as any)?.department_code));
  const [year, setYear] = useState(user?.year || '4th Year');
  const [deptOptions, setDeptOptions] = useState<string[]>(UCEK_ALLOWED_DEPTS);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Authenticated Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const resetPasswordState = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPwError(null);
  };

  // Fetch departments dynamically from backend catalog and filter strictly to UCEK departments
  useEffect(() => {
    getDepartmentsApi().then(items => {
      if (items && items.length > 0) {
        const dbCodes = items.map(d => d.code.toUpperCase());
        const valid = UCEK_ALLOWED_DEPTS.filter(c => dbCodes.includes(c));
        if (valid.length > 0) {
          setDeptOptions(valid);
        }
      }
    }).catch(() => {
      // Sensible fallback preserves UCEK_ALLOWED_DEPTS
    });
  }, []);

  // Sync state with current user when opened
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setBranch(normalizeDeptCode(user.branch || (user as any)?.department_code));
      setYear(user.year || '4th Year');
      setError(null);
      setSuccess(false);
      setView('profile');
      resetPasswordState();
      setPwSuccess(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Name cannot be empty.');
      return;
    }
    if (cleanName.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserProfile({
        name: cleanName,
        branch: branch.trim(),
        year: year.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!currentPassword) {
      setPwError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPwError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (!confirmPassword) {
      setPwError('Please confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPwError('New password must be different from current password.');
      return;
    }

    setPwLoading(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPwSuccess(true);
      resetPasswordState();
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={loading || pwLoading ? undefined : onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#0e0e13] border border-white/15 rounded-3xl shadow-2xl p-6 z-10 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                {view === 'password' ? <KeyRound className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {view === 'password' ? 'Change Password' : 'Edit Profile'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {view === 'password' ? 'Update your account password' : 'Update your academic and personal information'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {view === 'profile' && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(false);
                    resetPasswordState();
                    setPwSuccess(false);
                    setView('password');
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-orange-500/40 text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Change Password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Change Password</span>
                  <span className="sm:hidden">Password</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={loading || pwLoading}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VIEW: CHANGE PASSWORD */}
          {view === 'password' ? (
            <div className="mt-5 font-sans">
              {pwSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white font-sans tracking-tight">Password Changed Successfully</h4>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                      Your account password has been updated securely.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPwSuccess(false);
                        resetPasswordState();
                        setView('profile');
                      }}
                      className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Return to Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4" autoComplete="off">
                  {pwError && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{pwError}</span>
                    </div>
                  )}

                  {/* 1. Current Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Current Password <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="current-password"
                        id="current-password-field"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        required
                        disabled={pwLoading}
                        className="w-full pl-5 pr-11 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none"
                        tabIndex={-1}
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 2. New Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-zinc-300">
                        New Password <span className="text-orange-400">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-medium">Min 6 characters</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="new-password"
                        id="new-password-field"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                        disabled={pwLoading}
                        className="w-full pl-5 pr-11 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none"
                        tabIndex={-1}
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 3. Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Confirm New Password <span className="text-orange-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm-password"
                        id="confirm-password-field"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        disabled={pwLoading}
                        className="w-full pl-5 pr-11 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none"
                        tabIndex={-1}
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        resetPasswordState();
                        setView('profile');
                      }}
                      disabled={pwLoading}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ← Back to Edit Profile
                    </button>

                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pwLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5 text-black" />
                          <span>Change Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* VIEW: EDIT PROFILE */
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Feedback Banners */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Read-Only Account Information */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Email (Read-only)</span>
                  <span className="text-zinc-300 font-medium truncate block mt-0.5" title={user.email}>{user.email}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Role (Read-only)</span>
                  <span className="text-zinc-300 font-medium capitalize block mt-0.5">{user.role === 'mentee' ? 'Student' : user.role}</span>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Full Name <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-5 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans"
                  required
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Department / Branch <span className="text-orange-400">*</span>
                </label>
                <CustomSelect
                  value={branch}
                  onChange={setBranch}
                  options={deptOptions}
                  disabled={loading}
                  direction="auto"
                />
              </div>

              {/* Year of Study */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Year of Study <span className="text-orange-400">*</span>
                </label>
                <CustomSelect
                  value={year}
                  onChange={setYear}
                  options={YEAR_OPTIONS}
                  disabled={loading}
                  direction="auto"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

