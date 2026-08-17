import { DomainRoadmap } from '../../types';

export const dataScienceAIRoadmap: DomainRoadmap = {
  id: 'ds_ai',
  name: 'Data Science & AI',
  description: 'Build demonstrable ML/AI skills from Python foundations to production LLM systems, targeting ML Engineer, AI Engineer, Applied AI, GenAI and MLOps roles.',
  modules: [
    // ── FIRST YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'ds_ai_year_1',
      title: 'First Year — Programming & Math Foundations',
      level: 'Beginner',
      milestones: [
        {
          id: 'ds_ai_y1_python',
          title: 'Python Programming Foundations',
          description: 'Master Python fundamentals including variables, control flow, functions, collections, file I/O, exceptions, modules, and basic OOP. Build small CLI utilities and develop a habit of clean, readable code.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['Python', 'Functions', 'OOP Basics', 'File I/O', 'Exceptions'],
          resources: []
        },
        {
          id: 'ds_ai_y1_git_linux',
          title: 'Git, Linux & Development Workflow',
          description: 'Learn Git/GitHub for version control, Linux command line basics, virtual environments, and package management. Establish a well-organised GitHub profile with README-driven repositories.',
          estimatedHours: 20,
          completed: false,
          keyConcepts: ['Git', 'GitHub', 'Linux CLI', 'Virtual Environments', 'pip'],
          resources: []
        },
        {
          id: 'ds_ai_y1_sql',
          title: 'SQL & Data Foundations',
          description: 'Learn SQL fundamentals and relational database concepts. Write SELECT queries, filtering, aggregation, JOINs, and subqueries to extract and manipulate structured data.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['SQL', 'Relational Databases', 'JOINs', 'Aggregation', 'Subqueries'],
          resources: []
        },
        {
          id: 'ds_ai_y1_math_stats',
          title: 'Math & Statistics Foundations',
          description: 'Build foundations in algebra, functions, probability basics, descriptive statistics, and introductory linear algebra. These underpin all machine learning theory.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Probability', 'Descriptive Statistics', 'Linear Algebra', 'Algebra', 'Functions'],
          resources: []
        },
        {
          id: 'ds_ai_y1_data_tools',
          title: 'NumPy, Pandas & Data Exploration',
          description: 'Learn NumPy for numerical computing and Pandas for DataFrame operations. Perform basic data visualisation and exploratory analysis on real datasets.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['NumPy', 'Pandas', 'Data Visualisation', 'DataFrames', 'EDA'],
          resources: []
        },
        {
          id: 'ds_ai_y1_portfolio',
          title: 'Year 1 Projects & Portfolio',
          description: 'Complete a student-performance data-analysis project, a small prediction project on a public dataset, and a Python CLI utility. Maintain 100+ Python exercises, 2–3 documented GitHub projects, and a basic resume.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Data Analysis Project', 'Prediction Project', 'GitHub Portfolio', 'Resume'],
          resources: []
        }
      ]
    },

    // ── SECOND YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'ds_ai_year_2',
      title: 'Second Year — Applied Machine Learning',
      level: 'Intermediate',
      milestones: [
        {
          id: 'ds_ai_y2_data_prep',
          title: 'Data Preparation & Feature Engineering',
          description: 'Master data cleaning, feature engineering, train/validation/test splits, and preventing data leakage. Handle missing values, categorical encoding, and feature scaling for production-quality datasets.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Data Cleaning', 'Feature Engineering', 'Train/Val/Test Splits', 'Data Leakage'],
          resources: []
        },
        {
          id: 'ds_ai_y2_ml',
          title: 'Classical Machine Learning',
          description: 'Learn scikit-learn for regression, classification, decision trees, ensembles, and clustering. Understand model evaluation metrics, cross-validation, and systematic error analysis.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['scikit-learn', 'Regression', 'Classification', 'Ensembles', 'Clustering'],
          resources: []
        },
        {
          id: 'ds_ai_y2_stats',
          title: 'Statistics & Experimentation',
          description: 'Study distributions, correlation, hypothesis testing, and experiment design basics including A/B testing concepts. Apply statistical reasoning to validate model results.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Distributions', 'Hypothesis Testing', 'Correlation', 'A/B Testing'],
          resources: []
        },
        {
          id: 'ds_ai_y2_pytorch',
          title: 'Deep Learning Foundations with PyTorch',
          description: 'Learn PyTorch fundamentals: tensors, datasets, dataloaders, training loops, and building neural networks. Implement basic NLP or computer-vision projects.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['PyTorch', 'Tensors', 'Neural Networks', 'Training Loops', 'Datasets'],
          resources: []
        },
        {
          id: 'ds_ai_y2_api_docker',
          title: 'ML APIs, Testing & Docker',
          description: 'Build REST APIs with FastAPI for model serving. Learn database basics, automated testing, and Docker introduction. Deploy an end-to-end ML project with preprocessing, training, evaluation, and API deployment.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['FastAPI', 'REST APIs', 'Docker', 'Testing', 'Model Deployment'],
          resources: []
        },
        {
          id: 'ds_ai_y2_portfolio',
          title: 'Year 2 Portfolio & Internship Preparation',
          description: 'Build 2 solid ML projects with reproducible setup, documented metrics, and error analysis. Complete an NLP/CV project and an analytics/recommendation project. Accumulate 150–250 DSA problems and begin internship applications.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['End-to-End ML Project', 'NLP/CV Project', 'DSA Practice', 'Internship Applications'],
          resources: []
        }
      ]
    },

    // ── THIRD YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'ds_ai_year_3',
      title: 'Third Year — Production AI Engineering',
      level: 'Advanced',
      milestones: [
        {
          id: 'ds_ai_y3_deep_learning',
          title: 'Advanced Deep Learning',
          description: 'Go deeper with PyTorch: transfer learning, fine-tuning pretrained models, and experiment tracking. Understand responsible AI principles and bias mitigation.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Transfer Learning', 'Experiment Tracking', 'Fine-Tuning', 'Responsible AI'],
          resources: []
        },
        {
          id: 'ds_ai_y3_llm',
          title: 'LLM Foundations',
          description: 'Understand LLM fundamentals: tokens, embeddings, context windows, prompting techniques, and structured outputs. Learn to integrate LLM APIs into applications effectively.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['LLMs', 'Tokens & Embeddings', 'Prompting', 'Structured Outputs', 'API Integration'],
          resources: []
        },
        {
          id: 'ds_ai_y3_rag',
          title: 'RAG & Vector Retrieval',
          description: 'Build production-style RAG systems: document ingestion, chunking strategies, embedding generation, vector databases, retrieval, reranking, citations, and evaluation dashboards.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['RAG', 'Vector Databases', 'Embeddings', 'Chunking', 'Retrieval & Reranking'],
          resources: []
        },
        {
          id: 'ds_ai_y3_mlops',
          title: 'MLOps, CI/CD & Cloud Deployment',
          description: 'Learn Docker, CI/CD basics, cloud deployment, logging, monitoring, and MLflow for experiment tracking. Deploy a domain ML system through an API with Docker on one cloud platform.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Docker', 'CI/CD', 'Cloud Deployment', 'MLflow', 'Monitoring'],
          resources: []
        },
        {
          id: 'ds_ai_y3_capstone',
          title: 'Production Capstone & Internship',
          description: 'Build a production-style RAG application with evaluation dashboard. Complete a team project with cloud deployment, authentication, and monitoring. Secure an internship or real-world AI project. Maintain a cloud deployment demo and an AI/ML-targeted resume.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['RAG Application', 'Cloud Deployment', 'Team Project', 'Internship', 'AI/ML Resume'],
          resources: []
        }
      ]
    },

    // ── FOURTH YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'ds_ai_year_4',
      title: 'Fourth Year — Placement Readiness',
      level: 'Advanced',
      milestones: [
        {
          id: 'ds_ai_y4_system_design',
          title: 'ML System Design',
          description: 'Design end-to-end ML systems covering data ingestion, training pipelines, model serving, monitoring, and retraining strategies. Prepare for ML system-design interview questions.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['ML Pipelines', 'Model Serving', 'Monitoring', 'Retraining', 'System Design'],
          resources: []
        },
        {
          id: 'ds_ai_y4_llm_eng',
          title: 'LLM Application Engineering',
          description: 'Build advanced LLM applications: RAG at scale, appropriate tool use and agents, evaluation frameworks, and cost/latency trade-offs for production GenAI systems.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['RAG at Scale', 'AI Agents', 'Evaluation', 'Cost/Latency Trade-offs'],
          resources: []
        },
        {
          id: 'ds_ai_y4_mlops',
          title: 'MLOps & LLMOps',
          description: 'Master experiment tracking, model registry, CI/CD for ML, and observability. Understand one cloud platform at working level including security and secrets management.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Experiment Tracking', 'Model Registry', 'CI/CD for ML', 'Observability', 'Cloud Security'],
          resources: []
        },
        {
          id: 'ds_ai_y4_interview',
          title: 'AI/ML Interview Preparation',
          description: 'Prepare for ML theory, Python, SQL, DSA, and system-design interviews. Revise core CS fundamentals (OOP, DBMS, OS, CN). Prepare 5–10 project deep-dive stories and complete 8–12 mock interviews.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['ML Theory', 'DSA', 'SQL', 'System Design', 'Mock Interviews'],
          resources: []
        },
        {
          id: 'ds_ai_y4_capstone',
          title: 'Final Capstone & Placement Readiness',
          description: 'Deliver a real-world AI capstone: data pipeline → model/LLM integration → API → deployment → evaluation → monitoring. Polish GitHub portfolio and one-page resume. Be able to live-demo projects and explain architecture, trade-offs, and improvements.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['AI Capstone', 'Portfolio', 'One-Page Resume', 'Live Demo', 'Interview Stories'],
          resources: []
        }
      ]
    }
  ]
};
