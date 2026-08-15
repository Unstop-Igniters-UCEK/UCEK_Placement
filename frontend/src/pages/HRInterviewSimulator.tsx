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

export const HRInterviewSimulator: React.FC = () => {
  const { interviewQuestions } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(
    interviewQuestions[0] || {
      id: 'q1',
      category: 'HR & Behavioral',
      difficulty: 'Easy',
      questionText: 'Tell me about yourself and why you are interested in joining our organization as a Campus Recruit.',
      suggestedAnswer: 'I am a 4th-year Computer Science student at UCEK with hands-on experience in full-stack web development...',
      companyTag: 'TCS'
    }
  );

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

  const filteredQuestions = interviewQuestions.filter(q => {
    if (selectedCategory === 'All') return true;
    return q.category === selectedCategory || q.companyTag === selectedCategory;
  });

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

      // Pick the best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        await processRecording(mimeType);
      };

      recorder.start(200); // collect chunks every 200ms
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

  /** Convert recorded Blob chunks → base64 → call backend → map to InterviewFeedback */
  const processRecording = async (mimeType: string) => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Convert Blob to base64 string
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Call the FastAPI backend
      const result = await analyzeInterview({
        questionText: selectedQuestion.questionText,
        audioBase64: base64Audio,
        mimeType: mimeType,
      });

      // Map backend response → InterviewFeedback shape used by the UI
      const mapped: InterviewFeedback = {
        wpm: Math.round(120 + (result.confidenceScore / 100) * 30),   // Estimated WPM from confidence
        fillerCount: Math.max(0, Math.round((100 - result.confidenceScore) / 25)),
        fillerWords: result.confidenceScore < 70 ? ['um', 'like'] : [],
        confidenceScore: result.confidenceScore,
        tone: result.confidenceScore >= 80 ? 'Confident & Articulate' : 'Developing Confidence',
        strengths: result.aiFeedback.strengths,
        improvements: result.aiFeedback.areasForImprovement,
        overallRating: parseFloat((result.overallScore / 10).toFixed(1)),
        clarityScore: result.technicalAccuracy,
        relevanceScore: result.overallScore,
        sampleIdealResponse: result.aiFeedback.idealAnswerSnippet,
        transcript: 'AI-analyzed audio response.',
      };

      setFeedback(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setApiError(`AI analysis failed: ${msg}. Check that the backend is running on ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}.`);
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
      {/* UNWRAPPED HEADER (No card box) */}
      <motion.div variants={itemVariants} className="px-1 space-y-2 pb-1">
        <div className="flex items-center gap-2 text-orange-400">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Mic className="w-4.5 h-4.5 text-orange-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
          HR Interview Speech Simulator
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
          Practice HR behavioral questions with real-time speech fluency, pace (WPM), and confidence analysis.
        </p>
      </motion.div>

      {/* API ERROR BANNER */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-3 font-sans shadow-lg"
        >
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
          <span className="leading-relaxed">{apiError}</span>
        </motion.div>
      )}

      {/* SIMULATOR STAGE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERVIEW PROMPT & RECORDING STAGE */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Current Interview Prompt ({selectedQuestion.companyTag || 'HR Round'})</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug font-heading pt-1">
              "{selectedQuestion.questionText}"
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
                    ? 'Sending to Gemini AI for speech & STAR evaluation…'
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

          {/* QUESTION SELECTOR */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Select Question Prompt</h4>
            <div className="space-y-2.5 max-h-52 overflow-y-auto no-scrollbar pr-1">
              {filteredQuestions.map(q => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setFeedback(null);
                    setApiError(null);
                  }}
                  className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all duration-200 ${selectedQuestion.id === q.id
                    ? 'bg-orange-500/10 border-orange-500/40 text-white font-semibold shadow-sm'
                    : 'bg-[#000000] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                >
                  <p className="line-clamp-2 leading-relaxed">{q.questionText}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: SPEECH FEEDBACK REPORT */}
        <motion.div variants={itemVariants} className="lg:col-span-5 bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl flex flex-col justify-center min-h-[420px]">
          {analyzing ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-orange-400 mx-auto animate-spin" />
              <p className="text-xs font-semibold text-zinc-400 font-mono">Evaluating Your Speech & Fluency… Please Wait!</p>
            </div>
          ) : !feedback ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <p className="text-sm font-bold text-white">AI Evaluation Workspace</p>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">Record an answer on the left to generate an instant speech analysis & feedback report.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 bg-[#000000] border border-white/10 p-4 rounded-2xl font-mono text-center shadow-inner">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Fluency Rating</span>
                  <span className="text-2xl font-extrabold text-white">{feedback.overallRating} <span className="text-xs text-zinc-500 font-normal">/ 10</span></span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Pace (WPM)</span>
                  <span className="text-2xl font-extrabold text-cyan-400">{feedback.wpm}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Confidence</span>
                  <span className="text-2xl font-extrabold text-emerald-400">{feedback.confidenceScore}%</span>
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
};
