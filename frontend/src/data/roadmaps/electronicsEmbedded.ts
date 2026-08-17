import { DomainRoadmap } from '../../types';

export const electronicsEmbeddedRoadmap: DomainRoadmap = {
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
};
