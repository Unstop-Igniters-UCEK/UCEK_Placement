import { DomainRoadmap } from '../../types';

export const vlsiRoadmap: DomainRoadmap = {
  id: 'vlsi',
  name: 'VLSI & Chip Design',
  description: 'Verilog HDL, CMOS Digital Design, Synthesis, STA (Static Timing Analysis), & FPGA Prototyping.',
  modules: [
    {
      id: 'vlsi_mod_1',
      title: 'Verilog Digital Logic Synthesis',
      level: 'Intermediate',
      milestones: [
        {
          id: 'vlsi_m1',
          title: 'RTL Coding, Finite State Machines (FSM) & Testbenches',
          description: 'Implement Mealy & Moore state machines in Verilog and simulate with ModelSim.',
          estimatedHours: 20,
          completed: false,
          keyConcepts: ['Verilog HDL', 'FSM Synthesis', 'Testbench Logic'],
          resources: [
            { name: 'HDLBits Interactive Verilog', type: 'practice', url: 'https://hdlbits.01xz.net' }
          ]
        }
      ]
    }
  ]
};
