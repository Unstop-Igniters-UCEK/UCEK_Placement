import { DomainRoadmap } from '../../types';

export const dataAnalyticsBIRoadmap: DomainRoadmap = {
  id: 'data_analytics_bi',
  name: 'Data Analytics & BI',
  description: 'Master Excel, SQL, Power BI, Python/Pandas, and Data Storytelling to build actionable dashboards and drive business decisions.',
  modules: [
    // ── FIRST YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'analytics_year_1',
      title: 'First Year — Foundations',
      level: 'Beginner',
      milestones: [
        {
          id: 'analytics_y1_excel',
          title: 'Excel & Spreadsheet Analytics',
          description: 'Master Excel formulas, XLOOKUP/VLOOKUP, pivot tables, charts, and basic data cleaning techniques.',
          estimatedHours: 25,
          completed: false,
          keyConcepts: ['Excel', 'XLOOKUP / VLOOKUP', 'Pivot Tables', 'Charts', 'Data Cleaning'],
          resources: []
        },
        {
          id: 'analytics_y1_sql',
          title: 'SQL Foundations',
          description: 'Learn SQL fundamentals: SELECT, filtering, aggregation, JOINs, and subqueries.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['SQL', 'SELECT', 'Aggregation', 'JOINs', 'Subqueries'],
          resources: []
        },
        {
          id: 'analytics_y1_python_stats',
          title: 'Python, Pandas & Statistics Basics',
          description: 'Introduction to Python and Pandas. Learn basic statistics and data visualization. Get started with Git/GitHub for portfolio management.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Python', 'Pandas', 'Basic Statistics', 'Data Visualization', 'Git/GitHub'],
          resources: []
        },
        {
          id: 'analytics_y1_projects',
          title: 'Introductory Analytics Projects',
          description: 'Build a student performance dashboard, conduct retail/sales Excel analysis, and perform SQL analysis on a public dataset. Start a GitHub portfolio and basic resume.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Dashboards', 'Excel Analysis', 'SQL Analysis', 'Portfolio', 'Resume'],
          resources: []
        }
      ]
    },

    // ── SECOND YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'analytics_year_2',
      title: 'Second Year — Applied Skills',
      level: 'Intermediate',
      milestones: [
        {
          id: 'analytics_y2_advanced_sql',
          title: 'Advanced SQL',
          description: 'Master advanced SQL concepts including CTEs, window functions, CASE expressions, and query optimization basics.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Advanced SQL', 'CTEs', 'Window Functions', 'CASE Expressions', 'Query Optimization'],
          resources: []
        },
        {
          id: 'analytics_y2_power_bi',
          title: 'Power BI & Data Modelling',
          description: 'Learn Power BI, Power Query, data models, relationships, DAX measures, and interactive dashboard design.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Power BI', 'Power Query', 'Data Models', 'Relationships', 'DAX Measures'],
          resources: []
        },
        {
          id: 'analytics_y2_python_stats',
          title: 'Python Analytics & Statistics',
          description: 'Deepen Python skills with Pandas, NumPy, and Matplotlib/Seaborn for data cleaning and automation. Learn statistics: distributions, correlation, sampling, confidence intervals, and A/B-test basics.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Pandas / NumPy', 'Matplotlib / Seaborn', 'Distributions', 'Correlation', 'A/B Testing Basics'],
          resources: []
        },
        {
          id: 'analytics_y2_business',
          title: 'Business Thinking & Storytelling',
          description: 'Develop business acumen: define questions, select metrics, explain insights, and provide recommendations.',
          estimatedHours: 25,
          completed: false,
          keyConcepts: ['Business Questions', 'Metric Selection', 'Insights', 'Recommendations'],
          resources: []
        },
        {
          id: 'analytics_y2_projects',
          title: 'Analytics Projects & Portfolio',
          description: 'Build an e-commerce sales and cohort analysis, a marketing funnel/retention dashboard, and a finance/operations KPI dashboard. Maintain a SQL practice log and update your resume.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Cohort Analysis', 'Funnel Dashboard', 'KPI Dashboard', 'SQL Practice', 'Portfolio'],
          resources: []
        }
      ]
    },

    // ── THIRD YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'analytics_year_3',
      title: 'Third Year — Production & Advanced Skills',
      level: 'Advanced',
      milestones: [
        {
          id: 'analytics_y3_advanced_power_bi',
          title: 'Advanced Power BI',
          description: 'Master star schemas, advanced DAX patterns, row-level security, and publishing workflows. Optional exposure to Tableau or Looker.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Star Schemas', 'Advanced DAX', 'Row-Level Security', 'Publishing Workflows'],
          resources: []
        },
        {
          id: 'analytics_y3_analytics_engineering',
          title: 'Analytics Engineering & ETL',
          description: 'Learn analytics engineering basics: ETL/ELT pipelines, data warehouses, and dimensional modelling. Implement Python automation for reproducible analysis.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Analytics Engineering', 'ETL / ELT', 'Data Warehouses', 'Dimensional Modelling', 'Python Automation'],
          resources: []
        },
        {
          id: 'analytics_y3_product_analytics',
          title: 'Product Analytics',
          description: 'Focus on product analytics: analyze funnels, cohorts, retention, and experimentation.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Product Analytics', 'Funnels', 'Cohorts', 'Retention', 'Experimentation'],
          resources: []
        },
        {
          id: 'analytics_y3_projects',
          title: 'Decision-Oriented Analytics Portfolio',
          description: 'Complete an end-to-end analytics project (raw data → cleaning → SQL → model → Power BI → recommendations), a product analytics case study, and an automated reporting pipeline. Target an internship or real-world project.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['End-to-End Analytics', 'Product Case Study', 'Automated Reporting', 'Business Narratives', 'Internship'],
          resources: []
        }
      ]
    },

    // ── FOURTH YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'analytics_year_4',
      title: 'Fourth Year — Placement Readiness',
      level: 'Advanced',
      milestones: [
        {
          id: 'analytics_y4_interview_prep',
          title: 'Advanced SQL & Case Study Prep',
          description: 'Prepare for advanced SQL interviews and timed assessments. Work through Power BI case studies and dashboard redesign exercises.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Advanced SQL Interviews', 'Timed Assessments', 'Power BI Case Studies', 'Dashboard Redesign'],
          resources: []
        },
        {
          id: 'analytics_y4_business_storytelling',
          title: 'Business Cases & Data Storytelling',
          description: 'Practice business case interviews, data storytelling, statistics interpretation, and experiment interpretation.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Business Case Interviews', 'Data Storytelling', 'Statistics Interpretation', 'Experiment Interpretation'],
          resources: []
        },
        {
          id: 'analytics_y4_placement',
          title: 'Analytics Capstone & Placement Readiness',
          description: 'Deliver a business problem capstone with messy data, reproducible analysis, executive dashboards, and recommendations. Finalize a one-page resume, 4-6 polished portfolio projects, and mock interviews.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['Business Capstone', 'Executive Dashboard', 'One-Page Resume', 'Polished Portfolio', 'Mock Interviews'],
          resources: []
        }
      ]
    }
  ]
};
