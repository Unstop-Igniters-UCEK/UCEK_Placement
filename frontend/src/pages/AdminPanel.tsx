import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getAdminDashboardStatsApi, getAllUsersAdminApi } from '../lib/api';
import { AdminMockTests } from './AdminMockTests';
import { motion, Variants } from 'framer-motion';
import { UserRole } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import {
  ShieldCheck,
  Users,
  Plus,
  CheckCircle2,
  FileCheck,
  Mic,
  Search,
  Trophy,
  GraduationCap,
  Building2,
  LayoutDashboard,
  LogOut,
  CheckSquare,
  UserPlus,
  Menu,
  X,
  RotateCw
} from 'lucide-react';

/* ─── Shared logo mark — matches student dashboard header ─── */
const LogoMark = ({ size = 9 }: { size?: number }) => (
  <div
    style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    className="rounded-xl bg-white text-black flex items-center justify-center shadow-md shrink-0"
  >
    <GraduationCap style={{ width: `${size * 2.2}px`, height: `${size * 2.2}px` }} className="text-black" />
  </div>
);

/* ─── Spring variants (Emil §3: strong custom ease-out, no sluggish ease-in) ─── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.05, 
      ease: [0.23, 1, 0.32, 1] 
    } 
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { 
      duration: 0.22, 
      ease: [0.23, 1, 0.32, 1] 
    } 
  }
};

/* ─── Sidebar nav item — Apple §1: feedback on pointer-down (active:scale-[0.97]) ─── */
const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs
      font-semibold transition-all duration-150 cursor-pointer select-none
      active:scale-[0.97] active:transition-none
      ${active
        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
      }
    `}
  >
    <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-orange-400' : 'text-zinc-500'}`} />
    <span className="tracking-tight">{label}</span>
  </button>
);

/* ─── Single-accent KPI stat card — Emil: tactile surface depth ─── */
const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub: string;
}) => (
  <div className="group bg-[#121217]/90 border border-white/10 hover:border-orange-500/30 backdrop-blur-2xl rounded-2xl p-5 space-y-3 transition-all duration-200 shadow-xl hover:shadow-orange-500/5 active:scale-[0.99]">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase font-mono">{label}</span>
      <span className="w-2 h-2 rounded-full bg-orange-500/80 group-hover:animate-ping" />
    </div>
    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading group-hover:text-orange-400 transition-colors" style={{ letterSpacing: '-0.03em' }}>
      {value}
    </div>
    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
      <span>{sub}</span>
    </div>
  </div>
);

export const AdminPanel: React.FC = React.memo(() => {
  const { user, logoutUser, allUsers, recentScores, addQuestionToBank, updateUserRoleInAdmin, activeTab, setActiveTab } = useApp();

  
  const [selectedYearFilter, setSelectedYearFilter] = useState('All Years');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* Question Bank form */
  const [qTitle, setQTitle] = useState('');
  const [qType, setQType] = useState<'Technical' | 'Aptitude' | 'Logical' | 'Verbal' | 'Company-Specific'>('Technical');
  const [qCompanyTag, setQCompanyTag] = useState('TCS');
  const [qDifficulty, setQDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Backend Data States ───
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'admin-dashboard') {
      getAdminDashboardStatsApi(selectedYearFilter, selectedDeptFilter).then(data => {
        if (data) setDashboardStats(data);
      });
    } else if (activeTab === 'admin-roles') {
      getAllUsersAdminApi().then(data => {
        if (data && data.users) setAdminUsersList(data.users);
      });
    }
  }, [activeTab, selectedYearFilter, selectedDeptFilter, isRefreshing]);

  // Derived filtered users for "Student Onboarding" view
  const filteredAdminUsersList = useMemo(() => {
    return adminUsersList.filter(u => {
      const matchSearch = !searchQuery.trim() || 
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [adminUsersList, searchQuery]);

  const kpis = {
    totalStudents: dashboardStats?.kpis?.totalStudents || 0,
    totalMockTestsTaken: dashboardStats?.kpis?.totalMockTestsTaken || 0,
    totalResumeReviews: dashboardStats?.kpis?.totalResumeReviews || 0,
    totalInterviewsCompleted: dashboardStats?.kpis?.totalInterviewSimulationsCompleted || dashboardStats?.kpis?.totalInterviewsCompleted || 0,
  };
  const filteredStudents = dashboardStats?.studentPerformance || [];

  const handleRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 600); };

  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !qExplanation.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      addQuestionToBank({ title: qTitle, type: qType, companyTag: qCompanyTag, difficulty: qDifficulty, options: [optA, optB, optC, optD], correctOption, explanation: qExplanation });
      setAddSuccess(true);
      setSubmitting(false);
      setQTitle(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setQExplanation('');
      setTimeout(() => setAddSuccess(false), 3000);
    }, 300);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111115]/90 border border-white/10 backdrop-blur-2xl rounded-2xl p-8 text-center space-y-5 shadow-2xl text-white">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold font-heading tracking-tight">Admin access only</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">Sign in with an authorized TPO Cell admin account.</p>
          </div>
          <button onClick={() => setActiveTab('dashboard')} className="btn-primary w-full py-2.5 text-sm font-semibold rounded-xl cursor-pointer">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ─── INPUT FIELD SHARED STYLE ─── */
  const inputCls = "w-full bg-white/[0.05] text-sm text-white p-3 rounded-xl border border-white/10 outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all placeholder-zinc-600 font-sans";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide";

  return (
    <div className="w-full text-white font-sans max-w-[1280px] mx-auto">
      <motion.div key={activeTab}  className="space-y-5">

            {/* ── 1. Analytics view ── */}
            {activeTab === 'admin-dashboard' && (
              <>
                {/* ── Page hero ── */}
                <motion.div  className="relative overflow-hidden rounded-2xl bg-[#111115]/70 border border-white/8 backdrop-blur-xl px-6 pt-6 pb-5">
                  {/* Subtle orange left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-orange-500 via-amber-400 to-transparent rounded-l-2xl" />

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-2 pl-1">
                      {/* Badge row */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] font-medium text-orange-400 tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                          TPO Cell · Admin View
                        </span>
                        <span className="text-[11px] text-zinc-600 font-medium tabular-nums">
                          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Main heading */}
                      <h1
                        className="text-3xl sm:text-4xl font-bold text-white font-heading leading-tight"
                        style={{ letterSpacing: '-0.03em' }}
                      >
                        Placement Analytics
                      </h1>

                      {/* Sub-line */}
                      <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
                        Engagement, test completion, and readiness indices across all enrolled batches.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-sm text-zinc-300 font-medium transition-colors duration-150 cursor-pointer active:scale-[0.97]"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </motion.div>


                {/* Filters */}
                <motion.div  className="relative z-50 bg-[#111115]/80 border border-white/8 backdrop-blur-xl rounded-2xl p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className={labelCls}>
                        <span className="inline-flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-orange-400/70" />Year of study</span>
                      </label>
                      <CustomSelect value={selectedYearFilter} onChange={setSelectedYearFilter} options={['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year']} />
                    </div>
                    <div>
                      <label className={labelCls}>
                        <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-orange-400/70" />Department</span>
                      </label>
                      <CustomSelect value={selectedDeptFilter} onChange={setSelectedDeptFilter} options={['All Departments', 'Computer Science & Engg', 'Electronics & Comm Engg', 'Information Technology', 'EEE', 'Mechanical', 'Biotech']} />
                    </div>
                    <div className="flex items-end justify-end md:justify-start">
                      <span className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-orange-500/8 border border-orange-500/20 text-sm text-orange-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        {kpis.totalStudents} {kpis.totalStudents === 1 ? 'student' : 'students'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* KPI cards — single accent, distinguished by label/weight not hue */}
                <motion.div  className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total students" value={kpis.totalStudents} sub="Enrolled candidates" />
                  <StatCard label="Mock tests taken" value={kpis.totalMockTestsTaken} sub="Attempted assessments" />
                  <StatCard label="Resumes reviewed" value={kpis.totalResumeReviews} sub="AI ATS scans" />
                  <StatCard label="Interviews practiced" value={kpis.totalInterviewsCompleted} sub="Mock sessions" />
                </motion.div>

                {/* Performance table */}
                <motion.div  className="bg-[#111115]/80 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                  {/* Table header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-white/8">
                    <div className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-orange-400" />
                      <div>
                        <h2 className="font-semibold text-white text-[15px] tracking-tight font-heading">Student Performance</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Tests, interviews, and readiness indices</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search student…"
                          className="bg-white/[0.05] border border-white/10 text-sm text-white pl-9 pr-4 py-2 rounded-xl outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-zinc-600 w-44 sm:w-56"
                        />
                      </div>
                      <span className="text-xs text-zinc-500 font-medium shrink-0 tabular-nums">{filteredStudents.length} listed</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/6 bg-white/[0.01]">
                          <th className="py-3 px-6 text-xs font-medium text-zinc-500 tracking-wide">Student</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide">Department</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide">Year</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide text-center">Tests</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide text-center">Interviews</th>
                          <th className="py-3 px-6 text-xs font-medium text-zinc-500 tracking-wide text-right">Readiness</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-14 text-center text-zinc-600 text-sm">No students match the selected filters.</td>
                          </tr>
                        ) : (
                          filteredStudents.map((student: any) => {
                            const initial = (student.name || 'U').charAt(0).toUpperCase();
                            const mockTestsAttended = student.testsCompleted || 0;
                            const interviewsCompleted = student.interviewsCompleted || 0;
                            const score = student.readinessScore || 0;
                            return (
                              <tr key={student.id} className="hover:bg-white/[0.025] transition-colors duration-100 group">
                                <td className="py-3.5 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-semibold text-orange-400 text-sm shrink-0">
                                      {initial}
                                    </div>
                                    <div>
                                      <p className="font-medium text-white text-[13px] group-hover:text-orange-400 transition-colors duration-150 font-heading">{student.name}</p>
                                      <p className="text-xs text-zinc-500 mt-0.5">{student.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/8 text-zinc-300 text-xs">
                                    {student.branch === 'CSE' ? 'CS & Engg' : student.branch === 'ECE' ? 'EC & Comm' : student.branch === 'IT' ? 'Info Tech' : student.branch}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 text-[13px]">{student.year || '4th Year'}</td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold tabular-nums ${mockTestsAttended > 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-white/[0.05] text-zinc-500 border border-white/8'}`}>
                                    {mockTestsAttended}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold tabular-nums ${interviewsCompleted > 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-white/[0.05] text-zinc-500 border border-white/8'}`}>
                                    {interviewsCompleted}
                                  </span>
                                </td>
                                <td className="py-3.5 px-6 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="w-20 h-1.5 rounded-full bg-white/8 overflow-hidden hidden sm:block">
                                      <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(3, score))}%` }} />
                                    </div>
                                    <span className="text-[13px] font-semibold text-white tabular-nums font-heading">{score}<span className="text-zinc-500 font-normal text-xs">/100</span></span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </>
            )}

            {/* ── Admin Mock Tests view ── */}
            {activeTab === 'admin-tests' && <AdminMockTests />}

            {/* ── 2. Student Onboarding view ── */}
            {activeTab === 'admin-roles' && (
              <motion.div  className="space-y-5">
                <div className="pt-1 pb-2">
                  <h1 className="text-xl font-bold text-white font-heading tracking-tight" style={{ letterSpacing: '-0.02em' }}>Student Onboarding</h1>
                  <p className="text-sm text-zinc-500 mt-0.5">Manage account roles and access permissions</p>
                </div>
                <div className="bg-[#111115]/80 border border-white/8 backdrop-blur-xl rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-orange-400" />
                      <span className="font-semibold text-white text-[15px] font-heading">All accounts</span>
                    </div>
                    <span className="text-xs text-zinc-500">{filteredAdminUsersList.length} registered</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/6 bg-white/[0.01]">
                          <th className="py-3 px-6 text-xs font-medium text-zinc-500 tracking-wide">Name</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide">Email</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide">Branch · Year</th>
                          <th className="py-3 px-4 text-xs font-medium text-zinc-500 tracking-wide">Readiness</th>
                          <th className="py-3 px-6 text-xs font-medium text-zinc-500 tracking-wide">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {filteredAdminUsersList.map(u => (
                          <tr key={u.id} className="hover:bg-white/[0.025] transition-colors duration-100">
                            <td className="py-3.5 px-6 font-medium text-white text-[13px] font-heading">{u.name}</td>
                            <td className="py-3.5 px-4 text-zinc-500 text-xs">{u.email}</td>
                            <td className="py-3.5 px-4 text-zinc-400 text-[13px]">{u.branch} · {u.year}</td>
                            <td className="py-3.5 px-4 font-semibold text-[13px] text-orange-400 tabular-nums">{u.readinessScore}%</td>
                            <td className="py-3.5 px-6">
                              <select
                                value={u.role}
                                onChange={e => updateUserRoleInAdmin(u.id, e.target.value as UserRole)}
                                className="bg-white/[0.05] border border-white/10 text-sm text-white px-3 py-1.5 rounded-lg outline-none focus:border-orange-500/60 cursor-pointer transition-colors"
                              >
                                <option value="mentee" className="bg-[#111115]">Student</option>
                                <option value="admin" className="bg-[#111115]">Admin (TPO)</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── 3. Question bank view ── */}
            {activeTab === 'admin-question-bank' && (
              <motion.div  className="space-y-5">
                <div className="pt-1 pb-2 flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white font-heading tracking-tight" style={{ letterSpacing: '-0.02em' }}>Question Bank</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Add custom questions to the practice assessments</p>
                  </div>
                  {addSuccess && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved</span>
                    </div>
                  )}
                </div>

                <div className="bg-[#111115]/80 border border-white/8 backdrop-blur-xl rounded-2xl p-6">
                  <form onSubmit={handleAddQuestionSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={labelCls}>Category</label>
                        <select value={qType} onChange={e => setQType(e.target.value as any)} className={inputCls}>
                          <option value="Technical" className="bg-[#111115]">Technical Core</option>
                          <option value="Aptitude" className="bg-[#111115]">Aptitude & Reasoning</option>
                          <option value="Logical" className="bg-[#111115]">Logical Analysis</option>
                          <option value="Verbal" className="bg-[#111115]">Verbal Communication</option>
                          <option value="Company-Specific" className="bg-[#111115]">Company Specific</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Company tag</label>
                        <input type="text" value={qCompanyTag} onChange={e => setQCompanyTag(e.target.value)} placeholder="TCS / Infosys / Wipro" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Difficulty</label>
                        <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)} className={inputCls}>
                          <option value="Easy" className="bg-[#111115]">Easy</option>
                          <option value="Medium" className="bg-[#111115]">Medium</option>
                          <option value="Hard" className="bg-[#111115]">Hard</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Question prompt</label>
                      <textarea required rows={3} value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="Enter the question text…" className={`${inputCls} resize-none leading-relaxed`} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[['Option A', optA, setOptA], ['Option B', optB, setOptB], ['Option C', optC, setOptC], ['Option D', optD, setOptD]].map(([label, val, setter]) => (
                        <div key={label as string}>
                          <label className={labelCls}>{label as string}</label>
                          <input type="text" required value={val as string} onChange={e => (setter as any)(e.target.value)} className={inputCls} />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Correct answer</label>
                        <select value={correctOption} onChange={e => setCorrectOption(Number(e.target.value))} className={inputCls}>
                          {['Option A', 'Option B', 'Option C', 'Option D'].map((opt, i) => (
                            <option key={i} value={i} className="bg-[#111115]">{opt}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Explanation</label>
                        <input type="text" required value={qExplanation} onChange={e => setQExplanation(e.target.value)} placeholder="Step-by-step rationale…" className={inputCls} />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-black font-semibold text-sm transition-colors duration-150 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving…' : 'Save question to bank'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </motion.div>
    </div>
  );
});

export default AdminPanel;
