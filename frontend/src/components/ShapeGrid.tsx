import React, { useRef, useEffect } from 'react';

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface GridOffset {
  x: number;
  y: number;
}

export interface ShapeGridProps {
  direction?: 'diagonal' | 'up' | 'right' | 'down' | 'left';
  speed?: number;
  borderColor?: CanvasStrokeStyle;
  squareSize?: number;
  size?: number; // Alias for squareSize
  hoverFillColor?: CanvasStrokeStyle;
  hoverColor?: CanvasStrokeStyle; // Alias for hoverFillColor
  shape?: 'square' | 'hexagon' | 'circle' | 'triangle';
  hoverTrailAmount?: number;
}

const ShapeGrid: React.FC<ShapeGridProps> = ({
  direction = 'right',
  speed = 0.1,
  borderColor = 'rgba(255, 255, 255, 0.12)',
  squareSize,
  size = 51,
  hoverFillColor,
  hoverColor = '#F97316',
  shape = 'triangle',
  hoverTrailAmount = 0
}) => {
  const actualSize = squareSize ?? size;
  const actualHoverFill = hoverFillColor ?? hoverColor;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const numSquaresX = useRef<number>(0);
  const numSquaresY = useRef<number>(0);
  const gridOffset = useRef<GridOffset>({ x: 0, y: 0 });
  const hoveredSquareRef = useRef<GridOffset | null>(null);
  const trailCells = useRef<GridOffset[]>([]);
  const cellOpacities = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const isHex = shape === 'hexagon';
    const isTri = shape === 'triangle';
    const hexHoriz = actualSize * 1.5;
    const hexVert = actualSize * Math.sqrt(3);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      numSquaresX.current = Math.ceil(canvas.width / actualSize) + 1;
      numSquaresY.current = Math.ceil(canvas.height / actualSize) + 1;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawHex = (cx: number, cy: number, sz: number) => {
      if (!ctx) return;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const vx = cx + sz * Math.cos(angle);
        const vy = cy + sz * Math.sin(angle);
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    };

    const drawCircle = (cx: number, cy: number, sz: number) => {
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2);
      ctx.closePath();
    };

    const drawTriangle = (cx: number, cy: number, sz: number, flip: boolean) => {
      if (!ctx) return;
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(cx, cy + sz / 2);
        ctx.lineTo(cx + sz / 2, cy - sz / 2);
        ctx.lineTo(cx - sz / 2, cy - sz / 2);
      } else {
        ctx.moveTo(cx, cy - sz / 2);
        ctx.lineTo(cx + sz / 2, cy + sz / 2);
        ctx.lineTo(cx - sz / 2, cy + sz / 2);
      }
      ctx.closePath();
    };

    const drawGrid = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isHex) {
        const colShift = Math.floor(gridOffset.current.x / hexHoriz);
        const offsetX = ((gridOffset.current.x % hexHoriz) + hexHoriz) % hexHoriz;
        const offsetY = ((gridOffset.current.y % hexVert) + hexVert) % hexVert;

        const cols = Math.ceil(canvas.width / hexHoriz) + 3;
        const rows = Math.ceil(canvas.height / hexVert) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * hexHoriz + offsetX;
            const cy = row * hexVert + ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;

            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawHex(cx, cy, actualSize);
              ctx.fillStyle = actualHoverFill;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            drawHex(cx, cy, actualSize);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else if (isTri) {
        const halfW = actualSize / 2;
        const colShift = Math.floor(gridOffset.current.x / halfW);
        const rowShift = Math.floor(gridOffset.current.y / actualSize);
        const offsetX = ((gridOffset.current.x % halfW) + halfW) % halfW;
        const offsetY = ((gridOffset.current.y % actualSize) + actualSize) % actualSize;

        const cols = Math.ceil(canvas.width / halfW) + 4;
        const rows = Math.ceil(canvas.height / actualSize) + 4;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * halfW + offsetX;
            const cy = row * actualSize + actualSize / 2 + offsetY;
            const flip = ((col + colShift + row + rowShift) % 2 + 2) % 2 !== 0;

            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawTriangle(cx, cy, actualSize, flip);
              ctx.fillStyle = actualHoverFill;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            drawTriangle(cx, cy, actualSize, flip);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else if (shape === 'circle') {
        const offsetX = ((gridOffset.current.x % actualSize) + actualSize) % actualSize;
        const offsetY = ((gridOffset.current.y % actualSize) + actualSize) % actualSize;

        const cols = Math.ceil(canvas.width / actualSize) + 3;
        const rows = Math.ceil(canvas.height / actualSize) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const cx = col * actualSize + actualSize / 2 + offsetX;
            const cy = row * actualSize + actualSize / 2 + offsetY;

            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawCircle(cx, cy, actualSize);
              ctx.fillStyle = actualHoverFill;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            drawCircle(cx, cy, actualSize);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else {
        const offsetX = ((gridOffset.current.x % actualSize) + actualSize) % actualSize;
        const offsetY = ((gridOffset.current.y % actualSize) + actualSize) % actualSize;

        const cols = Math.ceil(canvas.width / actualSize) + 3;
        const rows = Math.ceil(canvas.height / actualSize) + 3;

        for (let col = -2; col < cols; col++) {
          for (let row = -2; row < rows; row++) {
            const sx = col * actualSize + offsetX;
            const sy = row * actualSize + offsetY;

            const cellKey = `${col},${row}`;
            const alpha = cellOpacities.current.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.fillStyle = actualHoverFill;
              ctx.fillRect(sx, sy, actualSize, actualSize);
              ctx.globalAlpha = 1;
            }

            ctx.strokeStyle = borderColor;
            ctx.strokeRect(sx, sy, actualSize, actualSize);
          }
        }
      }

      // Soft vignette for edge blending without hiding grid lines
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(3, 3, 5, 0.45)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const updateAnimation = () => {
      const effectiveSpeed = Math.max(speed, 0.05);
      const wrapX = isHex ? hexHoriz * 2 : actualSize;
      const wrapY = isHex ? hexVert : isTri ? actualSize * 2 : actualSize;

      switch (direction) {
        case 'right':
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + wrapX) % wrapX;
          break;
        case 'left':
          gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + wrapX) % wrapX;
          break;
        case 'up':
          gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + wrapY) % wrapY;
          break;
        case 'down':
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + wrapY) % wrapY;
          break;
        case 'diagonal':
          gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + wrapX) % wrapX;
          gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + wrapY) % wrapY;
          break;
        default:
          break;
      }

      updateCellOpacities();
      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    const updateCellOpacities = () => {
      const targets = new Map<string, number>();

      if (hoveredSquareRef.current) {
        targets.set(`${hoveredSquareRef.current.x},${hoveredSquareRef.current.y}`, 1);
      }

      if (hoverTrailAmount > 0) {
        for (let i = 0; i < trailCells.current.length; i++) {
          const t = trailCells.current[i];
          const key = `${t.x},${t.y}`;
          if (!targets.has(key)) {
            targets.set(key, (trailCells.current.length - i) / (trailCells.current.length + 1));
          }
        }
      }

      for (const [key] of targets) {
        if (!cellOpacities.current.has(key)) {
          cellOpacities.current.set(key, 0);
        }
      }

      for (const [key, opacity] of cellOpacities.current) {
        const target = targets.get(key) || 0;
        const next = opacity + (target - opacity) * 0.15;
        if (next < 0.005) {
          cellOpacities.current.delete(key);
        } else {
          cellOpacities.current.set(key, next);
        }
      }
    };

    // Global mouse tracking so grid responds to mouse anywhere on page
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      if (isHex) {
        const colShift = Math.floor(gridOffset.current.x / hexHoriz);
        const offsetX = ((gridOffset.current.x % hexHoriz) + hexHoriz) % hexHoriz;
        const offsetY = ((gridOffset.current.y % hexVert) + hexVert) % hexVert;
        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;

        const col = Math.round(adjustedX / hexHoriz);
        const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0;
        const row = Math.round((adjustedY - rowOffset) / hexVert);

        if (
          !hoveredSquareRef.current ||
          hoveredSquareRef.current.x !== col ||
          hoveredSquareRef.current.y !== row
        ) {
          if (hoveredSquareRef.current && hoverTrailAmount > 0) {
            trailCells.current.unshift({ ...hoveredSquareRef.current });
            if (trailCells.current.length > hoverTrailAmount) trailCells.current.length = hoverTrailAmount;
          }
          hoveredSquareRef.current = { x: col, y: row };
        }
      } else if (isTri) {
        const halfW = actualSize / 2;
        const offsetX = ((gridOffset.current.x % halfW) + halfW) % halfW;
        const offsetY = ((gridOffset.current.y % actualSize) + actualSize) % actualSize;

        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;

        const col = Math.round(adjustedX / halfW);
        const row = Math.floor(adjustedY / actualSize);

        if (
          !hoveredSquareRef.current ||
          hoveredSquareRef.current.x !== col ||
          hoveredSquareRef.current.y !== row
        ) {
          if (hoveredSquareRef.current && hoverTrailAmount > 0) {
            trailCells.current.unshift({ ...hoveredSquareRef.current });
            if (trailCells.current.length > hoverTrailAmount) trailCells.current.length = hoverTrailAmount;
          }
          hoveredSquareRef.current = { x: col, y: row };
        }
      } else if (shape === 'circle') {
        const offsetX = ((gridOffset.current.x % actualSize) + actualSize) % actualSize;
        const offsetY = ((gridOffset.current.y % actualSize) + actualSize) % actualSize;

        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;

        const col = Math.round(adjustedX / actualSize);
        const row = Math.round(adjustedY / actualSize);

        if (
          !hoveredSquareRef.current ||
          hoveredSquareRef.current.x !== col ||
          hoveredSquareRef.current.y !== row
        ) {
          if (hoveredSquareRef.current && hoverTrailAmount > 0) {
            trailCells.current.unshift({ ...hoveredSquareRef.current });
            if (trailCells.current.length > hoverTrailAmount) trailCells.current.length = hoverTrailAmount;
          }
          hoveredSquareRef.current = { x: col, y: row };
        }
      } else {
        const offsetX = ((gridOffset.current.x % actualSize) + actualSize) % actualSize;
        const offsetY = ((gridOffset.current.y % actualSize) + actualSize) % actualSize;

        const adjustedX = mouseX - offsetX;
        const adjustedY = mouseY - offsetY;

        const col = Math.floor(adjustedX / actualSize);
        const row = Math.floor(adjustedY / actualSize);

        if (
          !hoveredSquareRef.current ||
          hoveredSquareRef.current.x !== col ||
          hoveredSquareRef.current.y !== row
        ) {
          if (hoveredSquareRef.current && hoverTrailAmount > 0) {
            trailCells.current.unshift({ ...hoveredSquareRef.current });
            if (trailCells.current.length > hoverTrailAmount) trailCells.current.length = hoverTrailAmount;
          }
          hoveredSquareRef.current = { x: col, y: row };
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    let isVisible = false;
    let isPageVisible = !document.hidden;

    const tryStart = () => {
      if (isVisible && isPageVisible && !requestRef.current) {
        requestRef.current = requestAnimationFrame(updateAnimation);
      }
    };
    const tryStop = () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      tryStop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [direction, speed, borderColor, actualHoverFill, actualSize, shape, hoverTrailAmount]);

  return <canvas ref={canvasRef} className="w-full h-full border-none block pointer-events-none"></canvas>;
};

export default ShapeGrid;
