import React, { useState, useRef, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Loader2,
  Trash2,
  X,
  CheckSquare,
} from 'lucide-react';
import { api } from '../lib/api';
import { parseCSVQuestions } from './MockTestView';
import { CustomSelect } from '../components/CustomSelect';

/* ─── Motion ──────────────────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, willChange: 'transform, opacity' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] } },
};

/* ─── Filter tabs ─────────────────────────────────────────────── */
const FILTERS = ['All', 'General', 'Aptitude', 'Technical'] as const;
type Filter = typeof FILTERS[number];

/* ─── Category badge styles ──────────────────────────────────── */
const categoryStyle = (category: string): string => {
  const cat = (category || '').toLowerCase();
  if (cat === 'aptitude') return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
  if (cat === 'technical') return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
  return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
};

const inputCls =
  'w-full bg-[#141414] text-xs sm:text-sm text-white px-4 py-2.5 rounded-full border border-white/15 hover:border-white/30 outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all placeholder-zinc-500 font-sans';
const labelCls = 'block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide';

/* ─── Dropdown Options ────────────────────────────────────────── */
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 py-4 font-sans max-w-7xl mx-auto w-full">

      {/* ── Page Hero (Naked style matching Student Dashboard & AdminPanel) ── */}
      <motion.div variants={itemVariants} className="py-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="mono-badge rounded-full text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">
                TPO Cell · Mock Drives
              </span>
              <span className="text-[11px] text-zinc-600 font-medium tabular-nums">
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading" style={{ letterSpacing: '-0.03em' }}>
              Mock Placement Drives
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
              Create, configure, and publish targeted mock assessment drives for placement preparation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Section 1: Quiz Upload Hub Card ── */}
      <motion.div variants={itemVariants} className="mono-card p-4 sm:p-6 space-y-5 min-w-0 relative z-20">

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-orange-400 shrink-0" />
              <h2 className="font-bold text-base text-white font-heading">Quiz Upload Hub</h2>
            </div>
            <p className="text-xs text-zinc-400">Create &amp; assign targeted assessments by uploading question banks in CSV format</p>
          </div>

          {publishSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published Successfully!
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handlePublish} className="space-y-4">
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
              <CustomSelect
                value={testType}
                onChange={val => setTestType(val as any)}
                options={TEST_TYPE_OPTIONS as unknown as string[]}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>
                Duration (mins) <span className="text-orange-400">*</span>
              </label>
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setDuration(prev => Math.max(5, prev - 5))}
                  className="absolute left-1.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold active:scale-95 z-10"
                  title="Decrease duration by 5 mins"
                >
                  &minus;
                </button>
                <input
                  type="number"
                  required
                  min={5}
                  max={180}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-[#141414] text-xs sm:text-sm text-white text-center px-9 py-2.5 rounded-full border border-white/15 hover:border-white/30 outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all font-sans font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setDuration(prev => Math.min(180, prev + 5))}
                  className="absolute right-1.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold active:scale-95 z-10"
                  title="Increase duration by 5 mins"
                >
                  +
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Target Department</label>
              <CustomSelect
                value={targetDept}
                onChange={setTargetDept}
                options={DEPT_OPTIONS}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className={labelCls}>Target Year</label>
              <CustomSelect
                value={targetYear}
                onChange={setTargetYear}
                options={YEAR_OPTIONS}
              />
            </div>
            <div className="md:col-span-8">
              <label className={labelCls}>
                Upload CSV Question Bank <span className="text-orange-400">*</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-between px-3.5 py-1.5 rounded-full border border-white/15 hover:border-white/30 bg-[#141414] hover:bg-[#1a1a1a] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-full bg-white/10 group-hover:bg-orange-500/20 group-hover:text-orange-300 text-xs font-semibold text-white transition-all cursor-pointer shrink-0"
                  >
                    Choose File
                  </button>
                  <span className="text-xs text-zinc-400 truncate">
                    {csvFile ? csvFile.name : 'No file chosen (CSV format)'}
                  </span>
                </div>
                <UploadCloud className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors shrink-0 ml-2 mr-1" />
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {csvError && (
            <div className="p-3 rounded-full px-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}

          {/* Format Helper Banner */}
          <div className="p-3.5 px-5 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 font-mono tracking-wider uppercase">CSV Header Format Required:</span>
            <p className="text-xs font-mono text-zinc-400 leading-relaxed overflow-x-auto whitespace-nowrap">
              Question, Option A, Option B, Option C, Option D, Correct Option (A/B/C/D), Explanation
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
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
              className="btn-primary py-2.5 px-6 rounded-full text-xs font-bold text-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-heading"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Plus className="w-4 h-4" />}
              <span>{publishing ? 'Publishing Drive...' : 'Publish Test'}</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── Section 2: Mock Placement Drives Library Grid ── */}
      <motion.div variants={itemVariants} className="mono-card p-4 sm:p-6 space-y-5 min-w-0">

        {/* Filter Toolbar Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-orange-400 shrink-0" />
              <h2 className="font-bold text-base text-white font-heading">Mock Placement Drives</h2>
            </div>
            <p className="text-xs text-zinc-400">Assessment quizzes configured for placement preparation</p>
          </div>

          {/* Category Filter Pills (matching Student Dashboard drive filters) */}
          <div className="flex items-center bg-[#2a2e2f] p-1 rounded-full border border-white/10 text-xs self-start xl:self-auto overflow-x-auto no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all cursor-pointer active:scale-[0.97] whitespace-nowrap text-xs ${activeFilter === f
                  ? 'bg-[#000000] text-white shadow-sm font-semibold border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                {f === 'All' ? 'All Drives' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Test Cards List */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredTests.length === 0 ? (
                <div className="col-span-full py-12 text-center space-y-3 bg-[#141414] border border-white/10 rounded-xl">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-semibold text-zinc-400">No mock test modules found matching "{activeFilter}".</p>
                </div>
              ) : (
                filteredTests.map(test => {
                  const durationMins = test.duration_minutes ?? test.durationMinutes ?? test.durationMins ?? 30;
                  const qCount = test.total_questions ?? test.totalQuestions ?? test.questionCount ?? 0;
                  const deptTag = test.target_department_code || test.targetDept || (test.target_department_id ? 'Targeted' : 'All Departments');
                  const yearTag = test.target_year ? `${test.target_year}th Year` : (test.targetYear || 'All Years');
                  const typeLabel = (test.test_type || test.category || 'General').toUpperCase();

                  return (
                    <motion.div
                      key={test.id}
                      layout
                      className="bg-[#0d0d0d] hover:bg-[#141414] border border-white/10 hover:border-orange-500/30 rounded-xl p-5 space-y-4 transition-all duration-200 group relative flex flex-col justify-between shadow-sm"
                    >
                      <div className="space-y-3">
                        {/* Badges Row */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold font-mono tracking-wider uppercase ${categoryStyle(typeLabel)}`}>
                            {typeLabel}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1a1a1a] border border-white/10 text-[10px] font-medium text-zinc-400 font-mono">
                            {deptTag} &middot; {yearTag}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors font-heading leading-snug">
                          {test.title}
                        </h3>
                      </div>

                      {/* Footer Info & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2 flex-wrap">
                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                            {qCount > 0 ? `${qCount} Questions` : 'Questions: —'}
                          </span>
                          <span className="text-zinc-600">&middot;</span>
                          <span className="flex items-center gap-1.5">
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
                            className="px-2.5 py-1 rounded-full bg-[#2a2e2f] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-zinc-300 hover:text-rose-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium active:scale-95"
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
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
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
                  className="px-4 py-2 rounded-full bg-[#2a2e2f] hover:bg-[#323637] border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50"
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
