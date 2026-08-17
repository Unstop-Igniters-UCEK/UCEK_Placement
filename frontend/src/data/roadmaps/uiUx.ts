import { DomainRoadmap } from '../../types';

export const uiUxRoadmap: DomainRoadmap = {
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
};
