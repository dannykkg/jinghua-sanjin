import './style.css';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createMaterials } from './lib/materials';
import { buildWorld } from './world/world';
import { UI, type Mode } from './ui';
import { OrbitMode, PanoramaMode, WalkMode } from './modes/modes';
import { HOTSPOTS, ROOM_LABELS } from './data/site';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const app = document.getElementById('app') as HTMLElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9d1ce);
const fog = new THREE.Fog(0xd3cec1, 44, 150);
const orbitFog = new THREE.Fog(0xd3cec1, 135, 240);
scene.fog = fog;

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.05, 240);
camera.rotation.order = 'YXZ';

// A quiet, slightly overcast Beijing sky, with a warm horizon.
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(150, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(0x94a7a8) },
      mid: { value: new THREE.Color(0xc9cec5) },
      horizon: { value: new THREE.Color(0xe7d8bd) },
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform vec3 top;
      uniform vec3 mid;
      uniform vec3 horizon;
      void main() {
        float h = clamp(normalize(vWorld).y, 0.0, 1.0);
        vec3 c = mix(horizon, mid, smoothstep(0.0, 0.16, h));
        c = mix(c, top, smoothstep(0.18, 0.72, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  }),
);
scene.add(sky);

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new RoomEnvironment();
scene.environment = pmrem.fromScene(envScene, 0.03).texture;
scene.environmentIntensity = 0.42;
envScene.dispose?.();

const hemi = new THREE.HemisphereLight(0xcfd9d5, 0x7b6d59, 0.66);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0d3, 2.2);
sun.position.set(-20, 31, 23);
sun.target.position.set(13, 0, -28);
scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -38;
sun.shadow.camera.right = 38;
sun.shadow.camera.top = 38;
sun.shadow.camera.bottom = -38;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.00035;
sun.shadow.normalBias = 0.025;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xbfd2d2, 0.25);
fill.position.set(22, 16, -28);
scene.add(fill);
scene.add(new THREE.AmbientLight(0xd9d2c2, 0.12));

// DOM label layer, only visible in bird's-eye mode.
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.id = 'labels';
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.display = 'none';
app.appendChild(labelRenderer.domElement);

const labelGroup = new THREE.Group();
labelGroup.name = 'roomLabels';
labelGroup.visible = false;
scene.add(labelGroup);
for (const l of ROOM_LABELS) {
  const div = document.createElement('div');
  div.className = `room-label ${l.kind === 'major' ? 'major' : 'minor'}`;
  div.textContent = l.text;
  const obj = new CSS2DObject(div);
  obj.position.set(l.x, l.y, -l.z);
  labelGroup.add(obj);
}

const ui = new UI({
  onMode: (m) => switchMode(m),
  onSpot: (i) => {
    if (HOTSPOTS[i]?.id === 'birdview') {
      switchMode('orbit');
      ui.toast('从高处看三进格局');
      return;
    }
    if (currentMode !== 'panorama') switchMode('panorama');
    panorama.setHotspot(i);
    ui.showSpot(i);
  },
  onRoof: () => {
    const hidden = ui.isRoofHidden;
    world.ctx.roofs.forEach((o) => (o.visible = !hidden));
    world.ctx.ceilings.forEach((o) => (o.visible = !hidden));
    ui.toast(hidden ? '屋顶与顶棚已隐藏，可看梁架与格局' : '屋顶与顶棚已复原');
  },
  onQuality: () => applyQuality(),
});

ui.setLoading(8);
const mats = createMaterials();
ui.setLoading(34);
const world = buildWorld(scene, mats);
ui.setLoading(72);

const panorama = new PanoramaMode(camera, canvas, ui);
const walk = new WalkMode(camera, canvas, world.ctx, ui);
const orbit = new OrbitMode(canvas);
let currentMode: Mode = 'panorama';

function applyQuality(): void {
  const high = ui.isHighQuality;
  renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio, 1.75) : Math.min(window.devicePixelRatio, 1.1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  sun.castShadow = high;
  renderer.shadowMap.enabled = high;
  renderer.shadowMap.needsUpdate = true;
  ui.toast(high ? '画质：高 · 阴影与细节完整' : '画质：轻 · 适合移动端');
}

function switchMode(mode: Mode): void {
  if (currentMode === mode && mode !== 'panorama') return;
  if (currentMode === 'orbit' && mode !== 'orbit' && ui.isRoofHidden) {
    ui.setRoofHidden(false);
    world.ctx.roofs.forEach((o) => (o.visible = true));
    world.ctx.ceilings.forEach((o) => (o.visible = true));
    ui.toast('屋顶与顶棚已复原');
  }
  panorama.deactivate();
  walk.deactivate();
  orbit.deactivate();
  currentMode = mode;
  scene.fog = mode === 'orbit' ? orbitFog : fog;
  ui.setMode(mode);
  labelGroup.visible = mode === 'orbit';
  labelRenderer.domElement.style.display = mode === 'orbit' ? '' : 'none';
  if (mode === 'panorama') {
    panorama.activate();
    ui.showSpot(panorama.current);
  } else if (mode === 'walk') {
    walk.activate();
  } else {
    orbit.activate();
    ui.showSpot(9);
  }
}

// Start looking north from the middle of the inner courtyard.
panorama.current = 4;
ui.showSpot(4);
ui.setMode('panorama');
switchMode('panorama');

function resize(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  orbit.resize(w / h);
}
window.addEventListener('resize', resize);

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (currentMode === 'panorama') panorama.update(dt);
  else if (currentMode === 'walk') walk.update(dt);
  else orbit.update();
  const activeCamera = currentMode === 'orbit' ? orbit.camera : camera;
  renderer.render(scene, activeCamera);
  if (labelGroup.visible) labelRenderer.render(scene, activeCamera);
  requestAnimationFrame(frame);
}

ui.setLoading(92);
renderer.compile(scene, camera);
ui.setLoading(100);
requestAnimationFrame((t) => {
  last = t;
  frame(t);
  window.setTimeout(() => ui.finishLoading(), 380);
});

// Expose a minimal debug handle for smoke tests and further development.
(window as unknown as { __JINGHUA__: unknown }).__JINGHUA__ = { scene, camera, renderer, world, ui, switchMode, panorama, walk, orbit };

// Query parameters make it easy to inspect a mode or room without disturbing the UI.
window.setTimeout(() => {
  const q = new URLSearchParams(location.search);
  const mode = q.get('mode') as Mode | null;
  const spot = q.get('spot');
  if (mode === 'walk' || mode === 'orbit' || mode === 'panorama') switchMode(mode);
  if (spot !== null && mode !== 'walk') {
    const i = Number(spot);
    if (Number.isFinite(i) && i >= 0 && i < HOTSPOTS.length) {
      if (HOTSPOTS[i].id === 'birdview') switchMode('orbit');
      else {
        if (currentMode !== 'panorama') switchMode('panorama');
        panorama.setHotspot(i, true);
        ui.showSpot(i);
      }
    }
  }
}, 900);
