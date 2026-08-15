# Python mock data for UCEK Unstop Igniters Placement Platform

INITIAL_QUESTIONS = []

INITIAL_MOCK_TESTS = [
  {
    "id": "tcs_ninja_drive",
    "title": "TCS Ninja & Digital National Drive Mock 2026",
    "category": "Company Drive",
    "companyTag": "TCS",
    "company_tag": "TCS",
    "durationMinutes": 30,
    "duration_mins": 30,
    "passPercentage": 70,
    "pass_percentage": 70,
    "totalQuestions": 5,
    "questions": [
      {
        "id": "q1",
        "title": "A train 150m long passes a telegraph post in 12 seconds. What is the speed of the train in km/hr?",
        "options": ["45 km/hr", "50 km/hr", "36 km/hr", "40 km/hr"],
        "correctOption": 0
      },
      {
        "id": "q2",
        "title": "Which data structure is primarily used to implement Recursion in programming languages?",
        "options": ["Queue", "Call Stack", "Min-Heap", "Graph"],
        "correctOption": 1
      },
      {
        "id": "q3",
        "title": "Select the antonym for the word 'BENEVOLENT':",
        "options": ["Malevolent", "Generous", "Altruistic", "Friendly"],
        "correctOption": 0
      }
    ]
  },
  {
    "id": "infosys_nqt",
    "title": "Infosys Specialist Programmer Diagnostic Exam",
    "category": "Company Drive",
    "companyTag": "Infosys",
    "company_tag": "Infosys",
    "durationMinutes": 25,
    "duration_mins": 25,
    "passPercentage": 75,
    "pass_percentage": 75,
    "totalQuestions": 4,
    "questions": [
      {
        "id": "iq1",
        "title": "Find the next number in the series: 3, 5, 9, 17, 33, ?",
        "options": ["65", "49", "64", "55"],
        "correctOption": 0
      },
      {
        "id": "iq2",
        "title": "In Time Complexity analysis, what does Big-Omega (Ω) notation denote?",
        "options": ["Best Case", "Worst Case", "Average Case", "Upper Bound"],
        "correctOption": 0
      }
    ]
  }
]

INITIAL_INTERVIEW_QUESTIONS = [
  {
    "id": "hr_1",
    "question": "Tell me about yourself and why you are interested in joining our organization as a Campus Recruit.",
    "questionText": "Tell me about yourself and why you are interested in joining our organization as a Campus Recruit.",
    "category": "HR & Behavioral",
    "companyTag": "TCS",
    "company_tag": "TCS",
    "isFeatured": True
  },
  {
    "id": "hr_2",
    "question": "Describe a challenging situation during your final year project where team conflict arose. How did you resolve it?",
    "questionText": "Describe a challenging situation during your final year project where team conflict arose. How did you resolve it?",
    "category": "HR & Behavioral",
    "companyTag": "TCS",
    "company_tag": "TCS",
    "isFeatured": True
  },
  {
    "id": "inf_1",
    "question": "Why do you want to join Infosys as a Systems Engineer / Specialist Programmer, and where do you see yourself in 3 years?",
    "questionText": "Why do you want to join Infosys as a Systems Engineer / Specialist Programmer, and where do you see yourself in 3 years?",
    "category": "HR & Behavioral",
    "companyTag": "Infosys",
    "company_tag": "Infosys",
    "isFeatured": True
  },
  {
    "id": "inf_2",
    "question": "What is the difference between Process and Thread? Explain how Context Switching works.",
    "questionText": "What is the difference between Process and Thread? Explain how Context Switching works.",
    "category": "Technical",
    "companyTag": "Infosys",
    "company_tag": "Infosys",
    "isFeatured": True
  },
  {
    "id": "wip_1",
    "question": "How do you prioritize multiple tasks when working under tight deadlines in a multi-client project team?",
    "questionText": "How do you prioritize multiple tasks when working under tight deadlines in a multi-client project team?",
    "category": "Situational",
    "companyTag": "Wipro",
    "company_tag": "Wipro",
    "isFeatured": True
  },
  {
    "id": "wip_2",
    "question": "Describe a project where you had to learn a new technology or programming language quickly.",
    "questionText": "Describe a project where you had to learn a new technology or programming language quickly.",
    "category": "HR & Behavioral",
    "companyTag": "Wipro",
    "company_tag": "Wipro",
    "isFeatured": True
  },
  {
    "id": "acc_1",
    "question": "Accenture focuses heavily on innovation and emerging tech. Share an example of how you used creative problem-solving in a project.",
    "questionText": "Accenture focuses heavily on innovation and emerging tech. Share an example of how you used creative problem-solving in a project.",
    "category": "HR & Behavioral",
    "companyTag": "Accenture",
    "company_tag": "Accenture",
    "isFeatured": True
  },
  {
    "id": "acc_2",
    "question": "How do you handle constructive criticism or feedback from a senior developer or team mentor?",
    "questionText": "How do you handle constructive criticism or feedback from a senior developer or team mentor?",
    "category": "HR & Behavioral",
    "companyTag": "Accenture",
    "company_tag": "Accenture",
    "isFeatured": True
  },
  {
    "id": "gen_1",
    "question": "What are your key strengths and what is one technical area you are actively working to improve?",
    "questionText": "What are your key strengths and what is one technical area you are actively working to improve?",
    "category": "HR & Behavioral",
    "companyTag": "General HR",
    "company_tag": "General HR",
    "isFeatured": True
  },
  {
    "id": "gen_2",
    "question": "If you are given two high-priority tasks with tight deadlines simultaneously by two different project leads, how will you manage?",
    "questionText": "If you are given two high-priority tasks with tight deadlines simultaneously by two different project leads, how will you manage?",
    "category": "Situational",
    "companyTag": "General HR",
    "company_tag": "General HR",
    "isFeatured": True
  }
]

DEFAULT_ROADMAPS = {
  "Software Engineering": [
    {
      "id": "m1",
      "title": "Core CS Fundamentals",
      "description": "Data Structures, Algorithms, OOPs, OS & DBMS for TCS/Infosys drives",
      "milestones": [
        {"id": "ms1", "title": "Arrays, Strings & Two Pointers", "completed": True},
        {"id": "ms2", "title": "Stacks, Queues & HashMaps", "completed": True},
        {"id": "ms3", "title": "SQL Queries & Indexing", "completed": False},
        {"id": "ms4", "title": "Process Scheduling & Deadlocks", "completed": False}
      ]
    },
    {
      "id": "m2",
      "title": "Full Stack Web Development",
      "description": "React.js, Node.js/Python, REST APIs & Cloud Deployment",
      "milestones": [
        {"id": "ms5", "title": "HTML5, CSS3, Tailwind & Modern ES6+", "completed": True},
        {"id": "ms6", "title": "React Hooks & State Management", "completed": True},
        {"id": "ms7", "title": "FastAPI / Express Server APIs", "completed": False},
        {"id": "ms8", "title": "Docker, Cloud Run & CI/CD", "completed": False}
      ]
    },
    {
      "id": "m3",
      "title": "Campus Placement Drill",
      "description": "Aptitude, Verbal Ability, Resume Polish & Mock Interviews",
      "milestones": [
        {"id": "ms9", "title": "Quantitative Aptitude (Speed, Distance, Ratios)", "completed": True},
        {"id": "ms10", "title": "STAR-formatted Resume Bullet Points", "completed": False},
        {"id": "ms11", "title": "3 Mock Tests Completed", "completed": False},
        {"id": "ms12", "title": "1-on-1 Senior Mentorship Review", "completed": False}
      ]
    }
  ],
  "Data Science & AI": [
    {
      "id": "ds_m1",
      "title": "Python & Mathematical Foundations",
      "description": "NumPy, Pandas, Linear Algebra & Probability",
      "milestones": [
        {"id": "ds_ms1", "title": "Python Data Analysis with Pandas & Seaborn", "completed": True},
        {"id": "ds_ms2", "title": "Descriptive & Inferential Statistics", "completed": False}
      ]
    },
    {
      "id": "ds_m2",
      "title": "Machine Learning & AI",
      "description": "Scikit-Learn, Regression, Classification & Gemini LLMs",
      "milestones": [
        {"id": "ds_ms3", "title": "Supervised Learning Models", "completed": False},
        {"id": "ds_ms4", "title": "LLM Prompting & Vector Search", "completed": False}
      ]
    }
  ],
  "Embedded & IoT Systems": [
    {
      "id": "emb_m1",
      "title": "Embedded C & Microcontrollers",
      "description": "C Programming, AVR/ARM Architecture & SPI/I2C Protocols",
      "milestones": [
        {"id": "emb_ms1", "title": "Pointers, Memory Allocation & Bit Manipulation", "completed": True},
        {"id": "emb_ms2", "title": "GPIO, Timers & Interrupt Handling", "completed": False}
      ]
    }
  ],
  "Cybersecurity": [
    {
      "id": "sec_m1",
      "title": "Network Security & Penetration Testing",
      "description": "TCP/IP, Wireshark, OWASP Top 10 & Cryptography",
      "milestones": [
        {"id": "sec_ms1", "title": "Network Packet Analysis with Wireshark", "completed": True},
        {"id": "sec_ms2", "title": "OWASP Top 10 Web Vulnerabilities", "completed": False}
      ]
    }
  ],
  "VLSI & Hardware Design": [
    {
      "id": "vlsi_m1",
      "title": "Digital Electronics & Verilog HDL",
      "description": "Combinational & Sequential Circuits, FSM & Verilog Simulation",
      "milestones": [
        {"id": "vlsi_ms1", "title": "Logic Gates & K-Map Minimization", "completed": True},
        {"id": "vlsi_ms2", "title": "Verilog Testbench Writing", "completed": False}
      ]
    }
  ]
}
