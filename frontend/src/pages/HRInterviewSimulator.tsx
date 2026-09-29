import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { InterviewQuestion, InterviewFeedback } from '../types';
import { analyzeInterview } from '../lib/api';
import {
  Mic,
  Square,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const HRInterviewSimulator: React.FC = React.memo(() => {
  const {
    interviewQuestions,
    logoutUser,
    setActiveTab,
    selectedInterviewQuestionId,
    setSelectedInterviewQuestionId
  } = useApp();

  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(() => {
    if (selectedInterviewQuestionId) {
      const target = selectedInterviewQuestionId.trim().toLowerCase();
      const matched = interviewQuestions.find(
        q => q.id.toLowerCase() === target ||
          q.questionText.toLowerCase() === target ||
          q.questionText.toLowerCase().includes(target)
      );
      if (matched) return matched;
    }
    return interviewQuestions[0] || null;
  });

  useEffect(() => {
    if (!selectedQuestion && interviewQuestions.length > 0) {
      setSelectedQuestion(interviewQuestions[0]);
    }
  }, [interviewQuestions, selectedQuestion]);

  useEffect(() => {
    if (selectedInterviewQuestionId) {
      const target = selectedInterviewQuestionId.trim().toLowerCase();
      const matched = interviewQuestions.find(
        q => q.id.toLowerCase() === target ||
          q.questionText.toLowerCase() === target ||
          q.questionText.toLowerCase().includes(target)
      );
      if (matched) {
        setSelectedQuestion(matched);
        setFeedback(null);
        setApiError(null);
      }
      setSelectedInterviewQuestionId(null);
    }
  }, [selectedInterviewQuestionId, interviewQuestions, setSelectedInterviewQuestionId]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  // Cleanup mic stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleStartRecording = async () => {
    setFeedback(null);
    setApiError(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : MediaRecorder.isTypeSupported('audio/aac')
              ? 'audio/aac'
              : MediaRecorder.isTypeSupported('audio/wav')
                ? 'audio/wav'
                : '';

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await processRecording(mimeType);
      };

      recorder.start(200);
      setIsRecording(true);
    } catch (err) {
      setApiError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsRecording(false);
      setAnalyzing(true);
      mediaRecorderRef.current.stop();
    }
  };

  const processRecording = async (mimeType: string) => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      if (!selectedQuestion) {
        setApiError('Please select an interview question to record an answer.');
        setAnalyzing(false);
        return;
      }

      const result = await analyzeInterview({
        question_id: selectedQuestion.id,
        questionText: selectedQuestion.questionText,
        audioBase64: base64Audio,
        mimeType: mimeType,
        durationSeconds: recordingTime,
      });

      const mapped: InterviewFeedback = {
        wpm: result.wpm ?? 0,
        fillerCount: result.fillerCount ?? 0,
        fillerWords: result.fillerWords ?? [],
        confidenceScore: result.confidenceScore ?? 0,
        tone: result.tone || (result.confidenceScore >= 80 ? 'Confident & Articulate' : 'Developing Confidence'),
        strengths: result.aiFeedback?.strengths || [],
        improvements: result.aiFeedback?.areasForImprovement || [],
        overallRating: parseFloat(((result.overallScore ?? 0) / 10).toFixed(1)),
        clarityScore: result.technicalAccuracy ?? 0,
        relevanceScore: result.overallScore ?? 0,
        sampleIdealResponse: result.aiFeedback?.idealAnswerSnippet || result.betterAnswer?.example || '',
        transcript: result.transcript || '',
      };

      setFeedback(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const lower = msg.toLowerCase();

      if (lower.includes('expired') || msg.includes('401') || lower.includes('unauthorized')) {
        setApiError('Your session has expired. Please sign in again to continue.');
      } else if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too_many_requests') || lower.includes('daily limit') || lower.includes('quota')) {
        setApiError('The AI interview evaluation service has reached its daily request limit. Please try again later or tomorrow.');
      } else if (lower.includes('503') || lower.includes('high demand') || lower.includes('high traffic') || lower.includes('temporarily unavailable') || lower.includes('unavailable')) {
        setApiError('The AI evaluation service is currently experiencing high demand. Please wait a moment and try again.');
      } else if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('connection refused') || lower.includes('offline')) {
        setApiError('Unable to connect to the server. Please check your internet connection.');
      } else if (lower.includes('microphone') || lower.includes('audible') || lower.includes('no speech') || lower.includes('empty')) {
        setApiError('No audible speech was detected in your recording. Please check your microphone and try again.');
      } else {
        const isClean = msg.length < 150 && !msg.includes('{') && !msg.includes('http') && !msg.includes('Error code');
        setApiError(isClean ? msg : 'The AI evaluation service could not process your answer at this moment. Please try again in a few moments.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, transform: 'translateY(10px) scale(0.99)' },
    visible: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      className="space-y-6 py-4 font-sans max-w-7xl mx-auto transform-gpu"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* UNWRAPPED HEADER */}
      <motion.div variants={itemVariants} className="px-1 space-y-4 pb-1 relative z-30">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-400">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Mic className="w-4.5 h-4.5 text-orange-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Interview Practice
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Practice HR behavioral questions with real-time Speech fluency, Pace, and Confidence analysis.
            </p>
          </div>
        </div>
      </motion.div>

      {/* API ERROR BANNER */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{apiError}</span>
          </div>
          {(apiError.includes('expired') || apiError.includes('401') || apiError.includes('Unauthorized') || apiError.includes('sign in')) && (
            <button
              onClick={() => {
                logoutUser();
                setActiveTab('dashboard');
              }}
              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer transition-all shadow-md active:scale-95"
            >
              Sign In Again
            </button>
          )}
        </motion.div>
      )}

      {/* SIMULATOR STAGE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERVIEW PROMPT & RECORDING STAGE */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              <span>Current Interview Question{selectedQuestion?.companyTag ? ` (${selectedQuestion.companyTag})` : ''}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug font-heading pt-1">
              "{selectedQuestion ? selectedQuestion.questionText : 'Select an interview question to start practice'}"
            </h2>
          </div>

          {/* SIMULATOR AUDIO STAGE / RECORDING FRAME */}
          <div className="relative p-8 sm:p-10 rounded-2xl bg-[#000000] border border-white/10 flex flex-col items-center justify-center text-center space-y-5 overflow-hidden shadow-inner">
            <div className="w-22 h-22 rounded-full bg-[#0d0d0d] border border-white/15 flex items-center justify-center relative shadow-xl">
              {isRecording ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-orange-500/25 animate-ping" />
                  <Mic className="w-9 h-9 text-orange-400 z-10" />
                </>
              ) : analyzing ? (
                <Loader2 className="w-9 h-9 text-orange-400 z-10 animate-spin" />
              ) : (
                <Mic className="w-9 h-9 text-zinc-400 z-10" />
              )}
            </div>

            <div className="space-y-1 font-mono">
              <div className="text-3xl font-extrabold text-white tracking-wider font-mono">{formatSeconds(recordingTime)}</div>
              <div className="text-xs text-zinc-400 font-sans">
                {isRecording
                  ? 'Recording audio… Speak your answer clearly'
                  : analyzing
                    ? 'Evaluating... Please Wait'
                    : 'Click start to practice your response'}
              </div>
            </div>

            {/* SPEECH WAVEFORM SIMULATION */}
            {isRecording && (
              <div className="flex items-center gap-1.5 h-9 pt-1">
                {[40, 75, 30, 90, 50, 80, 45, 60, 95, 35].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ['25%', `${h}%`, '25%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                    className="w-1.5 bg-orange-400 rounded-full"
                  />
                ))}
              </div>
            )}

            <div className="pt-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={analyzing}
                  className="btn-primary py-3.5 px-9 text-xs font-bold rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Mic className="w-4 h-4 text-black" />
                  <span>Start Recording Answer</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="px-9 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop & Analyze Speech</span>
                </button>
              )}
            </div>
          </div>

          {/* QUESTION SELECTOR (Scrollable section with forced visible custom scrollbar) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Select Question</h4>
              <span className="text-[10px] font-mono text-zinc-500">{interviewQuestions.length} Questions Available</span>
            </div>
            <div className="space-y-2.5 max-h-[240px] overflow-y-scroll custom-scrollbar pr-3 pb-3">
              {interviewQuestions.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                  No Questions Available
                </div>
              ) : (
                interviewQuestions.map(q => (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQuestion(q);
                      setFeedback(null);
                      setApiError(null);
                    }}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all duration-200 ${selectedQuestion?.id === q.id
                      ? 'bg-orange-500/10 border-orange-500/40 text-white font-semibold shadow-sm'
                      : 'bg-[#000000] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                      }`}
                  >
                    <p className="line-clamp-2 leading-relaxed">{q.questionText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: SPEECH FEEDBACK REPORT */}
        <motion.div variants={itemVariants} className="lg:col-span-5 bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl flex flex-col justify-center min-h-[420px]">
          {analyzing ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-orange-400 mx-auto animate-spin" />
              <p className="text-xs font-semibold text-zinc-400 font-mono">Evaluating... Please Wait</p>
            </div>
          ) : !feedback ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <p className="text-sm font-bold text-white">AI Evaluation Workspace</p>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">Record an answer on the left to generate the Speech analysis & Feedback report.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 bg-[#000000] border border-white/10 p-3.5 rounded-2xl font-mono text-center shadow-inner">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block truncate">Answer Score</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-white">{Math.round(feedback.overallRating * 10)} <span className="text-[10px] text-zinc-500 font-normal">/ 100</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block truncate">Pace (WPM)</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-orange-400">{feedback.wpm}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block truncate">Confidence</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">{Math.round(feedback.confidenceScore)}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Key Strengths</h4>
                <ul className="space-y-2 text-xs">
                  {feedback.strengths.map((str, idx) => (
                    <li key={idx} className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Actionable Improvement Areas</h4>
                <ul className="space-y-2 text-xs">
                  {feedback.improvements.map((imp, idx) => (
                    <li key={idx} className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-300 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-[#000000] border border-white/10 space-y-2 text-xs">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">Suggested Ideal Response</span>
                <p className="text-zinc-300 leading-relaxed italic">{feedback.sampleIdealResponse}</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
});

export default HRInterviewSimulator;
