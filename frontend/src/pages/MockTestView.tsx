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
  ShieldAlert,
  ChevronDown,
  Check
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
  "CSE (Computer Science & Engineering)",
  "IT (Information Technology)",
  "ECE (Electronics & Communication Engineering)",
];

const YEAR_DROPDOWN_OPTIONS = [
  "All Years",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year"
];

const TEST_TYPE_OPTIONS = ["Aptitude", "Technical", "General"] as const;

// Helper to extract and format option text as "A. <text>", "B. <text>", etc.
function formatOptionWithLetter(item: any, letterOrIndex: any): string | null {
  if (letterOrIndex === null || letterOrIndex === undefined || letterOrIndex === '') {
    return null;
  }

  let letter: string | null = null;
  let idx = -1;

  if (typeof letterOrIndex === 'number') {
    idx = letterOrIndex;
    letter = ['A', 'B', 'C', 'D'][idx] || null;
  } else if (typeof letterOrIndex === 'string') {
    const trimmed = letterOrIndex.trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(trimmed)) {
      letter = trimmed;
      idx = { A: 0, B: 1, C: 2, D: 3 }[trimmed] ?? -1;
    } else if (/^[0-3]$/.test(trimmed)) {
      idx = parseInt(trimmed, 10);
      letter = ['A', 'B', 'C', 'D'][idx] || null;
    }
  }

  if (!letter || idx < 0) return null;

  // Retrieve option text from options array or individual option properties
  let text = '';
  if (Array.isArray(item?.options) && item.options[idx] !== undefined && item.options[idx] !== null) {
    text = String(item.options[idx]).trim();
  } else {
    const key = `option_${letter.toLowerCase()}`;
    if (item?.[key] !== undefined && item?.[key] !== null) {
      text = String(item[key]).trim();
    }
  }

  // If text already starts with the letter (e.g. "A. Paris" or "A) Paris"), avoid duplicating the letter
  if (text) {
    const regex = new RegExp(`^${letter}[\\.\\:\\)\\s]+\\s*`, 'i');
    if (regex.test(text)) {
      return text;
    }
    return `${letter}. ${text}`;
  }

  return letter;
}

export const MockTestView: React.FC = () => {
  const { user, mockTests: contextTests, highlightedTestId, setHighlightedTestId } = useApp();

  // Catalog tests state
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Admin Upload state
  const [testTitle, setTestTitle] = useState('');
  const [testType, setTestType] = useState<'Aptitude' | 'Technical' | 'General'>('Aptitude');
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
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);
  const [submitExamError, setSubmitExamError] = useState<string | null>(null);

  // ── Anti-Cheat & Assessment Session Protection State ──
  const [pendingTestToStart, setPendingTestToStart] = useState<any | null>(null);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [activeWarningModal, setActiveWarningModal] = useState<1 | 2 | null>(null);
  const [isMultiWindowBlocked, setIsMultiWindowBlocked] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [isTerminated, setIsTerminated] = useState<boolean>(false);
  const [terminationReason, setTerminationReason] = useState<string | null>(null);
  const [terminationMessage, setTerminationMessage] = useState<string | null>(null);

  const activeTestRef = useRef<any>(null);
  const examSubmittedRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const isTerminatedRef = useRef<boolean>(false);
  const hasLeftFocusRef = useRef<boolean>(false);
  const instanceIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    activeTestRef.current = activeTest;
  }, [activeTest]);

  useEffect(() => {
    examSubmittedRef.current = examSubmitted;
  }, [examSubmitted]);

  useEffect(() => {
    isTerminatedRef.current = isTerminated;
  }, [isTerminated]);

  // Fetch quizzes accessible to student/admin
  const fetchTests = async () => {
    setLoadingTests(true);
    try {
      const res = await api.getTests();
      if (res && res.tests && Array.isArray(res.tests)) {
        setTests(res.tests);
      } else {
        setTests([]);
      }
    } catch (e) {
      setTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [user]);

  // Auto-scroll and highlight when navigating from a notification
  useEffect(() => {
    if (highlightedTestId && !loadingTests) {
      const el = document.getElementById(`mock-test-card-${highlightedTestId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const timer = setTimeout(() => {
        setHighlightedTestId(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [highlightedTestId, loadingTests, setHighlightedTestId]);

  // Click-outside listener for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

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
      if (targetDept.includes("CS")) deptCode = "CSE";
      else if (targetDept.includes("IT")) deptCode = "IT";
      else if (targetDept.includes("ECE")) deptCode = "ECE";

      let yearCode = "All";
      if (targetYear.includes("1st")) yearCode = "1st Year";
      else if (targetYear.includes("2nd")) yearCode = "2nd Year";
      else if (targetYear.includes("3rd")) yearCode = "3rd Year";
      else if (targetYear.includes("4th")) yearCode = "4th Year";

      await api.uploadCSVTest({
        title: testTitle.trim(),
        duration: Number(duration),
        test_type: testType.toLowerCase(),
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

  // Terminate Assessment on violations, fullscreen exit, or timeout
  const handleTerminateAssessment = async (
    reason: 'violation' | 'fullscreen_exit' | 'timeout' | 'abandoned',
    message: string
  ) => {
    if (isTerminatedRef.current || examSubmittedRef.current || isSubmittingRef.current) return;
    isTerminatedRef.current = true;
    setIsTerminated(true);
    setTerminationReason(reason);
    setTerminationMessage(message);
    setActiveWarningModal(null);
    setShowSubmitConfirm(false);
    setUserAnswers({});
    setReviewFlags({});

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }

    if (activeTestRef.current?.id) {
      api.terminateTest(activeTestRef.current.id, {
        attempt_id: currentAttemptId || undefined,
        reason
      }).catch(err => {
        console.warn("Could not record assessment termination on backend:", err);
      });
    }
  };

  // Start Assessment session
  const handleStartAssessment = async (test: any) => {
    const totalSec = (test.duration_minutes || test.durationMins || test.durationMinutes || 30) * 60;
    isSubmittingRef.current = false;
    examSubmittedRef.current = false;
    isTerminatedRef.current = false;
    setLoadingTestDetails(true);
    setActiveTest(test);
    setExamSubmitted(false);
    setExamResult(null);
    setSubmitExamError(null);
    setUserAnswers({});
    setReviewFlags({});
    setCurrentQIdx(0);
    setTimeLeftSec(totalSec);
    setViolationCount(0);
    setActiveWarningModal(null);
    setIsTerminated(false);
    setTerminationReason(null);
    setTerminationMessage(null);
    setIsMultiWindowBlocked(false);

    // Record started attempt in DB and synchronize timer with server expires_at
    try {
      const startRes = await api.startTest(test.id);
      if (startRes && startRes.attempt_id) {
        setCurrentAttemptId(startRes.attempt_id);
        if (startRes.expires_at) {
          const expMs = new Date(startRes.expires_at).getTime();
          const remainingSec = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
          if (remainingSec > 0) {
            setTimeLeftSec(remainingSec);
          }
        }
      }
    } catch (err: any) {
      console.warn("Could not record attempt start in database:", err);
    }

    try {
      const details = await api.getTestDetails(test.id);
      if (details && details.questions && Array.isArray(details.questions)) {
        setTestQuestions(details.questions);
      } else {
        setTestQuestions(Array.isArray(test.questions) ? test.questions : []);
      }
    } catch (e) {
      setTestQuestions(Array.isArray(test.questions) ? test.questions : []);
    } finally {
      setLoadingTestDetails(false);
    }
  };

  // Pre-test warning modal confirmation with Real Fullscreen API
  const handleConfirmStartWithFullscreen = async () => {
    if (!pendingTestToStart) return;
    setFullscreenError(null);

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err: any) {
      console.warn("Browser rejected fullscreen request:", err);
      setFullscreenError("Fullscreen mode is required to begin the assessment. Please allow fullscreen permissions in your browser and try again.");
      return;
    }

    const testToStart = pendingTestToStart;
    setPendingTestToStart(null);
    await handleStartAssessment(testToStart);
  };

  // Fullscreen exit monitoring during assessment
  useEffect(() => {
    if (!activeTest || examSubmitted || isTerminated) return;

    const onFullscreenChange = () => {
      if (
        !document.fullscreenElement &&
        activeTestRef.current &&
        !examSubmittedRef.current &&
        !isSubmittingRef.current &&
        !isTerminatedRef.current
      ) {
        handleTerminateAssessment(
          'fullscreen_exit',
          'Fullscreen mode was exited during the test. Your assessment has been terminated and your progress was lost.'
        );
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [activeTest, examSubmitted, isTerminated]);

  // Tab switch & visibility change detection
  useEffect(() => {
    if (!activeTest || examSubmitted || isTerminated) return;

    const recordViolation = () => {
      if (examSubmittedRef.current || isTerminatedRef.current || isSubmittingRef.current) return;
      if (hasLeftFocusRef.current) return;
      hasLeftFocusRef.current = true;

      setViolationCount(prev => {
        const next = prev + 1;
        if (next === 1) {
          setActiveWarningModal(1);
        } else if (next === 2) {
          setActiveWarningModal(2);
        } else if (next >= 3) {
          setActiveWarningModal(null);
          handleTerminateAssessment(
            'violation',
            'Assessment terminated due to repeated tab or window switching. Your progress has been lost.'
          );
        }
        return next;
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordViolation();
      } else if (document.visibilityState === 'visible') {
        setTimeout(() => {
          hasLeftFocusRef.current = false;
        }, 300);
      }
    };

    const handleWindowBlur = () => {
      recordViolation();
    };

    const handleWindowFocus = () => {
      setTimeout(() => {
        hasLeftFocusRef.current = false;
      }, 300);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [activeTest, examSubmitted, isTerminated]);

  // Multiple Windows / Tabs detection via BroadcastChannel
  useEffect(() => {
    if (!activeTest || examSubmitted || isTerminated || !user?.id) return;

    const channelName = `impulse_test_coord_${activeTest.id}_${user.id}`;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(channelName);
    } catch (e) {
      console.warn("BroadcastChannel not supported in this environment:", e);
      return;
    }

    channel.postMessage({
      type: 'INSTANCE_ANNOUNCE',
      instanceId: instanceIdRef.current
    });

    const handleChannelMsg = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.instanceId === instanceIdRef.current) return;

      if (data.type === 'INSTANCE_ANNOUNCE') {
        setIsMultiWindowBlocked(true);
        channel?.postMessage({
          type: 'INSTANCE_RESPONSE',
          instanceId: instanceIdRef.current
        });
      } else if (data.type === 'INSTANCE_RESPONSE') {
        setIsMultiWindowBlocked(true);
      } else if (data.type === 'INSTANCE_CLOSED') {
        setIsMultiWindowBlocked(false);
      }
    };

    channel.onmessage = handleChannelMsg;

    const handleBeforeUnload = () => {
      try {
        channel?.postMessage({
          type: 'INSTANCE_CLOSED',
          instanceId: instanceIdRef.current
        });
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        channel?.postMessage({
          type: 'INSTANCE_CLOSED',
          instanceId: instanceIdRef.current
        });
        channel?.close();
      } catch {}
    };
  }, [activeTest, examSubmitted, isTerminated, user?.id]);

  // Authoritative timer effect (timeout handling)
  useEffect(() => {
    if (!activeTest || examSubmitted || loadingTestDetails || isTerminated) return;
    if (timeLeftSec <= 0) {
      // When timer reaches zero, force-submit current answers instead of abandoning
      if (!isSubmittingRef.current && !examSubmittedRef.current) {
        handleFinalSubmitExam();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftSec(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, examSubmitted, loadingTestDetails, timeLeftSec, isTerminated]);

  // Submit Quiz
  const handleFinalSubmitExam = async () => {
    if (!activeTest || submittingExam || isSubmittingRef.current || examSubmitted || loadingTestDetails || isTerminated) return;
    
    // 1. Enter intentional "submitting" state
    isSubmittingRef.current = true;
    setSubmittingExam(true);
    setSubmitExamError(null);

    const durationTotalSec = (activeTest.durationMins || activeTest.durationMinutes || 30) * 60;
    const timeTakenSec = Math.max(1, durationTotalSec - timeLeftSec);

    // 2. Submit attempt to backend while exam is still active in fullscreen
    try {
      const res = await api.submitQuiz(activeTest.id, {
        answers: userAnswers,
        timeTakenSec
      });
      // 3. Backend successfully marked attempt SUBMITTED:
      examSubmittedRef.current = true;
      setExamSubmitted(true);
      setExamResult(res);
      fetchTests();

      // 4. Only after successful submission, exit fullscreen if necessary
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {}
      }
    } catch (err: any) {
      // 5. Failure case: keep current exam state, show error, allow student to retry
      isSubmittingRef.current = false;
      setSubmitExamError(err?.message || "Failed to submit assessment to server. Please try again.");
    } finally {
      setSubmittingExam(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtering catalog
  const filteredCatalog = tests.filter(t => {
    const qCount = t.total_questions ?? t.totalQuestions ?? t.questionCount ?? (t.questions ? t.questions.length : 0);
    if (qCount <= 0) return false;
    if (selectedCategory === 'All') return true;
    const tt = (t.test_type || t.category || '').toLowerCase();
    if (selectedCategory === 'Aptitude') return tt === 'aptitude';
    if (selectedCategory === 'Technical') return tt === 'technical';
    if (selectedCategory === 'General') return tt === 'general';
    return true;
  });

  // ── Render Active Quiz / Exam Interface in natural document flow ──
  if (activeTest) {
    return (
      <div className="space-y-6 font-sans max-w-5xl mx-auto w-full pb-16 min-h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="bg-[#121217] border border-white/10 rounded-2xl p-4 md:p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!examSubmitted && !isTerminated) {
                  handleTerminateAssessment('abandoned', 'Assessment abandoned by exiting test view. Progress lost.');
                } else {
                  setActiveTest(null);
                }
              }}
              className="p-2 rounded-xl bg-[#09090b] border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
              title="Exit test"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">{activeTest.title}</h2>
              <span className="text-xs text-zinc-400 font-mono">
                {activeTest.target_department_code || activeTest.targetDept || (activeTest.target_department_id ? 'Departmental' : 'All Departments')} • {testQuestions.length} Questions
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

            {!examSubmitted && !isTerminated && (
              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submittingExam || isMultiWindowBlocked}
                className="btn-primary px-4 py-2 rounded-xl text-black text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingExam ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>

        {/* Submission error alert */}
        {submitExamError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitExamError}</span>
            </div>
            <button onClick={() => setSubmitExamError(null)} className="text-zinc-400 hover:text-white text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Test Questions */}
        {loadingTestDetails ? (
          <div className="py-20 text-center text-zinc-400 font-mono text-xs flex items-center justify-center gap-2 bg-[#121217] border border-white/10 rounded-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            Loading Assessment Questions...
          </div>
        ) : examSubmitted && examResult ? (
          /* Post-Exam Result Screen */
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 space-y-8 text-center shadow-xl">
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
                Question Review Breakdown ({examResult.review?.length || 0} Questions)
              </h4>
              <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4">
                {examResult.review && examResult.review.map((item: any, idx: number) => {
                  const selectedVal = item.selected_option !== undefined
                    ? item.selected_option
                    : item.selectedOption !== undefined
                    ? item.selectedOption
                    : item.userAnswer;

                  const correctVal = item.correct_option !== undefined
                    ? item.correct_option
                    : item.correctOption !== undefined
                    ? item.correctOption
                    : item.correctOptionIndex;

                  const formattedUserAns = formatOptionWithLetter(item, selectedVal);
                  const formattedCorrectAns = formatOptionWithLetter(item, correctVal);

                  const hasAnswered = formattedUserAns !== null;
                  const userAnsText = formattedUserAns || 'Not answered';
                  const correctAnsText = formattedCorrectAns || (typeof correctVal === 'string' && correctVal ? correctVal : 'N/A');

                  const isCorrect = item.is_correct !== undefined
                    ? Boolean(item.is_correct)
                    : item.isCorrect !== undefined
                    ? Boolean(item.isCorrect)
                    : Boolean(selectedVal && correctVal && String(selectedVal).trim().toUpperCase() === String(correctVal).trim().toUpperCase());

                  return (
                    <div key={item.id || item.question_id || idx} className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white">
                          {idx + 1}. {item.question || item.question_text || item.title}
                        </p>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                          isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="text-zinc-400">
                          Your answer: <span className={`font-semibold ${hasAnswered ? (isCorrect ? 'text-emerald-400' : 'text-rose-400') : 'text-zinc-400'}`}>{userAnsText}</span>
                        </div>
                        <div className="text-emerald-400">
                          Correct answer: <span className="font-semibold">{correctAnsText}</span>
                        </div>
                      </div>

                      {item.explanation && (
                        <div className="text-[11px] text-zinc-400 p-2.5 rounded-lg bg-[#121217] border border-white/10 leading-relaxed">
                          <strong className="text-orange-400">Explanation:</strong> {item.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-center">
              <button
                onClick={() => {
                  setActiveTest(null);
                  setExamSubmitted(false);
                  examSubmittedRef.current = false;
                  isSubmittingRef.current = false;
                  fetchTests();
                }}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Close Review & Back to Catalog
              </button>
            </div>
          </div>
        ) : testQuestions.length > 0 ? (
          /* Question Taker View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono font-bold text-orange-400">
                  Question {currentQIdx + 1} of {testQuestions.length}
                </span>
                <button
                  onClick={() => {
                    const qId = testQuestions[currentQIdx].id;
                    setReviewFlags(prev => ({ ...prev, [qId]: !prev[qId] }));
                  }}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    reviewFlags[testQuestions[currentQIdx]?.id]
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-[#09090b] border-white/10 text-zinc-400 hover:text-white'
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
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = userAnswers[qId] === letter || userAnswers[qId] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => !isMultiWindowBlocked && !isTerminated && setUserAnswers(prev => ({ ...prev, [qId]: letter }))}
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
                          {letter}
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
                  disabled={currentQIdx === 0 || isMultiWindowBlocked || isTerminated}
                  onClick={() => setCurrentQIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-[#09090b] border border-white/10 text-xs font-bold text-white disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentQIdx === testQuestions.length - 1 || isMultiWindowBlocked || isTerminated}
                  onClick={() => setCurrentQIdx(prev => prev + 1)}
                  className="btn-primary px-4 py-2 rounded-xl text-black text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="lg:col-span-4 bg-[#121217] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl lg:sticky lg:top-6">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Question Palette Grid
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {testQuestions.map((q, idx) => {
                  const answered = userAnswers[q.id] !== undefined && userAnswers[q.id] !== null && userAnswers[q.id] !== '';
                  const isCurrent = idx === currentQIdx;
                  const flagged = reviewFlags[q.id];
                  return (
                    <button
                      key={q.id}
                      disabled={isMultiWindowBlocked || isTerminated}
                      onClick={() => setCurrentQIdx(idx)}
                      className={`h-9 rounded-lg font-mono text-xs font-bold transition-all relative cursor-pointer ${
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
        ) : (
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Questions Available</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              This quiz does not have active question items loaded. Please check back later or contact your administrator.
            </p>
            <button
              onClick={() => setActiveTest(null)}
              className="px-5 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        )}

        {/* ── Multiple-Window Blocked Overlay ── */}
        <AnimatePresence>
          {isMultiWindowBlocked && !isTerminated && !examSubmitted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md backdrop-blur-2xl bg-[#141416] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-center font-sans pointer-events-auto overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 font-mono">
                    Multiple Instances Detected
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading">
                    Assessment Paused
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Multiple assessment windows detected. Close the other window to continue.
                </p>

                <p className="text-[11px] text-zinc-500 font-mono">
                  Interactions are temporarily disabled until all duplicate windows are closed.
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Tab Switch / Visibility Warning Modal ── */}
        <AnimatePresence>
          {activeWarningModal && !isTerminated && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md backdrop-blur-2xl bg-[#141210] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-left font-sans pointer-events-auto overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 font-mono">
                    {activeWarningModal === 1 ? 'Security Warning (1 of 2)' : 'Final Warning (2 of 2)'}
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading">
                    Tab / Window Switch Detected
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {activeWarningModal === 1 ? (
                    <>
                      You navigated away from the assessment screen. Please remain in fullscreen on this tab.
                      <strong className="text-white block mt-1.5">
                        After 2 warnings (on the 3rd violation), your assessment will be immediately terminated and all progress will be lost.
                      </strong>
                    </>
                  ) : (
                    <>
                      This is your <span className="text-rose-400 font-bold">final warning</span>.
                      <strong className="text-white block mt-1.5">
                        Any further tab switch or window blur will immediately terminate the assessment, mark your attempt as abandoned, and discard all progress.
                      </strong>
                    </>
                  )}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveWarningModal(null)}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-black cursor-pointer shadow-md"
                  >
                    I Understand, Resume Test
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Assessment Terminated Modal ── */}
        <AnimatePresence>
          {isTerminated && terminationReason !== 'timeout' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md backdrop-blur-2xl bg-[#181111] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-left font-sans pointer-events-auto overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-rose-400 font-mono">
                    Assessment Terminated
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading">
                    Attempt Abandoned
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {terminationMessage || 'Your assessment has been terminated due to a security violation. All progress has been lost and this attempt cannot be resumed.'}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTest(null);
                      setIsTerminated(false);
                      setTerminationReason(null);
                      setTerminationMessage(null);
                      setViolationCount(0);
                      fetchTests();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    Exit Assessment
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Timeout Modal ── */}
        <AnimatePresence>
          {isTerminated && terminationReason === 'timeout' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md backdrop-blur-2xl bg-black/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-left font-sans pointer-events-auto overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Clock className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-orange-400 font-mono">
                    Assessment Session Ended
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading">
                    Time's Up
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Your assessment time has expired. This attempt has ended and your current progress was not submitted.
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTest(null);
                      setIsTerminated(false);
                      setTerminationReason(null);
                      setTerminationMessage(null);
                      setViolationCount(0);
                      fetchTests();
                    }}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all cursor-pointer"
                  >
                    Exit Assessment
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Submit Confirmation Modal ── */}
        <AnimatePresence>
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md backdrop-blur-2xl bg-black/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-left font-sans pointer-events-auto overflow-hidden"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-orange-400 font-mono">
                      Final Submission
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading">
                    Submit assessment?
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  You are about to submit your assessment. You will not be able to change your answers after submission.
                </p>

                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Questions Answered:</span>
                  <span className="text-white font-bold">
                    {Object.keys(userAnswers).filter(k => userAnswers[k] !== undefined && userAnswers[k] !== null && userAnswers[k] !== '').length} / {testQuestions.length}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmitConfirm(false);
                      handleFinalSubmitExam();
                    }}
                    className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all cursor-pointer shadow-lg"
                  >
                    Submit Assessment
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
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
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Test Title <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder="e.g., Data Structures & Algorithms - CSE 4th Year"
                  className="w-full bg-[#16161d] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-zinc-500"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Test Type <span className="text-orange-400">*</span>
                </label>
                <select
                  value={testType}
                  onChange={e => setTestType(e.target.value as any)}
                  className="w-full bg-[#16161d] text-sm text-white px-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-orange-500 transition-all"
                >
                  {TEST_TYPE_OPTIONS.map(tt => (
                    <option key={tt} value={tt} className="bg-[#121217]">{tt}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
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
              <div className="md:col-span-4">
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

              <div className="md:col-span-8">
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



      {/* ── Student Assessment Catalog Dashboard ── */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Header with Title and Category Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span>Student Assessment Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Assessment &amp; Quiz Catalog
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
              Assigned departmental tests for your cohort ({user?.branch || 'All Departments'} • {user?.year || 'All Years'})
            </p>
          </div>

          {/* Polished Category Dropdown Control */}
          <div className="relative shrink-0" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryOpen(prev => !prev)}
              className="inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 hover:border-white/20 text-xs font-medium transition-all shadow-sm cursor-pointer min-w-[175px]"
              aria-haspopup="listbox"
              aria-expanded={isCategoryOpen}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedCategory !== 'All' ? 'bg-orange-500' : 'bg-zinc-500'}`} />
                <span className="text-zinc-400 font-mono text-[11px]">Category:</span>
                <span className={`font-semibold ${selectedCategory !== 'All' ? 'text-orange-400' : 'text-white'}`}>
                  {selectedCategory}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                  isCategoryOpen ? 'rotate-180 text-orange-400' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isCategoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#141414] border border-white/10 shadow-2xl p-1.5 z-40 backdrop-blur-xl"
                  role="listbox"
                >
                  {['All', 'Aptitude', 'Technical', 'General'].map(cat => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20'
                            : 'text-zinc-300 hover:text-white hover:bg-white/5'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span>{cat}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Catalog Grid or Empty / Loading State */}
        {loadingTests ? (
          <div className="py-20 text-center text-zinc-400 text-xs font-mono flex items-center justify-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            <span>Loading quizzes catalog...</span>
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="py-16 text-center bg-[#121217] rounded-3xl border border-white/10 p-8 sm:p-12 max-w-lg mx-auto space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
              <HelpCircle className="w-6 h-6 text-orange-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-heading tracking-tight">
                No Quizzes Found
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                There are currently no departmental quizzes assigned to your branch and year. Check back soon or select 'All' for general placement drives.
              </p>
            </div>
            {selectedCategory !== 'All' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  View All Quizzes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCatalog.map(test => {
              const qCount = test.total_questions ?? test.totalQuestions ?? test.questionCount ?? (test.questions ? test.questions.length : 0);
              const durationMins = test.duration_minutes ?? test.durationMinutes ?? test.durationMins ?? 30;
              const passPercentage = test.passPercentage || 60;
              const deptTag = test.target_department_code || test.targetDept || (test.target_department_id ? 'Departmental' : 'All Departments');
              const yearTag = test.target_year ? `${test.target_year}th Year` : (test.targetYear || 'All Years');
              const typeLabel = (test.test_type || test.category || 'General').toUpperCase();

              return (
                <div
                  key={test.id}
                  id={`mock-test-card-${test.id}`}
                  className={`bg-[#121217] border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group shadow-lg hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5 relative overflow-hidden ${
                    highlightedTestId === test.id
                      ? 'border-orange-500 ring-2 ring-orange-500/60 shadow-orange-500/20'
                      : 'border-white/10 hover:border-white/20 hover:border-orange-500/30'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Targeting Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-semibold text-orange-400 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        {deptTag}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-medium text-zinc-400 font-mono">
                        {yearTag}
                      </span>
                    </div>

                    {/* Test Title & Category */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-orange-400 transition-colors font-heading line-clamp-2">
                        {test.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 font-mono mt-1.5">
                        Category: <span className="text-zinc-300 font-semibold">{typeLabel}</span>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer: Metadata & [ ▶ Start Test ] Button */}
                  <div className="pt-5 mt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{durationMins}m</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{qCount} Qs</span>
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{passPercentage}%</span>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setPendingTestToStart(test);
                        setFullscreenError(null);
                      }}
                      className="btn-primary !px-4 !py-1.5 !text-xs !font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-black text-black shrink-0" />
                      <span>Start Test</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pre-Test Warning Modal */}
      <AnimatePresence>
        {pendingTestToStart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#121217] border border-orange-500/30 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-heading">
                    Before you begin
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Assessment: {pendingTestToStart.title}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-sm text-zinc-300 bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-5">
                <p className="font-medium text-white/90 text-[13px] leading-relaxed">
                  Once the assessment starts, you must remain in this test window and stay in fullscreen mode.
                </p>
                <ul className="space-y-2 text-xs text-zinc-400 font-sans leading-relaxed list-disc pl-4 marker:text-orange-500">
                  <li>Do not switch tabs or windows.</li>
                  <li>Leaving fullscreen or switching away from the assessment may be treated as a violation.</li>
                  <li>After more than 2 tab/window switches, the assessment will be terminated and your progress will be lost.</li>
                  <li>You may only have one active assessment window.</li>
                  <li>If the timer expires, the assessment will be terminated and your progress will be lost.</li>
                  <li>Submission is final.</li>
                </ul>
              </div>

              {fullscreenError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{fullscreenError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingTestToStart(null);
                    setFullscreenError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmStartWithFullscreen(pendingTestToStart)}
                  className="btn-primary !px-5 !py-2 !text-xs !font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black text-black shrink-0" />
                  <span>Start Test</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockTestView;
