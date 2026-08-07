import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Plus,
  Clock,
  FileText,
  GraduationCap,
  Building2,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ChevronRight,
  ShieldCheck,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

/* ─── Motion ──────────────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, ease: [0.23, 1, 0.32, 1] } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } },
};

/* ─── Filter tabs ─────────────────────────────────────────────── */
const FILTERS = ['All', 'Company Drive', 'Departmental', 'Aptitude', 'Technical'] as const;
type Filter = typeof FILTERS[number];

/* ─── Category badge styles ──────────────────────────────────── */
const categoryStyle = (category: string): string => {
  if (category === 'Company Drive') return 'bg-violet-500/10 text-violet-300 border-violet-500/20';
  if (category === 'Aptitude') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (category === 'Technical') return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
  return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
};

const categoryLabel = (category: string, companyTag?: string, dept?: string): string => {
  if (category === 'Company Drive' && companyTag) return `Company Drive · ${companyTag}`;
  if (dept) return `Departmental · ${dept}`;
  return category;
};

/* ─── Shared input styles ─────────────────────────────────────── */
const inputCls =
  'w-full bg-[#16161d]/80 text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-zinc-500 font-sans';
const labelCls = 'block text-xs font-semibold text-zinc-300 mb-1.5 tracking-wide';

/* ─── DEPT options ────────────────────────────────────────────── */
const DEPT_OPTIONS = [
  'Computer Science & Engg',
  'Electronics & Comm Engg',
  'Information Technology',
  'EEE',
  'Mechanical',
  'Biotech',
];
const YEAR_OPTIONS = ['1st Year (2028)', '2nd Year (2027)', '3rd Year (2026)', '4th Year (2025)'];

export const AdminMockTests: React.FC = () => {
  const { mockTests, publishTest } = useApp();

  /* ── Upload form state ── */
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [targetDept, setTargetDept] = useState(DEPT_OPTIONS[0]);
  const [targetYear, setTargetYear] = useState(YEAR_OPTIONS[3]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Filter state ── */
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  /* ── Filtered tests ── */
  const filteredTests = mockTests.filter(t => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Company Drive') return t.category === 'Company Drive';
    if (activeFilter === 'Departmental') return t.category === 'Technical' && !t.companyTag;
    if (activeFilter === 'Aptitude') return t.category === 'Aptitude';
    if (activeFilter === 'Technical') return t.category === 'Technical';
    return true;
  });

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    setPublishing(true);
    setTimeout(() => {
      publishTest({
        title: testTitle,
        category: 'Technical',
        durationMinutes: duration,
        questionCount: 0,
        description: `Departmental assessment for ${targetDept} (${targetYear}).`,
        companyTag: undefined,
      });
      setPublishing(false);
      setPublishSuccess(true);
      setTestTitle('');
      setCsvFile(null);
      setTimeout(() => setPublishSuccess(false), 3000);
    }, 400);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

      {/* ── Page Hero ── */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-[#121217]/90 border border-white/10 backdrop-blur-2xl px-6 py-6 shadow-xl">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-b from-orange-500 via-amber-400 to-transparent rounded-l-2xl" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-1">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[11px] font-medium text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Assessment Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              Mock Placement Drives
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Create, configure, and publish departmental mock assessment drives for placement preparation.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-semibold text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              Admin Portal Mode
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Section 1: Quiz Upload Hub Card ── */}
      <motion.div variants={itemVariants} className="bg-[#121217]/90 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden">
        
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">ADMIN PORTAL · ASSESSMENT MANAGEMENT</span>
              </div>
              <h2 className="text-lg font-bold text-white font-heading tracking-tight">Departmental Quiz Upload Hub</h2>
              <p className="text-xs text-zinc-400">Create & assign targeted assessments by uploading question banks in CSV format.</p>
            </div>
          </div>

          {publishSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <CheckCircle2 className="w-4 h-4" /> Published Successfully!
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublish} className="p-6 space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className={labelCls}>
                Test Title <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                required
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms – CS 4th Year"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>
                Duration (mins) <span className="text-orange-400">*</span>
              </label>
              <input
                type="number"
                required
                min={5}
                max={180}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Target Department</label>
              <select value={targetDept} onChange={e => setTargetDept(e.target.value)} className={inputCls}>
                {DEPT_OPTIONS.map(d => (
                  <option key={d} value={d} className="bg-[#121217]">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <label className={labelCls}>Target Year</label>
              <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className={inputCls}>
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y} className="bg-[#121217]">{y}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-7">
              <label className={labelCls}>
                Upload CSV Question Bank <span className="text-orange-400">*</span>
              </label>
              <div 
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-between px-4 py-2 rounded-xl border border-white/10 bg-[#16161d]/80 hover:border-orange-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-orange-500/20 group-hover:text-orange-300 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                  >
                    Choose File
                  </button>
                  <span className="text-xs text-zinc-400 truncate max-w-[220px]">
                    {csvFile ? csvFile.name : 'No file chosen'}
                  </span>
                </div>
                <UploadCloud className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
          </div>

          {/* Format Helper Banner */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 font-mono tracking-wider uppercase">CSV Header Format Required:</span>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed overflow-x-auto whitespace-nowrap">
              Question, Option A, Option B, Option C, Option D, Correct Option (A/B/C/D), Explanation
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              {csvFile ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Ready to parse ({csvFile.name})
                </span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> No CSV file loaded yet
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 font-button"
            >
              <Plus className="w-4 h-4" />
              <span>{publishing ? 'Publishing Drive...' : 'Publish Quiz'}</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── Section 2: Mock Test Library Grid ── */}
      <motion.div variants={itemVariants} className="bg-[#121217]/90 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden">
        
        {/* Filter Toolbar Header */}
        <div className="px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">PLACEMENT MOCK TEST MODULE</span>
            <h2 className="text-lg font-bold text-white font-heading tracking-tight">Departmental Mock Placement Drives</h2>
            <p className="text-xs text-zinc-400">Targeted assessment quizzes specific to your engineering branch and year.</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                  activeFilter === f
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold shadow-sm'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Test Cards List */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredTests.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-zinc-500 font-sans text-xs">
                  No mock test modules found matching the selected filter.
                </div>
              ) : (
                filteredTests.map(test => (
                  <motion.div
                    key={test.id}
                    layout
                    className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-orange-500/30 rounded-2xl p-5 space-y-4 transition-all duration-200 group relative flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Badge Tag */}
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg border text-[10px] font-bold font-mono tracking-wider uppercase ${categoryStyle(test.category)}`}>
                          {categoryLabel(test.category, test.companyTag)}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors font-heading leading-snug">
                          {test.title}
                        </h3>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">
                          {test.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-zinc-500" />
                          {test.questionCount > 0 ? `${test.questionCount} Questions` : 'Questions: —'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {test.durationMinutes > 0 ? `${test.durationMinutes} Mins` : 'Mins: —'}
                        </span>
                      </div>

                      <button className="px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95">
                        <span>Start Test</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>

    </motion.div>
  );
};

