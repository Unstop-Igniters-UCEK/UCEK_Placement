import React from 'react';

export interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-in-out' | 'ease-out';
  extraScale?: number;
  children?: React.ReactNode;
}

declare const ClickSpark: React.FC<ClickSparkProps>;
export default ClickSpark;
