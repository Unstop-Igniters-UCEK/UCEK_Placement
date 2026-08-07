import React, { useEffect, useRef } from 'react';

interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  sparklePhase: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

export const DotField: React.FC<DotFieldProps> = ({
  dotRadius = 3.0,
  dotSpacing = 30,
  bulgeStrength = 55,
  glowRadius = 240,
  sparkle = true,
  waveAmplitude = 20,
  cursorRadius = 260,
  cursorForce = 0.85,
  bulgeOnly = false,
  gradientFrom = '#ee2e8d',
  gradientTo = '#ff2d95',
  glowColor = '#000000',
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const c1 = hexToRgb(gradientFrom);
    const c2 = hexToRgb(gradientTo);

    const initGrid = () => {
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      particles = [];
      const cols = Math.ceil(width / dotSpacing) + 2;
      const rows = Math.ceil(height / dotSpacing) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * dotSpacing;
          const y = r * dotSpacing;
          particles.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            sparklePhase: Math.random() * Math.PI * 2
          });
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    window.addEventListener('resize', initGrid);
    window.addEventListener('mousemove', handleMouseMove);

    initGrid();

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.03;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 3D Wave Motion
        const wave = Math.sin(p.baseX * 0.01 + p.baseY * 0.01 + time) * waveAmplitude;
        let targetX = p.baseX;
        let targetY = p.baseY + wave * 0.3;

        // High-Sensitivity Mouse Cursor Proximity Force & Bulge Displacement
        const dx = mx - p.baseX;
        const dy = my - p.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let curRadiusScale = 1.0;

        if (dist < cursorRadius && dist > 0.001) {
          const factor = Math.pow(1 - dist / cursorRadius, 2);
          const force = factor * cursorForce * bulgeStrength;
          const angle = Math.atan2(dy, dx);

          targetX -= Math.cos(angle) * force;
          targetY -= Math.sin(angle) * force;

          curRadiusScale += factor * 1.5;
        }

        // Return Spring Interpolation with smooth easing
        p.x += (targetX - p.x) * 0.15;
        p.y += (targetY - p.y) * 0.15;

        // Color & Sparkle Gradient Calculation
        const tColor = (p.x / canvas.width);
        const r = Math.round(c1.r + (c2.r - c1.r) * tColor);
        const g = Math.round(c1.g + (c2.g - c1.g) * tColor);
        const b = Math.round(c1.b + (c2.b - c1.b) * tColor);

        let alpha = 0.6;
        if (sparkle) {
          p.sparklePhase += 0.04;
          alpha += Math.sin(p.sparklePhase) * 0.25;
        }

        if (dist < glowRadius) {
          const glowFactor = (1 - dist / glowRadius);
          alpha = Math.min(1.0, alpha + glowFactor * 0.6);
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0.15, alpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dotRadius * curRadiusScale, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', initGrid);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dotRadius, dotSpacing, bulgeStrength, glowRadius, sparkle, waveAmplitude, cursorRadius, cursorForce, bulgeOnly, gradientFrom, gradientTo, glowColor]);

  return <canvas ref={canvasRef} className={`block w-full h-full ${className}`} style={{ width: '100%', height: '100%', ...style }} />;
};

export default DotField;
