import React from 'react';

export interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare const Aurora: React.FC<AuroraProps>;
export default Aurora;
