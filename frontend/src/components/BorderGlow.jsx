import { useRef, useCallback, useEffect } from 'react';
import './BorderGlow.css';

function parseHSL(hslStr) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors) {
  const vars = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInCubic(x) { return x * x * x; }

// ── Shared global RAF scheduler ──────────────────────────────────────────────
// Instead of each animation spawning its own RAF loop, all animations share a
// single master tick registered once per frame. This prevents N×4 concurrent
// RAF callbacks competing for the same frame budget.
const _tasks = new Set();
let _rafId = null;

function _masterTick(now) {
  _rafId = null;
  if (_tasks.size === 0) return;
  _rafId = requestAnimationFrame(_masterTick);
  for (const task of _tasks) {
    task(now);
  }
}

function _scheduleTask(fn) {
  _tasks.add(fn);
  if (_rafId === null) {
    _rafId = requestAnimationFrame(_masterTick);
  }
  return () => _tasks.delete(fn);
}

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
  let t0 = null;
  let started = false;
  let cancelled = false;

  const tick = (now) => {
    if (cancelled) return;
    if (!started) {
      if (now < t0) return; // still in delay
      started = true;
    }
    const elapsed = now - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(Math.max(t, 0)));
    if (t >= 1) {
      cancel();
      if (onEnd) onEnd();
    }
  };

  let cancel = () => {};

  // Honour delay without a setTimeout (use the master RAF timer for accuracy)
  const timerHandle = setTimeout(() => {
    if (cancelled) return;
    t0 = performance.now();
    cancel = _scheduleTask(tick);
  }, delay);

  return () => {
    cancelled = true;
    clearTimeout(timerHandle);
    cancel();
  };
}

const BorderGlow = ({
  children,
  className = '',
  style: styleProp = {},
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = 'var(--bg-card)',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1.0,
  coneSpread = 25,
  animated = false,
  loopAnimation = false,
  loopInitialDelay = 0,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
}) => {
  const cardRef = useRef(null);
  // Cache bounding rect so pointer move doesn't call getBoundingClientRect every frame
  const rectRef = useRef(null);
  const pointerRafRef = useRef(null);
  const pendingPointerRef = useRef(null);

  const getCenterOfElement = useCallback((rect) => {
    return [rect.width / 2, rect.height / 2];
  }, []);

  const getEdgeProximity = useCallback((rect, x, y) => {
    const [cx, cy] = getCenterOfElement(rect);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfElement]);

  const getCursorAngle = useCallback((rect, x, y) => {
    const [cx, cy] = getCenterOfElement(rect);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }, [getCenterOfElement]);

  // Throttled pointer move: batch all pointer moves into a single RAF flush
  const handlePointerMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    pendingPointerRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (pointerRafRef.current) return; // already queued
    pointerRafRef.current = requestAnimationFrame(() => {
      pointerRafRef.current = null;
      const card2 = cardRef.current;
      const pending = pendingPointerRef.current;
      if (!card2 || !pending) return;

      // Refresh rect lazily (invalidated on resize)
      if (!rectRef.current) rectRef.current = card2.getBoundingClientRect();
      const rect = rectRef.current;
      const x = pending.clientX - rect.left;
      const y = pending.clientY - rect.top;

      const edge = getEdgeProximity(rect, x, y);
      const angle = getCursorAngle(rect, x, y);

      card2.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
      card2.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    });
  }, [getEdgeProximity, getCursorAngle]);

  // Invalidate cached rect on resize
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const ro = new ResizeObserver(() => { rectRef.current = null; });
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!animated || !cardRef.current) return;
    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    const cancels = [
      animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', v) }),
      animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      }}),
      animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      }}),
      animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
        onUpdate: v => card.style.setProperty('--edge-proximity', v),
        onEnd: () => card.classList.remove('sweep-active'),
      }),
    ];
    return () => cancels.forEach(c => c());
  }, [animated]);

  // Continuous loop animation (no hover required)
  useEffect(() => {
    if (!loopAnimation || !cardRef.current) return;
    const card = cardRef.current;
    let cancelled = false;
    let timerId = null;
    let activeCancels = [];

    const MAX_PROXIMITY = 75;
    const PAUSE_BETWEEN = 900;

    const runSweep = () => {
      if (cancelled) return;
      // Cancel any lingering animations from previous sweep
      activeCancels.forEach(c => c());
      activeCancels = [];

      const angleStart = Math.random() * 360;
      const angleEnd = angleStart + 355;
      card.classList.add('sweep-active');
      card.style.setProperty('--cursor-angle', `${angleStart}deg`);

      activeCancels.push(
        animateValue({ duration: 500, end: MAX_PROXIMITY, onUpdate: v => card.style.setProperty('--edge-proximity', v) }),
        animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
          card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
        }}),
        animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
          card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
        }}),
        animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: MAX_PROXIMITY, end: 0,
          onUpdate: v => card.style.setProperty('--edge-proximity', v),
          onEnd: () => {
            card.classList.remove('sweep-active');
            if (!cancelled) {
              timerId = setTimeout(runSweep, PAUSE_BETWEEN);
            }
          },
        }),
      );
    };

    timerId = setTimeout(runSweep, loopInitialDelay);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      activeCancels.forEach(c => c());
    };
  }, [loopAnimation, loopInitialDelay]);

  const glowVars = buildGlowVars(glowColor, glowIntensity);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--edge-sensitivity': edgeSensitivity,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--cone-spread': coneSpread,
        '--fill-opacity': fillOpacity,
        ...glowVars,
        ...buildGradientVars(colors),
        ...styleProp,
      }}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
