import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Compass,
  FileText,
  CheckSquare,
  Mic,
  Users,
  ShieldCheck,
  Award
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, user } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview & Metrics',
      icon: LayoutDashboard,
      badge: 'Main'
    },
    {
      id: 'roadmap',
      label: 'Domain Roadmaps',
      icon: Compass,
      badge: '5 Tracks'
    },
    {
      id: 'resumes',
      label: 'AI Resume Suite',
      icon: FileText,
      badge: 'ATS 90+'
    },
    {
      id: 'tests',
      label: 'Mock Drive Exams',
      icon: CheckSquare,
      badge: 'Timed'
    },
    {
      id: 'interview',
      label: 'HR Voice Evaluator',
      icon: Mic,
      badge: 'Speech AI'
    },
    {
      id: 'mentorship',
      label: 'Alumni Network',
      icon: Users,
      badge: '1-on-1'
    },
    {
      id: 'admin',
      label: 'Placement Cell',
      icon: ShieldCheck,
      badge: 'Admin'
    }
  ];

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-zinc-200 flex flex-col justify-between p-3 hidden md:flex min-h-[calc(100vh-49px)] font-sans">
      <div className="space-y-4">
        <div>
          <div className="px-2 mb-1.5 flex items-center justify-between text-[9px] font-bold tracking-widest text-zinc-400 uppercase font-mono">
            <span>Modules</span>
            <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1 rounded border border-zinc-200">
              v2.0
            </span>
          </div>

          <nav className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-[#09090b] text-white font-bold'
                      : 'text-zinc-600 hover:text-[#09090b] hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} className={isActive ? 'text-white' : 'text-zinc-400'} />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </div>

                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isActive ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Readiness Status Card */}
        {user && (
          <div className="p-3 rounded bg-zinc-50 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#09090b]">
                <Award size={13} className="text-[#09090b]" />
                <span className="text-[11px]">Readiness</span>
              </div>
              <span className="mono-badge-black text-[9px] py-0 px-1 font-mono">
                {user.readinessScore}%
              </span>
            </div>

            <div className="w-full bg-zinc-200 rounded-full h-1 overflow-hidden">
              <div
                className="bg-[#09090b] h-full rounded-full transition-all duration-300"
                style={{ width: `${user.readinessScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-zinc-200 text-[10px] text-center text-zinc-400 flex items-center justify-between px-1 font-mono">
        <span>UCEK Portal</span>
        <span className="text-[#09090b] font-bold">2026</span>
      </div>
    </aside>
  );
};
