import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
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
  Sparkles,
  Play
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
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, transform: 'translateY(10px) scale(0.99)' },
    visible: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  // RENDER TEST RUNNER / EVALUATION INTERFACE
  if (activeTest) {
    const currentQ = activeTest.questions[currentQIdx];
    const isAnswered = userAnswers[currentQ.id] !== undefined;

    return (
      <motion.div
        className="space-y-6 py-4 font-sans max-w-5xl mx-auto transform-gpu"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* TEST RUNNER HEADER */}
        <div className="mono-card p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTest(null)}
              className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-bold text-sm text-white font-heading">{activeTest.title}</h2>
              <span className="text-[11px] text-zinc-400 font-mono">{activeTest.category} • {activeTest.questions.length} Questions</span>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono">
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold ${
              timeLeftSec < 180
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-400 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-emerald-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeftSec)}</span>
            </div>

            {!examSubmitted && (
              <button
                onClick={handleSubmitExam}
                className="btn-primary py-2 px-5 text-xs font-bold rounded-full"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* RESULTS OVERLAY / EVALUATION VIEW */}
        {examSubmitted && testResult ? (
          <div className="mono-card p-8 space-y-6 text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-xl ${
              testResult.passed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {testResult.passed ? <Award className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-white font-heading">
                {testResult.passed ? 'Assessment Cleared!' : 'Keep Practicing'}
              </h2>
              <p className="text-xs text-zinc-400">
                You scored <strong className="text-white font-mono">{testResult.score}/{testResult.totalQuestions}</strong> with <strong className="text-emerald-400 font-mono">{testResult.accuracy}% accuracy</strong> in {testResult.timeSpentMinutes} mins.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => handleStartTest(activeTest)}
                className="btn-primary py-2.5 px-6 text-xs font-bold rounded-full"
              >
                Retry Mock Test
              </button>
              <button
                onClick={() => setActiveTest(null)}
                className="px-6 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
              >
                Back to Catalog
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE QUESTION CARD */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 mono-card p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <span className="text-xs font-mono font-bold text-orange-400 uppercase">
                  Question {currentQIdx + 1} of {activeTest.questions.length}
                </span>
                <button
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border transition-colors ${
                    reviewFlags[currentQ.id]
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Flag className="w-3 h-3" />
                  <span>{reviewFlags[currentQ.id] ? 'Flagged' : 'Flag'}</span>
                </button>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white leading-relaxed font-sans">
                {currentQ.title}
              </h3>

              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === optIdx;
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-orange-500/10 border-orange-500/50 text-white font-semibold'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[11px] ${
                          isSelected ? 'bg-orange-500 text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
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

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                <button
                  disabled={currentQIdx === 0}
                  onClick={() => setCurrentQIdx(prev => prev - 1)}
                  className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  disabled={currentQIdx === activeTest.questions.length - 1}
                  onClick={() => setCurrentQIdx(prev => prev + 1)}
                  className="px-4 py-2 rounded-full bg-orange-500 text-black text-xs font-bold disabled:opacity-40"
                >
                  Next Question
                </button>
              </div>
            </div>

            {/* QUESTION NAVIGATOR GRID */}
            <div className="lg:col-span-4 mono-card p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Question Navigator</h4>
              <div className="grid grid-cols-5 gap-2">
                {activeTest.questions.map((q, idx) => {
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
                          ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-400'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
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
        )}
      </motion.div>
    );
  }

  // RENDER CATALOG VIEW
  return (
    <motion.div
      className="space-y-6 py-4 font-sans max-w-7xl mx-auto transform-gpu"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* HEADER */}
      <motion.div variants={itemVariants} className="mono-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Mock Tests & Company Drives
            </h1>
            <p className="text-xs text-zinc-400">
              Practice timed aptitude rounds, technical MCQs, and company placement tests.
            </p>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80 font-medium">
          {['All', 'Aptitude & Reasoning', 'Technical Core', 'Company Drive'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-md font-bold'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      {/* CATALOG GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTests.map(test => (
          <motion.div
            key={test.id}
            variants={itemVariants}
            className="mono-card p-6 space-y-4 flex flex-col justify-between group hover:border-orange-500/40 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-orange-400">
                  {test.category}
                </span>
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {test.durationMinutes} mins
                </span>
              </div>

              <h2 className="font-bold text-base text-white font-heading group-hover:text-orange-400 transition-colors">
                {test.title}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {test.description}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">{test.questions.length} Questions</span>
              <button
                onClick={() => handleStartTest(test)}
                className="btn-primary py-2 px-4 text-xs font-bold rounded-full flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-black text-black" />
                <span>Start Test</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
