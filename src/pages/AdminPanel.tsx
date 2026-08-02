import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
import { UserRole } from '../types';
import {
  ShieldCheck,
  Users,
  Plus,
  CheckCircle2
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

  if (!user || user.role !== 'admin') {
    return (
      <div className="mono-card p-8 text-center max-w-md mx-auto space-y-3 my-12 border-[var(--border-color)] font-sans">
        <ShieldCheck className="w-10 h-10 text-white mx-auto" />
        <h2 className="text-whitease font-bold text-white">Placement Officer Admin Access Only</h2>
        <p className="text-xs text-[var(--text-muted)]">
          This panel is restricted to UCEK Placement Cell administrators. Toggle demo role in header.
        </p>
        <button onClick={() => setActiveTab('dashboard')} className="btn-secondary text-xs py-1.5 px-4">
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
    }, 400);
  };

  const avgReadiness = Math.round(
    allUsers.reduce((acc, curr) => acc + curr.readinessScore, 0) / (allUsers.length || 1)
  );

  return (
    <div className="space-y-5 py-2 font-sans">
      {/* HEADER SPECIFICATION */}
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
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-white/10 text-white flex items-center justify-center border border-white/15">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">Admin Console</h1>
                <span className="mono-badge text-[9px] font-mono">Analytics</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage test question bank, monitor UCEK student readiness analytics, & assign user roles.
              </p>
            </div>
          </div>

          {/* Analytics Cards Matrix */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/10 font-mono">
            <div className="p-3 rounded-sm bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase font-sans block">Total Students</span>
              <span className="text-xl font-extrabold text-white">{allUsers.length}</span>
              <span className="text-[9px] text-[var(--text-secondary)] font-sans block">Active users</span>
            </div>

            <div className="p-3 rounded-sm bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase font-sans block">Active Mentors</span>
              <span className="text-xl font-extrabold text-white">{mentors.length}</span>
              <span className="text-[9px] text-[var(--text-secondary)] font-sans block">Online now</span>
            </div>

            <div className="p-3 rounded-sm bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase font-sans block">Tests Evaluated</span>
              <span className="text-xl font-extrabold text-white">{recentScores.length * 3 + 12}</span>
              <span className="text-[9px] text-[var(--text-secondary)] font-sans block">This month</span>
            </div>

            <div className="p-3 rounded-sm bg-white/5 border border-white/10 space-y-0.5">
              <span className="text-[8px] text-[var(--text-secondary)] font-bold uppercase font-sans block">College Readiness</span>
              <span className="text-xl font-extrabold text-white">{avgReadiness} / 100</span>
              <span className="text-[9px] text-[var(--text-secondary)] font-sans block">State Average</span>
            </div>
          </div>
        </section>
      </BorderGlow>

      {/* Two-Column Content Spec */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Add Question Form */}
        <div className="lg:col-span-6 mono-card p-6 space-y-3 border-[var(--border-color)]">
          <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-white" />
            Add Test Question
          </h3>

          {addSuccess && (
            <div className="p-2.5 rounded-sm bg-zinc-100 border border-[var(--border-color)] flex items-center gap-2 text-xs text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              <span>Question added to bank successfully!</span>
            </div>
          )}

          <form onSubmit={handleAddQuestionSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Question Title / Prompt</label>
              <textarea
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none h-16 font-sans"
                placeholder="Enter question text or code snippet..."
                value={qTitle}
                onChange={e => setQTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Type</label>
                <select
                  className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                  value={qType}
                  onChange={e => setQType(e.target.value as any)}
                >
                  <option value="Technical">Technical</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Logical">Logical</option>
                  <option value="Verbal">Verbal</option>
                  <option value="Company-Specific">Company-Specific</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Company Tag</label>
                <input
                  type="text"
                  className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                  placeholder="TCS / Google"
                  value={qCompanyTag}
                  onChange={e => setQCompanyTag(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Difficulty</label>
                <select
                  className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                  value={qDifficulty}
                  onChange={e => setQDifficulty(e.target.value as any)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                placeholder="Option A"
                value={optA}
                onChange={e => setOptA(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                placeholder="Option B"
                value={optB}
                onChange={e => setOptB(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                placeholder="Option C"
                value={optC}
                onChange={e => setOptC(e.target.value)}
                required
              />
              <input
                type="text"
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                placeholder="Option D"
                value={optD}
                onChange={e => setOptD(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Correct Option</label>
              <div className="flex gap-3 pt-0.5">
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <label key={letter} className="flex items-center gap-1 text-xs text-white cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOption === idx}
                      onChange={() => setCorrectOption(idx)}
                      className="accent-[#09090b]"
                    />
                    <span>Option {letter}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">Explanation</label>
              <textarea
                className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none h-14 font-sans"
                placeholder="Explain why this answer is correct..."
                value={qExplanation}
                onChange={e => setQExplanation(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-xs py-2.5 font-bold rounded-full cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              <span>{submitting ? 'Adding...' : 'Add Question'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: User Management */}
        <div className="lg:col-span-6 mono-card p-6 space-y-3 border-[var(--border-color)]">
          <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white" />
            User Management
          </h3>

          <div className="overflow-x-auto border border-[var(--border-color)] rounded-sm bg-[var(--bg-card)]">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)] text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">
                  <th className="p-2.5 pl-3">Name</th>
                  <th className="p-2.5">Branch/Year</th>
                  <th className="p-2.5">Domain</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5 pr-3">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--bg-body)] transition-colors">
                    <td className="p-2.5 pl-3 font-bold text-white">{u.name}</td>
                    <td className="p-2.5 text-[var(--text-muted)] text-[11px]">{u.branch} ({u.year})</td>
                    <td className="p-2.5"><span className="mono-badge text-[9px] font-mono">{u.domain}</span></td>
                    <td className="p-2.5">
                      <select
                        className="bg-[var(--bg-body)] text-white text-[10px] py-0.5 px-1.5 rounded-sm border border-[var(--border-color)] font-semibold"
                        value={u.role}
                        onChange={e => updateUserRoleInAdmin(u.id, e.target.value as UserRole)}
                      >
                        <option value="mentee">Mentee</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-2.5 pr-3 font-bold text-white font-mono">{u.readinessScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
