import React from 'react';
import PixelBlast from './PixelBlast';

export const OrangeBlackGradient: React.FC = React.memo(() => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none w-full h-full bg-[#000000] overflow-hidden flex flex-col justify-end">
      {/* Bottom 600px PixelBlast Background Layer */}
      <div className="w-full h-[600px] relative shrink-0">
        <PixelBlast
          variant="triangle"
          pixelSize={4}
          color="#F97316"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples={false}
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.25}
          transparent
        />

        {/* Gradient Mask: Fades up from transparent at bottom to solid black at top center */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 60%, rgba(0, 0, 0, 1) 100%)'
          }}
        />
      </div>
    </div>
  );
});

export default OrangeBlackGradient;
