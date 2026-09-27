import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User as UserIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomSelect } from './CustomSelect';

const DEPARTMENT_OPTIONS = [
  'Computer Science & Engg',
  'Electronics & Comm Engg',
  'Information Technology',
  'Electrical & Electronics Engg',
  'Mechanical Engg',
  'Civil Engg'
];

const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year'
];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [branch, setBranch] = useState(user?.branch || 'Computer Science & Engg');
  const [year, setYear] = useState(user?.year || '4th Year');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state with current user when opened
  React.useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setBranch(user.branch || 'Computer Science & Engg');
      setYear(user.year || '4th Year');
      setError(null);
      setSuccess(false);
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
          onClick={loading ? undefined : onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-[#0e0e13] border border-white/15 rounded-3xl shadow-2xl p-6 overflow-hidden z-10 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Edit Profile</h3>
                <p className="text-[11px] text-zinc-400">Update your academic and personal information</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
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
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans"
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
                options={DEPARTMENT_OPTIONS}
                disabled={loading}
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
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
