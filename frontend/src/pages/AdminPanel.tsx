import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getAdminDashboardStatsApi, getAllUsersAdminApi, getAdminStudentsApi } from '../lib/api';
import { AdminMockTests } from './AdminMockTests';
import { StudentOnboardingView } from './StudentOnboardingView';
import { motion, Variants } from 'framer-motion';
import { UserRole } from '../types';
import { CustomSelect } from '../components/CustomSelect';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  FileCheck,
  Mic,
  Search,
  CheckSquare,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, willChange: 'transform, opacity' },
  visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] } },
};

const ROLE_OPTIONS = [
  { value: 'mentee', label: 'Student' },
  { value: 'admin', label: 'Admin (TPO)' }
];

const KpiCard = ({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number | string; sub: string }) => (
  <div className="mono-card mono-card-hover p-3.5 space-y-2.5 flex flex-col justify-between group relative overflow-hidden">
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="mono-badge rounded-full text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">{sub}</span>
    </div>
    <div>
      <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight group-hover:text-orange-400 transition-colors tabular-nums" style={{ letterSpacing: '-0.03em' }}>{value}</div>
      <p className="text-xs text-zinc-400 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

export const AdminPanel: React.FC = React.memo(() => {
  const { user, addQuestionToBank, updateUserRoleInAdmin, activeTab, setActiveTab } = useApp();
  const [selectedYearFilter, setSelectedYearFilter] = useState('All Years');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [performancePage, setPerformancePage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(false);
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
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);

  const fetchAdminData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'admin-dashboard') {
        const data = await getAdminDashboardStatsApi();
        if (data) setDashboardStats(data);
      } else if (activeTab === 'admin-roles') {
        const data = await getAllUsersAdminApi();
        if (data && data.users) setAdminUsersList(data.users);
      }
    } catch (err) {
      console.warn('Failed to fetch admin data:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [activeTab]);

  const fetchAdminStudents = useCallback(async () => {
    if (activeTab !== 'admin-dashboard') return;
    setStudentsLoading(true);
    try {
      const data = await getAdminStudentsApi(performancePage, 10, selectedYearFilter, selectedDeptFilter);
      if (data) { setStudentsList(data.students); setStudentsTotal(data.total); }
    } catch (err) {
      console.warn('Failed to fetch students:', err);
    } finally {
      setStudentsLoading(false);
    }
  }, [activeTab, performancePage, selectedYearFilter, selectedDeptFilter]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);
  useEffect(() => { fetchAdminStudents(); }, [fetchAdminStudents]);

  // All Accounts & Roles filters and pagination state
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [accountYearFilter, setAccountYearFilter] = useState('All Years');
  const [accountDeptFilter, setAccountDeptFilter] = useState('All Departments');
  const [accountPage, setAccountPage] = useState(1);

  const filteredAdminUsersList = useMemo(() => {
    return adminUsersList.filter(u => {
      // 1. Search Query
      if (accountSearchQuery.trim()) {
        const q = accountSearchQuery.toLowerCase();
        const matchesName = (u.name || '').toLowerCase().includes(q);
        const matchesEmail = (u.email || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail) return false;
      }

      // 2. Year Filter
      if (accountYearFilter !== 'All Years') {
        const uYear = String(u.year || '').toLowerCase();
        const digit = accountYearFilter.charAt(0);
        if (!uYear.includes(digit)) return false;
      }

      // 3. Department Filter (Only 3 departments: CSE, ECE, IT)
      if (accountDeptFilter !== 'All Departments') {
        const uBranch = String(u.branch || u.dept || '').toUpperCase();
        const target = accountDeptFilter.toUpperCase();
        if (target === 'CSE' && !(uBranch.includes('CSE') || uBranch.includes('CS') || uBranch.includes('COMPUTER'))) return false;
        if (target === 'ECE' && !(uBranch.includes('ECE') || uBranch.includes('EC') || uBranch.includes('ELECTRONIC'))) return false;
        if (target === 'IT' && !(uBranch.includes('IT') || uBranch.includes('INFORMATION'))) return false;
      }

      return true;
    });
  }, [adminUsersList, accountSearchQuery, accountYearFilter, accountDeptFilter]);

  useEffect(() => {
    setAccountPage(1);
  }, [accountSearchQuery, accountYearFilter, accountDeptFilter]);

  const ACCOUNTS_PER_PAGE = 10;
  const totalAccountPages = Math.max(1, Math.ceil(filteredAdminUsersList.length / ACCOUNTS_PER_PAGE));
  const safeAccountPage = Math.min(accountPage, totalAccountPages);
  const paginatedAccounts = filteredAdminUsersList.slice(
    (safeAccountPage - 1) * ACCOUNTS_PER_PAGE,
    safeAccountPage * ACCOUNTS_PER_PAGE
  );

  const kpis = {
    totalStudents: dashboardStats?.kpis?.totalStudents || 0,
    totalMockTestsTaken: dashboardStats?.kpis?.totalMockTestsTaken || 0,
    totalResumeReviews: dashboardStats?.kpis?.totalResumeReviews || 0,
    totalInterviewsCompleted: dashboardStats?.kpis?.totalInterviewsCompleted || dashboardStats?.kpis?.totalInterviewSimulationsCompleted || 0,
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const q = searchQuery.toLowerCase();
    return studentsList.filter((u: any) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [studentsList, searchQuery]);

  useEffect(() => { setPerformancePage(1); }, [searchQuery, selectedYearFilter, selectedDeptFilter]);

  const totalPerformancePages = Math.max(1, Math.ceil(studentsTotal / 10));

  const handleRefresh = () => { fetchAdminData(); fetchAdminStudents(); };

  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !qExplanation.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      addQuestionToBank({ title: qTitle, type: qType, companyTag: qCompanyTag, difficulty: qDifficulty, options: [optA, optB, optC, optD], correctOption, explanation: qExplanation });
      setAddSuccess(true); setSubmitting(false);
      setQTitle(''); setOptA(''); setOptB(''); setOptC(''); setOptD(''); setQExplanation('');
      setTimeout(() => setAddSuccess(false), 3000);
    }, 300);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="mono-card p-8 text-center max-w-sm mx-auto space-y-5 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-white font-heading tracking-tight">Admin access only</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">Sign in with an authorized TPO Cell admin account.</p>
          </div>
          <button onClick={() => setActiveTab('dashboard')} className="btn-primary w-full py-2.5 text-sm font-semibold rounded-full cursor-pointer">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full bg-[#141414] text-sm text-white p-3 rounded-xl border border-white/10 outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-zinc-600 font-sans";
  const labelCls = "block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 py-4 font-sans max-w-7xl mx-auto w-full">

      {/* ── Admin Dashboard ── */}
      {activeTab === 'admin-dashboard' && (
        <>
          {/* Hero header — naked like Student Dashboard */}
          <motion.div variants={itemVariants} className="py-1">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="mono-badge rounded-full text-orange-400 bg-orange-500/10 border-orange-500/20 font-bold">
                    TPO Cell · Admin View
                  </span>
                  <span className="text-[11px] text-zinc-600 font-medium tabular-nums">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading" style={{ letterSpacing: '-0.03em' }}>
                  Admin Dashboard
                </h1>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-lg">
                  Engagement, test completion, and readiness indices across all enrolled batches.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2a2e2f] hover:bg-[#323637] border border-white/10 text-sm text-zinc-300 hover:text-white font-medium transition-all cursor-pointer active:scale-[0.97]"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {/* 4 KPI pillar cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users}       label="Total Students"       value={kpis.totalStudents}           sub="Enrolled"  />
            <KpiCard icon={CheckSquare} label="Mock Tests Taken"      value={kpis.totalMockTestsTaken}     sub="Attempts"  />
            <KpiCard icon={FileCheck}   label="Resumes Reviewed"      value={kpis.totalResumeReviews}      sub="ATS Scans" />
            <KpiCard icon={Mic}         label="Interviews Practiced"  value={kpis.totalInterviewsCompleted} sub="Sessions" />
          </motion.div>

          {/* Students table */}
          <motion.div variants={itemVariants} className="mono-card p-4 sm:p-6 space-y-5 min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400 shrink-0" />
                  <h2 className="font-bold text-base text-white font-heading">Students</h2>
                </div>
                <p className="text-xs text-zinc-400">Tests, interviews, and readiness indices</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Year filter dropdown */}
                <div className="w-36 sm:w-40">
                  <CustomSelect
                    value={selectedYearFilter}
                    onChange={setSelectedYearFilter}
                    options={['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year']}
                  />
                </div>

                {/* Department filter dropdown */}
                <div className="w-48 sm:w-56">
                  <CustomSelect
                    value={selectedDeptFilter}
                    onChange={setSelectedDeptFilter}
                    options={['All Departments', 'Computer Science & Engg', 'Electronics & Comm Engg', 'Information Technology']}
                  />
                </div>

                {/* Search bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search student..."
                    className="bg-[#2a2e2f] border border-white/10 text-sm text-white pl-9 pr-4 py-2 rounded-full outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-zinc-600 w-44 sm:w-56"
                  />
                </div>
                <span className="text-xs text-zinc-500 font-medium tabular-nums shrink-0">{studentsTotal} total</span>
              </div>
            </div>

            {studentsLoading ? (
              <div className="py-12 text-center space-y-3 bg-[#141414] border border-white/10 rounded-lg">
                <Activity className="w-9 h-9 text-zinc-600 mx-auto animate-pulse" />
                <p className="text-xs font-semibold text-zinc-400">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-[#141414] border border-white/10 rounded-lg">
                <Users className="w-9 h-9 text-zinc-600 mx-auto" />
                <p className="text-xs font-semibold text-zinc-400">No students match the selected filters.</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-xs text-orange-400 hover:underline font-medium">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 min-w-0">
                <div className="overflow-x-auto border border-white/10 rounded-lg bg-[#0d0d0d] shadow-inner">
                  <table className="w-full min-w-[620px] text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-[#000000] border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4 pl-5">Student</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Year</th>
                        <th className="p-4 text-center">Tests</th>
                        <th className="p-4 text-center">Interviews</th>
                        <th className="p-4 pr-5 text-right">Readiness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs text-white">
                      {filteredStudents.map((student: any) => {
                        const initial = (student.name || 'U').charAt(0).toUpperCase();
                        const tests = student.testsCompleted ?? student.tests_completed ?? 0;
                        const interviews = student.interviewsCompleted ?? student.interviews_completed ?? 0;
                        const score = student.readinessScore ?? student.readiness_score ?? 0;
                        const branch =
                          student.branch === 'CSE' ? 'CS & Engg'
                          : student.branch === 'ECE' ? 'EC & Comm'
                          : student.branch === 'IT' ? 'Info Tech'
                          : (student.branch || '—');
                        const yr = student.year
                          ? `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year`
                          : '—';
                        return (
                          <tr key={student.id} className="hover:bg-[#141414] transition-colors group">
                            <td className="p-4 pl-5 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#000000] border border-white/10 text-orange-400 flex items-center justify-center shrink-0 font-semibold text-sm">
                                {initial}
                              </div>
                              <div>
                                <span className="block font-semibold text-[13px] group-hover:text-orange-400 transition-colors">{student.name}</span>
                                <span className="text-[10px] text-zinc-500 font-mono">{student.email}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="mono-badge rounded-full px-3 py-1 bg-[#141414] border border-white/10 text-zinc-200 text-[11px] font-medium">
                                {branch}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-400 text-[13px]">{yr}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold tabular-nums ${tests > 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-[#141414] text-zinc-500 border border-white/10'}`}>
                                {tests}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold tabular-nums ${interviews > 0 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-[#141414] text-zinc-500 border border-white/10'}`}>
                                {interviews}
                              </span>
                            </td>
                            <td className="p-4 pr-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-[#000000] rounded-full h-1.5 overflow-hidden border border-white/10 hidden sm:block">
                                  <div
                                    className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, Math.max(3, score))}%` }}
                                  />
                                </div>
                                <span className="text-[13px] font-semibold text-white tabular-nums font-heading">
                                  {score}<span className="text-zinc-500 font-normal text-xs">/100</span>
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination — Student Dashboard style */}
                {totalPerformancePages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0d0d0d] border border-white/10 text-xs font-sans">
                    <div className="text-zinc-400">
                      Page <strong className="text-white font-mono">{performancePage}</strong> of <strong className="text-white font-mono">{totalPerformancePages}</strong>
                      <span className="ml-2 text-zinc-600">({studentsTotal} students)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPerformancePage(p => Math.max(1, p - 1))}
                        disabled={performancePage === 1}
                        className="px-3.5 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-[0.97]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>
                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: Math.min(5, totalPerformancePages) }, (_, i) => {
                          let start = Math.max(1, performancePage - 2);
                          const end = Math.min(totalPerformancePages, start + 4);
                          start = Math.max(1, end - 4);
                          const pageNum = start + i;
                          if (pageNum > totalPerformancePages) return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPerformancePage(pageNum)}
                              className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                performancePage === pageNum
                                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                                  : 'bg-[#141414] text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/10'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setPerformancePage(p => Math.min(totalPerformancePages, p + 1))}
                        disabled={performancePage === totalPerformancePages}
                        className="px-3.5 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-[0.97]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ── Mock Tests view ── */}
      {activeTab === 'admin-tests' && <AdminMockTests />}

      {/* ── Student Onboarding view ── */}
      {activeTab === 'admin-roles' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants}>
            <StudentOnboardingView onUserCreated={fetchAdminData} />
          </motion.div>

          {/* All Accounts table */}
          <motion.div variants={itemVariants} className="mono-card p-4 sm:p-6 space-y-5 min-w-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-400 shrink-0" />
                  <h2 className="font-bold text-base text-white font-heading">All Accounts &amp; Roles</h2>
                </div>
                <p className="text-xs text-zinc-400">Manage role assignment and directory for registered accounts</p>
              </div>

              {/* Filtering & Search Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Year Filter */}
                <div className="w-32 sm:w-36">
                  <CustomSelect
                    value={accountYearFilter}
                    onChange={setAccountYearFilter}
                    options={['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year']}
                  />
                </div>

                {/* Department Filter (Only CSE, ECE, IT) */}
                <div className="w-40 sm:w-44">
                  <CustomSelect
                    value={accountDeptFilter}
                    onChange={setAccountDeptFilter}
                    options={['All Departments', 'CSE', 'ECE', 'IT']}
                  />
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={accountSearchQuery}
                    onChange={e => setAccountSearchQuery(e.target.value)}
                    placeholder="Search account..."
                    className="bg-[#2a2e2f] border border-white/10 text-sm text-white pl-9 pr-4 py-2 rounded-full outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-zinc-600 w-40 sm:w-48"
                  />
                </div>

                <span className="text-xs text-zinc-500 font-medium tabular-nums shrink-0">{filteredAdminUsersList.length} total</span>
              </div>
            </div>

            {filteredAdminUsersList.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-[#141414] border border-white/10 rounded-xl">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-semibold text-zinc-400">No accounts match the selected search and filter criteria.</p>
                {(accountSearchQuery || accountYearFilter !== 'All Years' || accountDeptFilter !== 'All Departments') && (
                  <button
                    onClick={() => {
                      setAccountSearchQuery('');
                      setAccountYearFilter('All Years');
                      setAccountDeptFilter('All Departments');
                    }}
                    className="text-xs text-orange-400 hover:underline font-medium cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 min-w-0">
                <div className="overflow-x-auto md:overflow-visible border border-white/10 rounded-lg bg-[#0d0d0d] shadow-inner">
                  <table className="w-full min-w-[620px] text-left border-collapse font-sans">
                    <thead>
                      <tr className="bg-[#000000] border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        <th className="p-4 pl-5">Account</th>
                        <th className="p-4">Branch</th>
                        <th className="p-4">Year</th>
                        <th className="p-4">Readiness</th>
                        <th className="p-4 pr-5">Assigned Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-xs text-white">
                      {paginatedAccounts.map(u => (
                        <tr key={u.id} className="hover:bg-[#141414] transition-colors group">
                          <td className="p-4 pl-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {u.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-semibold text-white text-[13px] font-heading block group-hover:text-orange-400 transition-colors">
                                  {u.name}
                                </span>
                                <span className="text-zinc-500 text-xs font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="mono-badge rounded-full px-2.5 py-0.5 bg-[#141414] border border-white/10 text-zinc-300 font-medium text-[11px]">
                              {u.branch || '—'}
                            </span>
                          </td>
                          <td className="p-4 text-zinc-400 text-xs">{u.year ? `${u.year}` : '—'}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#000000] rounded-full h-1.5 overflow-hidden border border-white/10">
                                <div
                                  className="bg-orange-500 h-full rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, u.readinessScore || 0))}%` }}
                                />
                              </div>
                              <span className="font-semibold text-orange-400 text-xs tabular-nums">{u.readinessScore ?? 0}%</span>
                            </div>
                          </td>
                          <td className="p-4 pr-5">
                            <div className="w-36">
                              <CustomSelect
                                value={u.role || 'mentee'}
                                onChange={val => updateUserRoleInAdmin(u.id, val as UserRole)}
                                options={ROLE_OPTIONS}
                                triggerClassName="px-3.5 py-1.5"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalAccountPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-3 flex-wrap">
                    <div className="text-xs text-zinc-500 font-medium">
                      Showing {(safeAccountPage - 1) * ACCOUNTS_PER_PAGE + 1}&ndash;{Math.min(safeAccountPage * ACCOUNTS_PER_PAGE, filteredAdminUsersList.length)} of {filteredAdminUsersList.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAccountPage(p => Math.max(1, p - 1))}
                        disabled={safeAccountPage === 1}
                        className="px-3 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-[0.97]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalAccountPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          const isCurrent = pageNum === safeAccountPage;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setAccountPage(pageNum)}
                              className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-orange-500 text-black shadow-md'
                                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setAccountPage(p => Math.min(totalAccountPages, p + 1))}
                        disabled={safeAccountPage === totalAccountPages}
                        className="px-3 py-1.5 rounded-full bg-[#2a2e2f] hover:bg-[#323637] disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer active:scale-[0.97]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ── Question Bank view ── */}
      {activeTab === 'admin-question-bank' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
          <motion.div variants={itemVariants} className="pt-1 pb-2 flex items-start justify-between">
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
          </motion.div>
          <motion.div variants={itemVariants} className="mono-card p-5 sm:p-6">
            <form onSubmit={handleAddQuestionSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={qType} onChange={e => setQType(e.target.value as any)} className={inputCls}>
                    <option value="Technical" className="bg-[#0d0d0d]">Technical Core</option>
                    <option value="Aptitude" className="bg-[#0d0d0d]">Aptitude &amp; Reasoning</option>
                    <option value="Logical" className="bg-[#0d0d0d]">Logical Analysis</option>
                    <option value="Verbal" className="bg-[#0d0d0d]">Verbal Communication</option>
                    <option value="Company-Specific" className="bg-[#0d0d0d]">Company Specific</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Company tag</label>
                  <input type="text" value={qCompanyTag} onChange={e => setQCompanyTag(e.target.value)} placeholder="TCS / Infosys / Wipro" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Difficulty</label>
                  <select value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)} className={inputCls}>
                    <option value="Easy" className="bg-[#0d0d0d]">Easy</option>
                    <option value="Medium" className="bg-[#0d0d0d]">Medium</option>
                    <option value="Hard" className="bg-[#0d0d0d]">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Question prompt</label>
                <textarea required rows={3} value={qTitle} onChange={e => setQTitle(e.target.value)} placeholder="Enter the question text..." className={`${inputCls} resize-none leading-relaxed`} />
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
                      <option key={i} value={i} className="bg-[#0d0d0d]">{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Explanation</label>
                  <input type="text" required value={qExplanation} onChange={e => setQExplanation(e.target.value)} placeholder="Step-by-step rationale..." className={inputCls} />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 text-sm font-bold rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save question to bank'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
});

export default AdminPanel;
