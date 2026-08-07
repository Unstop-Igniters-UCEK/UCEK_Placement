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
      {/* HEADER CARD */}
      <motion.div variants={itemVariants} className="mono-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-orange-400">
              <Mic className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              HR Interview Speech Simulator
            </h1>
            <p className="text-xs text-zinc-400">
              Practice HR behavioral questions with real-time speech fluency, pace (WPM), and confidence analysis.
            </p>
          </div>
        </div>
      </motion.div>

      {/* API ERROR BANNER */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2 font-sans"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </motion.div>
      )}

      {/* SIMULATOR STAGE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: INTERVIEW PROMPT & RECORDING STAGE */}
        <motion.div variants={itemVariants} className="lg:col-span-7 mono-card p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-orange-400 uppercase">
              Current Interview Prompt ({selectedQuestion.companyTag || 'HR Round'})
            </span>
            <h2 className="text-lg font-bold text-white leading-relaxed font-heading">
              "{selectedQuestion.questionText}"
            </h2>
          </div>

          {/* SIMULATOR AUDIO STAGE / RECORDING FRAME */}
          <div className="relative p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-4 overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center relative">
              {isRecording ? (
                <>
                  <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
                  <Mic className="w-8 h-8 text-orange-400 z-10" />
                </>
              ) : analyzing ? (
                <Loader2 className="w-8 h-8 text-cyan-400 z-10 animate-spin" />
              ) : (
                <Mic className="w-8 h-8 text-zinc-400 z-10" />
              )}
            </div>

            <div className="space-y-1 font-mono">
              <div className="text-2xl font-extrabold text-white">{formatSeconds(recordingTime)}</div>
              <div className="text-xs text-zinc-400">
                {isRecording
                  ? 'Recording audio… Speak your answer clearly'
                  : analyzing
                  ? 'Sending to Gemini AI for analysis…'
                  : 'Click start to practice response'}
              </div>
            </div>

            {/* SPEECH WAVEFORM SIMULATION */}
            {isRecording && (
              <div className="flex items-center gap-1.5 h-8">
                {[40, 75, 30, 90, 50, 80, 45, 60, 95, 35].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ['25%', `${h}%`, '25%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                    className="w-1 bg-orange-400 rounded-full"
                  />
                ))}
              </div>
            )}

            <div className="pt-2">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={analyzing}
                  className="btn-primary py-3 px-8 text-xs font-bold rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-4 h-4 text-black" />
                  <span>Start Recording Answer</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="px-8 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop & Analyze Speech</span>
                </button>
              )}
            </div>
          </div>

          {/* QUESTION SELECTOR */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Select Question Prompt</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
              {filteredQuestions.map(q => (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setFeedback(null);
                    setApiError(null);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedQuestion.id === q.id
                      ? 'bg-cyan-950/30 border-cyan-800/60 text-white font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <p className="line-clamp-1">{q.questionText}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: SPEECH FEEDBACK REPORT */}
        <motion.div variants={itemVariants} className="lg:col-span-5 mono-card p-6 space-y-6">
          {analyzing ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-orange-400 mx-auto animate-spin" />
              <p className="text-xs font-semibold text-zinc-400 font-mono">Gemini AI is evaluating your response…</p>
            </div>
          ) : !feedback ? (
            <div className="py-24 text-center space-y-2">
              <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold text-zinc-400 font-mono">Record an answer to generate AI speech feedback report</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl font-mono text-center">
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
                    <li key={idx} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Actionable Improvement Areas</h4>
                <ul className="space-y-2 text-xs">
                  {feedback.improvements.map((imp, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
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
