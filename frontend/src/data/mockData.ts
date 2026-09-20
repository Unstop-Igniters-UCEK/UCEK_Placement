import {
  User,
  MockTest,
  InterviewQuestion,
  SeniorMentor,
  MentorshipPair,
  ResumeData,
  TestResult
} from '../types';

export { INITIAL_ROADMAPS } from './roadmaps';

export const DEMO_USERS: User[] = [
  {
    id: 'usr_mentee_1',
    name: 'Anand Nair',
    email: 'anand.nair@ucek.ac.in',
    role: 'mentee',
    year: '4th Year',
    branch: 'CSE',
    domain: 'Software Engineering',
    readinessScore: 78,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'usr_admin_1',
    name: 'Dr. Suresh Kumar',
    email: 'placement.cell@ucek.ac.in',
    role: 'admin',
    year: 'Faculty',
    branch: 'Placement Cell',
    domain: 'Management & Consulting',
    readinessScore: 100,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
  }
];

export const MOCK_TESTS: MockTest[] = [];

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'hr_1',
    questionText: 'Tell me about yourself and why you are interested in joining our organization as a Campus Recruit.',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'TCS',
    suggestedAnswer: 'Start with your name, UCEK branch, core technical stack, key projects, internship experience, and align your personal growth with the company mission.'
  },
  {
    id: 'hr_2',
    questionText: 'Describe a challenging situation during your final year project where team conflict arose. How did you resolve it?',
    category: 'HR & Behavioral',
    difficulty: 'Medium',
    companyTag: 'TCS',
    suggestedAnswer: 'Use the STAR method (Situation, Task, Action, Result). Highlight active listening, objective data-driven compromise, and delivering on target.'
  },
  {
    id: 'inf_1',
    questionText: 'Why do you want to join Infosys as a Systems Engineer / Specialist Programmer, and where do you see yourself in 3 years?',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'Infosys',
    suggestedAnswer: 'Discuss Infosys learning ecosystem (Mysore Training Center), continuous upskilling, and contribution to enterprise digital transformation.'
  },
  {
    id: 'inf_2',
    questionText: 'What is the difference between Process and Thread? Explain how Context Switching works.',
    category: 'Technical',
    difficulty: 'Medium',
    companyTag: 'Infosys',
    suggestedAnswer: 'A process is an isolated program in execution with its own memory space. A thread is a lightweight execution unit inside a process sharing memory space.'
  },
  {
    id: 'wip_1',
    questionText: 'How do you prioritize multiple tasks when working under tight deadlines in a multi-client project team?',
    category: 'Situational',
    difficulty: 'Medium',
    companyTag: 'Wipro',
    suggestedAnswer: 'Prioritize by business impact and urgency. Communicate early with team leads to clarify requirements and prevent bottlenecks.'
  },
  {
    id: 'wip_2',
    questionText: 'Describe a project where you had to learn a new technology or programming language quickly.',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'Wipro',
    suggestedAnswer: 'Focus on your structured learning approach, documentation research, building a prototype, and delivering the module on schedule.'
  },
  {
    id: 'acc_1',
    questionText: 'Accenture focuses heavily on innovation and emerging tech. Share an example of how you used creative problem-solving in a project.',
    category: 'HR & Behavioral',
    difficulty: 'Hard',
    companyTag: 'Accenture',
    suggestedAnswer: 'Detail how you identified an operational flaw or bottleneck, researched innovative tools, and implemented an optimized automated solution.'
  },
  {
    id: 'acc_2',
    questionText: 'How do you handle constructive criticism or feedback from a senior developer or team mentor?',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'Accenture',
    suggestedAnswer: 'Emphasize a growth mindset, taking feedback objectively, implementing changes promptly, and asking clarifying questions to improve code quality.'
  },
  {
    id: 'gen_1',
    questionText: 'What are your key strengths and what is one technical area you are actively working to improve?',
    category: 'HR & Behavioral',
    difficulty: 'Easy',
    companyTag: 'General HR',
    suggestedAnswer: 'Share 2 technical strengths backed by project work, and 1 area you are actively improving via certifications or daily coding practice.'
  },
  {
    id: 'gen_2',
    questionText: 'If you are given two high-priority tasks with tight deadlines simultaneously by two different project leads, how will you manage?',
    category: 'Situational',
    difficulty: 'Hard',
    companyTag: 'General HR',
    suggestedAnswer: 'Communicate transparently with both leads, assess business impact/dependencies, propose realistic split timelines, and escalate if blocking.'
  }
];

export const SENIOR_MENTORS: SeniorMentor[] = [
  {
    id: 'ment_1',
    name: 'Devika Suresh',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    role: 'Software Engineer I',
    company: 'Google',
    domain: 'Software Engineering',
    bio: 'UCEK CSE Alumna (2025). Cracked Google Off-Campus & TCS Digital. Specializes in LeetCode algorithms, mock tech interviews, and ATS resume polish.',
    rating: 4.9,
    availability: '3 hrs / week'
  },
  {
    id: 'ment_2',
    name: 'Rahul Krishna',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'Embedded Systems Specialist',
    company: 'Texas Instruments',
    domain: 'Core Electronics & Embedded',
    bio: 'UCEK ECE Alumnus (2024). Placed at TI with focus on ARM Cortex microcontrollers, RTOS, & hardware prototyping.',
    rating: 4.8,
    availability: '2 hrs / week'
  },
  {
    id: 'ment_3',
    name: 'Ananya Pillai',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    role: 'Data Scientist',
    company: 'Amazon',
    domain: 'Data Science & AI',
    bio: 'UCEK IT Alumna (2024). Expert in ML pipelines, Python analytics, SQL case studies, and Amazon STAR behavioral interview rounds.',
    rating: 5.0,
    availability: '4 hrs / week'
  }
];

export const INITIAL_MENTORSHIP: MentorshipPair = {
  id: 'pair_101',
  mentorId: 'ment_1',
  mentorName: 'Devika Suresh',
  mentorCompany: 'Google',
  mentorRole: 'Software Engineer I',
  menteeId: 'usr_mentee_1',
  menteeName: 'Anand Nair',
  status: 'Active',
  nextMeetingDate: '2026-08-05 (Wed) @ 6:00 PM',
  logs: [
    {
      id: 'log_1',
      date: '2026-07-28',
      topic: 'Initial Diagnostic & Resume Review',
      feedback: 'Anand has solid foundational knowledge in Java & DSA. Resume needs quantified impact metrics in final year web app project.',
      actionItems: ['Quantify project metrics with STAR method', 'Solve 15 Sliding Window problems on LeetCode', 'Take TCS Mock Drive']
    }
  ]
};

export const INITIAL_RECENT_SCORES: TestResult[] = [];

export const INITIAL_RESUME_DATA: ResumeData = {
  template: 'ats',
  personal: {
    fullName: 'Anand Nair',
    email: 'anand.nair@ucek.ac.in',
    phone: '+91 98765 43210',
    location: 'Trivandrum, Kerala',
    linkedIn: 'linkedin.com/in/anandnair-ucek',
    github: 'github.com/anandnair-ucek',
    summary: 'Proactive 4th-year Computer Science Engineering student at UCEK with expertise in React, TypeScript, Node.js, and Data Structures. Passionate about building high-performance web applications and solving complex algorithmic challenges.'
  },
  education: [
    {
      id: 'edu_1',
      institution: 'University College of Engineering Kariavattom (UCEK)',
      degree: 'B.Tech',
      fieldOfStudy: 'Computer Science and Engineering',
      startDate: '2022',
      endDate: '2026',
      gpa: '8.4 / 10 CGPA'
    }
  ],
  experience: [
    {
      id: 'exp_1',
      company: 'Technopark Student Interns',
      position: 'Frontend Developer Intern',
      startDate: 'May 2025',
      endDate: 'July 2025',
      isCurrent: false,
      bullets: [
        'Developed responsive React UI components reducing load time by 35% across 4 primary modules.',
        'Integrated REST APIs with Axios and implemented Redux state management for 1,200 daily active users.'
      ]
    }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Smart Campus Placement Portal',
      techStack: 'React, TypeScript, Tailwind CSS, Node.js',
      description: 'Built a centralized campus recruitment platform featuring automated ATS resume parsing and timed mock test drives.',
      link: 'github.com/anandnair-ucek/placement-portal',
      bullets: [
        'Architected real-time quiz engine supporting 500+ concurrent student exam submissions.',
        'Engineered AI resume review system evaluating keyword match accuracy with 92% precision.'
      ]
    }
  ],
  skills: [
    { id: 'sk_1', category: 'Programming Languages', items: 'JavaScript, TypeScript, Java, C++, Python, SQL' },
    { id: 'sk_2', category: 'Web Frameworks & Libraries', items: 'React.js, Node.js, Express, HTML5, CSS3, Tailwind CSS' },
    { id: 'sk_3', category: 'Tools & Databases', items: 'Git, GitHub, VS Code, Postman, MySQL, MongoDB' }
  ],
  certifications: [
    'NPTEL Online Certification: Data Structures & Algorithms in Java (Elite Badge)',
    'Meta Front-End Developer Professional Certificate (Coursera)'
  ]
};
