import React, { useEffect, useRef } from 'react';

interface GrainientProps {
  color1?: string;
  color2?: string;
  color3?: string;
  timeSpeed?: number;
  colorBalance?: number;
  warpStrength?: number;
  warpFrequency?: number;
  warpSpeed?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  grainAnimated?: boolean;
  contrast?: number;
  gamma?: number;
  saturation?: number;
  centerX?: number;
  centerY?: number;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  return [
    ((bigint >> 16) & 255) / 255,
    ((bigint >> 8) & 255) / 255,
    (bigint & 255) / 255
  ];
}

const vertexShaderSource = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uWarpStrength;
  uniform float uWarpFrequency;
  uniform float uWarpSpeed;
  uniform float uGrainAmount;
  uniform float uGrainScale;
  uniform float uContrast;
  uniform float uZoom;
  uniform vec2 uCenter;

  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yzw * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 st = (vUv - 0.5) / uZoom + 0.5 + uCenter;
    float t = uTime * uWarpSpeed;

    vec2 q = vec2(
      snoise(st * uWarpFrequency + vec2(0.0, t * 0.2)),
      snoise(st * uWarpFrequency + vec2(1.0, t * 0.3))
    );

    vec2 r = vec2(
      snoise(st * uWarpFrequency + 4.0 * q + vec2(1.7, 9.2 + 0.15 * t)),
      snoise(st * uWarpFrequency + 4.0 * q + vec2(8.3, 2.8 + 0.12 * t))
    );

    float f = snoise(st * uWarpFrequency + uWarpStrength * r);

    float mixVal1 = smoothstep(-1.0, 0.2, f);
    float mixVal2 = smoothstep(0.0, 1.0, f);

    vec3 col = mix(uColor1, uColor2, mixVal1);
    col = mix(col, uColor3, mixVal2);

    col = mix(vec3(0.5), col, uContrast);

    if (uGrainAmount > 0.0) {
      float grain = rand(vUv * uGrainScale + vec2(uTime * 0.01)) * 2.0 - 1.0;
      col += grain * uGrainAmount;
    }

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export const Grainient: React.FC<GrainientProps> = ({
  color1 = '#000000',
  color2 = '#000000',
  color3 = '#F97316',
  timeSpeed = 0.25,
  colorBalance = 0,
  warpStrength = 1,
  warpFrequency = 5,
  warpSpeed = 2,
  warpAmplitude = 50,
  blendAngle = 0,
  blendSoftness = 0.05,
  rotationAmount = 500,
  noiseScale = 2,
  grainAmount = 0.1,
  grainScale = 2,
  grainAnimated = false,
  contrast = 1.5,
  gamma = 1,
  saturation = 1,
  centerX = 0,
  centerY = 0,
  zoom = 0.9,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    if (!gl) return;

    // Create Shader Helper
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen Quad Buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const locs = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uColor1: gl.getUniformLocation(program, 'uColor1'),
      uColor2: gl.getUniformLocation(program, 'uColor2'),
      uColor3: gl.getUniformLocation(program, 'uColor3'),
      uWarpStrength: gl.getUniformLocation(program, 'uWarpStrength'),
      uWarpFrequency: gl.getUniformLocation(program, 'uWarpFrequency'),
      uWarpSpeed: gl.getUniformLocation(program, 'uWarpSpeed'),
      uGrainAmount: gl.getUniformLocation(program, 'uGrainAmount'),
      uGrainScale: gl.getUniformLocation(program, 'uGrainScale'),
      uContrast: gl.getUniformLocation(program, 'uContrast'),
      uZoom: gl.getUniformLocation(program, 'uZoom'),
      uCenter: gl.getUniformLocation(program, 'uCenter')
    };

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const c3 = hexToRgb(color3);

    gl.uniform3f(locs.uColor1, c1[0], c1[1], c1[2]);
    gl.uniform3f(locs.uColor2, c2[0], c2[1], c2[2]);
    gl.uniform3f(locs.uColor3, c3[0], c3[1], c3[2]);
    gl.uniform1f(locs.uWarpStrength, warpStrength);
    gl.uniform1f(locs.uWarpFrequency, warpFrequency);
    gl.uniform1f(locs.uWarpSpeed, warpSpeed * 0.1);
    gl.uniform1f(locs.uGrainAmount, grainAmount);
    gl.uniform1f(locs.uGrainScale, grainScale * 500.0);
    gl.uniform1f(locs.uContrast, contrast);
    gl.uniform1f(locs.uZoom, zoom);
    gl.uniform2f(locs.uCenter, centerX, centerY);

    const handleResize = () => {
      const w = (canvas.width = window.innerWidth);
      const h = (canvas.height = window.innerHeight);
      gl.viewport(0, 0, w, h);
      gl.uniform2f(locs.uResolution, w, h);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += timeSpeed * 0.05;
      gl.uniform1f(locs.uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      gl.deleteProgram(program);
    };
  }, [
    color1,
    color2,
    color3,
    timeSpeed,
    warpStrength,
    warpFrequency,
    warpSpeed,
    grainAmount,
    grainScale,
    contrast,
    zoom,
    centerX,
    centerY
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  );
};

export default Grainient;
