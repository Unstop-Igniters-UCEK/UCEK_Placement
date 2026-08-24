import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
import { loginApi, registerApi, getMeApi, logoutApi, demoLoginApi, updateProfileApi, getTestHistoryApi, submitTestApi, deleteTestHistoryApi } from '../lib/api';

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
  selectedTargetDrive: string;
  setSelectedTargetDrive: (driveLabel: string) => void;
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
  clearTestHistory: () => void;
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
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const [selectedTargetDrive, setSelectedTargetDriveState] = useState<string>(() => {
    return localStorage.getItem('ucek_selected_target_drive') || 'TCS Ninja & Digital 2026';
  });

  const setSelectedTargetDrive = useCallback((driveLabel: string) => {
    setSelectedTargetDriveState(driveLabel);
    localStorage.setItem('ucek_selected_target_drive', driveLabel);
    const token = localStorage.getItem('ucek_access_token');
    if (token) {
      updateProfileApi({ targetDrive: driveLabel }).catch(() => {});
    }
  }, []);

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

            if (data.user.targetDrive) {
              setSelectedTargetDriveState(data.user.targetDrive);
              localStorage.setItem('ucek_selected_target_drive', data.user.targetDrive);
            }
            if (data.user.role === 'admin') {
              setActiveTab('admin-dashboard');
            }
          }
        })
        .catch(err => {
          console.warn('Failed to restore backend session:', err);
          localStorage.removeItem('ucek_access_token');
        });
    }
  }, []);

  // Sync user central test history from backend when authenticated
  useEffect(() => {
    const token = localStorage.getItem('ucek_access_token');
    if (token && user) {
      getTestHistoryApi()
        .then((remoteScores) => {
          if (remoteScores && remoteScores.length > 0) {
            setRecentScores(remoteScores);
          }
        })
        .catch(err => console.warn('Failed to fetch test history:', err));
    }
  }, [user?.id]);

  const toggleTheme = useCallback(() => {}, []);
  const setTheme = useCallback(() => {}, []);

  const [roadmaps, setRoadmaps] = useState<DomainRoadmap[]>(INITIAL_ROADMAPS);
  const [mockTests, setMockTests] = useState<MockTest[]>(MOCK_TESTS);
  const [recentScores, setRecentScores] = useState<TestResult[]>(INITIAL_RECENT_SCORES);
  const [mentorshipPair, setMentorshipPair] = useState<MentorshipPair | null>(INITIAL_MENTORSHIP);
  const [interviewQuestions] = useState<InterviewQuestion[]>(INTERVIEW_QUESTIONS);
  const [mentors] = useState<SeniorMentor[]>(SENIOR_MENTORS);
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);



  const switchDemoRole = useCallback(async (role: UserRole) => {
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
      setActiveTab(mappedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch {
      // Fallback for offline demo role selection
      const targetUser = allUsers.find(u => u.role === role) || DEMO_USERS.find(u => u.role === role);
      if (targetUser) {
        setUser(targetUser);
        setAuthModalOpen(false);
        setActiveTab(targetUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
      }
    }
  }, [allUsers]);

  const loginUser = useCallback(async (email: string, password?: string, role?: string): Promise<boolean> => {
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
    setActiveTab(mappedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    return true;
  }, []);

  const signupUser = useCallback(async (newUser: Omit<User, 'id' | 'readinessScore'> & { password?: string; adminSecurityCode?: string }): Promise<boolean> => {
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
    setActiveTab(mappedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    return true;
  }, []);

  const updateUserDomain = useCallback(async (domainName: string): Promise<boolean> => {
    try {
      const updatedUser = await updateProfileApi({ domainInterest: domainName, hasSelectedDomain: true });
      setUser(prev => prev ? {
        ...prev,
        domain: updatedUser.domainInterest || updatedUser.domain || domainName,
        hasSelectedDomain: true
      } : null);
      return true;
    } catch {
      setUser(prev => prev ? { ...prev, domain: domainName, hasSelectedDomain: true } : null);
      return true;
    }
  }, []);

  const logoutUser = useCallback(() => {
    logoutApi().catch(() => {});
    setUser(null);
    setActiveTab('dashboard');
  }, []);

  const toggleMilestone = useCallback((domainId: string, moduleId: string, milestoneId: string) => {
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
  }, []);

  const saveTestResult = useCallback((resultData: Omit<TestResult, 'id' | 'date'>) => {
    const newResult: TestResult = {
      ...resultData,
      id: `res_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    // Optimistic UI update
    setRecentScores(prev => [newResult, ...prev]);

    const token = localStorage.getItem('ucek_access_token');
    if (token) {
      submitTestApi(resultData.testId, {
        score: resultData.score,
        totalQuestions: resultData.totalQuestions,
        timeTakenSec: (resultData.timeSpentMinutes || 1) * 60,
        userAnswers: resultData.userAnswers,
        testTitle: resultData.testTitle,
        category: resultData.category,
        passed: resultData.passed,
        percentage: resultData.accuracy
      })
      .then(() => {
        // Fetch real history to get official score ID from backend
        getTestHistoryApi().then(scores => {
          if (scores && scores.length > 0) setRecentScores(scores);
        }).catch(err => console.warn('Failed to refresh test history:', err));
      })
      .catch(err => console.warn('Failed to sync test score to backend:', err));
    }
  }, []);

  const clearTestHistory = useCallback(() => {
    setRecentScores([]);
    const token = localStorage.getItem('ucek_access_token');
    if (token) {
      deleteTestHistoryApi().catch(err => console.warn('Failed to clear test history on backend:', err));
    }
  }, []);

  const addQuestionToBank = useCallback((newQ: Omit<Question, 'id'>) => {
    const createdQuestion: Question = {
      ...newQ,
      id: `q_custom_${Date.now()}`
    };

    setMockTests(prev => {
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
  }, []);

  const publishTest = useCallback((test: Omit<MockTest, 'id' | 'questions' | 'passPercentage'>) => {
    const newTest: MockTest = {
      ...test,
      id: `custom_${Date.now()}`,
      questions: [],
      passPercentage: 70,
    };
    setMockTests(prev => [newTest, ...prev]);
  }, []);

  const addMentorshipLog = useCallback((topic: string, feedback: string, actionItems: string[]) => {
    const newLog = {
      id: `log_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      topic,
      feedback,
      actionItems
    };
    setMentorshipPair(prev => (prev ? { ...prev, logs: [newLog, ...prev.logs] } : null));
  }, []);

  const requestMentorship = useCallback((mentorId: string) => {
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
  }, [mentors, user]);

  const updateUserRoleInAdmin = useCallback((userId: string, newRole: UserRole) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setUser(prev => (prev && prev.id === userId ? { ...prev, role: newRole } : prev));
  }, []);

  const value = useMemo(() => ({
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
    selectedTargetDrive,
    setSelectedTargetDrive,
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
    clearTestHistory,
    addQuestionToBank,
    publishTest,
    addMentorshipLog,
    requestMentorship,
    updateUserRoleInAdmin
  }), [
    user,
    activeTab,
    sidebarOpen,
    toggleSidebar,
    authModalOpen,
    authModalMode,
    theme,
    toggleTheme,
    setTheme,
    roadmaps,
    mockTests,
    recentScores,
    mentorshipPair,
    selectedTargetDrive,
    setSelectedTargetDrive,
    interviewQuestions,
    mentors,
    resumeData,
    allUsers,
    switchDemoRole,
    loginUser,
    signupUser,
    updateUserDomain,
    logoutUser,
    toggleMilestone,
    saveTestResult,
    clearTestHistory,
    addQuestionToBank,
    publishTest,
    addMentorshipLog,
    requestMentorship,
    updateUserRoleInAdmin
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
