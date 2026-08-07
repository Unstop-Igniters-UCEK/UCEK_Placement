import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Mesh, Geometry, Program } from 'ogl';

interface AuroraProps {
  colorStops?: string[];
  blend?: number;
  amplitude?: number;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b];
}

export const Aurora: React.FC<AuroraProps> = ({
  colorStops = ['#7cff67', '#B497CF', '#5227FF'],
  blend = 0.5,
  amplitude = 1.0,
  speed = 1.0,
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

    const camera = new Camera(gl);
    camera.position.set(0, 0, 1);

    const scene = new Transform();

    // Fullscreen Quad Geometry
    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
      uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) }
    });

    const c1 = hexToRgb(colorStops[0] || '#7cff67');
    const c2 = hexToRgb(colorStops[1] || '#B497CF');
    const c3 = hexToRgb(colorStops[2] || '#5227FF');

    const vertexShader = /* glsl */ `
      attribute vec2 position;
      attribute vec2 uv;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;
      varying vec2 vUv;

      uniform float uTime;
      uniform float uBlend;
      uniform float uAmplitude;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;

      // Simplex-like noise function
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = vUv;
        float t = uTime * 0.4;

        float n1 = snoise(vec2(st.x * 2.0 + t, st.y * 1.5 - t * 0.5)) * uAmplitude;
        float n2 = snoise(vec2(st.x * 3.0 - t * 0.7, st.y * 2.5 + t * 0.8)) * uAmplitude;

        float mixVal = clamp((st.y + n1 * 0.25) * 1.2, 0.0, 1.0);
        vec3 color = mix(uColor1, uColor2, mixVal);

        float mixVal2 = clamp((st.x + n2 * 0.25) * 1.2, 0.0, 1.0);
        color = mix(color, uColor3, mixVal2 * uBlend);

        float alpha = smoothstep(0.0, 0.8, (n1 + n2 + 1.2) * 0.5);

        gl_FragColor = vec4(color, alpha * 0.65);
      }
    `;

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBlend: { value: blend },
        uAmplitude: { value: amplitude },
        uColor1: { value: c1 },
        uColor2: { value: c2 },
        uColor3: { value: c3 }
      },
      transparent: true
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    function resize() {
      const width = container?.clientWidth || window.innerWidth;
      const height = container?.clientHeight || window.innerHeight;
      renderer.setSize(width, height);
    }

    window.addEventListener('resize', resize);
    resize();

    let animationFrameId: number;
    let time = 0;

    function update() {
      animationFrameId = requestAnimationFrame(update);
      time += 0.015 * speed;
      program.uniforms.uTime.value = time;
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
  }, [colorStops, blend, amplitude, speed]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', ...style }} />;
};

export default Aurora;
