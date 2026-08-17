import { DomainRoadmap } from '../../types';

export const backendCloudRoadmap: DomainRoadmap = {
  id: 'devops',
  name: 'Backend & Cloud Engineering',
  description: 'Master Python/Java, FastAPI/Django, PostgreSQL, Cloud (AWS/GCP/Azure), and DevOps to build scalable, secure, and highly available systems.',
  modules: [
    // ── FIRST YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'backend_year_1',
      title: 'First Year — Foundations',
      level: 'Beginner',
      milestones: [
        {
          id: 'backend_y1_programming',
          title: 'Programming & OOP Foundations',
          description: 'Master Python or Java fundamentals including functions, OOP, exceptions, modules, and clean code principles. Regular coding practice is essential.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Python / Java', 'OOP', 'Functions', 'Exceptions', 'Clean Code'],
          resources: []
        },
        {
          id: 'backend_y1_git_linux',
          title: 'Git, Linux & Networking Basics',
          description: 'Learn Git/GitHub for version control, Linux terminal commands, and basic networking concepts (TCP/IP, DNS, HTTP/HTTPS, routing). Learn basic HTML/CSS to understand web clients.',
          estimatedHours: 25,
          completed: false,
          keyConcepts: ['Git & GitHub', 'Linux Terminal', 'Networking Basics', 'HTML/CSS Basics'],
          resources: []
        },
        {
          id: 'backend_y1_sql',
          title: 'SQL & Relational Databases',
          description: 'Understand relational database fundamentals and learn to write efficient SQL queries.',
          estimatedHours: 25,
          completed: false,
          keyConcepts: ['SQL', 'Relational Databases', 'Queries'],
          resources: []
        },
        {
          id: 'backend_y1_dsa',
          title: 'DSA & Problem Solving',
          description: 'Build a strong foundation in Data Structures and Algorithms with a focus on consistent problem-solving discipline.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Data Structures', 'Algorithms', 'Problem Solving Discipline'],
          resources: []
        },
        {
          id: 'backend_y1_projects',
          title: 'Foundation Backend Projects',
          description: 'Build a CLI expense/task manager with file persistence, a simple CRUD application, and a small HTTP/API client project. Maintain a GitHub profile with 2-3 repositories and create a basic resume.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['CLI Apps', 'File Persistence', 'CRUD Operations', 'HTTP Client', 'GitHub Portfolio'],
          resources: []
        }
      ]
    },

    // ── SECOND YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'backend_year_2',
      title: 'Second Year — Applied Skills',
      level: 'Intermediate',
      milestones: [
        {
          id: 'backend_y2_api',
          title: 'FastAPI / Django Foundations & REST',
          description: 'Learn FastAPI or Django, routing, request validation, ORM, REST conventions, and API documentation (OpenAPI/Swagger).',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['FastAPI / Django', 'Routing', 'Validation', 'REST API Design', 'OpenAPI/Swagger'],
          resources: []
        },
        {
          id: 'backend_y2_postgresql',
          title: 'PostgreSQL & Database Engineering',
          description: 'Master PostgreSQL: schema design, indexes, joins, ACID transactions, and query optimization basics.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['PostgreSQL', 'Schema Design', 'Indexes', 'Transactions', 'Query Optimization'],
          resources: []
        },
        {
          id: 'backend_y2_auth_testing',
          title: 'Auth, Testing & Config',
          description: 'Implement authentication/authorization (JWT, OAuth concepts), secure password handling, and permissions. Learn automated testing, logging, configuration, and environment variables.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Authentication', 'JWT / OAuth', 'Automated Testing', 'Logging', 'Environment Variables'],
          resources: []
        },
        {
          id: 'backend_y2_docker',
          title: 'Docker & API Deployment',
          description: 'Learn Docker basics, containerize applications, and deploy APIs.',
          estimatedHours: 25,
          completed: false,
          keyConcepts: ['Docker', 'Containerization', 'API Deployment'],
          resources: []
        },
        {
          id: 'backend_y2_projects',
          title: 'Backend Projects & Internship Prep',
          description: 'Build an authenticated project-management API with role-based access, an e-commerce backend with PostgreSQL, and integrate a third-party API. Ensure API documentation, tests, and Dockerization are included. Deploy one project.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Authenticated APIs', 'Role-Based Access', 'Third-Party Integration', 'Deployed Project'],
          resources: []
        }
      ]
    },

    // ── THIRD YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'backend_year_3',
      title: 'Third Year — Production & Advanced Skills',
      level: 'Advanced',
      milestones: [
        {
          id: 'backend_y3_async_caching',
          title: 'Async Programming, Caching & Queues',
          description: 'Learn asynchronous programming, implement caching with Redis, and use background jobs and message queues for event-driven architectures.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Async Programming', 'Redis', 'Caching', 'Background Jobs', 'Message Queues'],
          resources: []
        },
        {
          id: 'backend_y3_cloud',
          title: 'Cloud Fundamentals (AWS/GCP/Azure)',
          description: 'Master core cloud services on one primary provider (AWS, GCP, or Azure). Learn networking basics, IAM, compute, storage, and managed databases.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Cloud Services', 'IAM', 'Compute', 'Storage', 'Managed Databases'],
          resources: []
        },
        {
          id: 'backend_y3_cicd_monitoring',
          title: 'CI/CD, Monitoring & Observability',
          description: 'Implement CI/CD pipelines using GitHub Actions. Setup monitoring, logging, health checks, and error tracking.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['CI/CD', 'GitHub Actions', 'Monitoring', 'Logging', 'Health Checks'],
          resources: []
        },
        {
          id: 'backend_y3_microservices',
          title: 'Microservices & System Design Foundations',
          description: 'Understand microservices concepts, messaging, and system-design fundamentals. Learn basic Kubernetes (after mastering Docker and cloud).',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Microservices', 'Messaging', 'System Design', 'Kubernetes Basics'],
          resources: []
        },
        {
          id: 'backend_y3_projects',
          title: 'Production Backend Project',
          description: 'Build a production-style SaaS backend featuring auth, payment mocks, background jobs, caching, and monitoring. Create an event-driven service using a queue/message broker. Deploy to cloud with CI/CD and architecture diagrams. Target backend-specific internships.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['SaaS Backend', 'Payments Integration', 'Event-Driven Services', 'Cloud CI/CD', 'Architecture Diagrams'],
          resources: []
        }
      ]
    },

    // ── FOURTH YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'backend_year_4',
      title: 'Fourth Year — Placement Readiness',
      level: 'Advanced',
      milestones: [
        {
          id: 'backend_y4_system_design',
          title: 'Scalable Backend System Design',
          description: 'Master scalability, load balancing, caching strategies, database scaling, queues, consistency, and failure handling.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Scalability', 'Load Balancing', 'Database Scaling', 'Consistency', 'Failure Handling'],
          resources: []
        },
        {
          id: 'backend_y4_security_performance',
          title: 'Performance, Security & Cloud Troubleshooting',
          description: 'Learn performance profiling, indexing, API latency reduction, and basic load testing. Understand OWASP basics, secrets management, access control, and secure API practices. Practice cloud troubleshooting.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Performance Profiling', 'Load Testing', 'OWASP Security', 'Secrets Management', 'Cloud Troubleshooting'],
          resources: []
        },
        {
          id: 'backend_y4_interview_prep',
          title: 'CS, DSA & System Design Interview Prep',
          description: 'Intensive interview preparation covering Python/Java, OOP, DSA, REST API design, SQL indexes/transactions, authentication, Docker, CI/CD, cloud basics, and caching/queues. Revise core CS (DBMS, OS, CN).',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['DSA', 'REST/API Design', 'System Design Interviews', 'Core CS Fundamentals'],
          resources: []
        },
        {
          id: 'backend_y4_placement',
          title: 'Capstone & Placement Readiness',
          description: 'Deliver a capstone backend platform with documented architecture, tests, CI/CD, cloud deployment, and observability. Prepare a one-page resume, clean GitHub, live demos, and complete mock interviews.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Capstone Platform', 'Live Demo', 'Targeted Resume', 'Mock Interviews', 'Placement Readiness'],
          resources: []
        }
      ]
    }
  ]
};
