import { DomainRoadmap } from '../../types';

export const cybersecurityRoadmap: DomainRoadmap = {
  id: 'cybersecurity',
  name: 'Cybersecurity & SOC',
  description: 'Master Networking, Linux, Cloud Security, SIEM, and Incident Response to become a placement-ready Security Operations Center (SOC) Analyst or Security Engineer.',
  modules: [
    // ── FIRST YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'cyber_year_1',
      title: 'First Year — OS & Networking Foundations',
      level: 'Beginner',
      milestones: [
        {
          id: 'cyber_y1_networking',
          title: 'Computer Networks',
          description: 'Learn foundational networking concepts including TCP/IP, DNS, HTTP/HTTPS, routing, ports, NAT, and common protocols.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['TCP/IP', 'DNS', 'HTTP/HTTPS', 'Routing', 'Ports & NAT'],
          resources: []
        },
        {
          id: 'cyber_y1_linux_windows',
          title: 'Linux & Windows Administration',
          description: 'Master the Linux command line, file permissions, processes, and basic shell scripting. Understand Windows fundamentals and basic system administration.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Linux CLI', 'File Permissions', 'Shell Scripting', 'Windows Administration'],
          resources: []
        },
        {
          id: 'cyber_y1_programming',
          title: 'Python & Git Basics',
          description: 'Learn Python basics for automation tasks and Git/GitHub for version control and portfolio management.',
          estimatedHours: 25,
          completed: false,
          keyConcepts: ['Python Automation', 'Git', 'GitHub'],
          resources: []
        },
        {
          id: 'cyber_y1_security_basics',
          title: 'Security Concepts & Ethics',
          description: 'Understand core security concepts: the CIA triad, authentication, authorization, common attack categories, and ethical considerations for lab work.',
          estimatedHours: 20,
          completed: false,
          keyConcepts: ['CIA Triad', 'Authentication / Authorization', 'Attack Categories', 'Security Ethics'],
          resources: []
        },
        {
          id: 'cyber_y1_projects',
          title: 'Foundation Security Projects',
          description: 'Complete a network traffic/log analysis report using a safe dataset, a Linux administration mini-lab, and a Python log parser. Maintain networking lab records and a basic resume.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Network Traffic Analysis', 'Linux Lab', 'Python Log Parser', 'Lab Documentation', 'Resume'],
          resources: []
        }
      ]
    },

    // ── SECOND YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'cyber_year_2',
      title: 'Second Year — Defensive Security & Testing',
      level: 'Intermediate',
      milestones: [
        {
          id: 'cyber_y2_packet_analysis',
          title: 'Wireshark & Packet Analysis',
          description: 'Master Wireshark for network packet analysis and TCP/IP troubleshooting.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Wireshark', 'Packet Analysis', 'TCP/IP Troubleshooting'],
          resources: []
        },
        {
          id: 'cyber_y2_web_security',
          title: 'Web Security & Vulnerability Assessment',
          description: 'Learn web security fundamentals (HTTP, sessions, authentication), OWASP Top 10 concepts, and vulnerability assessment methodologies within safe lab environments.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Web Security', 'OWASP Top 10', 'Vulnerability Assessment'],
          resources: []
        },
        {
          id: 'cyber_y2_siem_incident',
          title: 'SIEM Concepts & Basic Triage',
          description: 'Understand SIEM concepts, log sources, security alerts, and basic incident triage processes.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['SIEM', 'Log Sources', 'Security Alerts', 'Incident Triage'],
          resources: []
        },
        {
          id: 'cyber_y2_automation',
          title: 'Security Automation',
          description: 'Utilize Python and Bash for automating repetitive defensive tasks such as log parsing and alert enrichment.',
          estimatedHours: 30,
          completed: false,
          keyConcepts: ['Python Automation', 'Bash Scripting', 'Alert Enrichment'],
          resources: []
        },
        {
          id: 'cyber_y2_projects',
          title: 'Defensive Lab Projects',
          description: 'Build a home/lab SOC simulation with synthetic logs, a web-security learning lab in an intentionally vulnerable environment, and a security automation script. Maintain incident write-ups and apply for internships.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['SOC Simulation', 'Web-Security Lab', 'Incident Write-ups', 'Internship Applications'],
          resources: []
        }
      ]
    },

    // ── THIRD YEAR ──────────────────────────────────────────────────────────────
    {
      id: 'cyber_year_3',
      title: 'Third Year — SOC & Cloud Security',
      level: 'Advanced',
      milestones: [
        {
          id: 'cyber_y3_siem_workflow',
          title: 'SIEM Workflow & Detection Engineering',
          description: 'Master the SIEM workflow: log collection, parsing, correlation, crafting detection rules, and alert triage. Learn threat intelligence basics and security monitoring.',
          estimatedHours: 45,
          completed: false,
          keyConcepts: ['SIEM Workflow', 'Correlation Rules', 'Detection Engineering', 'Threat Intelligence'],
          resources: []
        },
        {
          id: 'cyber_y3_incident_response',
          title: 'Incident Response & Evidence Handling',
          description: 'Learn the complete incident response lifecycle and proper evidence handling procedures.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Incident Response Lifecycle', 'Evidence Handling', 'Playbooks'],
          resources: []
        },
        {
          id: 'cyber_y3_iam_cloud',
          title: 'IAM & Cloud Security Fundamentals',
          description: 'Understand identity and access management (IAM), the principle of least privilege, cloud fundamentals, and cloud security controls.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['IAM', 'Least Privilege', 'Cloud Security Controls', 'Cloud Fundamentals'],
          resources: []
        },
        {
          id: 'cyber_y3_projects',
          title: 'SOC & Cloud Security Portfolio',
          description: 'Build a mini SOC dashboard with detection rules/playbooks, configure a cloud security lab in a personal sandbox, and complete a threat-detection case study. Target a security internship.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['Mini SOC Dashboard', 'Cloud Security Lab', 'Threat Detection Case Study', 'Security Internship'],
          resources: []
        }
      ]
    },

    // ── FOURTH YEAR ─────────────────────────────────────────────────────────────
    {
      id: 'cyber_year_4',
      title: 'Fourth Year — Placement Readiness',
      level: 'Advanced',
      milestones: [
        {
          id: 'cyber_y4_advanced_incident',
          title: 'Advanced Incident Scenarios & Tuning',
          description: 'Handle advanced incident scenarios, detection tuning, root-cause analysis, and security automation.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Advanced Incident Scenarios', 'Detection Tuning', 'Root-Cause Analysis', 'Security Automation'],
          resources: []
        },
        {
          id: 'cyber_y4_risk_arch',
          title: 'Cloud Architecture & Risk Communication',
          description: 'Master cloud security architecture basics and IAM. Practice risk/vulnerability prioritization and remediation communication.',
          estimatedHours: 35,
          completed: false,
          keyConcepts: ['Cloud Security Architecture', 'Risk Prioritization', 'Remediation Communication'],
          resources: []
        },
        {
          id: 'cyber_y4_interview_prep',
          title: 'Security Interview Preparation',
          description: 'Prepare for interviews covering networking, Linux, security fundamentals, SIEM, and scenario-based incident response. Revise core CS fundamentals.',
          estimatedHours: 40,
          completed: false,
          keyConcepts: ['Networking Interviews', 'Linux Interviews', 'SIEM Scenarios', 'CS Fundamentals'],
          resources: []
        },
        {
          id: 'cyber_y4_placement',
          title: 'Defensive Capstone & Placement Readiness',
          description: 'Deliver an end-to-end defensive monitoring lab (logs → detections → alerts → triage → incident report → remediation) as a capstone. Prepare a one-page resume, GitHub portfolio, and incident-response stories for mock interviews.',
          estimatedHours: 50,
          completed: false,
          keyConcepts: ['End-to-End Monitoring Lab', 'Targeted Resume', 'Incident-Response Stories', 'Mock Interviews'],
          resources: []
        }
      ]
    }
  ]
};
