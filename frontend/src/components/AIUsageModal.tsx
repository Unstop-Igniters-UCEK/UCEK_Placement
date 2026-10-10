import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import { FeatureUsage, AIUsageResponse } from '../lib/api';

interface AIUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'explanation' | 'limit_reached';
  featureKey: 'resume_reviewer' | 'jd_matcher' | 'hr_interview';
  featureUsage?: FeatureUsage | null;
  allUsage?: AIUsageResponse | null;
}

export const AIUsageModal: React.FC<AIUsageModalProps> = ({
  isOpen,
  onClose,
  mode,
  featureKey,
  featureUsage,
  allUsage,
}) => {
  if (!isOpen) return null;

  const getFeatureTitle = (key: string) => {
    switch (key) {
      case 'resume_reviewer':
        return 'Resume Reviewer';
      case 'jd_matcher':
        return 'JD Matcher';
      case 'hr_interview':
        return 'HR Interview';
      default:
        return 'AI Feature';
    }
  };

  const featureName = getFeatureTitle(featureKey);
  const resetDate = featureUsage?.reset_date || allUsage?.reset_date || 'the 1st of next month';
  const usedCount = featureUsage?.used ?? 0;
  const limitCount = featureUsage?.limit ?? (featureKey === 'hr_interview' ? 4 : 2);

  // Consolidated feature list with current usage data
  const featureList = [
    {
      key: 'resume_reviewer',
      label: 'Resume Reviews',
      used: allUsage?.features?.resume_reviewer?.used ?? (featureKey === 'resume_reviewer' ? usedCount : 0),
      limit: allUsage?.features?.resume_reviewer?.limit ?? 2,
    },
    {
      key: 'jd_matcher',
      label: 'JD Matches',
      used: allUsage?.features?.jd_matcher?.used ?? (featureKey === 'jd_matcher' ? usedCount : 0),
      limit: allUsage?.features?.jd_matcher?.limit ?? 2,
    },
    {
      key: 'hr_interview',
      label: 'HR Practices',
      used: allUsage?.features?.hr_interview?.used ?? (featureKey === 'hr_interview' ? usedCount : 0),
      limit: allUsage?.features?.hr_interview?.limit ?? 4,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-6 z-10 font-sans text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-heading">
                {mode === 'explanation' ? 'Monthly AI Usage Limits' : 'Monthly Allowance Reached'}
              </h3>
              <p className="text-xs text-zinc-400">
                {mode === 'explanation'
                  ? `Resource allocation for ${featureName}`
                  : `${featureName} allowance used for this month`}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {mode === 'explanation' ? (
            /* ─── ONE-TIME EXPLANATION POPUP ──────────────────────────────────── */
            <div className="mt-4 space-y-4 font-sans">
              {/* Exact Suggested Copy */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-zinc-300 leading-relaxed font-sans">
                To keep Impulse completely free for students, AI features have monthly usage limits because each request incurs processing costs. Your available usage is shown below.
              </div>

              {/* Usage Cards Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  <span>Current Monthly Allowance</span>
                  {allUsage?.month && (
                    <span className="text-zinc-500 font-normal">{allUsage.month}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {featureList.map((item) => {
                    const isCurrent = item.key === featureKey;
                    return (
                      <div
                        key={item.key}
                        className={`px-3.5 py-2.5 rounded-full border flex items-center justify-between gap-2 transition-all ${
                          isCurrent
                            ? 'bg-orange-500/[0.08] border-orange-500/30 text-orange-200'
                            : 'bg-white/[0.02] border-white/10 text-zinc-300'
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold truncate ${
                            isCurrent ? 'text-orange-300' : 'text-zinc-300'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-white shrink-0">
                          {item.used} / {item.limit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset date info strip (pill shaped) */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.02] border border-white/10 text-xs text-zinc-400 font-sans">
                <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="leading-snug truncate">
                  Allowances reset automatically on the 1st of each month (
                  <span className="text-zinc-200 font-medium font-mono">{resetDate}</span>).
                </span>
              </div>

              {/* Modal Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Got it, continue
                </button>
              </div>
            </div>
          ) : (
            /* ─── LIMIT REACHED POPUP ────────────────────────────────────────── */
            <div className="mt-4 space-y-4 font-sans">
              {/* Limit Reached Banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5 leading-relaxed font-sans">
                <p>
                  You have used all{' '}
                  <span className="font-bold text-white font-mono">
                    {limitCount} of {limitCount}
                  </span>{' '}
                  available {featureUsage?.label || featureName} for this calendar month.
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Your allowance will reset on{' '}
                  <span className="font-bold text-white font-mono">{resetDate}</span>.
                </p>
              </div>

              {/* Reset Date Notice (pill shaped) */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/[0.02] border border-white/10 text-xs text-zinc-400 font-sans">
                <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="leading-snug truncate">
                  Allowances reset automatically on the 1st of each calendar month (
                  <span className="text-zinc-200 font-medium font-mono">{resetDate}</span>).
                </span>
              </div>

              {/* Policy note */}
              <p className="text-[11px] text-zinc-400 leading-relaxed px-1">
                To keep Impulse completely free for all students, monthly limits ensure sustainable AI access for the entire campus. Thank you for your understanding!
              </p>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary w-full py-2.5 text-xs font-bold rounded-full cursor-pointer shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  Understood
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
