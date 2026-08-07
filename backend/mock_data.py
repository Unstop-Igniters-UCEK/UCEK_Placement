# Python mock data for UCEK Unstop Igniters Placement Platform

INITIAL_QUESTIONS = []

INITIAL_MOCK_TESTS = []

INITIAL_INTERVIEW_QUESTIONS = [
  {
    "id": "iq1",
    "question": "Tell me about a challenging project you built during your B.Tech course at UCEK and how you solved a major technical bottleneck.",
    "category": "Behavioral",
    "recommendedKeywords": ["architecture", "bottleneck", "optimization", "teamwork", "solution", "result"]
  },
  {
    "id": "iq2",
    "question": "Explain the difference between SQL and NoSQL databases. When would you choose Firestore over PostgreSQL for a campus project?",
    "category": "Technical",
    "recommendedKeywords": ["ACID", "relational", "document", "schema", "scalability", "indexing"]
  },
  {
    "id": "iq3",
    "question": "How do you handle deadline pressures during campus placement drives when balancing end-semester exams?",
    "category": "HR",
    "recommendedKeywords": ["prioritization", "time management", "focus", "consistency", "planning"]
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
