import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import BorderGlow from '../components/BorderGlow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Star,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  MessageSquare,
  BookOpen
} from 'lucide-react';

export const Mentorship: React.FC = () => {
  const {
    mentors,
    mentorshipPair,
    requestMentorship,
    addMentorshipLog
  } = useApp();

  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('All');
  const [logTopic, setLogTopic] = useState('');
  const [logFeedback, setLogFeedback] = useState('');
  const [logActionItems, setLogActionItems] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  const filteredMentors = mentors.filter(m => {
    if (selectedDomainFilter === 'All') return true;
    return m.domain.toLowerCase().includes(selectedDomainFilter.toLowerCase());
  });

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTopic.trim() || !logFeedback.trim()) return;

    setLogSubmitting(true);
    setTimeout(() => {
      const itemsArray = logActionItems
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      addMentorshipLog(logTopic, logFeedback, itemsArray);
      setLogTopic('');
      setLogFeedback('');
      setLogActionItems('');
      setLogSubmitting(false);
    }, 400);
  };

  // MODE 2: ACTIVE MENTORSHIP SPECIFICATION
  if (mentorshipPair) {
    return (
      <div className="space-y-5 py-2 font-sans">
        <section className="mono-card p-6 space-y-3 border-zinc-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#09090b]" />
                <span className="mono-badge-black text-xs font-mono">Active Session</span>
              </div>
              <h1 className="text-xl font-extrabold text-[#09090b] tracking-tight">
                Senior Mentor: {mentorshipPair.mentorName}
              </h1>
              <p className="text-xs text-zinc-500">
                {mentorshipPair.mentorRole} at <span className="text-[#09090b] font-bold">{mentorshipPair.mentorCompany}</span> • Mentee: {mentorshipPair.menteeName}
              </p>
            </div>

            <div className="p-3 rounded-sm bg-zinc-50 border border-zinc-200 text-right space-y-0.5 font-mono">
              <span className="text-[9px] text-zinc-400 uppercase font-sans font-bold block">Next Sync</span>
              <span className="text-xs font-bold text-[#09090b] flex items-center gap-1 justify-end">
                <Calendar className="w-3.5 h-3.5" />
                {mentorshipPair.nextMeetingDate}
              </span>
            </div>
          </div>
        </section>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
              <div className="p-5 space-y-3 min-h-full">
                <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                  Check-in Logs & Meeting History
                </h3>

                {mentorshipPair.logs.length === 0 ? (
                  <div className="py-10 text-center space-y-2 text-zinc-400 bg-white/5 rounded-sm border border-white/10 p-5">
                    <BookOpen className="w-6 h-6 text-zinc-500 mx-auto" />
                    <p className="text-xs font-semibold text-white">No logs yet. Record your session below.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mentorshipPair.logs.map(log => (
                      <div key={log.id} className="p-3.5 rounded-sm bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-white">{log.topic}</h4>
                          <span className="text-[9px] text-zinc-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-white" /> {log.date}
                          </span>
                        </div>

                        <div className="p-3 rounded-sm bg-white/5 border border-white/10 text-xs text-zinc-300 italic">
                          <span className="font-bold text-white block not-italic mb-0.5 text-[10px] font-mono">Mentor Notes:</span>
                          "{log.feedback}"
                        </div>

                        {log.actionItems.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">Action Items:</span>
                            <ul className="space-y-1 text-xs text-zinc-300">
                              {log.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </BorderGlow>
          </div>

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
              <div className="p-5 space-y-3 min-h-full">
                <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-white" />
                  Record Session Log
                </h3>

                <form onSubmit={handleAddLogSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Session Topic</label>
                    <input
                      type="text"
                      className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                      placeholder="e.g. Mock Technical Interview"
                      value={logTopic}
                      onChange={e => setLogTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Feedback Notes</label>
                    <textarea
                      className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none h-24 font-sans"
                      placeholder="Mentor's recommendations..."
                      value={logFeedback}
                      onChange={e => setLogFeedback(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Action Items (comma separated)</label>
                    <input
                      type="text"
                      className="w-full bg-[var(--bg-card)] text-xs text-white p-2 rounded-sm border border-[var(--border-color)] outline-none font-sans"
                      placeholder="Revise Sliding Window, Polish STAR bullets"
                      value={logActionItems}
                      onChange={e => setLogActionItems(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={logSubmitting}
                    className="btn-primary w-full text-xs py-2.5 font-bold rounded-full cursor-pointer"
                  >
                    {logSubmitting ? 'Logging...' : 'Log Session'}
                  </button>
                </form>
              </div>
            </BorderGlow>
          </div>
        </div>
      </div>
    );
  }

  // MODE 1: MENTOR DIRECTORY SPECIFICATION
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
                <Users className="w-4 h-4 text-white" />
                <span className="mono-badge text-xs font-mono">Mentorship System</span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Connect with Placed Seniors
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Connect with placed UCEK alumni at Google, Amazon, TI, & TCS for placement guidance & mock interviews.
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-1.5 pt-1">
            {['All', 'Software Engineering', 'Core Electronics', 'Data Science'].map(dom => (
              <button
                key={dom}
                onClick={() => setSelectedDomainFilter(dom)}
                className={`px-3.5 py-1.5 rounded-sm text-xs font-semibold transition-all border ${
                  selectedDomainFilter === dom
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-[var(--bg-body)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>
        </section>
      </BorderGlow>

      {/* Mentor Directory Grid Matrix */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredMentors.map(m => (
            <motion.div
              layout
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
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
                <div className="p-5 space-y-3 flex flex-col justify-between min-h-full">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-10 h-10 rounded-sm border border-zinc-700 object-cover shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-xs text-white">{m.name}</h3>
                        <p className="text-[11px] text-zinc-300 font-semibold">{m.role} @ {m.company}</p>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-0.5 font-bold font-mono">
                          <Star className="w-3 h-3 text-white fill-white" />
                          <span>{m.rating} Rating</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed italic">{m.bio}</p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                      <span className="mono-badge text-[9px] font-mono">{m.domain}</span>
                      <span className="text-[9px] text-zinc-400 font-mono">{m.availability}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => requestMentorship(m.id)}
                    className="btn-primary w-full text-xs py-2.5 font-bold rounded-full cursor-pointer"
                  >
                    <span>Request Mentorship</span>
                  </button>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
