import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  UploadCloud,
  Plus,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Flag,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Award,
  Play,
  X,
  HelpCircle,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { api } from '../lib/api';

/* ─── CSV Parser Helper ────────────────────────────────────────── */
interface ParsedQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export function parseCSVQuestions(csvText: string): { questions: ParsedQuestion[]; error: string | null } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length < 2) {
    return { questions: [], error: 'CSV file is empty or missing question rows.' };
  }

  const parseRow = (rowStr: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inQ = false;
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        if (inQ && rowStr[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim());

  const hasQuestion = headers.some(h => h === "question" || h.includes("question"));
  const hasOptA = headers.some(h => h === "option a" || h.includes("option a"));
  const hasOptB = headers.some(h => h === "option b" || h.includes("option b"));
  const hasOptC = headers.some(h => h === "option c" || h.includes("option c"));
  const hasOptD = headers.some(h => h === "option d" || h.includes("option d"));
  const hasCorrect = headers.some(h => h.includes("correct option") || h.includes("correct"));
  const hasExp = headers.some(h => h.includes("explanation"));

  if (!hasQuestion || !hasOptA || !hasOptB || !hasOptC || !hasOptD || !hasCorrect || !hasExp) {
    return {
      questions: [],
      error: "CSV missing required headers: Question, Option A, Option B, Option C, Option D, Correct Option (A/B/C/D), Explanation"
    };
  }

  const getIdx = (term: string) => {
    if (term === "correct option") {
      return headers.findIndex(h => h.includes("correct option") || h.includes("correct"));
    }
    return headers.findIndex(h => h.includes(term));
  };

  const qIdx = getIdx("question");
  const optAIdx = getIdx("option a");
  const optBIdx = getIdx("option b");
  const optCIdx = getIdx("option c");
  const optDIdx = getIdx("option d");
  const correctIdx = getIdx("correct option");
  const expIdx = getIdx("explanation");

  const parsed: ParsedQuestion[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (row.length < 5) continue;

    const qText = row[qIdx] || '';
    const optA = row[optAIdx] || '';
    const optB = row[optBIdx] || '';
    const optC = row[optCIdx] || '';
    const optD = row[optDIdx] || '';
    const rawCorrect = (row[correctIdx] || '').trim().toUpperCase();
    const explanation = expIdx >= 0 ? (row[expIdx] || '') : '';

    if (!qText) continue;

    let correctIndex = 0;
    if (rawCorrect === 'A' || rawCorrect === '1' || rawCorrect === '0') correctIndex = 0;
    else if (rawCorrect === 'B' || rawCorrect === '2' || rawCorrect === '1') correctIndex = 1;
    else if (rawCorrect === 'C' || rawCorrect === '3' || rawCorrect === '2') correctIndex = 2;
    else if (rawCorrect === 'D' || rawCorrect === '4' || rawCorrect === '3') correctIndex = 3;

    parsed.push({
      question: qText,
      options: [optA, optB, optC, optD],
      correctOptionIndex: correctIndex,
      explanation
    });
  }

  if (parsed.length === 0) {
    return { questions: [], error: 'No valid question rows found in CSV file.' };
  }

  return { questions: parsed, error: null };
}

const DEPT_DROPDOWN_OPTIONS = [
  "All Departments",
  "CS (Computer Science & Engg)",
  "IT (Information Technology)",
  "ECE (Electronics & Comm)",
  "EEE (Electrical & Electronics)",
  "Mechanical",
  "Civil"
];

const YEAR_DROPDOWN_OPTIONS = [
  "All Years",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

export const MockTestView: React.FC = () => {
  const { user, mockTests: contextTests } = useApp();

  // Catalog tests state
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Admin Upload state
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [targetDept, setTargetDept] = useState(DEPT_DROPDOWN_OPTIONS[0]);
  const [targetYear, setTargetYear] = useState(YEAR_DROPDOWN_OPTIONS[0]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Active Exam state
  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [loadingTestDetails, setLoadingTestDetails] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);

  // Fetch quizzes accessible to student/admin
  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const res = await api.getTests();
      if (res && res.tests && Array.isArray(res.tests)) {
        setTests(res.tests);
      } else {
        setTests(contextTests || []);
      }
    } catch (e) {
      setTests(contextTests || []);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [user]);

  // Handle CSV Selection & Parsing
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

  // Admin Publish Quiz
  const handlePublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;
    if (parsedQuestions.length === 0) {
      setCsvError("Please upload a valid CSV file with questions before publishing.");
      return;
    }

    setPublishing(true);
    try {
      let deptCode = "All";
      if (targetDept.includes("CS")) deptCode = "CS";
      else if (targetDept.includes("IT")) deptCode = "IT";
      else if (targetDept.includes("ECE")) deptCode = "ECE";
      else if (targetDept.includes("EEE")) deptCode = "EEE";
      else if (targetDept.includes("Mechanical")) deptCode = "Mechanical";
      else if (targetDept.includes("Civil")) deptCode = "Civil";

      let yearCode = "All";
      if (targetYear.includes("1st")) yearCode = "1st Year";
      else if (targetYear.includes("2nd")) yearCode = "2nd Year";
      else if (targetYear.includes("3rd")) yearCode = "3rd Year";
      else if (targetYear.includes("4th")) yearCode = "4th Year";

      await api.uploadCSVTest({
        title: testTitle,
        duration: Number(duration),
        target_dept: deptCode,
        target_year: yearCode,
        questions: parsedQuestions
      });

      setPublishSuccess(true);
      setTestTitle('');
      setCsvFile(null);
      setParsedQuestions([]);
      setCsvError(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchTests();
      setTimeout(() => setPublishSuccess(false), 4000);
    } catch (err: any) {
      setCsvError(err?.message || "Failed to publish test.");
    } finally {
      setPublishing(false);
    }
  };

  // Start Assessment
  const handleStartAssessment = async (test: any) => {
    setLoadingTestDetails(true);
    setActiveTest(test);
    setExamSubmitted(false);
    setExamResult(null);
    setUserAnswers({});
    setReviewFlags({});
    setCurrentQIdx(0);

    try {
      const details = await api.getTestDetails(test.id);
      if (details && details.questions) {
        setTestQuestions(details.questions);
      } else {
        setTestQuestions(test.questions || []);
      }
    } catch (e) {
      setTestQuestions(test.questions || []);
    } finally {
      setLoadingTestDetails(false);
      setTimeLeftSec((test.durationMins || test.durationMinutes || 30) * 60);
    }
  };

  // Timer effect
  useEffect(() => {
    if (!activeTest || examSubmitted) return;
    if (timeLeftSec <= 0) {
      handleFinalSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftSec(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, examSubmitted, timeLeftSec]);

  // Submit Quiz
  const handleFinalSubmitExam = async () => {
    if (!activeTest || submittingExam || examSubmitted) return;
    setSubmittingExam(true);

    const durationTotalSec = (activeTest.durationMins || activeTest.durationMinutes || 30) * 60;
    const timeTakenSec = Math.max(1, durationTotalSec - timeLeftSec);

    try {
      const res = await api.submitQuiz(activeTest.id, {
        answers: userAnswers,
        timeTakenSec
      });
      setExamResult(res);
    } catch (err) {
      let correctCount = 0;
      testQuestions.forEach((q: any) => {
        if (userAnswers[q.id] === q.correctOptionIndex) {
          correctCount++;
        }
      });
      const totalQuestions = testQuestions.length || 1;
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      setExamResult({
        score: correctCount,
        totalQuestions,
        percentage,
        passed: percentage >= (activeTest.passPercentage || 60),
        review: testQuestions.map((q: any) => ({
          ...q,
          userAnswer: userAnswers[q.id]
        }))
      });
    } finally {
      setSubmittingExam(false);
      setExamSubmitted(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtering catalog
  const filteredCatalog = tests.filter(t => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Departmental') return t.category === 'Departmental' || t.targetDept !== 'All';
    if (selectedCategory === 'Aptitude') return t.category === 'Aptitude';
    if (selectedCategory === 'Technical') return t.category === 'Technical';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-8 font-sans space-y-8">
      {/* ── Admin Quiz Creation Card (Admin Only) ── */}
      {user?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121217] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">
                  ADMIN PORTAL • ASSESSMENT MANAGEMENT
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight font-heading">
                  Departmental Quiz Upload Hub
                </h2>
              </div>
            </div>
            {publishSuccess && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Published Successfully!
              </span>
            )}
          </div>

          <form onSubmit={handlePublishQuiz} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Test Title <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder="e.g., Data Structures & Algorithms - CS 4th Year"
                  className="w-full bg-[#16161d] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-zinc-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Duration (mins) <span className="text-orange-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={180}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full bg-[#16161d] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Department
                </label>
                <select
                  value={targetDept}
                  onChange={e => setTargetDept(e.target.value)}
                  className="w-full bg-[#16161d] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500 transition-all"
                >
                  {DEPT_DROPDOWN_OPTIONS.map(d => (
                    <option key={d} value={d} className="bg-[#121217]">{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Target Year
                </label>
                <select
                  value={targetYear}
                  onChange={e => setTargetYear(e.target.value)}
                  className="w-full bg-[#16161d] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500 transition-all"
                >
                  {YEAR_DROPDOWN_OPTIONS.map(y => (
                    <option key={y} value={y} className="bg-[#121217]">{y}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Upload CSV Question Bank (.csv) <span className="text-orange-400">*</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-between px-4 py-2 rounded-xl border border-white/10 bg-[#16161d] hover:border-orange-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-white/10 group-hover:bg-orange-500/20 text-xs font-semibold text-white group-hover:text-orange-300 transition-all"
                    >
                      Choose File
                    </button>
                    <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                      {csvFile ? csvFile.name : 'No file chosen'}
                    </span>
                  </div>
                  <UploadCloud className="w-4 h-4 text-zinc-500 group-hover:text-orange-400" />
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            {/* Validation Feedback */}
            {csvError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{csvError}</span>
              </div>
            )}

            {parsedQuestions.length > 0 && !csvError && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to publish {parsedQuestions.length} question(s)
                </span>
              </div>
            )}

            {/* Helper Box */}
            <div className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
                Required CSV Template Format:
              </span>
              <p className="text-xs font-mono text-zinc-400 whitespace-nowrap overflow-x-auto">
                Question, Option A, Option B, Option C, Option D, Correct Option (A/B/C/D), Explanation
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={publishing || parsedQuestions.length === 0}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-black flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Plus className="w-4 h-4 text-black" />}
                <span>{publishing ? 'Publishing Drive...' : 'Publish & Assign Quiz'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* ── Active Quiz / Exam Interface Modal ── */}
      <AnimatePresence>
        {activeTest && (
          <div className="fixed inset-0 z-50 bg-[#09090b] overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 md:p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTest(null)}
                    className="p-2 rounded-xl bg-[#09090b] border border-white/10 text-zinc-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-white font-heading">{activeTest.title}</h2>
                    <span className="text-xs text-zinc-400 font-mono">
                      {activeTest.targetDept || activeTest.companyTag || 'Department Core'} • {testQuestions.length} Questions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
                    timeLeftSec < 180 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' : 'bg-[#09090b] border-white/10 text-orange-400'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(timeLeftSec)}</span>
                  </div>

                  {!examSubmitted && (
                    <button
                      onClick={handleFinalSubmitExam}
                      disabled={submittingExam}
                      className="btn-primary px-4 py-2 rounded-xl text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      {submittingExam ? 'Submitting...' : 'Submit Assessment'}
                    </button>
                  )}
                </div>
              </div>

              {/* Loading Test Questions */}
              {loadingTestDetails ? (
                <div className="py-20 text-center text-zinc-400 font-mono text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                  Loading Assessment Questions...
                </div>
              ) : examSubmitted && examResult ? (
                /* Post-Exam Result Screen */
                <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 space-y-8 text-center">
                  <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center border-4 bg-orange-500/10 border-orange-500/30 text-orange-400">
                    <span className="text-2xl font-extrabold">{examResult.percentage}%</span>
                  </div>

                  <div className="space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block ${
                      examResult.passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {examResult.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}
                    </span>
                    <h3 className="text-2xl font-bold text-white font-heading">
                      {examResult.passed ? 'Congratulations!' : 'Keep Practicing'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      You scored {examResult.score} out of {examResult.totalQuestions} questions correctly.
                    </p>
                  </div>

                  {/* Question Review Breakdown */}
                  <div className="text-left space-y-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                      Question Review Breakdown
                    </h4>
                    {examResult.review && examResult.review.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-white">
                            {idx + 1}. {item.question || item.title}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.userAnswer === item.correctOptionIndex ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {item.userAnswer === item.correctOptionIndex ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="text-zinc-400">
                            Your answer: <span className="text-white font-semibold">{item.options[item.userAnswer] || 'Not answered'}</span>
                          </div>
                          <div className="text-emerald-400">
                            Correct answer: <span className="font-semibold">{item.options[item.correctOptionIndex]}</span>
                          </div>
                        </div>

                        {item.explanation && (
                          <div className="text-[11px] text-zinc-400 p-2.5 rounded-lg bg-[#121217] border border-white/10 leading-relaxed">
                            <strong className="text-orange-400">Explanation:</strong> {item.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setActiveTest(null)}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
                  >
                    Close Review
                  </button>
                </div>
              ) : testQuestions.length > 0 ? (
                /* Question Taker View */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs font-mono font-bold text-orange-400">
                        Question {currentQIdx + 1} of {testQuestions.length}
                      </span>
                      <button
                        onClick={() => {
                          const qId = testQuestions[currentQIdx].id;
                          setReviewFlags(prev => ({ ...prev, [qId]: !prev[qId] }));
                        }}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          reviewFlags[testQuestions[currentQIdx]?.id]
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-[#09090b] border-white/10 text-zinc-400'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{reviewFlags[testQuestions[currentQIdx]?.id] ? 'Flagged' : 'Mark for Review'}</span>
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white leading-relaxed font-sans">
                      {testQuestions[currentQIdx]?.question || testQuestions[currentQIdx]?.title}
                    </h3>

                    <div className="space-y-3">
                      {testQuestions[currentQIdx]?.options.map((opt: string, optIdx: number) => {
                        const qId = testQuestions[currentQIdx].id;
                        const isSelected = userAnswers[qId] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [qId]: optIdx }))}
                            className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-orange-500/10 border-orange-500/50 text-white font-semibold'
                                : 'bg-[#09090b] border-white/10 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                                isSelected ? 'bg-orange-500 text-black' : 'bg-[#121217] border border-white/10 text-zinc-400'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <button
                        disabled={currentQIdx === 0}
                        onClick={() => setCurrentQIdx(prev => prev - 1)}
                        className="px-4 py-2 rounded-xl bg-[#09090b] border border-white/10 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentQIdx === testQuestions.length - 1}
                        onClick={() => setCurrentQIdx(prev => prev + 1)}
                        className="btn-primary px-4 py-2 rounded-xl text-black text-xs font-bold disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Palette Grid */}
                  <div className="lg:col-span-4 bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      Question Palette Grid
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                      {testQuestions.map((q, idx) => {
                        const answered = userAnswers[q.id] !== undefined;
                        const isCurrent = idx === currentQIdx;
                        const flagged = reviewFlags[q.id];
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQIdx(idx)}
                            className={`h-9 rounded-lg font-mono text-xs font-bold transition-all relative ${
                              isCurrent
                                ? 'ring-2 ring-orange-400 bg-orange-500 text-black'
                                : answered
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-[#09090b] border border-white/10 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {idx + 1}
                            {flagged && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Student Assessment Catalog Dashboard ── */}
      <div className="bg-[#121217]/90 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">
              STUDENT ASSESSMENT DASHBOARD
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight font-heading">
              Assessment & Quiz Catalog
            </h2>
            <p className="text-xs text-zinc-400">
              Assigned departmental tests for your cohort ({user?.branch || 'All Departments'} • {user?.year || 'All Years'})
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Departmental', 'Aptitude', 'Technical'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold shadow-sm'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        {loadingTests ? (
          <div className="py-12 text-center text-zinc-400 text-xs font-mono flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> Loading Quizzes...
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs bg-white/[0.02] rounded-xl border border-white/10 p-8 max-w-lg mx-auto space-y-2">
            <HelpCircle className="w-8 h-8 text-zinc-500 mx-auto" />
            <p className="font-semibold text-white">No Quizzes Found</p>
            <p className="text-zinc-500 leading-relaxed">
              There are currently no departmental quizzes assigned to your branch and year. Check back soon or select 'All' for general placement drives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map(test => (
              <div
                key={test.id}
                className="bg-white/[0.02] border border-white/10 hover:border-orange-500/40 rounded-xl p-5 space-y-4 flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-400 font-mono">
                      {test.targetDept || test.companyTag || 'Department Core'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-medium text-zinc-400 font-mono">
                      {test.targetYear || 'All Years'}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-orange-400 transition-colors font-heading">
                    {test.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="text-[11px] text-zinc-400 font-mono space-x-2">
                    <span>{test.durationMins || test.durationMinutes || 30} mins</span>
                    <span>•</span>
                    <span>{test.totalQuestions || test.questionCount || test.questions?.length || 0} Qs</span>
                    <span>•</span>
                    <span>Pass: {test.passPercentage || 60}%</span>
                  </div>

                  <button
                    onClick={() => handleStartAssessment(test)}
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Start</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestView;
