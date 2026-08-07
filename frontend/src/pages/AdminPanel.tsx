import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, Variants } from 'framer-motion';
import { UserRole } from '../types';
import {
  ShieldCheck,
  Users,
  Plus,
  CheckCircle2,
  Building,
  Award,
  BookOpen
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user, allUsers, recentScores, mentors, addQuestionToBank, updateUserRoleInAdmin, setActiveTab } = useApp();

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

  const [addSuccess, setAddSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, transform: 'translateY(10px) scale(0.99)' },
    visible: { opacity: 1, transform: 'translateY(0px) scale(1)', transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="mono-card p-8 text-center max-w-md mx-auto space-y-4 my-16 font-sans">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Placement Officer Access Restricted</h2>
        <p className="text-xs text-zinc-400">
          This panel is restricted to UCEK Placement Cell administrators. Switch demo persona to Admin in top header.
        </p>
        <button onClick={() => setActiveTab('dashboard')} className="btn-primary py-2.5 px-6 text-xs font-bold rounded-full">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim() || !qExplanation.trim()) {
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      addQuestionToBank({
        title: qTitle,
        type: qType,
        companyTag: qCompanyTag,
        difficulty: qDifficulty,
        options: [optA, optB, optC, optD],
        correctOption,
        explanation: qExplanation
      });

      setAddSuccess(true);
      setSubmitting(false);

      setQTitle('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setQExplanation('');

      setTimeout(() => setAddSuccess(false), 3000);
    }, 300);
  };

  const avgReadiness = Math.round(
    allUsers.reduce((acc, curr) => acc + curr.readinessScore, 0) / (allUsers.length || 1)
  );

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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[11px] font-mono font-bold">
                TPO PLACEMENT CELL CONSOLE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Placement Cell Admin Management
            </h1>
            <p className="text-xs text-zinc-400">
              Manage student readiness metrics, role permissions, and test question bank repositories.
            </p>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80 font-mono text-center">
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Total Registered</span>
            <span className="text-2xl font-extrabold text-white">{allUsers.length} Students</span>
          </div>
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Batch Readiness Index</span>
            <span className="text-2xl font-extrabold text-purple-400">{avgReadiness}% Avg</span>
          </div>
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-sans">Active Mentors</span>
            <span className="text-2xl font-extrabold text-emerald-400">{mentors.length} Alumni</span>
          </div>
        </div>
      </motion.div>

      {/* USER ROLE MANAGEMENT TABLE */}
      <motion.div variants={itemVariants} className="mono-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-sm text-white font-heading">Student & Role Management Directory</h2>
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-800/80 rounded-xl bg-zinc-950/60">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                <th className="p-3.5 pl-4">Student Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Branch / Year</th>
                <th className="p-3.5">Readiness</th>
                <th className="p-3.5">Role Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs text-white">
              {allUsers.map(u => (
                <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5 pl-4 font-bold text-white">{u.name}</td>
                  <td className="p-3.5 font-mono text-zinc-400">{u.email}</td>
                  <td className="p-3.5 text-zinc-300">{u.branch} • {u.year}</td>
                  <td className="p-3.5 font-mono font-bold text-purple-400">{u.readinessScore}%</td>
                  <td className="p-3.5">
                    <select
                      value={u.role}
                      onChange={e => updateUserRoleInAdmin(u.id, e.target.value as UserRole)}
                      className="bg-zinc-900 border border-zinc-800 text-xs text-white p-1.5 rounded-lg outline-none font-mono cursor-pointer"
                    >
                      <option value="mentee">Mentee (Student)</option>
                      <option value="mentor">Mentor (Alumni)</option>
                      <option value="admin">Admin (TPO Cell)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* QUESTION BANK MANAGER */}
      <motion.div variants={itemVariants} className="mono-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-400" />
            <h2 className="font-bold text-sm text-white font-heading">Add Custom Question to Practice Bank</h2>
          </div>
          {addSuccess && (
            <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Added successfully!
            </span>
          )}
        </div>

        <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Category</label>
              <select
                value={qType}
                onChange={e => setQType(e.target.value as any)}
                className="w-full bg-zinc-950/80 text-white p-3 rounded-xl border border-zinc-800 outline-none font-mono"
              >
                <option value="Technical">Technical Core</option>
                <option value="Aptitude">Aptitude & Reasoning</option>
                <option value="Logical">Logical Analysis</option>
                <option value="Verbal">Verbal Communication</option>
                <option value="Company-Specific">Company Specific</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Company Drive Tag</label>
              <input
                type="text"
                value={qCompanyTag}
                onChange={e => setQCompanyTag(e.target.value)}
                placeholder="TCS / Infosys / Wipro"
                className="w-full bg-zinc-950/80 text-white p-3 rounded-xl border border-zinc-800 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Difficulty Level</label>
              <select
                value={qDifficulty}
                onChange={e => setQDifficulty(e.target.value as any)}
                className="w-full bg-zinc-950/80 text-white p-3 rounded-xl border border-zinc-800 outline-none font-mono"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-zinc-400 text-[11px]">Question Prompt Text</label>
            <textarea
              required
              rows={2}
              value={qTitle}
              onChange={e => setQTitle(e.target.value)}
              placeholder="Enter technical or aptitude question prompt..."
              className="w-full bg-zinc-950/80 text-white p-3 rounded-xl border border-zinc-800 outline-none leading-relaxed resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Option A</label>
              <input type="text" required value={optA} onChange={e => setOptA(e.target.value)} className="w-full bg-zinc-950/80 text-white p-2.5 rounded-xl border border-zinc-800 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Option B</label>
              <input type="text" required value={optB} onChange={e => setOptB(e.target.value)} className="w-full bg-zinc-950/80 text-white p-2.5 rounded-xl border border-zinc-800 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Option C</label>
              <input type="text" required value={optC} onChange={e => setOptC(e.target.value)} className="w-full bg-zinc-950/80 text-white p-2.5 rounded-xl border border-zinc-800 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Option D</label>
              <input type="text" required value={optD} onChange={e => setOptD(e.target.value)} className="w-full bg-zinc-950/80 text-white p-2.5 rounded-xl border border-zinc-800 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Correct Option Index</label>
              <select
                value={correctOption}
                onChange={e => setCorrectOption(Number(e.target.value))}
                className="w-full bg-zinc-950/80 text-white p-3 rounded-xl border border-zinc-800 outline-none font-mono"
              >
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-zinc-400 text-[11px]">Explanation / Solution Notes</label>
              <input
                type="text"
                required
                value={qExplanation}
                onChange={e => setQExplanation(e.target.value)}
                placeholder="Explain the step-by-step logic behind the answer..."
                className="w-full bg-zinc-950/80 text-white p-3 rounded-xl border border-zinc-800 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-xs font-bold rounded-full cursor-pointer"
          >
            <span>{submitting ? 'Adding Question...' : 'Save Question to Bank'}</span>
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};
