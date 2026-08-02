import React from 'react';

export interface PixelBlastProps {
  variant?: 'circle' | 'square' | 'triangle' | 'diamond';
  pixelSize?: number;
  color?: string;
  patternScale?: number;
  patternDensity?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleSpeed?: number;
  rippleThickness?: number;
  rippleIntensityScale?: number;
  liquid?: boolean;
  liquidStrength?: number;
  liquidRadius?: number;
  liquidWobbleSpeed?: number;
  speed?: number;
  edgeFade?: number;
  transparent?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare const PixelBlast: React.FC<PixelBlastProps>;
export default PixelBlast;
