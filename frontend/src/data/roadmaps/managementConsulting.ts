import { DomainRoadmap } from '../../types';

export const managementConsultingRoadmap: DomainRoadmap = {
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
};
