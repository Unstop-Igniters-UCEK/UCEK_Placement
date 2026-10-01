import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Question,
  EMPTY_RESUME_DATA
} from '../types';
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
  demoLoginApi,
  updateProfileApi,
  getTestHistoryApi,
  submitTestApi,
  deleteTestHistoryApi,
  toggleMilestoneApi,
  getRoadmapApi,
  getHrQuestionsApi,
  getMentorsApi,
  getTests,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getResumeApi,
  getMockTestNotificationsApi,
  markMockTestNotificationsSeenApi,
  MockTestNotification,
  selectDomainApi
} from '../lib/api';

export type Theme = 'dark' | 'light';

interface AppContextType {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
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
  selectedInterviewQuestionId: string | null;
  setSelectedInterviewQuestionId: (id: string | null) => void;
  interviewQuestions: InterviewQuestion[];
  mentors: SeniorMentor[];
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>;
  allUsers: User[];

  // Mock Test Notifications (Current Session Only)
  notifications: MockTestNotification[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: (ids?: string[]) => void;
  markNotificationAsRead: (id: string) => void;
  highlightedTestId: string | null;
  setHighlightedTestId: (id: string | null) => void;

  // Actions
  switchDemoRole: (role: UserRole) => void;
  loginUser: (email: string, password?: string, role?: string) => Promise<boolean>;
  signupUser: (newUser: Omit<User, 'id' | 'readinessScore'> & { password?: string; adminSecurityCode?: string }) => Promise<boolean>;
  updateUserDomain: (domainName: string) => Promise<boolean>;
  updateUserProfile: (data: { name?: string; branch?: string; year?: string }) => Promise<User>;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const [selectedTargetDrive, setSelectedTargetDriveState] = useState<string>('');
  const [selectedInterviewQuestionId, setSelectedInterviewQuestionId] = useState<string | null>(null);

  // In-Memory Mock Test Notifications (Current Session Only)
  const [notifications, setNotifications] = useState<MockTestNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const readNotificationIdsRef = useRef<Set<string>>(new Set());
  const [highlightedTestId, setHighlightedTestId] = useState<string | null>(null);

  const markNotificationsAsRead = useCallback((ids?: string[]) => {
    setNotifications(prev => {
      const idsToMark = ids && ids.length > 0 ? new Set(ids) : new Set(prev.map(n => n.id));
      if (idsToMark.size === 0) return prev;

      idsToMark.forEach(id => readNotificationIdsRef.current.add(id));
      setReadNotificationIds(new Set(readNotificationIdsRef.current));

      return prev.filter(n => !idsToMark.has(n.id));
    });

    // Persist seen timestamp to backend
    markMockTestNotificationsSeenApi().catch(err => {
      console.warn('Failed to persist notification seen timestamp:', err);
    });
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    readNotificationIdsRef.current.add(id);
    setReadNotificationIds(new Set(readNotificationIdsRef.current));
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Persist seen timestamp to backend
    markMockTestNotificationsSeenApi().catch(err => {
      console.warn('Failed to persist notification seen timestamp:', err);
    });
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !readNotificationIdsRef.current.has(n.id)).length;

  const setSelectedTargetDrive = useCallback((driveLabel: string) => {
    setSelectedTargetDriveState(driveLabel);
    const token = getStoredToken();
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

  // Handle centralized 401 unauthorized notifications
  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken();
      setUser(null);
      setSelectedTargetDriveState('');
      setRecentScores([]);
      setMentorshipPair(null);
      setResumeData(EMPTY_RESUME_DATA);
      setNotifications([]);
      setReadNotificationIds(new Set());
      readNotificationIdsRef.current.clear();
      setHighlightedTestId(null);
      setActiveTab('dashboard');
    };

    window.addEventListener('ucek:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ucek:unauthorized', handleUnauthorized);
  }, []);

  // Restore user session from backend on mount if valid session access token exists
  useEffect(() => {
    // Clear any legacy persistent access token from localStorage
    localStorage.removeItem('ucek_access_token');

    const token = getStoredToken();
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
              domain: data.user.hasSelectedDomain ? (data.user.domainInterest || data.user.domain || data.user.domain_name) : null,
              domain_id: data.user.domain_id || null,
              hasSelectedDomain: Boolean(data.user.domain_id || data.user.hasSelectedDomain),
              targetDrive: data.user.targetDrive || null,
              readinessScore: data.user.readinessScore ?? null,
              readiness: data.user.readiness,
              avatar: data.user.avatar,
              bio: data.user.bio,
            });

            setSelectedTargetDriveState(data.user.targetDrive || '');
            if (data.user.role === 'admin') {
              setActiveTab('admin-dashboard');
            }
          }
        })
        .catch(err => {
          console.warn('Failed to restore backend session:', err);
          clearStoredToken();
          setUser(null);
        });
    }
  }, []);

  // Sync user central test history from backend when authenticated
  useEffect(() => {
    const token = getStoredToken();
    if (token && user) {
      getTestHistoryApi()
        .then((remoteScores) => {
          if (Array.isArray(remoteScores)) {
            setRecentScores(remoteScores);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch test history:', err);
          setRecentScores([]);
        });
    } else if (!user) {
      setRecentScores([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setResumeData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          fullName: prev.personal.fullName || user.name || '',
          email: prev.personal.email || user.email || ''
        }
      }));
    }
  }, [user?.id, user?.name, user?.email]);

  const toggleTheme = useCallback(() => {}, []);
  const setTheme = useCallback(() => {}, []);

  const [roadmaps, setRoadmaps] = useState<DomainRoadmap[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [recentScores, setRecentScores] = useState<TestResult[]>([]);
  const [mentorshipPair, setMentorshipPair] = useState<MentorshipPair | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [mentors, setMentors] = useState<SeniorMentor[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData>(EMPTY_RESUME_DATA);

  // Sync authentic HR questions from Supabase hr_practice_questions table
  useEffect(() => {
    getHrQuestionsApi('all')
      .then(questions => {
        if (Array.isArray(questions) && questions.length > 0) {
          setInterviewQuestions(questions);
        }
      })
      .catch(err => console.warn('Failed to load HR questions:', err));
  }, []);

  // Sync authentic mentors from Supabase users table (where role == 'mentor')
  useEffect(() => {
    getMentorsApi()
      .then(remoteMentors => {
        if (Array.isArray(remoteMentors) && remoteMentors.length > 0) {
          setMentors(remoteMentors);
        }
      })
      .catch(err => console.warn('Failed to load mentors:', err));
  }, []);

  // Sync authentic tests/quizzes from Supabase via backend
  useEffect(() => {
    getTests()
      .then(res => {
        if (res && Array.isArray(res.tests)) {
          setMockTests(res.tests);
        }
      })
      .catch(err => {
        console.warn('Failed to load tests:', err);
        setMockTests([]);
      });
  }, []);

  // Poll for newly published mock tests every 30 seconds for active students (Current Session Only)
  useEffect(() => {
    if (!user || user.role === 'admin') {
      setNotifications([]);
      setReadNotificationIds(new Set());
      readNotificationIdsRef.current.clear();
      return;
    }

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await getMockTestNotificationsApi();
        if (!isMounted || !res || !Array.isArray(res.notifications)) return;

        setNotifications(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const incoming = res.notifications.filter(
            item => !existingIds.has(item.id) && !readNotificationIdsRef.current.has(item.id)
          );
          if (incoming.length === 0) return prev;
          return [...incoming, ...prev];
        });
      } catch (err) {
        // Silently fail gracefully without fabricating fake notifications
        console.warn('Failed to poll mock test notifications:', err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.id, user?.role, user?.branch, user?.year]);

  // Sync personalized roadmap from Supabase when user is authenticated
  useEffect(() => {
    const token = getStoredToken();
    if (token && user?.hasSelectedDomain && user?.domain) {
      getRoadmapApi()
        .then(remoteRoadmap => {
          if (remoteRoadmap && Array.isArray(remoteRoadmap.modules) && remoteRoadmap.modules.length > 0) {
            setRoadmaps([remoteRoadmap]);
          } else {
            setRoadmaps([]);
          }
        })
        .catch(err => {
          console.warn('Failed to fetch user roadmap:', err);
          setRoadmaps([]);
        });
    } else {
      setRoadmaps([]);
    }
  }, [user?.id, user?.domain, user?.hasSelectedDomain]);

  // Sync authentic persistent resume from PostgreSQL when student user is authenticated
  useEffect(() => {
    const token = getStoredToken();
    if (token && user && user.role !== 'admin') {
      getResumeApi()
        .then(res => {
          if (res && res.resume) {
            const r = res.resume;
            const mappedTemplate: 'ats' | 'modern' = (r.template_type === 'modern' || r.template_type === 'modern_executive') ? 'modern' : 'ats';

            const mappedSkills = Array.isArray(r.skills)
              ? r.skills.map((sk: any, idx: number) => ({
                  id: sk.id ? String(sk.id) : `sk_${idx}`,
                  category: sk.category || 'Technical Skills',
                  items: sk.skill || sk.items || ''
                }))
              : [];

            const mappedProjects = Array.isArray(r.projects)
              ? r.projects.map((p: any, idx: number) => {
                  let bullets: string[] = [];
                  if (Array.isArray(p.bullets) && p.bullets.length > 0) {
                    bullets = p.bullets;
                  } else if (p.description) {
                    bullets = String(p.description).split('\n').filter((b: string) => b.trim().length > 0);
                  }
                  return {
                    id: p.id ? String(p.id) : `proj_${idx}`,
                    title: p.title || 'Project',
                    techStack: p.technologies || p.techStack || '',
                    description: p.description || '',
                    link: p.project_url || p.link || '',
                    bullets: bullets.length > 0 ? bullets : ['Project implementation and key contributions.']
                  };
                })
              : [];

            const mappedExperience = Array.isArray(r.experience)
              ? r.experience.map((exp: any, idx: number) => {
                  let bullets: string[] = [];
                  if (Array.isArray(exp.bullets) && exp.bullets.length > 0) {
                    bullets = exp.bullets;
                  } else if (exp.description) {
                    bullets = String(exp.description).split('\n').filter((b: string) => b.trim().length > 0);
                  }
                  return {
                    id: exp.id ? String(exp.id) : `exp_${idx}`,
                    company: exp.organization || exp.company || 'Company',
                    position: exp.role || exp.position || 'Role',
                    startDate: exp.start_date || exp.startDate || '',
                    endDate: exp.end_date || exp.endDate || '',
                    isCurrent: Boolean(exp.is_current ?? exp.isCurrent ?? false),
                    bullets: bullets.length > 0 ? bullets : ['Key responsibility and outcome.']
                  };
                })
              : [];

            const mappedEducation = Array.isArray(r.education)
              ? r.education.map((edu: any, idx: number) => ({
                  id: edu.id ? String(edu.id) : `edu_${idx}`,
                  institution: edu.institution || 'University',
                  degree: edu.degree || 'Degree',
                  fieldOfStudy: edu.field_of_study || edu.fieldOfStudy || '',
                  startDate: edu.start_year ? String(edu.start_year) : (edu.startDate ? String(edu.startDate) : ''),
                  endDate: edu.end_year ? String(edu.end_year) : (edu.endDate ? String(edu.endDate) : ''),
                  gpa: edu.grade || edu.gpa || ''
                }))
              : [];

            const mappedCertifications = Array.isArray(r.certifications)
              ? r.certifications.map((c: any) => typeof c === 'string' ? c : (c.name || 'Certification'))
              : [];

            setResumeData({
              template: mappedTemplate,
              personal: {
                fullName: user.name || '',
                email: user.email || '',
                phone: r.phone || '',
                location: r.location || '',
                linkedIn: r.linkedin_url || '',
                github: r.github_url || '',
                summary: r.summary || '',
                avatar: r.photo_storage_path || undefined
              },
              skills: mappedSkills,
              projects: mappedProjects,
              experience: mappedExperience,
              education: mappedEducation,
              certifications: mappedCertifications
            });
          }
        })
        .catch(err => {
          console.warn('Failed to fetch student resume:', err);
        });
    }
  }, [user?.id, user?.name, user?.email]);

  const switchDemoRole = useCallback(async (role: UserRole) => {
    const data = await demoLoginApi(role);
    if (data.accessToken) {
      setStoredToken(data.accessToken);
    }
    const mappedUser: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: (data.user.role as UserRole) || role,
      year: data.user.year || '4th Year',
      branch: data.user.branch || 'CSE',
      domain: data.user.hasSelectedDomain ? (data.user.domainInterest || data.user.domain || data.user.domain_name) : null,
      domain_id: data.user.domain_id || null,
      hasSelectedDomain: Boolean(data.user.domain_id || data.user.hasSelectedDomain),
      targetDrive: data.user.targetDrive || null,
      readinessScore: data.user.readinessScore ?? null,
      readiness: data.user.readiness,
      avatar: data.user.avatar,
      bio: data.user.bio,
    };
    setUser(mappedUser);
    setActiveTab(mappedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
  }, []);

  const loginUser = useCallback(async (email: string, password?: string, role?: string): Promise<boolean> => {
    const data = await loginApi({ email, password: password || '', role });
    if (data.accessToken) {
      setStoredToken(data.accessToken);
    }
    const mappedUser: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: (data.user.role as UserRole) || 'mentee',
      year: data.user.year || '4th Year',
      branch: data.user.branch || 'CSE',
      domain: data.user.hasSelectedDomain ? (data.user.domainInterest || data.user.domain || data.user.domain_name) : null,
      domain_id: data.user.domain_id || null,
      hasSelectedDomain: Boolean(data.user.domain_id || data.user.hasSelectedDomain),
      targetDrive: data.user.targetDrive || null,
      readinessScore: data.user.readinessScore ?? null,
      readiness: data.user.readiness,
      avatar: data.user.avatar,
      bio: data.user.bio,
    };
    setUser(mappedUser);
    setSelectedTargetDriveState(data.user.targetDrive || '');
    setActiveTab(mappedUser.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    return true;
  }, []);

  const signupUser = useCallback(async (newUser: Omit<User, 'id' | 'readinessScore'> & { password?: string; adminSecurityCode?: string }): Promise<boolean> => {
    await registerApi({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password || '',
      role: newUser.role || 'mentee',
      year: newUser.year || '4th Year',
      branch: newUser.branch || 'CSE',
      domainInterest: newUser.domain || undefined,
      adminSecurityCode: newUser.adminSecurityCode
    });
    return true;
  }, []);

  const updateUserDomain = useCallback(async (domainIdOrName: string): Promise<boolean> => {
    try {
      const updatedUser = await selectDomainApi(domainIdOrName);
      setUser(prev => prev ? {
        ...prev,
        domain: updatedUser.domain_name || updatedUser.domain || updatedUser.domainInterest || null,
        domain_id: updatedUser.domain_id || null,
        hasSelectedDomain: Boolean(updatedUser.domain_id || updatedUser.hasSelectedDomain)
      } : null);
      return true;
    } catch (err) {
      console.warn('Failed to update domain on backend:', err);
      return false;
    }
  }, []);

  const updateUserProfile = useCallback(async (data: { name?: string; branch?: string; year?: string }): Promise<User> => {
    const updated = await updateProfileApi(data);
    const updatedUserObj: User = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: (updated.role as UserRole) || 'mentee',
      year: updated.year || '4th Year',
      branch: updated.branch || 'CSE',
      domain: updated.hasSelectedDomain ? (updated.domainInterest || updated.domain) : null,
      hasSelectedDomain: updated.hasSelectedDomain ?? false,
      targetDrive: updated.targetDrive || null,
      readinessScore: updated.readinessScore ?? null,
      readiness: updated.readiness,
      avatar: updated.avatar,
      bio: updated.bio,
    };
    setUser(updatedUserObj);
    return updatedUserObj;
  }, []);
  const logoutUser = useCallback(() => {
    logoutApi().catch(() => {});
    clearStoredToken();
    localStorage.removeItem('ucek_selected_target_drive');
    setUser(null);
    setSelectedTargetDriveState('');
    setRecentScores([]);
    setMentorshipPair(null);
    setResumeData(EMPTY_RESUME_DATA);
    setNotifications([]);
    setReadNotificationIds(new Set());
    readNotificationIdsRef.current.clear();
    setHighlightedTestId(null);
    setActiveTab('dashboard');
  }, []);

  const toggleMilestone = useCallback((domainId: string, moduleId: string, milestoneId: string) => {
    let newCompleted = false;
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
                newCompleted = !ms.completed;
                return { ...ms, completed: newCompleted };
              })
            };
          })
        };
      })
    );
    // Fire-and-forget backend sync (optimistic update already applied above)
    const token = getStoredToken();
    if (token) {
      toggleMilestoneApi(moduleId, milestoneId, newCompleted)
        .catch(err => console.warn('Failed to persist milestone toggle:', err));
    }
  }, []);

  const saveTestResult = useCallback((resultData: Omit<TestResult, 'id' | 'date'>) => {
    const newResult: TestResult = {
      ...resultData,
      id: `res_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    // Optimistic UI update
    setRecentScores(prev => [newResult, ...prev]);

    const token = getStoredToken();
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
    const token = getStoredToken();
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

  const publishTest = useCallback((test: any) => {
    const newTest: MockTest = {
      id: test.id || `custom_${Date.now()}`,
      title: test.title || "Placement Assessment",
      category: (() => {
        const raw = String(test.category || test.test_type || test.testType || 'General').toLowerCase();
        if (raw === 'aptitude') return 'Aptitude';
        if (raw === 'technical') return 'Technical';
        return 'General';
      })(),
      durationMinutes: test.durationMinutes || test.durationMins || test.duration || 30,
      questionCount: test.questionCount || test.totalQuestions || (Array.isArray(test.questions) ? test.questions.length : 0),
      description: test.description || 'Placement mock assessment drive.',
      companyTag: test.companyTag || test.company_tag || test.targetDept || "Department Core",
      questions: Array.isArray(test.questions) ? test.questions : [],
      passPercentage: test.passPercentage || test.pass_percentage || 60,
      targetDept: test.targetDept || test.target_dept || "All",
      targetYear: test.targetYear || test.target_year || "All"
    };
    setMockTests(prev => [newTest, ...prev.filter(t => t.id !== newTest.id)]);
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
    theme,
    toggleTheme,
    setTheme,
    roadmaps,
    mockTests,
    recentScores,
    mentorshipPair,
    selectedTargetDrive,
    setSelectedTargetDrive,
    selectedInterviewQuestionId,
    setSelectedInterviewQuestionId,
    interviewQuestions,
    mentors,
    resumeData,
    setResumeData,
    allUsers,
    switchDemoRole,
    loginUser,
    signupUser,
    updateUserDomain,
    updateUserProfile,
    logoutUser,
    toggleMilestone,
    saveTestResult,
    clearTestHistory,
    addQuestionToBank,
    publishTest,
    addMentorshipLog,
    requestMentorship,
    updateUserRoleInAdmin,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    markNotificationAsRead,
    highlightedTestId,
    setHighlightedTestId
  }), [
    user,
    activeTab,
    sidebarOpen,
    toggleSidebar,
    theme,
    toggleTheme,
    setTheme,
    roadmaps,
    mockTests,
    recentScores,
    mentorshipPair,
    selectedTargetDrive,
    setSelectedTargetDrive,
    selectedInterviewQuestionId,
    setSelectedInterviewQuestionId,
    interviewQuestions,
    mentors,
    resumeData,
    allUsers,
    switchDemoRole,
    loginUser,
    signupUser,
    updateUserDomain,
    updateUserProfile,
    logoutUser,
    toggleMilestone,
    saveTestResult,
    clearTestHistory,
    addQuestionToBank,
    publishTest,
    addMentorshipLog,
    requestMentorship,
    updateUserRoleInAdmin,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    markNotificationAsRead,
    highlightedTestId,
    setHighlightedTestId
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
