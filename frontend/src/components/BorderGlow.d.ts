import React from 'react';

export interface BorderGlowProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  loopAnimation?: boolean;
  loopInitialDelay?: number;
  colors?: string[];
  fillOpacity?: number;
}

declare const BorderGlow: React.FC<BorderGlowProps>;
export default BorderGlow;
