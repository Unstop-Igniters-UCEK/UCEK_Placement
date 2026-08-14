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
import { loginApi, registerApi, getMeApi, logoutApi, demoLoginApi, updateProfileApi } from '../lib/api';

export type Theme = 'dark' | 'light';

interface AppContextType {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot') => void;
  
  // Theme System
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  
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
  loginUser: (email: string, password?: string, role?: string) => Promise<boolean>;
  signupUser: (newUser: Omit<User, 'id' | 'readinessScore'> & { password?: string; adminSecurityCode?: string }) => Promise<boolean>;
  updateUserDomain: (domainName: string) => Promise<boolean>;
  logoutUser: () => void;
  toggleMilestone: (domainId: string, moduleId: string, milestoneId: string) => void;
  saveTestResult: (result: Omit<TestResult, 'id' | 'date'>) => void;
  addQuestionToBank: (newQ: Omit<Question, 'id'>) => void;
  publishTest: (test: Omit<MockTest, 'id' | 'questions' | 'passPercentage'>) => void;
  addMentorshipLog: (topic: string, feedback: string, actionItems: string[]) => void;
  requestMentorship: (mentorId: string) => void;
  updateUserRoleInAdmin: (userId: string, newRole: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); // Default to unauthenticated for landing page first load
  const [allUsers, setAllUsers] = useState<User[]>(DEMO_USERS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Fixed Dark Theme System (Light mode removed entirely per user directive)
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    localStorage.setItem('ucek-theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  // Restore user session from backend on mount if access token exists
  useEffect(() => {
    const token = localStorage.getItem('ucek_access_token');
    if (token && !user) {
      getMeApi()
        .then(data => {
          if (data.user) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: (data.user.role as UserRole) || 'mentee',
              year: data.user.year || '4th Year',
              branch: data.user.branch || 'CSE',
              domain: data.user.domainInterest || data.user.domain || 'Software Engineering',
              hasSelectedDomain: data.user.hasSelectedDomain ?? false,
              readinessScore: data.user.readinessScore ?? 75,
              avatar: data.user.avatar,
              bio: data.user.bio,
            });
          }
        })
        .catch(err => {
          console.warn('Failed to restore backend session:', err);
          localStorage.removeItem('ucek_access_token');
        });
    }
  }, []);

  const toggleTheme = () => {
    // No-op: Light mode removed
  };

  const setTheme = () => {
    // No-op: Light mode removed
  };

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

  const switchDemoRole = async (role: UserRole) => {
    try {
      const data = await demoLoginApi(role);
      if (data.accessToken) {
        localStorage.setItem('ucek_access_token', data.accessToken);
      }
      const mappedUser: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: (data.user.role as UserRole) || role,
        year: data.user.year || '4th Year',
        branch: data.user.branch || 'CSE',
        domain: data.user.domainInterest || data.user.domain || 'Software Engineering',
        hasSelectedDomain: data.user.hasSelectedDomain ?? false,
        readinessScore: data.user.readinessScore ?? 80,
        avatar: data.user.avatar,
        bio: data.user.bio,
      };
      setUser(mappedUser);
      setAuthModalOpen(false);
      setActiveTab(mappedUser.role === 'admin' ? 'admin' : 'dashboard');
    } catch {
      // Fallback for offline demo role selection
      const targetUser = allUsers.find(u => u.role === role) || DEMO_USERS.find(u => u.role === role);
      if (targetUser) {
        setUser(targetUser);
        setAuthModalOpen(false);
        setActiveTab(targetUser.role === 'admin' ? 'admin' : 'dashboard');
      }
    }
  };

  const loginUser = async (email: string, password?: string, role?: string): Promise<boolean> => {
    const data = await loginApi({ email, password: password || '', role });
    if (data.accessToken) {
      localStorage.setItem('ucek_access_token', data.accessToken);
    }
    const mappedUser: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: (data.user.role as UserRole) || 'mentee',
      year: data.user.year || '4th Year',
      branch: data.user.branch || 'CSE',
      domain: data.user.domainInterest || data.user.domain || 'Software Engineering',
      hasSelectedDomain: data.user.hasSelectedDomain ?? false,
      readinessScore: data.user.readinessScore ?? 75,
      avatar: data.user.avatar,
      bio: data.user.bio,
    };
    setUser(mappedUser);
    setAuthModalOpen(false);
    setActiveTab(mappedUser.role === 'admin' ? 'admin' : 'dashboard');
    return true;
  };

  const signupUser = async (newUser: Omit<User, 'id' | 'readinessScore'> & { password?: string; adminSecurityCode?: string }): Promise<boolean> => {
    const data = await registerApi({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password || '',
      role: newUser.role || 'mentee',
      year: newUser.year || '4th Year',
      branch: newUser.branch || 'CSE',
      domainInterest: newUser.domain || 'Software Engineering',
      adminSecurityCode: newUser.adminSecurityCode
    });
    if (data.accessToken) {
      localStorage.setItem('ucek_access_token', data.accessToken);
    }
    const mappedUser: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: (data.user.role as UserRole) || 'mentee',
      year: data.user.year || '4th Year',
      branch: data.user.branch || 'CSE',
      domain: data.user.domainInterest || data.user.domain || 'Software Engineering',
      hasSelectedDomain: data.user.hasSelectedDomain ?? false,
      readinessScore: data.user.readinessScore ?? 65,
      avatar: data.user.avatar,
      bio: data.user.bio,
    };
    setUser(mappedUser);
    setAuthModalOpen(false);
    setActiveTab(mappedUser.role === 'admin' ? 'admin' : 'dashboard');
    return true;
  };

  const updateUserDomain = async (domainName: string): Promise<boolean> => {
    try {
      const updatedUser = await updateProfileApi({ domainInterest: domainName, hasSelectedDomain: true });
      if (user) {
        setUser(prev => prev ? {
          ...prev,
          domain: updatedUser.domainInterest || updatedUser.domain || domainName,
          hasSelectedDomain: true
        } : null);
      }
      return true;
    } catch {
      if (user) {
        setUser(prev => prev ? { ...prev, domain: domainName, hasSelectedDomain: true } : null);
      }
      return true;
    }
  };

  const logoutUser = () => {
    logoutApi().catch(() => {});
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

  const publishTest = (test: Omit<MockTest, 'id' | 'questions' | 'passPercentage'>) => {
    const newTest: MockTest = {
      ...test,
      id: `custom_${Date.now()}`,
      questions: [],
      passPercentage: 70,
    };
    setMockTests(prev => [newTest, ...prev]);
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
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        theme,
        toggleTheme,
        setTheme,
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
        updateUserDomain,
        logoutUser,
        toggleMilestone,
        saveTestResult,
        addQuestionToBank,
        publishTest,
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
