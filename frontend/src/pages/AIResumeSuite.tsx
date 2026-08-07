import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { ResumeReviewResult, JDMatchResult } from '../types';
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
  ChevronRight
} from 'lucide-react';

export const AIResumeSuite: React.FC = () => {
  const { resumeData, setResumeData, user } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'reviewer' | 'builder' | 'matcher'>('reviewer');

  // SUB-TAB 1: REVIEWER STATE
  const [targetRole, setTargetRole] = useState(user?.domain || 'Software Engineer');
  const [resumeText, setResumeText] = useState(
    `Anand Nair - anand.nair@ucek.ac.in | 4th Year CSE UCEK
Summary: Passionate CSE student proficient in React, TypeScript, Java, and Data Structures.
Experience: Frontend Intern at Technopark - Created React UI components for campus portal. Integrated REST APIs and optimized state management.
Projects: Smart Placement Portal - Built web platform for automated testing and resume parsing using Node.js and MySQL.`
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ResumeReviewResult | null>({
    overallScore: 84,
    atsScore: 88,
    impactScore: 80,
    missingKeywords: ['Docker', 'CI/CD Pipelines', 'RESTful API Specification', 'Unit Testing (Jest)', 'Agile / Scrum'],
    bulletImprovements: [
      {
        category: 'Work Experience',
        issue: 'Lacks Quantifiable Impact & Metrics',
        original: 'Created React UI components for campus portal.',
        revised: 'Developed 12+ responsive React UI components, improving page render speeds by 35% across 4 primary modules.',
        suggestion: 'Quantified metrics demonstrate concrete business value to technical campus recruiters.'
      },
      {
        category: 'Projects',
        issue: 'Missing Action Verbs & Tech Stack Details',
        original: 'Built web platform for automated testing and resume parsing.',
        revised: 'Architected scalable automated testing engine in Node.js & TypeScript supporting 500+ concurrent student exam submissions.',
        suggestion: 'Prefix bullet points with strong action verbs (Architected, Engineered, Implemented).'
      }
    ]
  });

  // SUB-TAB 3: JD MATCHER STATE
  const [jdCompany, setJdCompany] = useState('TCS Digital / Infosys');
  const [jdRole, setJdRole] = useState('Systems Engineer / Software Developer');
  const [jdText, setJdText] = useState(
    `We are looking for a Software Engineer with strong foundations in Data Structures, Algorithms, JavaScript/TypeScript, React.js, Docker containerization, REST API design, and Relational Databases (MySQL/PostgreSQL). Candidate should have proven project experience and strong problem-solving skills.`
  );
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JDMatchResult | null>({
    matchPercentage: 78,
    interviewChance: 85,
    matchingSkills: ['JavaScript', 'TypeScript', 'React.js', 'Data Structures', 'Algorithms', 'MySQL'],
    missingSkills: ['Docker Containerization', 'RESTful API Spec', 'Jest Unit Testing'],
    missingKeywords: ['CI/CD', 'Agile Methodologies', 'System Architecture'],
    suggestions: [
      'Add Docker and container deployment experience to your technical skills section.',
      'Highlight REST API integration experience in your internship bullet points.',
      'Quantify test coverage or performance gains in your project descriptions.'
    ],
    tailoredBullets: [
      'Orchestrated containerized microservices using Docker, streamlining local developer setup times by 40%.',
      'Implemented robust REST API endpoints in Node.js with 95%+ unit test coverage using Jest.'
    ]
  });

  const handleRunReview = () => {
    setReviewLoading(true);
    setTimeout(() => {
      setReviewResult({
        overallScore: Math.floor(Math.random() * 12) + 82,
        atsScore: Math.floor(Math.random() * 8) + 85,
        impactScore: Math.floor(Math.random() * 10) + 78,
        missingKeywords: ['System Design', 'Microservices', 'GraphQL', 'Kubernetes', 'Redis'],
        bulletImprovements: [
          {
            category: 'Technical Stack',
            issue: 'Weak Keyword Placement',
            original: 'Worked with Node.js and databases.',
            revised: 'Engineered backend microservices utilizing Node.js, Express, and PostgreSQL with Redis caching for low-latency queries.',
            suggestion: 'Explicitly specify database types and architectural patterns used.'
          }
        ]
      });
      setReviewLoading(false);
    }, 400);
  };

  const handleRunMatcher = () => {
    setMatchLoading(true);
    setTimeout(() => {
      setMatchResult({
        matchPercentage: Math.floor(Math.random() * 15) + 78,
        interviewChance: Math.floor(Math.random() * 10) + 82,
        matchingSkills: ['React', 'TypeScript', 'Java', 'SQL', 'Git'],
        missingSkills: ['Docker', 'PostgreSQL Indexing', 'Microservices'],
        missingKeywords: ['Agile', 'Scrum', 'Cloud Native'],
        suggestions: [
          'Align your project titles with the JD required technical competencies.',
          'Emphasize algorithm optimization and data structure proficiency.'
        ],
        tailoredBullets: [
          'Engineered highly optimized database queries reducing API latency by 45%.',
          'Collaborated in Agile sprint cycles delivering production features bi-weekly.'
        ]
      });
      setMatchLoading(false);
    }, 400);
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
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              AI Resume Suite & JD Matcher
            </h1>
            <p className="text-xs text-zinc-400">
              ATS scoring, STAR bullet generator, and live job description keyword matcher.
            </p>
          </div>

          <div className="flex gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-full text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('reviewer')}
              className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                activeSubTab === 'reviewer'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ATS Reviewer
            </button>
            <button
              onClick={() => setActiveSubTab('builder')}
              className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                activeSubTab === 'builder'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              STAR Builder
            </button>
            <button
              onClick={() => setActiveSubTab('matcher')}
              className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                activeSubTab === 'matcher'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              JD Matcher
            </button>
          </div>
        </div>
      </motion.div>

      {/* SUB-TAB 1: AI REVIEWER */}
      {activeSubTab === 'reviewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-5 mono-card p-6 space-y-4">
            <h2 className="font-bold text-sm text-white font-heading flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-400" />
              Target Role & Resume Input
            </h2>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Target Role Title</label>
              <input
                type="text"
                className="w-full bg-zinc-950/80 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:border-orange-500 outline-none font-sans"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="Software Engineer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-400">Resume Content</label>
                <span className="text-[10px] text-zinc-500">{resumeText.length} chars</span>
              </div>
              <textarea
                className="w-full bg-zinc-950/80 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:border-orange-500 outline-none h-64 font-sans leading-relaxed resize-none"
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your existing resume content..."
              />
            </div>

            <button
              onClick={handleRunReview}
              disabled={reviewLoading}
              className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{reviewLoading ? 'Analyzing Resume...' : 'Run ATS AI Scan'}</span>
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-7 mono-card p-6 space-y-6">
            {!reviewResult ? (
              <div className="py-20 text-center space-y-2">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs font-semibold text-zinc-400 font-mono">Paste resume content and run scan to see ATS scores</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl font-mono text-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Overall Score</span>
                    <span className="text-2xl font-extrabold text-white">{reviewResult.overallScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">ATS Pass Rate</span>
                    <span className="text-2xl font-extrabold text-amber-400">{reviewResult.atsScore}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Impact Score</span>
                    <span className="text-2xl font-extrabold text-emerald-400">{reviewResult.impactScore}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Missing Recruiter Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {reviewResult.missingKeywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-rose-950/30 border border-rose-800/50 text-rose-300 text-[11px] font-mono">
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">AI Bullet Point Recommendations</h4>
                  {reviewResult.bulletImprovements.map((imp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-amber-400 font-mono text-[11px] font-bold">
                        <span>{imp.category} • {imp.issue}</span>
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        <p className="text-rose-400 line-through">Original: "{imp.original}"</p>
                        <p className="text-emerald-400 font-semibold">Revised: "{imp.revised}"</p>
                      </div>
                      <p className="text-[11px] text-zinc-400 italic pt-1">{imp.suggestion}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* SUB-TAB 2: STAR BUILDER */}
      {activeSubTab === 'builder' && (
        <motion.div variants={itemVariants} className="mono-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-white font-heading">Interactive Resume Content Builder</h2>
              <p className="text-xs text-zinc-400">STAR Method (Situation, Task, Action, Result) bullet optimizer.</p>
            </div>
            <button onClick={() => window.print()} className="btn-primary py-2 px-4 text-xs font-bold rounded-full">
              <Printer className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Work Experience</h4>
              {resumeData.experience.map(exp => (
                <div key={exp.id} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>{exp.position} @ {exp.company}</span>
                    <span className="text-zinc-500 font-mono text-[11px]">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Key Projects</h4>
              {resumeData.projects.map(proj => (
                <div key={proj.id} className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-white">
                    <span>{proj.title}</span>
                    <span className="text-amber-400 font-mono text-[11px]">{proj.techStack}</span>
                  </div>
                  <ul className="space-y-1 text-zinc-400 list-disc list-inside">
                    {proj.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUB-TAB 3: JD MATCHER */}
      {activeSubTab === 'matcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div variants={itemVariants} className="lg:col-span-5 mono-card p-6 space-y-4">
            <h2 className="font-bold text-sm text-white font-heading flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-400" />
              Target Job Description
            </h2>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Company Name</label>
              <input
                type="text"
                className="w-full bg-zinc-950/80 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:border-amber-400 outline-none font-sans"
                value={jdCompany}
                onChange={e => setJdCompany(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Role Title</label>
              <input
                type="text"
                className="w-full bg-zinc-950/80 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:border-amber-400 outline-none font-sans"
                value={jdRole}
                onChange={e => setJdRole(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Job Description Text</label>
              <textarea
                className="w-full bg-zinc-950/80 text-xs text-white p-3 rounded-xl border border-zinc-800 focus:border-amber-400 outline-none h-48 font-sans leading-relaxed resize-none"
                value={jdText}
                onChange={e => setJdText(e.target.value)}
              />
            </div>

            <button
              onClick={handleRunMatcher}
              disabled={matchLoading}
              className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer"
            >
              <Target className="w-4 h-4 text-black" />
              <span>{matchLoading ? 'Matching with JD...' : 'Calculate JD Match Score'}</span>
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-7 mono-card p-6 space-y-6">
            {!matchResult ? (
              <div className="py-20 text-center space-y-2">
                <Target className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs font-semibold text-zinc-400 font-mono">Paste JD text to calculate qualification match</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl font-mono text-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">JD Match %</span>
                    <span className="text-3xl font-extrabold text-amber-400">{matchResult.matchPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Est. Interview Callback</span>
                    <span className="text-3xl font-extrabold text-emerald-400">{matchResult.interviewChance}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Matching Skills Found</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchingSkills.map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-950/30 border border-emerald-800/50 text-emerald-300 text-[11px] font-mono">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Missing Skills to Add</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingSkills.map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-rose-950/30 border border-rose-800/50 text-rose-300 text-[11px] font-mono">
                        ! {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Tailored Bullet Suggestions for {jdCompany}</h4>
                  {matchResult.tailoredBullets.map((tb, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-emerald-400">
                      + "{tb}"
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
