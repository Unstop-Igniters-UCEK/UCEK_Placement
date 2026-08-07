import React, { useEffect, useRef } from 'react';

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

interface Dot {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  colorProgress: number;
}

export const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 5,
  gap = 15,
  baseColor = '#2F293A',
  activeColor = '#EC4899',
  proximity = 120,
  shockRadius = 250,
  shockStrength = 5,
  resistance = 750,
  returnDuration = 1.5,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; px: number; py: number; isDown: boolean }>({
    x: -1000,
    y: -1000,
    px: -1000,
    py: -1000,
    isDown: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dots: Dot[] = [];

    const parseColor = (hex: string) => {
      const cleanHex = hex.replace('#', '');
      const bigint = parseInt(cleanHex, 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
      };
    };

    const cBase = parseColor(baseColor);
    const cActive = parseColor(activeColor);

    const initGrid = () => {
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      dots = [];
      const step = dotSize + gap;
      const cols = Math.ceil(width / step) + 2;
      const rows = Math.ceil(height / step) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * step;
          const y = r * step;
          dots.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            colorProgress: 0
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.px = mouseRef.current.x;
      mouseRef.current.py = mouseRef.current.y;
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      mouseRef.current.isDown = true;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    window.addEventListener('resize', initGrid);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    initGrid();

    const returnFactor = 1 / (returnDuration * 60);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        const dx = mx - dot.x;
        const dy = my - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Interactive Proximity Ripple Color & Displacement
        if (dist < proximity) {
          const targetProgress = (1 - dist / proximity);
          dot.colorProgress = Math.max(dot.colorProgress, targetProgress);

          const force = (1 - dist / proximity) * (shockStrength / 10);
          const angle = Math.atan2(dy, dx);
          dot.vx -= Math.cos(angle) * force;
          dot.vy -= Math.sin(angle) * force;
        } else {
          dot.colorProgress *= 0.94;
        }

        // Physics Return Spring
        const springDx = dot.baseX - dot.x;
        const springDy = dot.baseY - dot.y;

        dot.vx += (springDx / resistance) * 60;
        dot.vy += (springDy / resistance) * 60;

        dot.vx *= 0.88;
        dot.vy *= 0.88;

        dot.x += dot.vx;
        dot.y += dot.vy;

        // Color Interpolation
        const r = Math.round(cBase.r + (cActive.r - cBase.r) * dot.colorProgress);
        const g = Math.round(cBase.g + (cActive.g - cBase.g) * dot.colorProgress);
        const b = Math.round(cBase.b + (cActive.b - cBase.b) * dot.colorProgress);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', initGrid);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dotSize, gap, baseColor, activeColor, proximity, shockRadius, shockStrength, resistance, returnDuration]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className}`} style={{ width: '100%', height: '100%', ...style }} />;
};

export default DotGrid;
