import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
import { MockTest, TestResult } from '../types';
import {
  CheckSquare,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const MockTests: React.FC = () => {
  const { mockTests, saveTestResult, setActiveTab } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);

  const [currentQIdx, setCurrentQIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const filteredTests = mockTests.filter(t => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  useEffect(() => {
    if (!activeTest || examSubmitted) return;
    if (timeLeftSec <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSec(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, examSubmitted, timeLeftSec]);

  const handleStartTest = (test: MockTest) => {
    setActiveTest(test);
    setCurrentQIdx(0);
    setUserAnswers({});
    setReviewFlags({});
    setTimeLeftSec(test.durationMinutes * 60);
    setExamSubmitted(false);
    setTestResult(null);
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (examSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleToggleFlag = (questionId: string) => {
    setReviewFlags(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitExam = () => {
    if (!activeTest || examSubmitted) return;

    let score = 0;
    activeTest.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctOption) {
        score++;
      }
    });

    const totalQuestions = activeTest.questions.length;
    const accuracy = Math.round((score / totalQuestions) * 100);
    const passed = accuracy >= activeTest.passPercentage;
    const timeSpent = Math.max(1, Math.round((activeTest.durationMinutes * 60 - timeLeftSec) / 60));

    const result: Omit<TestResult, 'id' | 'date'> = {
      testId: activeTest.id,
      testTitle: activeTest.title,
      category: activeTest.category,
      score,
      totalQuestions,
      accuracy,
      passed,
      timeSpentMinutes: timeSpent,
      userAnswers
    };

    saveTestResult(result);
    setTestResult({
      ...result,
      id: `res_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    });
    setExamSubmitted(true);

    if (passed) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // MODE 2: ACTIVE EXAM SPECIFICATION
  if (activeTest && !examSubmitted) {
    const currentQ = activeTest.questions[currentQIdx];
    const isFlagged = !!reviewFlags[currentQ.id];

    return (
      <div className="space-y-4 py-2 font-sans">
        {/* Sticky Status Bar Spec */}
        <div className="p-3 bg-[var(--accent-primary)] text-white rounded-sm flex items-center justify-between sticky top-16 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="mono-badge text-[9px] bg-zinc-800 text-white border-zinc-700 font-mono">{activeTest.category}</span>
            <h2 className="font-bold text-white text-xs hidden sm:block">{activeTest.title}</h2>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-zinc-900 border border-zinc-700 font-mono text-xs font-bold text-white">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeftSec)}</span>
          </div>

          <button onClick={handleSubmitExam} className="btn-primary bg-[var(--bg-card)] text-white hover:bg-zinc-100 border-white text-xs py-1.5 px-4 font-bold">
            Submit Exam
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 mono-card p-6 space-y-4 flex flex-col justify-between min-h-[400px] border-[var(--border-color)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-[11px] font-bold text-[var(--text-muted)] font-mono">
                  Question {currentQIdx + 1} of {activeTest.questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="mono-badge text-[9px] font-mono">
                    {currentQ.difficulty}
                  </span>
                  <button
                    onClick={() => handleToggleFlag(currentQ.id)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-sm border transition-colors font-medium ${
                      isFlagged
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                        : 'bg-zinc-100 text-zinc-700 border-[var(--border-color)] hover:bg-zinc-200'
                    }`}
                  >
                    <Flag className="w-3 h-3" />
                    <span>{isFlagged ? 'Marked' : 'Mark'}</span>
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white leading-relaxed">
                {currentQ.title}
              </h3>

              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = userAnswers[currentQ.id] === optIdx;

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full flex items-start gap-2.5 p-3 rounded-sm border text-left text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] font-bold'
                          : 'bg-[var(--bg-body)] text-white border-[var(--border-color)] hover:bg-zinc-100'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-sm text-[10px] font-bold flex items-center justify-center shrink-0 font-mono ${
                        isSelected ? 'bg-[var(--bg-card)] text-white' : 'bg-zinc-200 text-white'
                      }`}>
                        {letter}
                      </span>
                      <span className="mt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <button
                onClick={() => setCurrentQIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQIdx === 0}
                className="btn-secondary text-xs py-1.5 disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <button
                onClick={() => setCurrentQIdx(prev => Math.min(activeTest.questions.length - 1, prev + 1))}
                disabled={currentQIdx === activeTest.questions.length - 1}
                className="btn-primary text-xs py-1.5 disabled:opacity-40"
              >
                Next <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Question Palette Spec */}
          <div className="lg:col-span-4 mono-card p-6 space-y-3 border-[var(--border-color)]">
            <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Question Palette</h4>

            <div className="grid grid-cols-5 gap-1.5 font-mono">
              {activeTest.questions.map((q, idx) => {
                const qAnswered = userAnswers[q.id] !== undefined;
                const qFlagged = !!reviewFlags[q.id];
                const isCurrent = idx === currentQIdx;

                let stateClass = 'bg-zinc-100 text-zinc-700 border-[var(--border-color)]';
                if (isCurrent) stateClass = 'bg-[var(--accent-primary)] text-white font-bold border-[var(--accent-primary)]';
                else if (qAnswered) stateClass = 'bg-zinc-200 text-white border-zinc-400 font-bold';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIdx(idx)}
                    className={`relative h-9 rounded-sm border font-bold text-xs flex items-center justify-center transition-all ${stateClass}`}
                  >
                    <span>{idx + 1}</span>
                    {qAnswered && !isCurrent && <CheckCircle2 className="w-2.5 h-2.5 text-white absolute top-0.5 right-0.5" />}
                    {qFlagged && <Flag className="w-2.5 h-2.5 text-[var(--text-secondary)] absolute top-0.5 left-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MODE 3: RESULTS SCREEN SPECIFICATION
  if (activeTest && examSubmitted && testResult) {
    return (
      <div className="space-y-5 py-4 max-w-2xl mx-auto font-sans">
        <div className="mono-card p-8 text-center space-y-5 border-[var(--border-color)]">
          <div className="w-12 h-12 rounded-sm bg-[var(--accent-primary)] text-white flex items-center justify-center mx-auto">
            <Award className="w-6 h-6 text-white" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white">Test Completed</h1>
            <p className="text-xs text-[var(--text-muted)]">{activeTest.title}</p>
          </div>

          <div className="flex items-center justify-center gap-3 font-mono">
            <div className="px-5 py-2.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] text-center">
              <span className="text-xl font-extrabold text-white block">{testResult.score} / {testResult.totalQuestions}</span>
              <span className="text-[9px] text-[var(--text-secondary)] uppercase font-sans font-bold">Score</span>
            </div>

            <div className="px-5 py-2.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] text-center">
              <span className="text-xl font-extrabold text-white block">{testResult.accuracy}%</span>
              <span className="text-[9px] text-[var(--text-secondary)] uppercase font-sans font-bold">Accuracy</span>
            </div>

            <div className="px-5 py-2.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] text-center">
              <span className="text-whitease font-extrabold block text-white">
                {testResult.passed ? 'PASSED' : 'RETRY'}
              </span>
              <span className="text-[9px] text-[var(--text-secondary)] uppercase font-sans font-bold">Status</span>
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <button onClick={() => handleStartTest(activeTest)} className="btn-secondary text-xs py-2 px-4">
              <RotateCcw className="w-3.5 h-3.5" /> Retake Test
            </button>
            <button
              onClick={() => {
                setActiveTest(null);
                setActiveTab('dashboard');
              }}
              className="btn-primary text-xs py-2 px-4"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-white" />
            Question Review & Solutions
          </h3>

          {activeTest.questions.map((q, qIdx) => {
            const userAns = testResult.userAnswers[q.id];
            const isCorrect = userAns === q.correctOption;

            return (
              <div key={q.id} className="mono-card p-4 space-y-2 border-[var(--border-color)]">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-[10px] text-[var(--text-secondary)]">Question {qIdx + 1}</span>
                  {isCorrect ? (
                    <span className="mono-badge text-[9px]">Correct</span>
                  ) : (
                    <span className="mono-badge bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 text-[9px]">Incorrect</span>
                  )}
                </div>

                <h4 className="font-bold text-xs text-white leading-relaxed">{q.title}</h4>

                <div className="space-y-1 text-xs">
                  {q.options.map((opt, oIdx) => {
                    let optStyle = 'bg-[var(--bg-body)] border-[var(--border-color)] text-white';
                    if (oIdx === q.correctOption) optStyle = 'bg-zinc-200 border-zinc-400 text-white font-bold';
                    else if (oIdx === userAns && !isCorrect) optStyle = 'bg-zinc-100 border-[var(--border-color)] text-[var(--text-secondary)] line-through';

                    return (
                      <div key={oIdx} className={`p-2 rounded-sm border flex items-center justify-between ${optStyle}`}>
                        <span>{String.fromCharCode(65 + oIdx)}. {opt}</span>
                        {oIdx === q.correctOption && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        {oIdx === userAns && !isCorrect && <XCircle className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  <span className="font-bold text-white block mb-0.5 text-[11px]">Explanation:</span>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // MODE 1: TEST BROWSER SPECIFICATION
  return (
    <div className="space-y-5 py-2 font-sans">
      <BorderGlow
        edgeSensitivity={30}
        glowColor="40 80 80"
        backgroundColor="#111115"
        borderRadius={12}
        glowRadius={40}
        glowIntensity={1}
        coneSpread={25}
        animated={false}
        colors={['#c084fc', '#f472b6', '#38bdf8']}
      >
        <section className="p-6 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-white" />
                <span className="mono-badge text-xs font-mono">Timed Exams</span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Timed Mock Placement Drives
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Practice timed exams across TCS, Infosys, & Wipro question patterns.
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-1.5 pt-1">
            {['All', 'Aptitude', 'Company Drive', 'Technical', 'Verbal'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all border ${
                  selectedCategory === cat
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-[var(--bg-body)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </BorderGlow>

      {/* Test Cards Grid Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map((test) => (
          <BorderGlow
            key={test.id}
            edgeSensitivity={30}
            glowColor="40 80 80"
            backgroundColor="#08080a"
            borderRadius={12}
            glowRadius={40}
            glowIntensity={1}
            coneSpread={25}
            animated={false}
            colors={['#c084fc', '#f472b6', '#38bdf8']}
          >
            <div className="p-5 space-y-3 flex flex-col justify-between min-h-full">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="mono-badge text-[9px] font-mono">{test.category}</span>
                  {test.companyTag && <span className="mono-badge bg-white/10 text-white border-white/20 text-[9px] font-mono">{test.companyTag}</span>}
                </div>

                <h3 className="font-bold text-sm text-white">{test.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{test.description}</p>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-xs font-mono">
                  <div className="p-1.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <span className="text-[8px] text-[var(--text-secondary)] block font-sans font-bold uppercase">Duration</span>
                    <span className="font-bold text-white">{test.durationMinutes}m</span>
                  </div>
                  <div className="p-1.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <span className="text-[8px] text-[var(--text-secondary)] block font-sans font-bold uppercase">Questions</span>
                    <span className="font-bold text-white">{test.questionCount} Qs</span>
                  </div>
                  <div className="p-1.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)]">
                    <span className="text-[8px] text-[var(--text-secondary)] block font-sans font-bold uppercase">Pass Rate</span>
                    <span className="font-bold text-white">{test.passPercentage}%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartTest(test)}
                className="btn-primary w-full text-xs py-2.5 font-bold rounded-full cursor-pointer"
              >
                <span>Start Test</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </BorderGlow>
        ))}
      </div>
    </div>
  );
};
