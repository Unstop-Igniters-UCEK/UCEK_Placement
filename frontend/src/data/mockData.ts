import {
  User,
  DomainRoadmap,
  MockTest,
  InterviewQuestion,
  SeniorMentor,
  MentorshipPair,
  ResumeData,
  TestResult
} from '../types';

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

export const INITIAL_ROADMAPS: DomainRoadmap[] = [
  {
    id: 'swe',
    name: 'Software Engineering',
    description: 'Master Core Data Structures, Algorithms, System Architecture, & Web Engineering for top tier placement drives.',
    modules: [
      {
        id: 'swe_mod_1',
        title: 'Core DSA & Problem Solving Foundation',
        level: 'Beginner',
        milestones: [
          {
            id: 'm1_1',
            title: 'Arrays, Strings, Two Pointers & Sliding Window',
            description: 'Learn memory alignment, basic complexity analysis, two-pointer techniques for array searches.',
            estimatedHours: 12,
            completed: true,
            keyConcepts: ['Time Complexity', 'Two Pointers', 'Sliding Window', 'In-place Mutation'],
            resources: [
              { name: 'Neetcode 150 Arrays Guide', type: 'doc', url: 'https://neetcode.io' },
              { name: 'Sliding Window Deep Dive', type: 'video', url: 'https://youtube.com' }
            ]
          },
          {
            id: 'm1_2',
            title: 'Linked Lists, Stacks & Queues Mastery',
            description: 'Implement doubly linked lists, monotonic stack pattern for next greater element, stack evaluation.',
            estimatedHours: 10,
            completed: true,
            keyConcepts: ['Pointers', 'Monotonic Stack', 'Queue via Stacks', 'LRU Cache'],
            resources: [
              { name: 'Stack Pattern Practice Set', type: 'practice', url: 'https://leetcode.com' }
            ]
          },
          {
            id: 'm1_3',
            title: 'Trees, BST & Graph Traversals (BFS/DFS)',
            description: 'Master binary tree recursion, tree height, LCA algorithm, BFS/DFS matrix traversals.',
            estimatedHours: 18,
            completed: false,
            keyConcepts: ['Binary Trees', 'LCA', 'Graph Adjacency', 'BFS / DFS'],
            resources: [
              { name: 'Graph Algorithm Cheatsheet', type: 'doc', url: 'https://geeksforgeeks.org' }
            ]
          }
        ]
      },
      {
        id: 'swe_mod_2',
        title: 'Object Oriented Programming & System Basics',
        level: 'Intermediate',
        milestones: [
          {
            id: 'm2_1',
            title: 'Java / C++ OOP Design Principles & SOLID',
            description: 'Understand Polymorphism, Encapsulation, Single Responsibility, and Factory Design Pattern.',
            estimatedHours: 14,
            completed: true,
            keyConcepts: ['Polymorphism', 'Inheritance', 'SOLID', 'Design Patterns'],
            resources: [
              { name: 'Refactoring Guru - Design Patterns', type: 'doc', url: 'https://refactoring.guru' }
            ]
          },
          {
            id: 'm2_2',
            title: 'Database Design & SQL Querying (MySQL/PostgreSQL)',
            description: 'Master ER diagrams, 3NF Normalization, SQL Joins, Indexing, and ACID transactions.',
            estimatedHours: 16,
            completed: false,
            keyConcepts: ['Normal Forms', 'Joins', 'Indexes', 'ACID'],
            resources: [
              { name: 'SQL Zoo Interactive', type: 'practice', url: 'https://sqlzoo.net' }
            ]
          }
        ]
      },
      {
        id: 'swe_mod_3',
        title: 'System Design & High Concurrency',
        level: 'Advanced',
        milestones: [
          {
            id: 'm3_1',
            title: 'Low-Level System Design (LLD) & Clean Architecture',
            description: 'Design Parking Lot, Elevator System, and Tic-Tac-Toe with proper UML & classes.',
            estimatedHours: 20,
            completed: false,
            keyConcepts: ['UML Diagrams', 'Design Patterns', 'Extensibility'],
            resources: [
              { name: 'LLD Interview Primer', type: 'doc', url: 'https://github.com' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'ds_ai',
    name: 'Data Science & AI',
    description: 'Statistical Inference, Machine Learning Algorithms, Deep Learning, & Python Analytics pipeline.',
    modules: [
      {
        id: 'ds_mod_1',
        title: 'Exploratory Data Analysis & Python Stack',
        level: 'Beginner',
        milestones: [
          {
            id: 'ds_m1',
            title: 'NumPy, Pandas Data Wrangling & Feature Engineering',
            description: 'Master DataFrame operations, missing value handling, one-hot encoding, feature scaling.',
            estimatedHours: 15,
            completed: true,
            keyConcepts: ['Pandas', 'NumPy', 'Feature Scaling', 'Categorical Encoding'],
            resources: [
              { name: 'Kaggle Pandas Tutorial', type: 'doc', url: 'https://kaggle.com' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'electronics',
    name: 'Core Electronics & Embedded',
    description: 'Embedded C, Microcontrollers, ARM Architecture, Real-Time Operating Systems (RTOS), & Digital Circuits.',
    modules: [
      {
        id: 'elec_mod_1',
        title: 'Microcontroller Fundamentals & Embedded C',
        level: 'Beginner',
        milestones: [
          {
            id: 'elec_m1',
            title: 'Registers, GPIO, Timers & UART Communication',
            description: 'Learn bitwise operations in C, memory maps, interrupts, and UART serial communication.',
            estimatedHours: 16,
            completed: true,
            keyConcepts: ['Embedded C', 'Interrupts', 'UART/SPI', 'GPIO Registers'],
            resources: [
              { name: 'ARM Cortex Embedded Guide', type: 'doc', url: 'https://arm.com' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'ui_ux',
    name: 'UI/UX & Product Design',
    description: 'User Research, Figma Prototyping, Design Systems, Information Architecture, & Usability Testing.',
    modules: [
      {
        id: 'ui_mod_1',
        title: 'Figma Auto-Layout & UI Systems',
        level: 'Beginner',
        milestones: [
          {
            id: 'ui_m1',
            title: 'Grid Systems, Typography Scale & Components',
            description: 'Design responsive web cards, auto-layout frame constraints, and interactive prototypes.',
            estimatedHours: 12,
            completed: false,
            keyConcepts: ['Figma Tokens', 'Auto-Layout', 'Accessibility (WCAG)'],
            resources: [
              { name: 'Figma Academy UI Course', type: 'video', url: 'https://figma.com' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'vlsi',
    name: 'VLSI & Chip Design',
    description: 'Verilog HDL, CMOS Digital Design, Synthesis, STA (Static Timing Analysis), & FPGA Prototyping.',
    modules: [
      {
        id: 'vlsi_mod_1',
        title: 'Verilog Digital Logic Synthesis',
        level: 'Intermediate',
        milestones: [
          {
            id: 'vlsi_m1',
            title: 'RTL Coding, Finite State Machines (FSM) & Testbenches',
            description: 'Implement Mealy & Moore state machines in Verilog and simulate with ModelSim.',
            estimatedHours: 20,
            completed: false,
            keyConcepts: ['Verilog HDL', 'FSM Synthesis', 'Testbench Logic'],
            resources: [
              { name: 'HDLBits Interactive Verilog', type: 'practice', url: 'https://hdlbits.01xz.net' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'devops',
    name: 'Cloud & DevOps',
    description: 'Docker Containerization, Kubernetes Orchestration, CI/CD Pipelines, AWS Services, & Terraform Infrastructure.',
    modules: [
      {
        id: 'dev_mod_1',
        title: 'Containerization & Cloud Infrastructure',
        level: 'Intermediate',
        milestones: [
          {
            id: 'dev_m1',
            title: 'Docker Image Building, Multi-Stage Builds & Compose',
            description: 'Write optimized Dockerfiles, network containers, and run multi-container applications.',
            estimatedHours: 14,
            completed: true,
            keyConcepts: ['Docker', 'Multi-Stage Build', 'Networking', 'Volume Mounts'],
            resources: [
              { name: 'Docker Docs & Labs', type: 'doc', url: 'https://docker.com' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'management',
    name: 'Management & Consulting',
    description: 'Business Aptitude, Case Study Frameworks, Financial Ratios, Guesstimates, & Product Management.',
    modules: [
      {
        id: 'mgmt_mod_1',
        title: 'Consulting Frameworks & Guesstimates',
        level: 'Intermediate',
        milestones: [
          {
            id: 'mgmt_m1',
            title: 'Profitability Trees, Market Sizing & MECE Approach',
            description: 'Break down complex market entry problems using Mutually Exclusive Collectively Exhaustive logic.',
            estimatedHours: 12,
            completed: false,
            keyConcepts: ['MECE Framework', 'Profitability Tree', 'Market Sizing'],
            resources: [
              { name: 'Case In Point Summary Guide', type: 'doc', url: 'https://consulting.com' }
            ]
          }
        ]
      }
    ]
  }
];

export const MOCK_TESTS: MockTest[] = [
  {
    id: 'tcs_ninja_drive',
    title: 'TCS Ninja & Digital National Drive Mock 2026',
    category: 'Company Drive',
    companyTag: 'TCS',
    durationMinutes: 30,
    questionCount: 5,
    passPercentage: 70,
    description: 'Comprehensive simulation matching TCS NQT question style covering Numerical Ability, Verbal Reasoning, & Core Coding Concepts.',
    questions: [
      {
        id: 'q1',
        title: 'A train 150m long passes a telegraph post in 12 seconds. What is the speed of the train in km/hr?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['45 km/hr', '50 km/hr', '36 km/hr', '40 km/hr'],
        correctOption: 0,
        explanation: 'Speed = Distance / Time = 150m / 12s = 12.5 m/s. Converting to km/hr: 12.5 * (18 / 5) = 45 km/hr.'
      },
      {
        id: 'q2',
        title: 'Which data structure is primarily used to implement Recursion in programming languages?',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['Queue', 'Call Stack', 'Min-Heap', 'Graph'],
        correctOption: 1,
        explanation: 'Recursion uses the system Call Stack to manage active function frames and local scope.'
      },
      {
        id: 'q3',
        title: 'Select the antonym for the word "BENEVOLENT":',
        type: 'Verbal',
        companyTag: 'TCS',
        difficulty: 'Easy',
        options: ['Malevolent', 'Generous', 'Altruistic', 'Friendly'],
        correctOption: 0,
        explanation: 'Benevolent means well-meaning and kindly. Malevolent means wishing to do evil to others.'
      },
      {
        id: 'q4',
        title: 'What is the output of `typeof null` in JavaScript?',
        type: 'Technical',
        companyTag: 'TCS',
        difficulty: 'Medium',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctOption: 2,
        explanation: 'Due to a historical bug in early JavaScript, `typeof null` evaluates to `"object"`.'
      },
      {
        id: 'q5',
        title: 'If 6 men and 8 boys can do a piece of work in 10 days, while 26 men and 48 boys can do it in 2 days, what is the ratio of work done by 1 man to 1 boy?',
        type: 'Aptitude',
        companyTag: 'TCS',
        difficulty: 'Hard',
        options: ['2 : 1', '3 : 1', '1 : 2', '4 : 1'],
        correctOption: 0,
        explanation: 'Equating work: 10(6M + 8B) = 2(26M + 48B) => 60M + 80B = 52M + 96B => 8M = 16B => M/B = 2/1.'
      }
    ]
  },
  {
    id: 'infosys_nqt',
    title: 'Infosys Specialist Programmer Diagnostic Exam',
    category: 'Company Drive',
    companyTag: 'Infosys',
    durationMinutes: 25,
    questionCount: 4,
    passPercentage: 75,
    description: 'Standard Infosys NQT pattern test focusing on Logical Deductions, Data Interpretation, and Algorithm optimization.',
    questions: [
      {
        id: 'iq1',
        title: 'Find the next number in the series: 3, 5, 9, 17, 33, ?',
        type: 'Logical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['65', '49', '64', '55'],
        correctOption: 0,
        explanation: 'The difference between numbers doubles each time (+2, +4, +8, +16, +32). 33 + 32 = 65.'
      },
      {
        id: 'iq2',
        title: 'In Time Complexity analysis, what does Big-Omega (Ω) notation denote?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: ['Upper Bound', 'Lower Bound / Best Case', 'Tight Bound', 'Average Case'],
        correctOption: 1,
        explanation: 'Big-Omega (Ω) represents asymptotic lower bound (best-case lower limit) of execution time.'
      },
      {
        id: 'iq3',
        title: 'Which SQL keyword is used to eliminate duplicate rows from a SELECT query result?',
        type: 'Technical',
        companyTag: 'Infosys',
        difficulty: 'Easy',
        options: ['UNIQUE', 'DISTINCT', 'GROUP BY', 'DIFFERENT'],
        correctOption: 1,
        explanation: 'SELECT DISTINCT column_name FROM table_name returns unique distinct records.'
      },
      {
        id: 'iq4',
        title: 'Choose the grammatically correct sentence:',
        type: 'Verbal',
        companyTag: 'Infosys',
        difficulty: 'Medium',
        options: [
          'Neither the manager nor the employees was present.',
          'Neither the manager nor the employees were present.',
          'Neither the manager nor the employees are present yesterday.',
          'Neither manager nor employees were present.'
        ],
        correctOption: 1,
        explanation: 'In "neither... nor" structures, the verb agrees with the subject closest to it ("employees were").'
      }
    ]
  },
  {
    id: 'general_aptitude',
    title: 'Universal Quantitative & Logical Aptitude Test',
    category: 'Aptitude',
    durationMinutes: 20,
    questionCount: 3,
    passPercentage: 60,
    description: 'High-frequency placement questions on Probability, Permutations, Syllogisms, & Data Sufficiency.',
    questions: [
      {
        id: 'ga1',
        title: 'Two dice are tossed together. What is the probability that the sum of numbers obtained is a prime number?',
        type: 'Aptitude',
        difficulty: 'Medium',
        options: ['15/36 (5/12)', '7/36', '1/2', '13/36'],
        correctOption: 0,
        explanation: 'Total outcomes = 36. Prime sums possible: 2, 3, 5, 7, 11. Count of outcomes = 1 + 2 + 4 + 6 + 2 = 15. Probability = 15/36 = 5/12.'
      },
      {
        id: 'ga2',
        title: 'All cats are animals. All animals are living beings. Conclusion: All cats are living beings.',
        type: 'Logical',
        difficulty: 'Easy',
        options: ['Valid', 'Invalid', 'Partially True', 'Cannot be Determined'],
        correctOption: 0,
        explanation: 'Standard transitive syllogism: Cats ⊂ Animals ⊂ Living Beings => Cats ⊂ Living Beings.'
      },
      {
        id: 'ga3',
        title: 'If LOGIC is coded as MTHJD, how is SMART coded in the same pattern?',
        type: 'Logical',
        difficulty: 'Medium',
        options: ['TNBUS', 'TLBSU', 'TNBSU', 'TMCUS'],
        correctOption: 2,
        explanation: 'Each letter is shifted by +1 (L->M, O->P... S->T, M->N, A->B, R->S, T->U = TNBSU).'
      }
    ]
  }
];

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
    companyTag: 'Google',
    suggestedAnswer: 'Use the STAR method (Situation, Task, Action, Result). Highlight active listening, objective data-driven compromise, and delivering on target.'
  },
  {
    id: 'tech_1',
    questionText: 'What is the difference between Process and Thread? Explain how Context Switching works.',
    category: 'Technical',
    difficulty: 'Medium',
    companyTag: 'Infosys',
    suggestedAnswer: 'A process is an isolated program in execution with its own memory space. A thread is a lightweight execution unit inside a process sharing memory space.'
  },
  {
    id: 'sit_1',
    questionText: 'If you are given two high-priority tasks with tight deadlines simultaneously by two different project leads, how will you manage?',
    category: 'Situational',
    difficulty: 'Hard',
    companyTag: 'UST',
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

export const INITIAL_RECENT_SCORES: TestResult[] = [
  {
    id: 'res_1',
    testId: 'tcs_ninja_drive',
    testTitle: 'TCS Ninja & Digital National Drive Mock 2026',
    category: 'Company Drive',
    score: 4,
    totalQuestions: 5,
    accuracy: 80,
    passed: true,
    timeSpentMinutes: 18,
    date: '2026-07-29',
    userAnswers: { q1: 0, q2: 1, q3: 0, q4: 2, q5: 1 }
  },
  {
    id: 'res_2',
    testId: 'general_aptitude',
    testTitle: 'Universal Quantitative & Logical Aptitude Test',
    category: 'Aptitude',
    score: 2,
    totalQuestions: 3,
    accuracy: 67,
    passed: true,
    timeSpentMinutes: 12,
    date: '2026-07-25',
    userAnswers: { ga1: 0, ga2: 0, ga3: 0 }
  }
];

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
