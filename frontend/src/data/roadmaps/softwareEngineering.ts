import { DomainRoadmap } from '../../types';

export const softwareEngineeringRoadmap: DomainRoadmap = {
  id: 'swe',
  name: 'Software Engineering',
  description: 'Master Core Data Structures, Algorithms, Full-Stack Web Development, System Architecture, & Object-Oriented Design for top-tier software engineering drives.',
  modules: [
    // ── FIRST YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'swe_year_1',
      title: 'First Year — Programming, CS Fundamentals & Basic DSA',
      level: 'Beginner',
      milestones: [
        {
          id: 'swe_y1_programming',
          title: 'Programming & OOP Foundations (C++ / Java / Python)',
          description: 'Master core programming fundamentals: variables, control flow, functions, memory allocation, pointers/references, and basic Object-Oriented Programming (Classes, Inheritance, Polymorphism).',
          estimatedHours: 45,
          completed: true,
          keyConcepts: ['C++ / Java', 'Pointers & Memory', 'OOP Basics', 'Control Flow', 'Functions'],
          resources: [
            { name: 'C++ Programming Masterclass', type: 'video', url: 'https://youtube.com' },
            { name: 'Java OOP Principles', type: 'doc', url: 'https://docs.oracle.com' }
          ]
        },
        {
          id: 'm1_1',
          title: 'Arrays, Strings, Two Pointers & Sliding Window',
          description: 'Learn memory alignment, basic complexity analysis (Big-O), two-pointer techniques, and sliding window patterns for array/string searching.',
          estimatedHours: 25,
          completed: true,
          keyConcepts: ['Time Complexity', 'Two Pointers', 'Sliding Window', 'In-place Mutation', 'Subarrays'],
          resources: [
            { name: 'Neetcode 150 Arrays Guide', type: 'doc', url: 'https://neetcode.io' },
            { name: 'Sliding Window Deep Dive', type: 'video', url: 'https://youtube.com' }
          ]
        },
        {
          id: 'swe_y1_git_linux',
          title: 'Git, GitHub, Command Line & Developer Tools',
          description: 'Learn Git version control fundamentals (commit, branch, merge, rebase, PRs), GitHub collaboration workflows, Linux shell commands, and IDE debugging setup.',
          estimatedHours: 20,
          completed: false,
          keyConcepts: ['Git CLI', 'GitHub Workflows', 'Linux Terminal', 'Debugging', 'Virtual Environments'],
          resources: [
            { name: 'Git & GitHub Complete Handbook', type: 'doc', url: 'https://git-scm.com' }
          ]
        },
        {
          id: 'swe_y1_web_basics',
          title: 'Web Engineering Fundamentals (HTML5, CSS3, JS ES6+)',
          description: 'Build responsive static webpages using semantic HTML, CSS Flexbox/Grid, and modern JavaScript (promises, async/await, DOM events, fetch API).',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['HTML5', 'CSS Flexbox/Grid', 'JavaScript ES6+', 'DOM API', 'Async/Await'],
          resources: [
            { name: 'MDN Web Docs JS Guide', type: 'doc', url: 'https://developer.mozilla.org' }
          ]
        },
        {
          id: 'swe_y1_projects',
          title: 'Year 1 Projects & Portfolio Building',
          description: 'Build a CLI data processing tool and a responsive personal portfolio site. Set up GitHub profile with clean code repositories and a tech-focused initial resume.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['CLI Tools', 'Personal Portfolio', 'GitHub Profile', 'Resume Foundations'],
          resources: []
        }
      ]
    },

    // ── SECOND YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'swe_year_2',
      title: 'Second Year — Advanced DSA, Databases & Full-Stack Development',
      level: 'Intermediate',
      milestones: [
        {
          id: 'm1_2',
          title: 'Linked Lists, Stacks & Queues Mastery',
          description: 'Implement singly/doubly linked lists, monotonic stack patterns for next greater element, queue via stacks, and LRU Cache.',
          estimatedHours: 30,
          completed: true,
          keyConcepts: ['Pointers', 'Monotonic Stack', 'Queue via Stacks', 'LRU Cache', 'Doubly Linked List'],
          resources: [
            { name: 'Stack Pattern Practice Set', type: 'practice', url: 'https://leetcode.com' }
          ]
        },
        {
          id: 'm1_3',
          title: 'Trees, Binary Search Trees & Heaps/Priority Queues',
          description: 'Master binary tree recursions, tree traversals (In-order, Pre-order, Post-order, Level-order), BST operations, Lowest Common Ancestor (LCA), and Heap/Priority Queue applications.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Binary Trees', 'BST', 'LCA', 'Min/Max Heaps', 'Priority Queue'],
          resources: [
            { name: 'Tree Traversal Visualizer', type: 'doc', url: 'https://geeksforgeeks.org' }
          ]
        },
        {
          id: 'm2_2',
          title: 'Database Design & SQL Querying (MySQL / PostgreSQL)',
          description: 'Master ER diagrams, 3NF Normalization, complex SQL Joins, subqueries, indexing strategies, and ACID transaction guarantees.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Normal Forms (3NF)', 'SQL Joins', 'Indexes & B-Trees', 'ACID Transactions', 'ER Modeling'],
          resources: [
            { name: 'SQL Zoo Interactive Exercises', type: 'practice', url: 'https://sqlzoo.net' }
          ]
        },
        {
          id: 'swe_y2_web_frameworks',
          title: 'Modern Full-Stack Frameworks (React, Node.js, Express)',
          description: 'Build full-stack web applications with React (hooks, state management, router) and Node.js/Express RESTful backend APIs with MongoDB/PostgreSQL ORM.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['React.js', 'Node.js', 'Express.js', 'REST APIs', 'State Management'],
          resources: [
            { name: 'React Official Documentation', type: 'doc', url: 'https://react.dev' }
          ]
        },
        {
          id: 'swe_y2_os_cn',
          title: 'Core CS: Operating Systems & Computer Networks',
          description: 'Understand Process Management, Threads, Concurrency/Deadlocks, Virtual Memory, and TCP/IP, HTTP/HTTPS, DNS, Sockets, and OSI layer architecture.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Processes vs Threads', 'Deadlocks', 'Virtual Memory', 'TCP/IP & Sockets', 'HTTP Headers'],
          resources: [
            { name: 'CS50 Computer Science Lecture Series', type: 'video', url: 'https://youtube.com' }
          ]
        },
        {
          id: 'swe_y2_projects',
          title: 'Full-Stack Project & Internship Prep',
          description: 'Develop an end-to-end full-stack web application featuring user auth (JWT), database integration, and clean API structure. Solve 150+ LeetCode problems and apply for summer software engineering internships.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Full-Stack Web App', 'JWT Authentication', 'LeetCode 150', 'Internship Prep'],
          resources: []
        }
      ]
    },

    // ── THIRD YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'swe_year_3',
      title: 'Third Year — Complex Algorithms, Low-Level System Design & Cloud',
      level: 'Advanced',
      milestones: [
        {
          id: 'swe_y3_graphs_dp',
          title: 'Graph Traversals (BFS/DFS) & Dynamic Programming',
          description: 'Master graph algorithms (Adjacency List, BFS/DFS, Dijkstra, Topological Sort, Disjoint Set Union) and Dynamic Programming patterns (1D/2D DP, Knapsack, Longest Common Subsequence, Memoization vs Tabulation).',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['BFS / DFS', 'Dijkstra Algorithm', 'Topological Sort', 'Dynamic Programming', 'Memoization'],
          resources: [
            { name: 'Striver SDE Sheet - Graphs & DP', type: 'practice', url: 'https://takeuforward.org' }
          ]
        },
        {
          id: 'm2_1',
          title: 'Java / C++ OOP Design Principles & SOLID',
          description: 'Deep dive into SOLID principles, Object-Oriented Analysis & Design (OOAD), and essential Design Patterns (Factory, Strategy, Observer, Singleton, Decorator).',
          estimatedHours: 30,
          completed: true,
          keyConcepts: ['SOLID Principles', 'Encapsulation', 'Polymorphism', 'Factory Pattern', 'Observer Pattern'],
          resources: [
            { name: 'Refactoring Guru - Design Patterns', type: 'doc', url: 'https://refactoring.guru' }
          ]
        },
        {
          id: 'm3_1',
          title: 'Low-Level System Design (LLD) & Clean Architecture',
          description: 'Design extensible systems with UML class diagrams: Parking Lot, Elevator System, Rate Limiter, and Tic-Tac-Toe following clean code and design pattern principles.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['UML Class Diagrams', 'LLD Case Studies', 'Clean Architecture', 'Extensibility', 'Design Patterns'],
          resources: [
            { name: 'LLD Interview Primer & System Coding', type: 'doc', url: 'https://github.com' }
          ]
        },
        {
          id: 'swe_y3_cloud_devops',
          title: 'Docker, CI/CD Pipelines & Cloud Basics (AWS / GCP)',
          description: 'Containerize multi-service applications using Docker Compose, set up automated CI/CD pipelines via GitHub Actions, and deploy web applications to cloud servers (AWS EC2 / S3 / Render).',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Docker Compose', 'CI/CD Pipelines', 'GitHub Actions', 'AWS EC2 / S3', 'Nginx Reverse Proxy'],
          resources: [
            { name: 'Docker & DevOps Crash Course', type: 'video', url: 'https://youtube.com' }
          ]
        },
        {
          id: 'swe_y3_capstone',
          title: 'Production Software Capstone & Internship Drive',
          description: 'Build a production-grade software system (e.g., real-time chat/collaborative platform with WebSockets or microservices). Secure a software engineering internship and refine technical resume.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['Production SaaS App', 'WebSockets / Async', 'Cloud Deployment', 'Technical Resume', 'SWE Internship'],
          resources: []
        }
      ]
    },

    // ── FOURTH YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'swe_year_4',
      title: 'Fourth Year — High-Level System Design, Placement Drive & Interview Prep',
      level: 'Advanced',
      milestones: [
        {
          id: 'swe_y4_hld',
          title: 'High-Level Distributed System Design (HLD)',
          description: 'Architect scalable web systems: Load Balancers, Distributed Caching (Redis), Message Queues (Kafka/RabbitMQ), Database Sharding & Replication, Rate Limiters, and CAP Theorem trade-offs.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Load Balancing', 'Distributed Caching', 'Message Queues', 'Database Sharding', 'CAP Theorem'],
          resources: [
            { name: 'System Design Primer', type: 'doc', url: 'https://github.com/donnemartin/system-design-primer' }
          ]
        },
        {
          id: 'swe_y4_interview_dsa',
          title: 'Intensive DSA & Speed Coding Round Preparation',
          description: 'Master NeetCode 150 / Blind 75, speed solving, timed mock coding tests (TCS, Infosys, Amazon, Google drive patterns), and edge case handling under pressure.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['Blind 75', 'NeetCode 150', 'Speed Coding', 'Timed Mock Drives', 'Edge Case Handling'],
          resources: [
            { name: 'LeetCode Company Specific Questions', type: 'practice', url: 'https://leetcode.com' }
          ]
        },
        {
          id: 'swe_y4_core_cs_revision',
          title: 'Core CS Revision (DBMS, OS, CN) & HR Preparation',
          description: 'Thorough revision of standard interview questions in DBMS (Transactions, Indexing), OS (Concurrency, Memory), CN (TCP/IP handshake, DNS lookup), and behavioral STAR method responses.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['DBMS Interview Questions', 'OS Concurrency Questions', 'CN TCP/IP Tracing', 'Behavioral STAR Method'],
          resources: []
        },
        {
          id: 'swe_y4_capstone',
          title: 'Final Capstone Project & Placement Drive Readiness',
          description: 'Complete and document a enterprise-ready software engineering capstone project with live URL, GitHub repo, architecture diagram, unit tests, and performance benchmark. Conduct 10+ mock technical interviews.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['Enterprise Capstone', 'Architecture Diagram', 'Live Demo', 'Mock Interviews', 'Placement Readiness'],
          resources: []
        }
      ]
    }
  ]
};
