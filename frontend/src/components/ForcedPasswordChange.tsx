import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { forcedChangePasswordApi } from '../lib/api';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

export const ForcedPasswordChange: React.FC = () => {
  const { user, completeForcedPasswordChange, logoutUser } = useApp();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await forcedChangePasswordApi({
        newPassword,
        confirmPassword,
      });

      setIsSuccess(true);
      // Brief feedback before proceeding into the dashboard
      setTimeout(() => {
        completeForcedPasswordChange();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-body,#08080c)] flex flex-col justify-between font-sans relative overflow-hidden select-none">
      {/* Top minimal bar with logo and Logout */}
      <header className="w-full bg-black/40 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <img
            src="/new_logo.png"
            alt="Impulse Logo"
            className="w-9 h-9 rounded-xl object-contain shadow-md"
          />
          <span
            className="text-lg font-normal text-white tracking-tight"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Impulse
          </span>
        </div>

        <button
          onClick={logoutUser}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer transition-all active:scale-95"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5 text-zinc-400" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#0d0d12]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6"
        >
          {/* Header Icon + Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-lg mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight font-sans">
              Password Reset Required
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
              Your password was reset by the Placement Administrator. Create a new password to continue.
            </p>
            {user?.email && (
              <p className="text-[11px] text-zinc-500 font-mono">
                Account: {user.email}
              </p>
            )}
          </div>

          {/* Error Message Banner */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2"
            >
              <span className="shrink-0 font-bold">!</span>
              <span className="leading-tight">{errorMsg}</span>
            </motion.div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Password updated successfully! Entering dashboard...</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isSubmitting || isSuccess}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={isSubmitting || isSuccess}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full outline-none focus:outline-none"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Set New Password Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              <Lock className="w-4 h-4 text-black" />
              <span>{isSubmitting ? 'Updating Password...' : 'Set New Password'}</span>
            </button>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-white/10 z-10">
        <span
          className="font-medium text-zinc-400 tracking-[0.2em] uppercase text-[10px]"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          UNSTOP IGNITERS CLUB UCEK
        </span>
      </footer>
    </div>
  );
};

export default ForcedPasswordChange;
