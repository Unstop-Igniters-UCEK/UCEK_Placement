import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  DomainRoadmap,
  MockTest,
  TestResult,
  MentorshipPair,
  ResumeData,
  InterviewQuestion,
  SeniorMentor,
  Question
} from '../types';
import {
  DEMO_USERS,
  INITIAL_ROADMAPS,
  MOCK_TESTS,
  INTERVIEW_QUESTIONS,
  SENIOR_MENTORS,
  INITIAL_MENTORSHIP,
  INITIAL_RECENT_SCORES,
  INITIAL_RESUME_DATA
} from '../data/mockData';

interface AppContextType {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot') => void;
  
  // Data
  roadmaps: DomainRoadmap[];
  mockTests: MockTest[];
  recentScores: TestResult[];
  mentorshipPair: MentorshipPair | null;
  interviewQuestions: InterviewQuestion[];
  mentors: SeniorMentor[];
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  allUsers: User[];

  // Actions
  switchDemoRole: (role: UserRole) => void;
  loginUser: (email: string) => boolean;
  signupUser: (newUser: Omit<User, 'id' | 'readinessScore'>) => void;
  logoutUser: () => void;
  toggleMilestone: (domainId: string, moduleId: string, milestoneId: string) => void;
  saveTestResult: (result: Omit<TestResult, 'id' | 'date'>) => void;
  addQuestionToBank: (newQ: Omit<Question, 'id'>) => void;
  addMentorshipLog: (topic: string, feedback: string, actionItems: string[]) => void;
  requestMentorship: (mentorId: string) => void;
  updateUserRoleInAdmin: (userId: string, newRole: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Default to unauthenticated for landing page first load
  const [allUsers, setAllUsers] = useState<User[]>(DEMO_USERS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const [roadmaps, setRoadmaps] = useState<DomainRoadmap[]>(INITIAL_ROADMAPS);
  const [mockTests, setMockTests] = useState<MockTest[]>(MOCK_TESTS);
  const [recentScores, setRecentScores] = useState<TestResult[]>(INITIAL_RECENT_SCORES);
  const [mentorshipPair, setMentorshipPair] = useState<MentorshipPair | null>(INITIAL_MENTORSHIP);
  const [interviewQuestions] = useState<InterviewQuestion[]>(INTERVIEW_QUESTIONS);
  const [mentors] = useState<SeniorMentor[]>(SENIOR_MENTORS);
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);

  // Recalculate user readiness score based on milestone completion and test scores
  useEffect(() => {
    if (!user) return;
    const currentDomainRoadmap = roadmaps.find(
      r => r.name.toLowerCase() === user.domain.toLowerCase() || r.id === 'swe'
    );
    if (!currentDomainRoadmap) return;

    let totalMilestones = 0;
    let completedMilestones = 0;
    currentDomainRoadmap.modules.forEach(m => {
      m.milestones.forEach(ms => {
        totalMilestones++;
        if (ms.completed) completedMilestones++;
      });
    });

    const milestoneRatio = totalMilestones > 0 ? completedMilestones / totalMilestones : 0.5;
    
    // Average score from test results
    let avgTestScorePct = 75;
    if (recentScores.length > 0) {
      const sumPct = recentScores.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
      avgTestScorePct = sumPct / recentScores.length;
    }

    const calculatedReadiness = Math.round(milestoneRatio * 40 + (avgTestScorePct / 100) * 60);

    if (calculatedReadiness !== user.readinessScore) {
      setUser(prev => (prev ? { ...prev, readinessScore: calculatedReadiness } : null));
    }
  }, [roadmaps, recentScores]);

  const switchDemoRole = (role: UserRole) => {
    const targetUser = allUsers.find(u => u.role === role) || DEMO_USERS.find(u => u.role === role);
    if (targetUser) {
      setUser(targetUser);
    }
  };

  const loginUser = (email: string): boolean => {
    const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      setAuthModalOpen(false);
      return true;
    }
    // Dynamic login fallback for demo
    const createdUser: User = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role: 'mentee',
      year: '4th Year',
      branch: 'CSE',
      domain: 'Software Engineering',
      readinessScore: 72
    };
    setAllUsers(prev => [...prev, createdUser]);
    setUser(createdUser);
    setAuthModalOpen(false);
    return true;
  };

  const signupUser = (newUser: Omit<User, 'id' | 'readinessScore'>) => {
    const created: User = {
      ...newUser,
      id: `usr_${Date.now()}`,
      readinessScore: 65
    };
    setAllUsers(prev => [...prev, created]);
    setUser(created);
    setAuthModalOpen(false);
  };

  const logoutUser = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const toggleMilestone = (domainId: string, moduleId: string, milestoneId: string) => {
    setRoadmaps(prev =>
      prev.map(roadmap => {
        if (roadmap.id !== domainId) return roadmap;
        return {
          ...roadmap,
          modules: roadmap.modules.map(mod => {
            if (mod.id !== moduleId) return mod;
            return {
              ...mod,
              milestones: mod.milestones.map(ms => {
                if (ms.id !== milestoneId) return ms;
                return { ...ms, completed: !ms.completed };
              })
            };
          })
        };
      })
    );
  };

  const saveTestResult = (resultData: Omit<TestResult, 'id' | 'date'>) => {
    const newResult: TestResult = {
      ...resultData,
      id: `res_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setRecentScores(prev => [newResult, ...prev]);
  };

  const addQuestionToBank = (newQ: Omit<Question, 'id'>) => {
    const createdQuestion: Question = {
      ...newQ,
      id: `q_custom_${Date.now()}`
    };

    setMockTests(prev => {
      // Add to company drive or aptitude test or first test
      const targetTest = prev.find(t => t.category === newQ.type || t.companyTag === newQ.companyTag) || prev[0];
      if (!targetTest) return prev;

      return prev.map(t => {
        if (t.id !== targetTest.id) return t;
        return {
          ...t,
          questionCount: t.questionCount + 1,
          questions: [...t.questions, createdQuestion]
        };
      });
    });
  };

  const addMentorshipLog = (topic: string, feedback: string, actionItems: string[]) => {
    if (!mentorshipPair) return;
    const newLog = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      topic,
      feedback,
      actionItems
    };
    setMentorshipPair(prev => (prev ? { ...prev, logs: [newLog, ...prev.logs] } : null));
  };

  const requestMentorship = (mentorId: string) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (!mentor || !user) return;

    const newPair: MentorshipPair = {
      id: `pair_${Date.now()}`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorCompany: mentor.company,
      mentorRole: mentor.role,
      menteeId: user.id,
      menteeName: user.name,
      status: 'Active',
      nextMeetingDate: 'Upcoming (Schedule with Mentor)',
      logs: []
    };
    setMentorshipPair(newPair);
  };

  const updateUserRoleInAdmin = (userId: string, newRole: UserRole) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (user && user.id === userId) {
      setUser(prev => (prev ? { ...prev, role: newRole } : null));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        activeTab,
        setActiveTab,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        roadmaps,
        mockTests,
        recentScores,
        mentorshipPair,
        interviewQuestions,
        mentors,
        resumeData,
        setResumeData,
        allUsers,
        switchDemoRole,
        loginUser,
        signupUser,
        logoutUser,
        toggleMilestone,
        saveTestResult,
        addQuestionToBank,
        addMentorshipLog,
        requestMentorship,
        updateUserRoleInAdmin
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
