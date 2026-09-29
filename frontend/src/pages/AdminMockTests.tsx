//Testing

import React, { useState, useRef, useEffect } from 'react';
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
  Loader2,
  Trash2,
  X,
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
const FILTERS = ['All', 'Departmental', 'Aptitude', 'Technical', 'General'] as const;
type Filter = typeof FILTERS[number];

/* ─── Category badge styles ──────────────────────────────────── */
const categoryStyle = (category: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat === 'aptitude') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (cat === 'technical') return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
  return 'bg-orange-500/10 text-orange-300 border-orange-500/20';
};

/* ─── Shared input styles ─────────────────────────────────────── */
const inputCls =
  'w-full bg-[#16161d]/80 text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder-zinc-500 font-sans';
const labelCls = 'block text-xs font-semibold text-zinc-300 mb-1.5 tracking-wide';

/* ─── DEPT options ────────────────────────────────────────────── */
import { api } from '../lib/api';
import { parseCSVQuestions } from './MockTestView';

const DEPT_OPTIONS = [
  'All Departments',
  'CSE (Computer Science & Engineering)',
  'IT (Information Technology)',
  'ECE (Electronics & Communication Engineering)',
];
const YEAR_OPTIONS = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year'];
const TEST_TYPE_OPTIONS = ['Aptitude', 'Technical', 'General'] as const;

export const AdminMockTests: React.FC = () => {
  /* ── Real Database Tests state ── */
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState<boolean>(true);

  /* ── Upload form state ── */
  const [testTitle, setTestTitle] = useState('');
  const [testType, setTestType] = useState<'Aptitude' | 'Technical' | 'General'>('Aptitude');
  const [duration, setDuration] = useState(30);
  const [targetDept, setTargetDept] = useState(DEPT_OPTIONS[0]);
  const [targetYear, setTargetYear] = useState(YEAR_OPTIONS[4]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Filter state ── */
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  /* ── Delete state ── */
  const [testToDelete, setTestToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteMockTest(testToDelete.id);
      setTests(prev => prev.filter(t => t.id !== testToDelete.id));
      setTestToDelete(null);
    } catch (err: any) {
      console.error('Failed to remove mock test:', err);
      setDeleteError(err.message || 'Failed to remove mock test');
    } finally {
      setDeleting(false);
    }
  };

  const fetchAdminTests = async () => {
    setLoadingTests(true);
    try {
      const res = await api.getTests();
      if (res && Array.isArray(res.tests)) {
        setTests(res.tests);
      }
    } catch (e) {
      console.error('Failed to load admin mock tests', e);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchAdminTests();
  }, []);

  /* ── Filtered tests ── */
  const filteredTests = tests.filter(t => {
    const qCount = t.total_questions ?? t.totalQuestions ?? t.questionCount ?? 0;
    if (qCount <= 0) return false;
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Departmental') return t.target_department_id != null;
    const tt = (t.test_type || t.category || '').toLowerCase();
    if (activeFilter === 'Aptitude') return tt === 'aptitude';
    if (activeFilter === 'Technical') return tt === 'technical';
    if (activeFilter === 'General') return tt === 'general';
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setParsedQuestions([]);
      setCsvError(null);
      return;
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { questions, error } = parseCSVQuestions(text);
      if (error) {
        setCsvError(error);
        setParsedQuestions([]);
      } else {
        setCsvError(null);
        setParsedQuestions(questions);
      }
    };
    reader.readAsText(file);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    if (parsedQuestions.length === 0) {
      setCsvError("Please select a valid CSV file with questions.");
      return;
    }
    setPublishing(true);
    setCsvError(null);

    let deptCode = "All";
    if (targetDept.includes("CS")) deptCode = "CSE";
    else if (targetDept.includes("IT")) deptCode = "IT";
    else if (targetDept.includes("ECE")) deptCode = "ECE";

    let yearCode = "All";
    if (targetYear.includes("1st")) yearCode = "1st Year";
    else if (targetYear.includes("2nd")) yearCode = "2nd Year";
    else if (targetYear.includes("3rd")) yearCode = "3rd Year";
    else if (targetYear.includes("4th")) yearCode = "4th Year";

    try {
      await api.uploadCSVTest({
        title: testTitle.trim(),
        duration: Number(duration),
        test_type: testType.toLowerCase(),
        target_dept: deptCode,
        target_year: yearCode,
        questions: parsedQuestions
      });

      await fetchAdminTests();
      setPublishing(false);
      setPublishSuccess(true);
      setTestTitle('');
      setCsvFile(null);
      setParsedQuestions([]);
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err: any) {
      setPublishing(false);
      setCsvError(err?.message || "Failed to publish test via API");
    }
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
            <div className="md:col-span-5">
              <label className={labelCls}>
                Test Title <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                required
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                placeholder="e.g. Data Structures & Algorithms – CSE 4th Year"
                className={inputCls}
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>
                Test Type <span className="text-orange-400">*</span>
              </label>
              <select
                value={testType}
                onChange={e => setTestType(e.target.value as any)}
                className={inputCls}
              >
                {TEST_TYPE_OPTIONS.map(tt => (
                  <option key={tt} value={tt} className="bg-[#121217]">{tt}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
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
            <div className="md:col-span-2">
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
            <div className="md:col-span-4">
              <label className={labelCls}>Target Year</label>
              <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className={inputCls}>
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y} className="bg-[#121217]">{y}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-8">
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
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {csvError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

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
              {parsedQuestions.length > 0 && !csvError ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Ready to publish {parsedQuestions.length} question(s)
                </span>
              ) : csvFile ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Parsing CSV...
                </span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> No CSV file loaded yet
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={publishing || parsedQuestions.length === 0}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 font-button"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Plus className="w-4 h-4" />}
              <span>{publishing ? 'Publishing Drive...' : 'Publish & Assign Quiz'}</span>
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${activeFilter === f
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
                filteredTests.map(test => {
                  const durationMins = test.duration_minutes ?? test.durationMinutes ?? test.durationMins ?? 30;
                  const qCount = test.total_questions ?? test.totalQuestions ?? test.questionCount ?? 0;
                  const deptTag = test.target_department_code || test.targetDept || (test.target_department_id ? 'Departmental' : 'All Departments');
                  const yearTag = test.target_year ? `${test.target_year}th Year` : (test.targetYear || 'All Years');
                  const typeLabel = (test.test_type || test.category || 'General').toUpperCase();

                  return (
                    <motion.div
                      key={test.id}
                      layout
                      className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-orange-500/30 rounded-2xl p-5 space-y-4 transition-all duration-200 group relative flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Badge Tag */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg border text-[10px] font-bold font-mono tracking-wider uppercase ${categoryStyle(typeLabel)}`}>
                            {typeLabel}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium text-zinc-400 font-mono">
                            {deptTag} • {yearTag}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="space-y-1">
                          <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors font-heading leading-snug">
                            {test.title}
                          </h3>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2">
                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                            {qCount > 0 ? `${qCount} Questions` : 'Questions: —'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {durationMins > 0 ? `${durationMins} Mins` : 'Mins: —'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                            Published
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTestToDelete(test);
                              setDeleteError(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium active:scale-95"
                            title="Remove this mock test from active use"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </motion.div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {testToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans"
            onClick={() => {
              if (!deleting) {
                setTestToDelete(null);
                setDeleteError(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mono-card p-6 max-w-md w-full relative space-y-5 shadow-2xl border border-white/10 bg-[#0d0d0d] rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Remove Mock Test
                    </h3>
                    <p className="text-xs text-zinc-400">Confirm test removal from active use</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setTestToDelete(null);
                    setDeleteError(null);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
                <p>
                  Are you sure you want to remove <strong className="text-white">"{testToDelete.title}"</strong>?
                </p>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-zinc-400 font-mono text-[11px]">
                  <div className="flex items-start gap-2 text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>The test will no longer be available to students.</span>
                  </div>
                  <div className="flex items-start gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
                    <span>It will be removed from the active admin list.</span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>Historical student attempts and answers will remain fully preserved.</span>
                  </div>
                </div>

                {deleteError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {deleteError}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setTestToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2a2e2f] hover:bg-[#323637] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Test</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

