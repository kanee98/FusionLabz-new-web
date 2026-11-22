import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Refined volumetric studio light-field shader (Stripe / Apple Pro / Linear aesthetic)
// Ultra-deep obsidian canvas with silky slow-moving titanium & subtle FusionLabz cyan light caustics
const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uIntensity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float t = uTime * 0.075;
    float scrollDrift = uScroll * 2.1;

    // Gentle parallax from pointer
    p -= uMouse * 0.08;

    // Flowing organic light fold
    vec2 q = vec2(
      fbm(p * 1.15 + vec2(t, scrollDrift * 0.45)),
      fbm(p * 1.15 + vec2(-t * 0.8 + 4.2, scrollDrift * 0.35 + 1.7))
    );

    float field = fbm(p * 1.35 + q * 1.45 + vec2(0.0, scrollDrift * 0.3));

    // Studio horizon band sweeping elegantly across scroll chapters
    float horizonY = 0.38 - sin(uScroll * 3.14159) * 0.28 + (field - 0.5) * 0.34;
    float band = exp(-pow((uv.y - horizonY) * 3.1, 2.0));
    float topGlow = exp(-pow(length((uv - vec2(0.5 + uMouse.x * 0.08, 0.96)) * vec2(1.1, 1.9)), 2.0));

    // Palette: pure obsidian base, brushed steel slate, subtle surgical FusionLabz cyan
    vec3 base = vec3(0.024, 0.028, 0.036);
    vec3 steel = vec3(0.11, 0.14, 0.20);
    vec3 cyan = vec3(0.0, 0.72, 0.96);
    vec3 ice = vec3(0.75, 0.88, 0.98);

    vec3 col = base;
    col += steel * band * smoothstep(0.25, 0.85, field) * 0.72 * uIntensity;
    col += cyan * band * smoothstep(0.46, 0.92, field) * 0.24 * uIntensity;
    col += mix(cyan, ice, 0.55) * topGlow * 0.14 * uIntensity;

    // Crisp radial vignette so text contrast stays immaculate
    float vig = smoothstep(1.35, 0.25, length(p * 0.85));
    col = mix(base, col, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function CosmicCanvas({ intensity = 'hero' }: { intensity?: 'hero' | 'ambient' }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uIntensity: { value: intensity === 'hero' ? 1.0 : 0.62 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let mouseX = 0;
    let mouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;
    let smoothScroll = 0;
    let visible = true;

    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    const onVisibility = () => {
      visible = !document.hidden;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    const clock = new THREE.Clock();
    let rafId = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (!visible) return;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const targetScroll = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      smoothScroll += (targetScroll - smoothScroll) * 0.06;
      smoothMouseX += (mouseX - smoothMouseX) * 0.04;
      smoothMouseY += (mouseY - smoothMouseY) * 0.04;

      uniforms.uTime.value = prefersReduced ? 0 : clock.getElapsedTime();
      uniforms.uScroll.value = smoothScroll;
      uniforms.uMouse.value.set(smoothMouseX, -smoothMouseY);

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [intensity]);

  return <div ref={containerRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
