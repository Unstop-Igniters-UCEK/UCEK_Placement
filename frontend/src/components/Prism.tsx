import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Mesh, Geometry, Program } from 'ogl';

interface PrismProps {
  animationType?: 'rotate' | 'pulse' | 'static';
  timeScale?: number;
  height?: number;
  baseWidth?: number;
  scale?: number;
  hueShift?: number;
  colorFrequency?: number;
  noise?: number;
  glow?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Prism: React.FC<PrismProps> = ({
  animationType = 'rotate',
  timeScale = 0.5,
  height = 3.5,
  baseWidth = 5.5,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  glow = 1,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({ alpha: true, antialias: true });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.set(0, 0, 10);

    const scene = new Transform();

    // Create Triangular Prism Geometry
    const hw = baseWidth / 2;
    const hh = height / 2;
    const hd = baseWidth / 2;

    const positions = new Float32Array([
      // Front Triangle
      0, hh, 0,
      -hw, -hh, hd,
      hw, -hh, hd,

      // Back Triangle
      0, hh, 0,
      hw, -hh, -hd,
      -hw, -hh, -hd,

      // Left Side
      0, hh, 0,
      -hw, -hh, -hd,
      -hw, -hh, hd,

      // Right Side
      0, hh, 0,
      hw, -hh, hd,
      hw, -hh, -hd,

      // Bottom Quad
      -hw, -hh, hd,
      -hw, -hh, -hd,
      hw, -hh, -hd,

      -hw, -hh, hd,
      hw, -hh, -hd,
      hw, -hh, hd,
    ]);

    const normals = new Float32Array([
      0, 0.4, 0.9,  0, 0.4, 0.9,  0, 0.4, 0.9,
      0, 0.4, -0.9, 0, 0.4, -0.9, 0, 0.4, -0.9,
      -0.9, 0.4, 0, -0.9, 0.4, 0, -0.9, 0.4, 0,
      0.9, 0.4, 0,  0.9, 0.4, 0,  0.9, 0.4, 0,
      0, -1, 0, 0, -1, 0, 0, -1, 0,
      0, -1, 0, 0, -1, 0, 0, -1, 0
    ]);

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      normal: { size: 3, data: normals }
    });

    const vertexShader = /* glsl */ `
      attribute vec3 position;
      attribute vec3 normal;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;

      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 pos = modelViewMatrix * vec4(position, 1.0);
        vPosition = pos.xyz;
        gl_Position = projectionMatrix * pos;
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;

      varying vec3 vNormal;
      varying vec3 vPosition;

      uniform float uTime;
      uniform float uHueShift;
      uniform float uColorFreq;
      uniform float uGlow;

      vec3 rgb2hsl(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      vec3 hsl2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }

      void main() {
        vec3 viewDir = normalize(-vPosition);
        float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 2.5);
        float intensity = max(0.1, dot(vNormal, vec3(0.5, 0.8, 0.5))) + fresnel * uGlow;

        float hue = fract(vPosition.y * 0.1 * uColorFreq + uTime * 0.1 + uHueShift);
        vec3 baseColor = hsl2rgb(vec3(hue, 0.7, 0.5));
        vec3 finalColor = baseColor * intensity;

        gl_FragColor = vec4(finalColor, mix(0.2, 0.85, fresnel * uGlow));
      }
    `;

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uHueShift: { value: hueShift },
        uColorFreq: { value: colorFrequency },
        uGlow: { value: glow }
      },
      transparent: true,
      cullFace: false
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.scale.set(scale / 3, scale / 3, scale / 3);
    mesh.setParent(scene);

    function resize() {
      const width = container?.clientWidth || window.innerWidth;
      const height = container?.clientHeight || 600;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    }

    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;
    let time = 0;

    function update() {
      animationFrameId = requestAnimationFrame(update);
      time += 0.016 * timeScale;
      program.uniforms.uTime.value = time;

      if (animationType === 'rotate') {
        mesh.rotation.y = time * 0.5;
        mesh.rotation.x = Math.sin(time * 0.3) * 0.2;
      }

      renderer.render({ scene, camera });
    }

    update();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (gl.canvas.parentNode) {
        gl.canvas.parentNode.removeChild(gl.canvas);
      }
    };
  }, [animationType, timeScale, height, baseWidth, scale, hueShift, colorFrequency, glow]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', ...style }} />;
};

export default Prism;
