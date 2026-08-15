/// <reference types="vite/client" />

declare module 'three' {
  export type Texture = any;
  export type Uniform = any;
  export type WebGLRenderer = any;
  export type Scene = any;
  export type OrthographicCamera = any;
  export type ShaderMaterial = any;
  export type Clock = any;
  export type Vector2 = any;
  export type Color = any;
  export type Mesh<T = any, U = any> = any;
  export type PlaneGeometry = any;
  export const GLSL3: any;
  export const LinearFilter: any;
  export const WebGLRenderer: any;
  export const Scene: any;
  export const OrthographicCamera: any;
  export const ShaderMaterial: any;
  export const Clock: any;
  export const Vector2: any;
  export const Color: any;
  export const Mesh: any;
  export const PlaneGeometry: any;
  export const Uniform: any;
  export const Texture: any;
}

declare module 'postprocessing' {
  export type Effect = any;
  export type EffectComposer = any;
  export type EffectPass = any;
  export type RenderPass = any;
  export const Effect: any;
  export const EffectComposer: any;
  export const EffectPass: any;
  export const RenderPass: any;
}

declare module 'ogl' {
  export type Renderer = any;
  export type Program = any;
  export type Triangle = any;
  export type Mesh<T = any, U = any> = any;
  export const Renderer: any;
  export const Program: any;
  export const Triangle: any;
  export const Mesh: any;
}
