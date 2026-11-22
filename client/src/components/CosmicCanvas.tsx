import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Stripe-inspired luminous multi-blue atmospheric silk shader
// Blends crisp porcelain white with flowing sky-ice, FusionLabz cyan (#00B8F4), azure (#2563EB), and sapphire waves
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
      p = rot * p * 1.98;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    float t = uTime * 0.085;
    float scrollShift = uScroll * 1.85;
    p -= uMouse * 0.06;

    vec2 q = vec2(
      fbm(p * 1.05 + vec2(t, scrollShift * 0.4)),
      fbm(p * 1.05 + vec2(-t * 0.75 + 3.4, scrollShift * 0.3 + 2.1))
    );

    float flow = fbm(p * 1.2 + q * 1.35 + vec2(0.0, scrollShift * 0.25));

    // Luminous blue silk ribbons floating softly behind the crisp light canvas
    vec3 porcelain = vec3(0.973, 0.985, 1.0);
    vec3 skyIce    = vec3(0.835, 0.929, 1.0);
    vec3 cyanGlow  = vec3(0.0, 0.722, 0.957);
    vec3 azureBlue = vec3(0.145, 0.388, 0.922);
    vec3 royalBlue = vec3(0.0, 0.322, 1.0);

    // Sweeping upper-right and lower-left silk waves that shift with scroll
    float topWave = exp(-pow(length((uv - vec2(0.76 - uScroll * 0.25, 0.86)) * vec2(1.1, 1.4)), 2.0));
    float leftWave = exp(-pow(length((uv - vec2(0.18 + uScroll * 0.2, 0.72 - uScroll * 0.15)) * vec2(1.15, 1.35)), 2.0));
    float centerRibbon = exp(-pow((uv.y - (0.64 - uScroll * 0.28 + (flow - 0.5) * 0.35)) * 2.6, 2.0));

    vec3 col = porcelain;
    col = mix(col, skyIce, smoothstep(0.28, 0.82, flow) * 0.68 * uIntensity);
    col = mix(col, cyanGlow, topWave * smoothstep(0.32, 0.85, flow) * 0.30 * uIntensity);
    col = mix(col, azureBlue, leftWave * smoothstep(0.35, 0.88, flow) * 0.22 * uIntensity);
    col = mix(col, mix(cyanGlow, royalBlue, uv.x), centerRibbon * 0.14 * uIntensity);

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
      uIntensity: { value: intensity === 'hero' ? 1.0 : 0.72 },
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
