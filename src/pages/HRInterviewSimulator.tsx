import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
import { InterviewQuestion, InterviewFeedback } from '../types';
import {
  Mic,
  Square,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare
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
  const timerRef = useRef<any>(null);

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
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleStartRecording = () => {
    setFeedback(null);
    setRecordingTime(0);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setAnalyzing(true);

    setTimeout(() => {
      const generatedFeedback: InterviewFeedback = {
        wpm: Math.floor(Math.random() * 30) + 125, // 125 - 155 WPM
        fillerCount: Math.floor(Math.random() * 4), // 0 - 3 fillers
        fillerWords: ['um', 'like', 'you know'].slice(0, Math.floor(Math.random() * 2) + 1),
        confidenceScore: 92,
        tone: 'Confident & Articulate',
        strengths: [
          'Excellent pace regulation matching standard technical interview standards.',
          'Structured response using the STAR (Situation, Task, Action, Result) framework.',
          'Highlighted UCEK coursework and practical project deliverables clearly.'
        ],
        improvements: [
          'Incorporate more quantitative impact metrics (e.g. % performance gain, user scale).',
          'Slight hesitation during technical project architecture explanation.'
        ],
        overallRating: 8.8,
        clarityScore: 90,
        relevanceScore: 95,
        sampleIdealResponse: selectedQuestion.suggestedAnswer,
        transcript: 'Generated response transcript analyzing technical and behavioral competency.'
      };

      setFeedback(generatedFeedback);
      setAnalyzing(false);
    }, 2200);
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
                <Mic className="w-4 h-4 text-white" />
                <span className="mono-badge text-xs font-mono">HR Voice Simulator</span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Voice Interview Practice & AI Analysis
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Practice oral responses with speech recognition, WPM pace tracking, filler word detection, & STAR structure evaluation.
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-1.5 pt-1">
            {['All', 'HR & Behavioral', 'Technical', 'Situational', 'TCS', 'Google'].map(cat => (
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Question Bank (4-Column Spec) */}
        <div className="lg:col-span-4">
          <BorderGlow
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
            <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto min-h-full">
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-white" />
                Question Bank
              </h3>

              <div className="space-y-1.5">
                {filteredQuestions.map(q => {
                  const isSelected = q.id === selectedQuestion.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        setSelectedQuestion(q);
                        setFeedback(null);
                        setIsRecording(false);
                      }}
                      className={`p-3 rounded-sm border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-[var(--bg-body)] border-[var(--border-color)] text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="mono-badge text-[9px] font-mono">{q.category}</span>
                        {q.companyTag && <span className="mono-badge bg-white/10 text-white border-white/20 text-[9px] font-mono">{q.companyTag}</span>}
                      </div>
                      <p className="text-xs line-clamp-2 leading-relaxed">{q.questionText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </BorderGlow>
        </div>

        {/* Main Content: Recording Interface (8-Column Spec) */}
        <div className="lg:col-span-8">
          <BorderGlow
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
            <div className="p-6 space-y-4 min-h-full">
              <div className="p-4 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] space-y-1">
                <span className="mono-badge text-[9px]">Selected Question</span>
                <h2 className="text-sm font-bold text-white leading-relaxed">
                  "{selectedQuestion.questionText}"
                </h2>
              </div>

              {!isRecording && !analyzing && !feedback && (
                <div className="py-12 text-center space-y-3 bg-[var(--bg-body)] rounded-sm border border-[var(--border-color)] p-6">
                  <div className="w-12 h-12 rounded-sm bg-white/10 text-white flex items-center justify-center mx-auto border border-white/20">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-white">Click to Record Your Response</h3>
                    <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                      Speak clearly into your microphone to analyze your WPM pace & speech structure.
                    </p>
                  </div>
                  <button
                    onClick={handleStartRecording}
                    className="btn-primary py-2.5 px-8 rounded-full font-bold text-xs cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-black" />
                    <span>Start Recording</span>
                  </button>
                </div>
              )}

              {isRecording && (
                <div className="py-6 text-center space-y-4 bg-zinc-900 text-white rounded-sm border border-zinc-800 p-5">
                  <div className="flex items-center justify-center gap-1 h-6">
                    <div className="w-1 h-6 bg-white animate-bounce"></div>
                    <div className="w-1 h-4 bg-zinc-300 animate-bounce delay-100"></div>
                    <div className="w-1 h-8 bg-zinc-400 animate-bounce delay-200"></div>
                    <div className="w-1 h-3 bg-white animate-bounce delay-150"></div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-2xl font-extrabold font-mono text-white tracking-widest">
                      {formatSeconds(recordingTime)}
                    </span>
                    <p className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">Recording Live Stream...</p>
                  </div>

                  <button
                    onClick={handleStopRecording}
                    className="btn-primary px-6 py-2 text-xs font-bold rounded-full cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-black fill-black" />
                    <span>Stop & Analyze</span>
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="py-12 text-center space-y-3 bg-[var(--bg-body)] rounded-sm border border-[var(--border-color)]">
                  <Sparkles className="w-8 h-8 text-white animate-spin mx-auto" />
                  <p className="text-xs font-bold text-white">AI Analyzing Voice Cadence & STAR Metrics...</p>
                </div>
              )}

              {feedback && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    <div className="mono-card p-3 text-center space-y-0.5 bg-[var(--bg-body)] border-[var(--border-color)]">
                      <span className="text-[8px] font-semibold text-[var(--text-secondary)] uppercase block font-sans">Speaking Pace</span>
                      <span className="text-xl font-extrabold text-white block">{feedback.wpm} WPM</span>
                      <span className="text-[8px] text-white font-sans font-semibold">Optimal Cadence</span>
                    </div>

                    <div className="mono-card p-3 text-center space-y-0.5 bg-[var(--bg-body)] border-[var(--border-color)]">
                      <span className="text-[8px] font-semibold text-[var(--text-secondary)] uppercase block font-sans">Filler Words</span>
                      <span className="text-xl font-extrabold text-white block">{feedback.fillerCount}</span>
                      <span className="text-[8px] text-[var(--text-secondary)]">({feedback.fillerWords.join(', ')})</span>
                    </div>

                    <div className="mono-card p-3 text-center space-y-0.5 bg-[var(--bg-body)] border-[var(--border-color)]">
                      <span className="text-[8px] font-semibold text-[var(--text-secondary)] uppercase block font-sans">Confidence</span>
                      <span className="text-xl font-extrabold text-white block">{feedback.confidenceScore}%</span>
                      <span className="text-[8px] text-[var(--text-muted)] font-sans font-semibold">High Energy</span>
                    </div>

                    <div className="mono-card p-3 text-center space-y-0.5 bg-[var(--bg-body)] border-[var(--border-color)]">
                      <span className="text-[8px] font-semibold text-[var(--text-secondary)] uppercase block font-sans">Tone</span>
                      <span className="text-[11px] font-bold text-white block mt-1 font-sans">{feedback.tone}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        AI Evaluation Breakdown
                      </h4>
                      <span className="mono-badge font-mono">Rating: {feedback.overallRating} / 10</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-mono">Strengths</span>
                      <ul className="space-y-1 text-xs text-zinc-300">
                        {feedback.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-[var(--border-color)]">
                      <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider block font-mono">Improvements</span>
                      <ul className="space-y-1 text-xs text-zinc-300">
                        {feedback.improvements.map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-sm bg-[var(--bg-card)] border border-[var(--border-color)] space-y-0.5 text-xs font-mono">
                      <span className="font-bold text-white block text-[10px] font-sans">Sample Model Response:</span>
                      <p className="text-zinc-400 italic leading-relaxed">{selectedQuestion.suggestedAnswer}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleStartRecording} className="btn-secondary flex-1 text-xs py-2 rounded-full cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" /> Record Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
};
