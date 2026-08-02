import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
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
  Loader2
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
        overallScore: Math.floor(Math.random() * 15) + 78,
        atsScore: Math.floor(Math.random() * 10) + 82,
        impactScore: Math.floor(Math.random() * 15) + 75,
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
    }, 800);
  };

  const handleRunMatcher = () => {
    setMatchLoading(true);
    setTimeout(() => {
      setMatchResult({
        matchPercentage: Math.floor(Math.random() * 20) + 75,
        interviewChance: Math.floor(Math.random() * 15) + 80,
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
    }, 800);
  };

  const handleEnhanceBullet = (section: 'exp' | 'proj', parentId: string, bulletIdx: number) => {
    if (section === 'exp') {
      setResumeData(prev => ({
        ...prev,
        experience: prev.experience.map(item => {
          if (item.id !== parentId) return item;
          const updatedBullets = [...item.bullets];
          updatedBullets[bulletIdx] = `Architected & deployed ${updatedBullets[bulletIdx]} delivering 40% performance improvement across production workflows.`;
          return { ...item, bullets: updatedBullets };
        })
      }));
    } else {
      setResumeData(prev => ({
        ...prev,
        projects: prev.projects.map(item => {
          if (item.id !== parentId) return item;
          const updatedBullets = [...item.bullets];
          updatedBullets[bulletIdx] = `Engineered ${updatedBullets[bulletIdx]} utilizing scalable design patterns and robust error handling.`;
          return { ...item, bullets: updatedBullets };
        })
      }));
    }
  };

  const handlePrint = () => {
    window.print();
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
                <FileText className="w-4 h-4 text-white" />
                <span className="mono-badge text-xs font-mono">ATS Optimizer</span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                AI Resume Suite & JD Matcher
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                ATS scoring, STAR bullet generator, and live job description keyword matcher.
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-1.5 pt-1">
            <button
              onClick={() => setActiveSubTab('reviewer')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all border ${
                activeSubTab === 'reviewer'
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-[var(--bg-body)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              AI ATS Reviewer
            </button>
            <button
              onClick={() => setActiveSubTab('builder')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all border ${
                activeSubTab === 'builder'
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-[var(--bg-body)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              STAR Resume Builder
            </button>
            <button
              onClick={() => setActiveSubTab('matcher')}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all border ${
                activeSubTab === 'matcher'
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-[var(--bg-body)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              JD Matcher
            </button>
          </div>
        </section>
      </BorderGlow>

      {/* SUB-TAB 1: AI REVIEWER */}
      {activeSubTab === 'reviewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
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
              <div className="p-6 space-y-3 min-h-full">
                <h3 className="font-bold text-xs text-white flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-white" />
                  Upload or Paste Resume
                </h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Target Role</label>
                  <input
                    type="text"
                    className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Paste Resume Text</label>
                    <span className="text-[9px] text-[var(--text-secondary)] font-mono">{resumeText.length} chars</span>
                  </div>
                  <textarea
                    className="w-full bg-[var(--bg-card)] text-xs text-white p-2.5 rounded-sm border border-[var(--border-color)] outline-none h-56 font-sans"
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
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>{reviewLoading ? 'Analyzing with AI...' : 'Analyze with AI'}</span>
                </button>
              </div>
            </BorderGlow>
          </div>

          <div className="lg:col-span-7">
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
                {!reviewResult ? (
                  <div className="py-14 text-center space-y-2">
                    <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">Paste your resume to begin analysis</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] flex items-center justify-between font-mono">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-sans font-bold block uppercase">Overall Score</span>
                        <span className="text-2xl font-extrabold text-white">{reviewResult.overallScore} <span className="text-xs text-[var(--text-secondary)] font-normal">/ 100</span></span>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[9px] text-[var(--text-muted)] font-sans font-bold block uppercase">ATS Score</span>
                          <span className="text-sm font-extrabold text-white">{reviewResult.atsScore}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[var(--text-muted)] font-sans font-bold block uppercase">Impact Score</span>
                          <span className="text-sm font-extrabold text-white">{reviewResult.impactScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-sans">
                      <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Missing Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {reviewResult.missingKeywords.map((kw, idx) => (
                          <span key={idx} className="mono-badge text-[10px]">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2.5 font-sans">
                      <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                        Recommended STAR Improvements
                      </h4>

                      {reviewResult.bulletImprovements.map((imp, idx) => (
                        <div key={idx} className="p-3.5 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="mono-badge text-[9px]">{imp.category}</span>
                            <span className="mono-badge bg-white/10 text-white border-white/20 text-[9px]">{imp.issue}</span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="p-2 rounded-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] line-through">
                              <span className="font-bold text-[9px] uppercase block text-[var(--text-secondary)] font-mono">Original:</span>
                              "{imp.original}"
                            </div>

                            <div className="p-2 rounded-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-white font-medium">
                              <span className="font-bold text-[9px] uppercase block text-white font-mono">Revised STAR Format:</span>
                              "{imp.revised}"
                            </div>
                          </div>

                          <p className="text-[10px] text-[var(--text-muted)] italic">💡 {imp.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </BorderGlow>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RESUME BUILDER SPECIFICATION */}
      {activeSubTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 space-y-4">
            <div className="mono-card p-4 space-y-2 border-[var(--border-color)]">
              <h3 className="font-bold text-xs text-white">Select Template</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ats', name: 'ATS Clean', desc: 'Highest parser rate' },
                  { id: 'modern', name: 'Executive', desc: 'Header layout' },
                  { id: 'academic', name: 'Minimalist', desc: 'Formal academic' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setResumeData(prev => ({ ...prev, template: t.id as any }))}
                    className={`p-2 rounded-sm border text-left transition-all ${
                      resumeData.template === t.id
                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] font-bold'
                        : 'bg-[var(--bg-body)] border-[var(--border-color)] text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <p className="text-xs">{t.name}</p>
                    <span className="text-[9px] opacity-70 block font-mono">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mono-card p-4 space-y-2 border-[var(--border-color)]">
              <h3 className="font-bold text-xs text-white">Personal Info</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                  value={resumeData.personal.fullName}
                  onChange={e => setResumeData({
                    ...resumeData,
                    personal: { ...resumeData.personal, fullName: e.target.value }
                  })}
                  placeholder="Full Name"
                />
                <input
                  type="email"
                  className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                  value={resumeData.personal.email}
                  onChange={e => setResumeData({
                    ...resumeData,
                    personal: { ...resumeData.personal, email: e.target.value }
                  })}
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="mono-card p-4 space-y-3 border-[var(--border-color)]">
              <h3 className="font-bold text-xs text-white">Experience (AI STAR Enhance)</h3>

              {resumeData.experience.map((exp) => (
                <div key={exp.id} className="p-3 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full bg-[var(--bg-card)] text-xs text-white p-1.5 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                      placeholder="Company"
                      value={exp.company}
                      onChange={e => {
                        const val = e.target.value;
                        setResumeData(prev => ({
                          ...prev,
                          experience: prev.experience.map(item => item.id === exp.id ? { ...item, company: val } : item)
                        }));
                      }}
                    />
                    <input
                      type="text"
                      className="w-full bg-[var(--bg-card)] text-xs text-white p-1.5 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                      placeholder="Position"
                      value={exp.position}
                      onChange={e => {
                        const val = e.target.value;
                        setResumeData(prev => ({
                          ...prev,
                          experience: prev.experience.map(item => item.id === exp.id ? { ...item, position: val } : item)
                        }));
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    {exp.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex gap-1.5">
                        <textarea
                          className="w-full bg-[var(--bg-card)] text-xs text-white p-1.5 rounded-sm border border-[var(--border-color)] outline-none h-12 font-sans"
                          value={b}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              experience: prev.experience.map(item => {
                                if (item.id !== exp.id) return item;
                                const updated = [...item.bullets];
                                updated[bIdx] = val;
                                return { ...item, bullets: updated };
                              })
                            }));
                          }}
                        />
                        <button
                          onClick={() => handleEnhanceBullet('exp', exp.id, bIdx)}
                          className="btn-secondary shrink-0 flex flex-col items-center justify-center p-1.5 text-white"
                          title="Enhance bullet with AI STAR format"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-white" />
                          <span className="text-[8px] font-bold">Enhance</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handlePrint} className="btn-primary w-full py-2.5 text-xs">
              <Printer className="w-3.5 h-3.5 text-white" /> Export PDF / Print
            </button>
          </div>

          <div className="lg:col-span-6 mono-card p-6 space-y-2 border-[var(--border-color)]">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 font-mono">
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-white" />
                Live Preview ({resumeData.template.toUpperCase()})
              </h3>
              <span className="mono-badge text-[9px]">Live</span>
            </div>

            <div id="resume-preview-sheet" className="bg-[var(--bg-card)] text-white p-5 rounded-sm border border-[var(--border-color)] min-h-[500px] text-[11px] space-y-2.5 font-sans">
              <div className="border-b pb-1.5 border-[var(--border-color)] text-center">
                <h1 className="text-whitease font-bold uppercase tracking-wide text-white">{resumeData.personal.fullName}</h1>
                <p className="text-[9px] text-[var(--text-muted)] font-mono">
                  {resumeData.personal.email} | {resumeData.personal.phone} | {resumeData.personal.location}
                </p>
              </div>

              <div>
                <h2 className="text-[9px] font-bold uppercase border-b border-[var(--border-color)] pb-0.5 mb-1 text-white font-mono">Education</h2>
                {resumeData.education.map(edu => (
                  <div key={edu.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-[11px]">{edu.institution}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">{edu.degree} in {edu.fieldOfStudy}</p>
                    </div>
                    <div className="text-right text-[9px] font-mono">
                      <p className="font-medium text-white">{edu.gpa}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-[9px] font-bold uppercase border-b border-[var(--border-color)] pb-0.5 mb-1 text-white font-mono">Experience</h2>
                {resumeData.experience.map(exp => (
                  <div key={exp.id} className="space-y-0.5 mb-1.5">
                    <div className="flex justify-between">
                      <p className="font-bold text-white text-[11px]">{exp.position} — <span className="font-normal italic">{exp.company}</span></p>
                    </div>
                    <ul className="list-disc list-inside text-[10px] text-[var(--text-secondary)] space-y-0.5">
                      {exp.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="text-[9px] font-bold uppercase border-b border-[var(--border-color)] pb-0.5 mb-1 text-white font-mono">Technical Skills</h2>
                <div className="space-y-0.5 text-[10px]">
                  {resumeData.skills.map(sk => (
                    <p key={sk.id}><span className="font-semibold text-white">{sk.category}:</span> {sk.items}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: JD MATCHER SPECIFICATION */}
      {activeSubTab === 'matcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 mono-card p-6 space-y-3 border-[var(--border-color)]">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-white" />
              Target Company Job Description
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Company Name</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                value={jdCompany}
                onChange={e => setJdCompany(e.target.value)}
                placeholder="TCS Digital / Google"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Job Role / Title</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                value={jdRole}
                onChange={e => setJdRole(e.target.value)}
                placeholder="Software Developer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Paste Job Description (JD)</label>
                <span className="text-[9px] text-[var(--text-secondary)] font-mono">{jdText.length} chars</span>
              </div>
              <textarea
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none h-36 font-sans"
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste company JD requirements..."
              />
            </div>

            <button
              onClick={handleRunMatcher}
              disabled={matchLoading}
              className="btn-primary w-full py-2.5 text-xs"
            >
              {matchLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Matching...</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 text-white" />
                  <span>Analyze Match</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 mono-card p-6 space-y-4 border-[var(--border-color)]">
            {!matchResult ? (
              <div className="py-14 text-center space-y-2">
                <Target className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Paste job description to begin</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-sans font-bold uppercase block">JD Match</span>
                    <span className="text-2xl font-extrabold text-white">{matchResult.matchPercentage}%</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] font-sans font-bold uppercase block">Interview Chance</span>
                    <span className="text-lg font-bold text-white">{matchResult.interviewChance}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-white" /> Matching Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.matchingSkills.map((sk, idx) => (
                        <span key={idx} className="mono-badge text-[10px]">{sk}</span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3 text-[var(--text-muted)]" /> Missing Skills
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.missingSkills.map((sk, idx) => (
                        <span key={idx} className="mono-badge bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 text-[10px]">{sk}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                    AI-Generated Tailored Bullets
                  </h4>
                  {matchResult.tailoredBullets.map((tb, idx) => (
                    <div key={idx} className="p-3 rounded-sm bg-[var(--bg-body)] border border-[var(--border-color)] text-xs text-white flex items-start gap-2 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                      <span>"{tb}"</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
