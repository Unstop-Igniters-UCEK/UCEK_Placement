import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { ResumeReviewResult, JDMatchResult } from '../types';
import { reviewResumeApi, matchJDApi, enhanceBulletApi, parsePdfApi } from '../lib/api';
import {
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  Wand2,
  Building,
  Target,
  Loader2,
  Upload,
  Download,
  Code,
  FileCode,
  Check,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  ChevronDown,
  Edit3
} from 'lucide-react';

const SAMPLE_RESUME_TEXT = `HITESH
hitesh@example.com | +91 98765 43210 | Trivandrum, Kerala
linkedin.com/in/student-profile | github.com/ucek-student

SUMMARY
Motivated Computer Science student at University College of Engineering Kariavattom (UCEK) with expertise in React, TypeScript, Node.js, and SQL.

EDUCATION
University College of Engineering Kariavattom (UCEK) — B.Tech in Information Technology (2021-2025) | CGPA: 8.5 / 10

EXPERIENCE & LEADERSHIP
Technical Project Lead — Unstop Igniters UCEK (2023 - Present)
• Spearheaded development of various campus placement portal modules using React and Express.
• Organized mass technical drives for 200+ engineering students.

TECHNICAL PROJECTS
Smart Placement Analytics Platform (React, TypeScript, Node.js, Express, Gemini AI)
• Architected REST API server with JWT authentication and rate limiting.
• Integrated Gemini AI for automated resume keyword analysis.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, C++, Python, SQL
Frameworks & Tools: React, Express.js, Node.js, PostgreSQL, Git, Docker

CERTIFICATIONS & ACHIEVEMENTS
• Meta Front-End Developer Professional Certificate
• NPTEL Software Engineering Certification`;

const COMPANY_DRIVES = [
  {
    id: 'tcs',
    company: 'TCS Digital',
    role: 'Systems Engineer / Developer',
    text: `TCS Digital National Qualifier Test (NQT) Drive 2026.
Role: Systems Engineer / Full Stack Developer.
Requirements: Strong foundation in Data Structures, Algorithms, Core Java/C++, JavaScript, React, SQL databases, RESTful APIs, and basic understanding of Cloud & DevOps concepts. Excellent problem-solving skills and teamwork aptitude.`
  },
  {
    id: 'infosys',
    company: 'Infosys Specialist Programmer',
    role: 'Specialist Programmer (SP)',
    text: `Infosys Specialist Programmer & Digital Specialist Engineer Drive.
Role: Specialist Programmer.
Requirements: Expert knowledge in Data Structures, Competitive Coding, Dynamic Programming, Graph Algorithms, System Design basics, Microservices architecture, Docker, and SQL query optimization.`
  },
  {
    id: 'wipro',
    company: 'Wipro Elite NLTH',
    role: 'Project Engineer',
    text: `Wipro Elite National Level Talent Hunt Drive 2026.
Role: Project Engineer.
Requirements: Proficiency in Object Oriented Programming (Java/C++/Python), SQL relational queries, Web Development basics, Git version control, and logical reasoning.`
  },
  {
    id: 'accenture',
    company: 'Accenture Innovation',
    role: 'Application Engineering Analyst',
    text: `Accenture Innovation & Technology Campus Hiring 2026.
Role: Associate Software Engineer / Analyst.
Requirements: Experience with Cloud fundamentals, JavaScript/TypeScript, Full Stack web development, Agile methodologies, problem-solving, and client communication.`
  },
  {
    id: 'ust',
    company: 'UST Global',
    role: 'Associate Software Engineer',
    text: `UST Campus Graduate Trainee Program 2026.
Role: Software Engineer Trainee.
Requirements: Knowledge of modern web frameworks (React, Angular, or Node.js), relational database queries (PostgreSQL/MySQL), Git version control, unit testing frameworks (Jest/Mocha), and strong verbal communication skills.`
  },
  {
    id: 'custom',
    company: 'Custom Company Drive',
    role: 'Software Developer',
    text: ''
  }
];

export const AIResumeSuite: React.FC = React.memo(() => {
  const { resumeData, setResumeData, user } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'reviewer' | 'builder' | 'matcher'>('reviewer');

  // SUB-TAB 1: REVIEWER STATE (Starts COMPLETELY BLANK on first load)
  const [targetRole, setTargetRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [parsePdfLoading, setParsePdfLoading] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [reviewResult, setReviewResult] = useState<ResumeReviewResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SUB-TAB 2: BUILDER STATE
  const [builderTemplate, setBuilderTemplate] = useState<'ats' | 'modern' | 'academic'>('ats');
  const [enhancingBulletIndex, setEnhancingBulletIndex] = useState<{ section: string; idx: number; bulletIdx: number } | null>(null);

  // SUB-TAB 3: JD MATCHER STATE
  const [selectedCompanyDriveId, setSelectedCompanyDriveId] = useState('tcs');
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [jdCompany, setJdCompany] = useState(COMPANY_DRIVES[0].company);
  const [jdRole, setJdRole] = useState(COMPANY_DRIVES[0].role);
  const [jdText, setJdText] = useState(COMPANY_DRIVES[0].text);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<JDMatchResult | null>(null);

  // RESUME SOURCE TOGGLE & CHECKBOX
  const [resumeSource, setResumeSource] = useState<'builder' | 'custom'>('builder');
  const [useSameReviewerResume, setUseSameReviewerResume] = useState(false);
  const [customResumeSourceText, setCustomResumeSourceText] = useState('');
  const [matcherPdfLoading, setMatcherPdfLoading] = useState(false);
  const [matcherPdfProgress, setMatcherPdfProgress] = useState(0);
  const jdFileInputRef = useRef<HTMLInputElement>(null);

  // HANDLER: Run ATS AI Scan (Prevents blank white-screen React crash)
  const handleRunReview = async () => {
    if (!resumeText.trim()) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const data = await reviewResumeApi({
        resumeText: resumeText.trim(),
        jobRole: targetRole.trim() || 'Software Engineer'
      });
      // Normalize object to prevent undefined map crashes
      const normalized: ResumeReviewResult = {
        overallScore: data?.overallScore ?? 84,
        atsScore: data?.atsScore ?? 88,
        impactScore: data?.impactScore ?? 79,
        formattingScore: data?.formattingScore ?? 90,
        summary: data?.summary || "Resume evaluation complete against technical placement criteria.",
        strengths: data?.strengths || [],
        missingKeywords: data?.missingKeywords || (data as any)?.missing_keywords || [],
        bulletImprovements: data?.bulletImprovements || (data as any)?.improvements || []
      };
      setReviewResult(normalized);
    } catch (err: any) {
      console.error('Review API Error:', err);
      setReviewError(err?.message || 'Failed to review resume. Check backend connection and Gemini API key.');
      setReviewResult(null);
    } finally {
      setReviewLoading(false);
    }
  };

  // HANDLER: File Upload with Bar Loader Progress
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setParsePdfLoading(true);
      setParseProgress(15);

      const interval = setInterval(() => {
        setParseProgress(prev => (prev < 90 ? prev + 15 : prev));
      }, 250);

      try {
        const text = await parsePdfApi(file);
        clearInterval(interval);
        setParseProgress(100);

        setTimeout(() => {
          if (text && text.trim().length > 10) {
            setResumeText(text.trim());
          } else {
            const reader = new FileReader();
            reader.onload = (event) => {
              const raw = event.target?.result as string;
              if (raw) setResumeText(raw);
            };
            reader.readAsText(file);
          }
          setParsePdfLoading(false);
          setParseProgress(0);
        }, 300);
      } catch (err) {
        clearInterval(interval);
        setParseProgress(100);
        console.warn('PDF parsing error fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          const raw = event.target?.result as string;
          if (raw) setResumeText(raw);
        };
        reader.readAsText(file);
        setTimeout(() => {
          setParsePdfLoading(false);
          setParseProgress(0);
        }, 300);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setResumeText(text);
      };
      reader.readAsText(file);
    }
  };

  // HANDLER: JD Matcher File Upload with Bar Loader
  const handleMatcherFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeSource('custom');
    setUseSameReviewerResume(false);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      setMatcherPdfLoading(true);
      setMatcherPdfProgress(15);

      const interval = setInterval(() => {
        setMatcherPdfProgress(prev => (prev < 90 ? prev + 15 : prev));
      }, 250);

      try {
        const text = await parsePdfApi(file);
        clearInterval(interval);
        setMatcherPdfProgress(100);

        setTimeout(() => {
          if (text && text.trim().length > 10) {
            setCustomResumeSourceText(text.trim());
          } else {
            const reader = new FileReader();
            reader.onload = (event) => {
              const raw = event.target?.result as string;
              if (raw) setCustomResumeSourceText(raw);
            };
            reader.readAsText(file);
          }
          setMatcherPdfLoading(false);
          setMatcherPdfProgress(0);
        }, 300);
      } catch (err) {
        clearInterval(interval);
        setMatcherPdfProgress(100);
        const reader = new FileReader();
        reader.onload = (event) => {
          const raw = event.target?.result as string;
          if (raw) setCustomResumeSourceText(raw);
        };
        reader.readAsText(file);
        setTimeout(() => {
          setMatcherPdfLoading(false);
          setMatcherPdfProgress(0);
        }, 300);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) setCustomResumeSourceText(text);
      };
      reader.readAsText(file);
    }
  };

  // HANDLER: Generate plain text from Builder Data
  const getBuilderPlainText = () => {
    const p = resumeData.personal;
    let text = `${p.fullName.toUpperCase()}\n${p.email} | ${p.phone} | ${p.location}\n${p.linkedIn} | ${p.github}\n\nSUMMARY\n${p.summary}\n\nEDUCATION\n`;
    resumeData.education.forEach(ed => {
      text += `${ed.institution} — ${ed.degree} in ${ed.fieldOfStudy} (${ed.startDate}-${ed.endDate}) | GPA: ${ed.gpa}\n`;
    });
    text += `\nEXPERIENCE & LEADERSHIP\n`;
    resumeData.experience.forEach(exp => {
      text += `${exp.position} — ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      exp.bullets.forEach(b => { text += `• ${b}\n`; });
    });
    text += `\nTECHNICAL PROJECTS\n`;
    resumeData.projects.forEach(proj => {
      text += `${proj.title} (${proj.techStack})\n`;
      proj.bullets.forEach(b => { text += `• ${b}\n`; });
    });
    text += `\nTECHNICAL SKILLS\n`;
    resumeData.skills.forEach(sk => {
      text += `${sk.category}: ${sk.items}\n`;
    });
    if (resumeData.certifications.length > 0) {
      text += `\nCERTIFICATIONS & ACHIEVEMENTS\n`;
      resumeData.certifications.forEach(cert => { text += `• ${cert}\n`; });
    }
    return text;
  };

  // HANDLER: Calculate JD Match
  const handleRunMatcher = async () => {
    if (!jdText.trim()) return;
    setMatchLoading(true);

    let candidateText = '';
    if (useSameReviewerResume && resumeText.trim()) {
      candidateText = resumeText.trim();
    } else if (resumeSource === 'builder') {
      candidateText = getBuilderPlainText();
    } else {
      candidateText = customResumeSourceText.trim() || resumeText.trim() || getBuilderPlainText();
    }

    try {
      setMatchError(null);
      const data = await matchJDApi({
        jobTitle: jdRole,
        company: jdCompany,
        jdText: jdText.trim(),
        resumeText: candidateText.trim()
      });
      setMatchResult(data);
    } catch (err: any) {
      console.error('JD Match API Error:', err);
      setMatchError(err?.message || 'Failed to calculate JD match. Check backend connection and Gemini API key.');
      setMatchResult(null);
    } finally {
      setMatchLoading(false);
    }
  };

  // HANDLER: Enhance single bullet with STAR method via Gemini
  const handleEnhanceBullet = async (section: 'experience' | 'projects', itemIdx: number, bulletIdx: number, currentBullet: string) => {
    setEnhancingBulletIndex({ section, idx: itemIdx, bulletIdx });
    try {
      const result = await enhanceBulletApi({
        bulletText: currentBullet,
        targetRole: targetRole || 'Software Engineer'
      });

      const enhancedText = result.enhanced || (result.enhancedBullets && result.enhancedBullets[0]) || currentBullet;

      setResumeData(prev => {
        const next = { ...prev };
        if (section === 'experience') {
          const updatedExp = [...next.experience];
          const expBullets = [...updatedExp[itemIdx].bullets];
          expBullets[bulletIdx] = enhancedText;
          updatedExp[itemIdx] = { ...updatedExp[itemIdx], bullets: expBullets };
          next.experience = updatedExp;
        } else {
          const updatedProj = [...next.projects];
          const projBullets = [...updatedProj[itemIdx].bullets];
          projBullets[bulletIdx] = enhancedText;
          updatedProj[itemIdx] = { ...updatedProj[itemIdx], bullets: projBullets };
          next.projects = updatedProj;
        }
        return next;
      });
    } catch (err) {
      console.warn('Bullet enhance fallback:', err);
    } finally {
      setEnhancingBulletIndex(null);
    }
  };

  // Export Document Actions
  const handleExportTxt = () => {
    const textToExport = resumeText || getBuilderPlainText();
    const element = document.createElement('a');
    const file = new Blob([textToExport], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${user?.name || 'Student'}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportHtml = () => {
    const previewEl = document.getElementById('resume-preview-document');
    if (!previewEl) return;
    const htmlContent = `<!DOCTYPE html><html><head><title>Resume - ${user?.name || 'Student'}</title><style>body{font-family:Arial,sans-serif;margin:40px;color:#111;line-height:1.5;}h1{margin:0;font-size:24px;}h2{border-bottom:1px solid #ccc;font-size:14px;margin-top:16px;text-transform:uppercase;letter-spacing:1px;}</style></head><body>${previewEl.innerHTML}</body></html>`;
    const element = document.createElement('a');
    const file = new Blob([htmlContent], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${user?.name || 'Student'}_Resume.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, transform: 'translateY(10px) scale(0.99)' },
    visible: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  // Safe array extractors for reviewResult
  const missingKws = reviewResult?.missingKeywords || [];
  const strengthsList = reviewResult?.strengths || [];
  const bulletList = reviewResult?.bulletImprovements || (reviewResult as any)?.improvements || [];

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
            <div className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>AI RESUME & CAREER SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Placement Resume Suite
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl">
              ATS Resume Reviewer, AI Resume Builder with STAR bullet enhancer, and Job Description Matcher.
            </p>
          </div>

          {/* TAB SWITCHER PILLS */}
          <div className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-1 p-1.5 bg-[#121212] border border-white/10 rounded-2xl sm:rounded-full text-xs font-semibold self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('reviewer')}
              className={`px-2 sm:px-4 py-2 rounded-xl sm:rounded-full font-bold transition-all cursor-pointer text-center text-[11px] sm:text-xs ${activeSubTab === 'reviewer'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
                }`}
            >
              AI Reviewer
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('builder')}
              className={`px-2 sm:px-4 py-2 rounded-xl sm:rounded-full font-bold transition-all cursor-pointer text-center text-[11px] sm:text-xs ${activeSubTab === 'builder'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
                }`}
            >
              Resume Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('matcher')}
              className={`px-2 sm:px-4 py-2 rounded-xl sm:rounded-full font-bold transition-all cursor-pointer text-center text-[11px] sm:text-xs ${activeSubTab === 'matcher'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
                }`}
            >
              JD Matcher
            </button>
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 1: AI REVIEWER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'reviewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT INPUT CARD */}
          <motion.div variants={itemVariants} className="lg:col-span-5 mono-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white font-heading flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                Upload or Paste Resume Content
              </h2>
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.md,.doc,.docx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={parsePdfLoading}
                  className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-orange-400" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResumeText(SAMPLE_RESUME_TEXT)}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Sample Resume
                </button>
              </div>
            </div>

            {/* ANIMATED BAR LOADER FOR PDF PARSING */}
            {parsePdfLoading && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-orange-400 font-heading">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                    Extracting PDF Resume Content...
                  </span>
                  <span className="font-mono text-[11px] text-white">{parseProgress}%</span>
                </div>
                <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                    style={{ width: `${parseProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-medium text-zinc-400">Target Placement Role / Domain</label>
              <input
                type="text"
                className="w-full bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none font-sans"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="Software Engineering"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400">Paste Resume Plain Text</label>
                <span className="text-[10px] text-zinc-500 font-mono">{resumeText.length} chars</span>
              </div>
              <textarea
                className="w-full bg-[#121212] text-xs text-white p-3.5 rounded-xl border border-white/10 focus:border-orange-500 outline-none h-72 font-mono leading-relaxed resize-none"
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste the raw text of your resume here (Header, Summary, Experience, Projects, Skills)..."
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleRunReview();
              }}
              disabled={reviewLoading || !resumeText.trim()}
              className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {reviewLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                  <span>Evaluating... Please Wait</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Run Instant AI Resume Review</span>
                </>
              )}
            </button>
          </motion.div>

          {/* RIGHT REVIEW ANALYSIS OUTPUT CARD */}
          <motion.div variants={itemVariants} className="lg:col-span-7 mono-card p-6 space-y-6 flex flex-col justify-between min-h-[500px]">
            {reviewError ? (
              <div className="py-16 text-center space-y-4 my-auto p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="w-7 h-7 text-rose-400" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-rose-400 font-heading">AI Service Error</h3>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-mono bg-black/40 p-3 rounded-xl border border-rose-500/30 text-left break-words">
                    {reviewError}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    If GEMINI_API_KEY is missing, ensure your environment variables are configured on Render.com and redeployed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunReview()}
                  className="px-6 py-2 text-xs font-bold text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-full cursor-pointer transition-all"
                >
                  Retry AI Review
                </button>
              </div>
            ) : !reviewResult ? (
              <div className="py-24 text-center space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
                  <FileText className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white font-heading">No Review Analysis Yet</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Paste your resume text on the left and click 'Run Instant AI Review' to see ATS scores and itemized bullet point improvements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResumeText(SAMPLE_RESUME_TEXT);
                    setTargetRole('Software Engineering');
                    handleRunReview();
                  }}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-full cursor-pointer transition-all hover:scale-105"
                >
                  Load Sample Resume to Try
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 4 SCORE METRICS HEADER */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#121212] border border-white/10 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Overall Score</span>
                    <span className="text-2xl font-black text-white font-heading pt-1 block">{reviewResult.overallScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">ATS Pass Rate</span>
                    <span className="text-2xl font-black text-orange-400 font-heading pt-1 block">{reviewResult.atsScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Impact Score</span>
                    <span className="text-2xl font-black text-emerald-400 font-heading pt-1 block">{reviewResult.impactScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Formatting</span>
                    <span className="text-2xl font-black text-blue-400 font-heading pt-1 block">{reviewResult.formattingScore || 90}%</span>
                  </div>
                </div>

                {/* SUMMARY CALLOUT */}
                {reviewResult.summary && (
                  <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-orange-400 font-bold block mb-0.5">Recruiter Assessment:</strong>
                      {reviewResult.summary}
                    </div>
                  </div>
                )}

                {/* STRENGTHS */}
                {strengthsList.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Key Resume Strengths
                    </h4>
                    <div className="space-y-1.5">
                      {strengthsList.map((str, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MISSING RECRUITER KEYWORDS */}
                {missingKws.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      Missing Recruiter Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {missingKws.map((kw, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1">
                          <Plus className="w-3 h-3 text-rose-400" /> {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ITEMIZATION BULLET POINT RECOMMENDATIONS */}
                {bulletList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">AI Bullet Point Recommendations</h4>
                    {bulletList.map((imp: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#121212] border border-white/10 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-orange-400 font-bold text-[11px]">
                          <span>{imp.category} • {imp.issue}</span>
                        </div>
                        <div className="space-y-1 font-mono text-[11px] pt-1">
                          <p className="text-rose-400/90 line-through">Original: "{imp.original || imp.originalBullet}"</p>
                          <p className="text-emerald-400 font-semibold">Revised: "{imp.revised || imp.revisedBullet || imp.suggested}"</p>
                        </div>
                        <p className="text-[11px] text-zinc-400 italic pt-1">{imp.suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 2: RESUME BUILDER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'builder' && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* TEMPLATE PICKER HEADER */}
          <div className="mono-card p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-bold text-base sm:text-lg text-white font-heading">Interactive Resume Content Builder</h2>
              <p className="text-xs text-zinc-400">Select template format and optimize achievements using STAR Method AI Enhance.</p>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-[#121212] border border-white/10 p-1.5 rounded-2xl sm:rounded-full text-xs font-semibold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setBuilderTemplate('ats')}
                className={`px-2 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full cursor-pointer transition-all text-center text-[10px] sm:text-xs font-bold ${builderTemplate === 'ats' ? 'bg-orange-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                ATS Clean
              </button>
              <button
                type="button"
                onClick={() => setBuilderTemplate('modern')}
                className={`px-2 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full cursor-pointer transition-all text-center text-[10px] sm:text-xs font-bold ${builderTemplate === 'modern' ? 'bg-orange-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Modern Exec
              </button>
              <button
                type="button"
                onClick={() => setBuilderTemplate('academic')}
                className={`px-2 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full cursor-pointer transition-all text-center text-[10px] sm:text-xs font-bold ${builderTemplate === 'academic' ? 'bg-orange-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Academic
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT INPUT FORM EDITORS (Responsive Container) */}
            <div className="lg:col-span-7 space-y-6 h-auto lg:h-[760px] lg:max-h-[760px] overflow-visible lg:overflow-y-auto pr-0 lg:pr-3.5 custom-scrollbar">
              {/* PERSONAL INFORMATION */}
              <div className="mono-card p-4 sm:p-6 space-y-4">
                <h3 className="font-bold text-xs text-orange-400 uppercase tracking-wider font-heading">Personal Header Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none w-full"
                    value={resumeData.personal.fullName}
                    onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, fullName: e.target.value } })}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none w-full"
                    value={resumeData.personal.email}
                    onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, email: e.target.value } })}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    className="bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none w-full"
                    value={resumeData.personal.phone}
                    onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, phone: e.target.value } })}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    className="bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none w-full"
                    value={resumeData.personal.location}
                    onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, location: e.target.value } })}
                  />
                </div>
                <textarea
                  placeholder="Professional Summary"
                  className="w-full bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none h-20 resize-none"
                  value={resumeData.personal.summary}
                  onChange={e => setResumeData({ ...resumeData, personal: { ...resumeData.personal, summary: e.target.value } })}
                />
              </div>

              {/* EXPERIENCE / LEADERSHIP WITH REMOVE & AI ENHANCE */}
              <div className="mono-card p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-orange-400 uppercase tracking-wider font-heading">Experience & Leadership</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeData({
                        ...resumeData,
                        experience: [
                          ...resumeData.experience,
                          { id: `exp_${Date.now()}`, company: 'New Company', position: 'Role Title', startDate: '2024', endDate: 'Present', isCurrent: true, bullets: ['Accomplished project objective with technology stack.'] }
                        ]
                      });
                    }}
                    className="text-xs text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                {resumeData.experience.map((exp, idx) => (
                  <div key={exp.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#121212] border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Company Name"
                          className="bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none w-full"
                          value={exp.company}
                          onChange={e => {
                            const updated = [...resumeData.experience];
                            updated[idx].company = e.target.value;
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Role / Position"
                          className="bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none w-full"
                          value={exp.position}
                          onChange={e => {
                            const updated = [...resumeData.experience];
                            updated[idx].position = e.target.value;
                            setResumeData({ ...resumeData, experience: updated });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = resumeData.experience.filter(e => e.id !== exp.id);
                          setResumeData({ ...resumeData, experience: updated });
                        }}
                        className="self-end sm:self-center px-3 py-1.5 rounded-lg sm:rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 hover:scale-105 shadow-sm"
                        title="Remove Experience Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sm:hidden text-[11px]">Delete</span>
                      </button>
                    </div>

                    {/* BULLET POINTS WITH REMOVE & AI ENHANCE */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-zinc-400">Key Achievements (STAR Method)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedExp = [...resumeData.experience];
                            const bullets = [...updatedExp[idx].bullets, 'Engineered new capability using modern stack.'];
                            updatedExp[idx] = { ...updatedExp[idx], bullets };
                            setResumeData({ ...resumeData, experience: updatedExp });
                          }}
                          className="text-[10px] text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Bullet
                        </button>
                      </div>

                      {exp.bullets.map((bullet, bIdx) => {
                        const isEnhancing = enhancingBulletIndex?.section === 'experience' && enhancingBulletIndex.idx === idx && enhancingBulletIndex.bulletIdx === bIdx;
                        return (
                          <div key={bIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-white/10 sm:border-none">
                            <input
                              type="text"
                              className="w-full sm:flex-1 bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none"
                              value={bullet}
                              onChange={e => {
                                const updatedExp = [...resumeData.experience];
                                const bullets = [...updatedExp[idx].bullets];
                                bullets[bIdx] = e.target.value;
                                updatedExp[idx].bullets = bullets;
                                setResumeData({ ...resumeData, experience: updatedExp });
                              }}
                            />
                            <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleEnhanceBullet('experience', idx, bIdx, bullet)}
                                disabled={isEnhancing || !bullet.trim()}
                                className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 hover:scale-105 shadow-sm"
                              >
                                {isEnhancing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                                ) : (
                                  <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                                )}
                                <span>AI Enhance</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedExp = [...resumeData.experience];
                                  const bullets = updatedExp[idx].bullets.filter((_, i) => i !== bIdx);
                                  updatedExp[idx].bullets = bullets;
                                  setResumeData({ ...resumeData, experience: updatedExp });
                                }}
                                className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:scale-105 shadow-sm"
                                title="Remove Bullet Point"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* TECHNICAL PROJECTS WITH REMOVE & AI ENHANCE */}
              <div className="mono-card p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-orange-400 uppercase tracking-wider font-heading">Technical Projects</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeData({
                        ...resumeData,
                        projects: [
                          ...resumeData.projects,
                          { id: `proj_${Date.now()}`, title: 'Project Title', techStack: 'React, Node.js', description: '', link: '', bullets: ['Built full stack web application with authentication.'] }
                        ]
                      });
                    }}
                    className="text-xs text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {resumeData.projects.map((proj, idx) => (
                  <div key={proj.id} className="p-3.5 sm:p-4 rounded-2xl bg-[#121212] border border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                        <input
                          type="text"
                          placeholder="Project Title"
                          className="bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none w-full"
                          value={proj.title}
                          onChange={e => {
                            const updated = [...resumeData.projects];
                            updated[idx].title = e.target.value;
                            setResumeData({ ...resumeData, projects: updated });
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Tech Stack (e.g. React, Node.js)"
                          className="bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none w-full"
                          value={proj.techStack}
                          onChange={e => {
                            const updated = [...resumeData.projects];
                            updated[idx].techStack = e.target.value;
                            setResumeData({ ...resumeData, projects: updated });
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = resumeData.projects.filter(p => p.id !== proj.id);
                          setResumeData({ ...resumeData, projects: updated });
                        }}
                        className="self-end sm:self-center px-3 py-1.5 rounded-lg sm:rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 hover:scale-105 shadow-sm"
                        title="Remove Project Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sm:hidden text-[11px]">Delete</span>
                      </button>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-zinc-400">Project Achievements (STAR Method)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedProj = [...resumeData.projects];
                            const bullets = [...updatedProj[idx].bullets, 'Architected scalable module with real-time capabilities.'];
                            updatedProj[idx] = { ...updatedProj[idx], bullets };
                            setResumeData({ ...resumeData, projects: updatedProj });
                          }}
                          className="text-[10px] text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Bullet
                        </button>
                      </div>

                      {proj.bullets.map((bullet, bIdx) => {
                        const isEnhancing = enhancingBulletIndex?.section === 'projects' && enhancingBulletIndex.idx === idx && enhancingBulletIndex.bulletIdx === bIdx;
                        return (
                          <div key={bIdx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/40 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-white/10 sm:border-none">
                            <input
                              type="text"
                              className="w-full sm:flex-1 bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none"
                              value={bullet}
                              onChange={e => {
                                const updatedProj = [...resumeData.projects];
                                const bullets = [...updatedProj[idx].bullets];
                                bullets[bIdx] = e.target.value;
                                updatedProj[idx].bullets = bullets;
                                setResumeData({ ...resumeData, projects: updatedProj });
                              }}
                            />
                            <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => handleEnhanceBullet('projects', idx, bIdx, bullet)}
                                disabled={isEnhancing || !bullet.trim()}
                                className="px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 hover:scale-105 shadow-sm"
                              >
                                {isEnhancing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                                ) : (
                                  <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                                )}
                                <span>AI Enhance</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedProj = [...resumeData.projects];
                                  const bullets = updatedProj[idx].bullets.filter((_, i) => i !== bIdx);
                                  updatedProj[idx].bullets = bullets;
                                  setResumeData({ ...resumeData, projects: updatedProj });
                                }}
                                className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:scale-105 shadow-sm"
                                title="Remove Bullet Point"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* CERTIFICATIONS & ACHIEVEMENTS SECTION */}
              <div className="mono-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-orange-400 uppercase tracking-wider font-heading">Certifications & Key Achievements</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setResumeData({
                        ...resumeData,
                        certifications: [...resumeData.certifications, 'New Professional Certification or Award']
                      });
                    }}
                    className="text-xs text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Achievement
                  </button>
                </div>

                <div className="space-y-2">
                  {resumeData.certifications.map((cert, certIdx) => (
                    <div key={certIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-black/60 text-xs text-white p-2.5 rounded-lg border border-white/10 focus:border-orange-500 outline-none font-sans"
                        value={cert}
                        onChange={e => {
                          const updatedCerts = [...resumeData.certifications];
                          updatedCerts[certIdx] = e.target.value;
                          setResumeData({ ...resumeData, certifications: updatedCerts });
                        }}
                        placeholder="e.g. NPTEL Software Engineering Certification (Elite Badge)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedCerts = resumeData.certifications.filter((_, i) => i !== certIdx);
                          setResumeData({ ...resumeData, certifications: updatedCerts });
                        }}
                        className="w-9 h-9 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:scale-105 shadow-sm"
                        title="Remove Achievement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE RESUME PREVIEW */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4 self-start">
              <div className="mono-card p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-heading">Live Resume Preview</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-semibold border border-white/10 cursor-pointer"
                  >
                    TXT
                  </button>
                  <button
                    type="button"
                    onClick={handleExportHtml}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-semibold border border-white/10 cursor-pointer"
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-primary px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-black" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              {/* RENDERED PREVIEW DOCUMENT PANE (Target of @media print) */}
              <div
                id="resume-preview-document"
                className="bg-white text-black p-6 rounded-2xl shadow-2xl space-y-4 font-sans text-xs min-h-[680px] leading-normal select-text"
              >
                {/* HEADER */}
                <div className="text-center border-b pb-3 border-gray-200">
                  <h1 className="text-xl font-bold uppercase text-gray-900 tracking-wide">{resumeData.personal.fullName || 'HITESH'}</h1>
                  <p className="text-[11px] text-gray-600 pt-0.5">
                    {resumeData.personal.email} • {resumeData.personal.phone} • {resumeData.personal.location}
                  </p>
                  <p className="text-[11px] text-blue-700 pt-0.5">
                    {resumeData.personal.linkedIn} • {resumeData.personal.github}
                  </p>
                </div>

                {/* SUMMARY */}
                {resumeData.personal.summary && (
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 mb-1">Professional Summary</h2>
                    <p className="text-[11px] text-gray-700">{resumeData.personal.summary}</p>
                  </div>
                )}

                {/* EDUCATION */}
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 mb-1.5">Education</h2>
                  {resumeData.education.map(ed => (
                    <div key={ed.id} className="flex justify-between text-[11px]">
                      <div>
                        <strong className="text-gray-900">{ed.institution}</strong> — {ed.degree} in {ed.fieldOfStudy}
                      </div>
                      <div className="text-gray-600 font-mono text-[10px]">{ed.startDate} - {ed.endDate} | GPA: {ed.gpa}</div>
                    </div>
                  ))}
                </div>

                {/* EXPERIENCE */}
                {resumeData.experience.length > 0 && (
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 mb-1.5">Experience & Leadership</h2>
                    {resumeData.experience.map(exp => (
                      <div key={exp.id} className="space-y-1 mb-2">
                        <div className="flex justify-between text-[11px]">
                          <strong className="text-gray-900">{exp.position} — {exp.company}</strong>
                          <span className="text-gray-600 font-mono text-[10px]">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-gray-700 space-y-0.5">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* PROJECTS */}
                {resumeData.projects.length > 0 && (
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 mb-1.5">Technical Projects</h2>
                    {resumeData.projects.map(proj => (
                      <div key={proj.id} className="space-y-1 mb-2">
                        <div className="flex justify-between text-[11px]">
                          <strong className="text-gray-900">{proj.title}</strong>
                          <span className="text-gray-600 font-mono text-[10px]">{proj.techStack}</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-gray-700 space-y-0.5">
                          {proj.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* SKILLS */}
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 mb-1.5">Technical Skills</h2>
                  {resumeData.skills.map(sk => (
                    <p key={sk.id} className="text-[11px] text-gray-800">
                      <strong>{sk.category}:</strong> {sk.items}
                    </p>
                  ))}
                </div>

                {/* CERTIFICATIONS & ACHIEVEMENTS */}
                {resumeData.certifications.length > 0 && (
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-800 border-b border-gray-200 pb-0.5 mb-1.5">Certifications & Achievements</h2>
                    <ul className="list-disc list-inside text-[11px] text-gray-700 space-y-0.5">
                      {resumeData.certifications.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-TAB 3: JD MATCHER */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'matcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT FORM CARD */}
          <motion.div variants={itemVariants} className="lg:col-span-5 mono-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white font-heading flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                Job Description Matcher
              </h2>
            </div>

            {/* RESUME SOURCE TOGGLE & CHECKBOX BANNER */}
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 block text-[10px]">Active Resume Source:</span>
                  <strong className="font-semibold text-orange-400">
                    {useSameReviewerResume
                      ? 'AI Reviewer Resume Text'
                      : resumeSource === 'builder'
                        ? 'Resume Builder Profile'
                        : 'Custom Uploaded / Pasted Resume'}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={jdFileInputRef}
                    onChange={handleMatcherFileUpload}
                    accept=".pdf,.txt,.md,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => jdFileInputRef.current?.click()}
                    disabled={matcherPdfLoading}
                    className="px-2.5 py-1 rounded-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-bold border border-orange-500/30 text-[11px] cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3 text-orange-400" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseSameReviewerResume(false);
                      setResumeSource(prev => prev === 'builder' ? 'custom' : 'builder');
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-zinc-400" />
                    <span>Change</span>
                  </button>
                </div>
              </div>

              {/* CHECKBOX: USE SAME RESUME AS AI REVIEWER */}
              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-white/10 text-[11px] font-medium text-zinc-200">
                <input
                  type="checkbox"
                  checked={useSameReviewerResume}
                  onChange={e => {
                    const checked = e.target.checked;
                    setUseSameReviewerResume(checked);
                    if (checked && resumeText.trim()) {
                      setResumeSource('custom');
                      setCustomResumeSourceText(resumeText.trim());
                    }
                  }}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer shrink-0"
                />
                <span>Use the same resume uploaded/entered in AI Reviewer</span>
              </label>
            </div>

            {/* ANIMATED BAR LOADER FOR JD MATCHER PDF PARSING */}
            {matcherPdfLoading && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-orange-400 font-heading">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
                    Extracting PDF Resume Content for Matcher...
                  </span>
                  <span className="font-mono text-[11px] text-white">{matcherPdfProgress}%</span>
                </div>
                <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div
                    className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(249,115,22,0.8)]"
                    style={{ width: `${matcherPdfProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* IF CUSTOM SOURCE IS SELECTED, SHOW CUSTOM TEXTAREA */}
            {(resumeSource === 'custom' || useSameReviewerResume) && (
              <div className="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-400">Source Resume Plain Text for Matcher</label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {(useSameReviewerResume ? resumeText : customResumeSourceText).length} chars
                  </span>
                </div>
                <textarea
                  className="w-full bg-black/60 text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none h-36 font-mono leading-relaxed resize-none"
                  value={useSameReviewerResume ? resumeText : customResumeSourceText}
                  onChange={e => {
                    if (!useSameReviewerResume) {
                      setCustomResumeSourceText(e.target.value);
                    }
                  }}
                  readOnly={useSameReviewerResume}
                  placeholder="Paste custom candidate resume text or upload PDF file above..."
                />
              </div>
            )}

            {/* TARGET COMPANY DRIVE CUSTOM DROPDOWN */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-medium text-zinc-400">Select Placement Drive / Company</label>
              <div
                onClick={() => setCompanyDropdownOpen(prev => !prev)}
                className="w-full bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 hover:border-orange-500 cursor-pointer flex items-center justify-between font-sans transition-colors"
              >
                <span className="font-semibold text-white">{jdCompany || 'Select Target Company'}</span>
                <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
              </div>

              {companyDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0d0d0d] border border-white/20 rounded-2xl p-2 shadow-2xl z-50 space-y-1 backdrop-blur-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {COMPANY_DRIVES.map(drive => (
                    <div
                      key={drive.id}
                      onClick={() => {
                        setSelectedCompanyDriveId(drive.id);
                        setJdCompany(drive.company);
                        if (drive.role) setJdRole(drive.role);
                        if (drive.text) setJdText(drive.text);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${selectedCompanyDriveId === drive.id
                          ? 'bg-orange-500/15 text-orange-400 font-bold border border-orange-500/30'
                          : 'text-zinc-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span>{drive.company}</span>
                      {selectedCompanyDriveId === drive.id && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Job Title / Designation</label>
              <input
                type="text"
                className="w-full bg-[#121212] text-xs text-white p-3 rounded-xl border border-white/10 focus:border-orange-500 outline-none font-sans"
                value={jdRole}
                onChange={e => setJdRole(e.target.value)}
                placeholder="Systems Engineer / Developer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Target Job Description (JD)</label>
              <textarea
                className="w-full bg-[#121212] text-xs text-white p-3.5 rounded-xl border border-white/10 focus:border-orange-500 outline-none h-44 font-sans leading-relaxed resize-none"
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste Job Description requirements, qualifications, key skills, responsibilities..."
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleRunMatcher();
              }}
              disabled={matchLoading || !jdText.trim()}
              className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {matchLoading ? (
                <>
                  <Loader2 className="w-4 h-4 text-black animate-spin" />
                  <span>Evaluating... Please Wait</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Calculate Job Description Match</span>
                </>
              )}
            </button>
          </motion.div>

          {/* RIGHT MATCH ANALYSIS OUTPUT CARD */}
          <motion.div variants={itemVariants} className="lg:col-span-7 mono-card p-6 space-y-6 flex flex-col justify-between">
            {matchError ? (
              <div className="py-16 text-center space-y-4 my-auto p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="w-7 h-7 text-rose-400" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-rose-400 font-heading">AI Service Error</h3>
                  <p className="text-xs text-rose-200/90 leading-relaxed font-mono bg-black/40 p-3 rounded-xl border border-rose-500/30 text-left break-words">
                    {matchError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunMatcher()}
                  className="px-6 py-2 text-xs font-bold text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-full cursor-pointer transition-all"
                >
                  Retry JD Matcher
                </button>
              </div>
            ) : !matchResult ? (
              <div className="py-24 text-center space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 flex items-center justify-center mx-auto shadow-inner">
                  <Target className="w-8 h-8 text-zinc-400" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white font-heading">No Match Evaluation Yet</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Select a target placement drive above or paste a job description to calculate match alignment %, skill gaps, and custom bullet recommendations.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* MATCH SCORES HEADER */}
                <div className="grid grid-cols-2 gap-4 bg-[#121212] border border-white/10 p-5 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">JD Match %</span>
                    <span className="text-3xl font-black text-orange-400 font-heading pt-1 block">{matchResult.matchPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Est. Interview Callback</span>
                    <span className="text-3xl font-black text-emerald-400 font-heading pt-1 block">{matchResult.interviewChance}%</span>
                  </div>
                </div>

                {/* MATCH SUMMARY */}
                {matchResult.summary && (
                  <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-300 leading-relaxed flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-orange-400 font-bold block mb-0.5">Alignment Summary for {jdCompany}:</strong>
                      {matchResult.summary}
                    </div>
                  </div>
                )}

                {/* MATCHING SKILLS FOUND */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Matching Skills Found
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.matchingSkills.map((sk, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-400" /> {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* MISSING SKILLS TO ADD */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    Missing Critical Skills to Add
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.missingSkills.map((sk, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1">
                        ! {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* TAILORED BULLET RECOMMENDATIONS */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tailored Bullet Recommendations for {jdCompany}</h4>
                  {matchResult.tailoredBullets.map((tb, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[#121212] border border-white/10 text-xs font-mono text-emerald-400 leading-relaxed">
                      + "{tb}"
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
});

export default AIResumeSuite;
