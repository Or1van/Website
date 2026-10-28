import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

const SNOW_VERTEX = /* glsl */ `
  attribute float aScale;
  attribute float aSpeed;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Fall and drift, wrapping inside an 18 x 28 box so flakes never run out.
    p.y = mod(p.y - uTime * aSpeed + 9.0, 18.0) - 9.0;
    p.x = mod(p.x + uTime * 0.18 * aSpeed + sin(uTime * 0.45 + aPhase) * 0.6 + 14.0, 28.0) - 14.0;
    p.z += cos(uTime * 0.3 + aPhase) * 0.3;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * 28.0 * uPixelRatio / -mv.z;
    vAlpha = smoothstep(19.0, 5.0, -mv.z) * (0.3 + 0.7 * aScale / 1.6);
  }
`;

const SNOW_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(0.93, 0.91, 0.86, a * a * vAlpha * uOpacity);
  }
`;

const FOG_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FOG_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uAmount;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.1, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= uRes.x / uRes.y;
    vec2 q = uv * 1.5 + vec2(uTime * 0.025, uTime * 0.004) + uMouse * 0.06;
    // Domain warping gives the fog its slow, curling motion.
    float n = fbm(q + vec2(fbm(q + uTime * 0.035), fbm(q - uTime * 0.02)));
    float low = smoothstep(0.95, 0.05, vUv.y);
    float edges = smoothstep(0.0, 0.35, abs(vUv.x - 0.5) + 0.1);
    float a = smoothstep(0.35, 0.95, n) * (low * 0.85 + edges * 0.25) * uAmount;
    vec3 col = mix(vec3(0.42, 0.44, 0.48), vec3(0.78, 0.74, 0.67), n);
    gl_FragColor = vec4(col, a * 0.62);
  }
`;

export type AtmosphereControls = { fog: boolean };

export function createAtmosphere(canvas: HTMLCanvasElement, controls: AtmosphereControls) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;

  // Fog: one full-screen quad.
  const fogScene = new Scene();
  const fogCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fogMaterial = new ShaderMaterial({
    vertexShader: FOG_VERTEX,
    fragmentShader: FOG_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uAmount: { value: 1 },
      uRes: { value: new Vector2(1, 1) },
      uMouse: { value: new Vector2() },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const fogGeometry = new PlaneGeometry(2, 2);
  fogScene.add(new Mesh(fogGeometry, fogMaterial));

  // Snow: GPU-animated points, so the CPU only updates a few uniforms per frame.
  const scene = new Scene();
  const camera = new PerspectiveCamera(55, 1, 0.1, 50);
  camera.position.z = 10;

  const count = window.innerWidth < 768 ? 550 : 1300;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 28;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 2] = Math.random() * 14 - 8;
    scales[i] = 0.35 + Math.pow(Math.random(), 2.2) * 1.25;
    speeds[i] = 0.25 + Math.random() * 0.6;
    phases[i] = Math.random() * Math.PI * 2;
  }
  const snowGeometry = new BufferGeometry();
  snowGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  snowGeometry.setAttribute("aScale", new BufferAttribute(scales, 1));
  snowGeometry.setAttribute("aSpeed", new BufferAttribute(speeds, 1));
  snowGeometry.setAttribute("aPhase", new BufferAttribute(phases, 1));
  const snowMaterial = new ShaderMaterial({
    vertexShader: SNOW_VERTEX,
    fragmentShader: SNOW_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const snow = new Points(snowGeometry, snowMaterial);
  snow.frustumCulled = false;
  scene.add(snow);

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fogMaterial.uniforms.uRes.value.set(w, h);
  };
  resize();

  const mouse = new Vector2();
  const smoothMouse = new Vector2();
  const onPointer = (e: PointerEvent) => {
    mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  };

  let raf = 0;
  let running = true;
  const start = performance.now();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const t = (performance.now() - start) / 1000;
    const scroll = window.scrollY / window.innerHeight;

    smoothMouse.lerp(mouse, 0.04);
    camera.position.x = smoothMouse.x * 0.9;
    camera.position.y = smoothMouse.y * 0.5;
    camera.lookAt(0, 0, 0);

    snowMaterial.uniforms.uTime.value = t;
    snowMaterial.uniforms.uOpacity.value = scroll < 1 ? 1 - scroll * 0.45 : 0.55;
    const fogAmount = controls.fog ? Math.max(0, 1 - scroll * 1.15) : 0;
    fogMaterial.uniforms.uAmount.value = fogAmount;
    fogMaterial.uniforms.uTime.value = t;
    fogMaterial.uniforms.uMouse.value.copy(smoothMouse);

    renderer.clear();
    if (fogAmount > 0.01) renderer.render(fogScene, fogCamera);
    renderer.render(scene, camera);
  };
  frame();

  const onVisibility = () => {
    if (document.hidden && running) {
      cancelAnimationFrame(raf);
      running = false;
    } else if (!document.hidden && !running) {
      running = true;
      frame();
    }
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    snowGeometry.dispose();
    snowMaterial.dispose();
    fogGeometry.dispose();
    fogMaterial.dispose();
    renderer.dispose();
  };
}
