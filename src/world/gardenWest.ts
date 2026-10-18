import * as THREE from 'three';
import type { WorldContext } from './context';
import { WEST_GARDEN } from '../data/site';
import { box, createGableRoof, createLatticePanel, cylinder, plane } from '../lib/geom';
import { buildTree } from './garden';

const G = WEST_GARDEN;

function wall(ctx: WorldContext, x1: number, z1: number, x2: number, z2: number): void {
  const w = x2 - x1;
  const d = z2 - z1;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  box(w, 0.22, d, ctx.mats.stone, cx, 0, cz, ctx.architecture, false, true);
  box(w, 2.05, d, ctx.mats.plaster, cx, 0.22, cz, ctx.architecture, true, true);
  box(w, 0.33, d, ctx.mats.brick, cx, 0.22, cz, ctx.architecture, true, true);
  box(w + 0.12, 0.14, d + 0.12, ctx.mats.roofDark, cx, 2.6, cz, ctx.architecture, false, true);
  ctx.addCollider(x1, z1, x2, z2);
}

function path(ctx: WorldContext, x1: number, z1: number, x2: number, z2: number): void {
  const w = x2 - x1;
  const d = z2 - z1;
  plane(w, d, ctx.mats.pavingPath, (x1 + x2) / 2, 0.022, (z1 + z2) / 2, -Math.PI / 2, 0, 0, ctx.garden);
  box(w + 0.08, 0.025, 0.06, ctx.mats.stone, (x1 + x2) / 2, 0.0, z1, ctx.garden, false, true);
  box(w + 0.08, 0.025, 0.06, ctx.mats.stone, (x1 + x2) / 2, 0.0, z2, ctx.garden, false, true);
}

function fish(ctx: WorldContext, x: number, z: number, material: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0.19, z);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), material);
  body.scale.set(0.07, 0.028, 0.038);
  body.castShadow = true;
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.075, 4), material);
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -0.08;
  g.add(tail);
  return g;
}

function bamboo(ctx: WorldContext, x: number, z: number, n: number): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  for (let i = 0; i < n; i++) {
    const a = i * 1.9;
    const bx = Math.cos(a) * 0.18;
    const bz = Math.sin(a) * 0.18;
    const h = 1.8 + (i % 3) * 0.35;
    const stem = cylinder(0.018, 0.026, h, 5, ctx.mats.woodLight, bx, 0, bz, g);
    stem.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.035;
    for (let j = 0; j < 4; j++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.35), ctx.mats.leaf);
      leaf.position.set(bx + (j % 2 === 0 ? 0.12 : -0.12), h - 0.1 - j * 0.16, bz + (j - 1.5) * 0.08);
      leaf.rotation.set(0.2, a + j, 0.5);
      g.add(leaf);
    }
  }
  ctx.garden.add(g);
}

function rockery(ctx: WorldContext): void {
  const stones = [
    [-7.0, 0.55, 24.0, 0.65, 0.75, 0.55, 0.2],
    [-6.3, 0.35, 24.3, 0.5, 0.55, 0.45, -0.4],
    [-6.8, 1.05, 24.2, 0.35, 0.5, 0.32, 0.6],
    [-6.0, 0.3, 23.8, 0.38, 0.3, 0.3, 0.1],
    [-7.1, 0.25, 23.2, 0.7, 0.25, 0.45, -0.2],
  ];
  for (const [x, y, z, sx, sy, sz, rot] of stones) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), ctx.mats.stone);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.y = rot;
    m.castShadow = true;
    m.receiveShadow = true;
    ctx.garden.add(m);
  }
  ctx.addCollider(-7.6, 22.8, -5.8, 25.2);
}

function pavilion(ctx: WorldContext): void {
  const g = new THREE.Group();
  ctx.garden.add(g);
  const x1 = -6.15;
  const x2 = -3.45;
  const z1 = 33.2;
  const z2 = 35.9;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  box(x2 - x1, 0.24, z2 - z1, ctx.mats.stone, cx, 0, cz, g, false, true);
  plane(x2 - x1 - 0.04, z2 - z1 - 0.04, ctx.mats.paving, cx, 0.252, cz, -Math.PI / 2, 0, 0, g);
  ctx.addFloor(x1, z1, x2, z2, 0.24);
  for (const x of [x1 + 0.22, x2 - 0.22]) {
    for (const z of [z1 + 0.22, z2 - 0.22]) {
      cylinder(0.13, 0.15, 2.26, 10, ctx.mats.woodVertical, x, 0.24, z, g);
      cylinder(0.2, 0.22, 0.14, 12, ctx.mats.stone, x, 0.22, z, g);
    }
  }
  box(x2 - x1 - 0.2, 0.18, 0.18, ctx.mats.woodDark, cx, 2.42, z1 + 0.22, g, true, true);
  box(x2 - x1 - 0.2, 0.18, 0.18, ctx.mats.woodDark, cx, 2.42, z2 - 0.22, g, true, true);
  createGableRoof({
    centerX: cx, centerZ: cz, width: x2 - x1, depth: z2 - z1,
    eave: 2.55, ridge: 3.22, overhang: 0.36, ridgeAxis: 'x',
    mats: ctx.mats, parent: g, roofStore: ctx.roofs,
  });
  // low side rails, leaving the east side open
  for (const z of [z1 + 0.24, z2 - 0.24]) {
    box(0.06, 0.06, 0.8, ctx.mats.woodDark, x1 + 0.24, 0.55, z + 0.0, g, true, true);
  }
  // low timber rails on three sides; the east side stays open for entry
  const railY = 0.78;
  for (const z of [z1 + 0.3, z2 - 0.3]) {
    box(x2 - x1 - 0.6, 0.055, 0.055, ctx.mats.woodDark, cx, railY, z, g, true, true);
    for (let i = 0; i < 4; i++) {
      box(0.05, 0.65, 0.05, ctx.mats.woodDark, x1 + 0.3 + i * 0.8, 0.24, z, g, true, true);
    }
  }
  box(0.055, 0.055, z2 - z1 - 0.6, ctx.mats.woodDark, x1 + 0.3, railY, cz, g, true, true);
  for (let i = 0; i < 4; i++) {
    box(0.05, 0.65, 0.05, ctx.mats.woodDark, x1 + 0.3, 0.24, z1 + 0.3 + i * 0.8, g, true, true);
  }
  // a simple bench along the west side
  box(0.34, 0.07, 1.0, ctx.mats.woodDark, x1 + 0.55, 0.62, cz, g, true, true);
  for (const z of [cz - 0.4, cz + 0.4]) {
    box(0.06, 0.4, 0.06, ctx.mats.woodDark, x1 + 0.55, 0.24, z, g, true, true);
  }

  // two stone steps on the east side
  box(1.3, 0.12, 0.55, ctx.mats.stone, x2 + 0.1, 0, cz, g, true, true);
  box(1.3, 0.24, 0.3, ctx.mats.stone, x2 + 0.25, 0, cz, g, true, true);
  // Columns only; the pavilion is open on all sides, with steps on the east.
  for (const x of [x1 + 0.22, x2 - 0.22]) {
    for (const z of [z1 + 0.22, z2 - 0.22]) {
      ctx.addCollider(x - 0.18, z - 0.18, x + 0.18, z + 0.18);
    }
  }
}

function shrub(ctx: WorldContext, x: number, z: number, s = 1): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  for (let i = 0; i < 7; i++) {
    const a = i * 1.7;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.26 * s, 0.5 * s), ctx.mats.leaf);
    leaf.position.set(Math.cos(a) * 0.12 * s, 0.3 * s, Math.sin(a) * 0.12 * s);
    leaf.rotation.set(0.5, a, 0.25);
    g.add(leaf);
  }
  ctx.garden.add(g);
}

function flowerClump(ctx: WorldContext, x: number, z: number, color: THREE.Material = ctx.mats.blossom): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.9;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.42), ctx.mats.leaf);
    leaf.position.set(Math.cos(a) * 0.1, 0.22, Math.sin(a) * 0.1);
    leaf.rotation.set(0.45, a, 0.2);
    g.add(leaf);
  }
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), color);
    f.position.set((i - 1) * 0.12, 0.42 + (i % 2) * 0.07, (i % 2) * 0.1);
    g.add(f);
  }
  ctx.garden.add(g);
}

function stoneLantern(ctx: WorldContext, x: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  cylinder(0.22, 0.27, 0.16, 8, ctx.mats.stone, 0, 0, 0, g);
  cylinder(0.09, 0.12, 0.75, 8, ctx.mats.stone, 0, 0.16, 0, g);
  box(0.34, 0.28, 0.34, ctx.mats.stone, 0, 0.91, 0, g);
  box(0.38, 0.08, 0.38, ctx.mats.roofDark, 0, 1.19, 0, g);
  cone: {
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.18, 4), ctx.mats.roofDark);
    cap.position.y = 1.3;
    cap.rotation.y = Math.PI / 4;
    g.add(cap);
  }
  box(0.2, 0.16, 0.02, ctx.mats.lanternPaper, 0, 0.97, 0.18, g);
  ctx.garden.add(g);
}

function pergola(ctx: WorldContext): void {
  const g = new THREE.Group();
  g.position.set(0, 0, 7.8);
  const x1 = -2.95;
  const x2 = -0.65;
  const z1 = -1.8;
  const z2 = 1.8;
  for (const x of [x1, x2]) {
    for (const z of [z1, z2]) {
      box(0.12, 2.35, 0.12, ctx.mats.woodDark, x, 0, z, g);
      cylinder(0.18, 0.2, 0.16, 8, ctx.mats.stone, x, 0, z, g);
    }
  }
  for (const z of [z1, z2]) box(x2 - x1 + 0.3, 0.12, 0.16, ctx.mats.woodDark, (x1 + x2) / 2, 2.3, z, g);
  for (let i = 0; i < 5; i++) {
    const z = z1 + (i / 4) * (z2 - z1);
    box(x2 - x1 + 0.35, 0.07, 0.09, ctx.mats.woodDark, (x1 + x2) / 2, 2.4, z, g);
  }
  // sparse vines on top
  for (let i = 0; i < 18; i++) {
    const a = i * 1.7;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.36), ctx.mats.leaf);
    leaf.position.set(x1 + 0.2 + (i % 6) * 0.35, 2.3 + (i % 3) * 0.08, z1 + 0.2 + (i % 5) * 0.7);
    leaf.rotation.set(0.8, a, 0.2);
    g.add(leaf);
  }
  ctx.garden.add(g);
}

export function createWestGarden(ctx: WorldContext): void {
  const x1 = G.x1;
  const x2 = G.x2;
  const z1 = G.z1;
  const z2 = G.z2;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;

  // Garden floor: a quieter stone/earth surface than the main courtyard.
  box(x2 - x1, 0.025, z2 - z1, ctx.mats.paving, cx, -0.025, cz, ctx.architecture, false, true);
  plane(x2 - x1 - 0.05, z2 - z1 - 0.05, ctx.mats.paving, cx, 0.012, cz, -Math.PI / 2, 0, 0, ctx.garden);

  // Perimeter: west, south and north. The east side reuses the main west wall.
  wall(ctx, x1, z1, x1 + 0.4, z2);
  wall(ctx, x1, z1, x2, z1 + 0.4);
  wall(ctx, x1, z2 - 0.4, x2, z2);

  // Two cross-walls divide the long west strip into front, middle and rear
  // garden courts. Each has a moon-gate opening aligned with the main path.
  for (const z of [19.4, 37.8]) {
    wall(ctx, x1, z - 0.2, -2.2, z + 0.2);
    wall(ctx, -0.8, z - 0.2, x2, z + 0.2);
    box(1.4, 0.38, 0.4, ctx.mats.brick, -1.5, 2.22, z, ctx.garden, true, true);
    box(1.55, 0.1, 0.52, ctx.mats.roofDark, -1.5, 2.6, z, ctx.garden, false, true);
    const gateArch = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 7, 20), ctx.mats.stone);
    gateArch.position.set(-1.5, 1.1, z);
    gateArch.castShadow = true;
    ctx.garden.add(gateArch);
    box(1.4, 0.08, 0.4, ctx.mats.stone, -1.5, 0, z, ctx.garden, false, true);
  }

  // Moon gate in the existing west wall opening.
  const gateZ = (G.gateZ1 + G.gateZ2) / 2;
  box(0.46, 0.09, G.gateZ2 - G.gateZ1, ctx.mats.stone, 0, 0, gateZ, ctx.garden, false, true);
  // header over the opening (no collider: it is above head height)
  box(0.4, 0.38, G.gateZ2 - G.gateZ1, ctx.mats.brick, 0, 2.22, gateZ, ctx.garden, true, true);
  box(0.5, 0.12, G.gateZ2 - G.gateZ1 + 0.12, ctx.mats.roofDark, 0, 2.6, gateZ, ctx.garden, false, true);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.055, 8, 24), ctx.mats.stone);
  arch.position.set(0.22, 1.15, gateZ);
  arch.rotation.y = Math.PI / 2;
  arch.castShadow = true;
  ctx.garden.add(arch);
  // stone thresholds on both sides of the gate
  box(0.5, 0.08, G.gateZ2 - G.gateZ1, ctx.mats.stone, -0.2, 0, gateZ, ctx.garden, false, true);
  box(0.5, 0.08, G.gateZ2 - G.gateZ1, ctx.mats.stone, 0.2, 0, gateZ, ctx.garden, false, true);

  // Paths: gate -> north-south spine -> pond / pavilion.
  path(ctx, -2.2, 21.55, 0, 22.65);
  path(ctx, -2.2, 1.0, -1.0, 54.9);
  path(ctx, -3.3, 27.0, -1.0, 28.1);
  path(ctx, -3.55, 34.3, -1.0, 35.3);
  path(ctx, -7.0, 21.0, -2.2, 21.55);
  path(ctx, -2.2, 8.8, -1.0, 10.0);
  path(ctx, -2.2, 46.5, -1.0, 47.7);

  // Pond: a raised stone rim, dark bottom, water, and a few fish.
  const px1 = -6.2;
  const px2 = -3.2;
  const pz1 = 25.9;
  const pz2 = 29.0;
  const pcx = (px1 + px2) / 2;
  const pcz = (pz1 + pz2) / 2;
  plane(px2 - px1, pz2 - pz1, ctx.mats.soil, pcx, 0.02, pcz, -Math.PI / 2, 0, 0, ctx.garden);
  plane(px2 - px1 - 0.5, pz2 - pz1 - 0.5, ctx.mats.water, pcx, 0.17, pcz, -Math.PI / 2, 0, 0, ctx.garden);
  const rim = 0.28;
  box(px2 - px1, 0.28, rim, ctx.mats.stone, pcx, 0, pz1 + rim / 2, ctx.garden, true, true);
  box(px2 - px1, 0.28, rim, ctx.mats.stone, pcx, 0, pz2 - rim / 2, ctx.garden, true, true);
  box(rim, 0.28, pz2 - pz1 - rim * 2, ctx.mats.stone, px1 + rim / 2, 0, pcz, ctx.garden, true, true);
  box(rim, 0.28, pz2 - pz1 - rim * 2, ctx.mats.stone, px2 - rim / 2, 0, pcz, ctx.garden, true, true);
  ctx.addCollider(px1 - 0.15, pz1 - 0.15, px2 + 0.15, pz2 + 0.15);
  ctx.garden.add(fish(ctx, -5.0, 27.0, ctx.mats.fruit), fish(ctx, -4.5, 27.8, ctx.mats.gold), fish(ctx, -5.4, 28.2, ctx.mats.fruit));

  // Rockery behind the pond.
  rockery(ctx);

  // Small open pavilion at the north-west corner.
  pavilion(ctx);

  // Bamboo and a banana-like clump.
  bamboo(ctx, -7.15, 30.4, 6);
  bamboo(ctx, -7.1, 36.4, 4);
  const banana = new THREE.Group();
  banana.position.set(-1.35, 0, 25.3);
  cylinder(0.08, 0.11, 1.1, 7, ctx.mats.woodLight, 0, 0, 0, banana);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.35), ctx.mats.leaf);
    leaf.position.set(Math.cos(a) * 0.25, 1.0, Math.sin(a) * 0.25);
    leaf.rotation.set(0.5, a, 0.15);
    banana.add(leaf);
  }
  ctx.garden.add(banana);

  // Flower bed along the south wall; low, so it does not block the gate path.
  box(5.8, 0.12, 0.7, ctx.mats.soil, -4.1, 0, 20.75, ctx.garden, false, true);
  for (let i = 0; i < 18; i++) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), i % 3 === 0 ? ctx.mats.blossom : ctx.mats.leaf);
    f.position.set(-6.8 + (i % 9) * 0.6, 0.17 + (i % 2) * 0.06, 20.65 + Math.floor(i / 9) * 0.2);
    ctx.garden.add(f);
  }

  // Leak windows / lattice openings on the long west wall.
  for (const z of [8.0, 24.5, 32.0, 47.0]) {
    box(0.02, 0.75, 0.9, ctx.mats.blackLacquer, -7.59, 1.2, z, ctx.garden, false, false);
    box(0.03, 0.95, 1.05, ctx.mats.stone, -7.6, 1.08, z, ctx.garden, false, false);
    const lat = createLatticePanel({ width: 0.9, height: 0.72, mats: ctx.mats, paper: false, frame: true, dark: true });
    lat.position.set(-7.56, 1.56, z);
    lat.rotation.y = Math.PI / 2;
    ctx.garden.add(lat);
  }

  // A full-depth side garden: front orchard/service section and rear orchard.
  buildTree(ctx, -6.45, 10.2, 'pomegranate');
  buildTree(ctx, -6.5, 46.8, 'jujube');
  bamboo(ctx, -7.1, 7.2, 4);
  bamboo(ctx, -7.15, 50.0, 5);
  for (const z of [8.0, 14.0, 44.0, 51.0]) {
    box(0.8, 0.10, 2.4, ctx.mats.soil, -7.1, 0, z, ctx.garden, false, true);
    for (let i = 0; i < 4; i++) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 5), ctx.mats.leaf);
      bush.scale.set(1.2, 0.6, 1.0);
      bush.position.set(-7.25 + (i % 2) * 0.22, 0.2, z - 0.75 + i * 0.42);
      bush.castShadow = true;
      ctx.garden.add(bush);
    }
  }

  // A pomegranate tree in the north-west planting bed.
  buildTree(ctx, -6.8, 18.0, 'pomegranate');

  // Soil beds along the west wall, with low shrubs.
  for (const z of [22.2, 37.0]) {
    box(0.7, 0.10, 2.0, ctx.mats.soil, -7.15, 0, z, ctx.garden, false, true);
    for (let i = 0; i < 5; i++) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 5), ctx.mats.leaf);
      bush.scale.set(1.2, 0.65, 1.0);
      bush.position.set(-7.25 + (i % 2) * 0.24, 0.22, z - 0.7 + i * 0.3);
      bush.castShadow = true;
      ctx.garden.add(bush);
    }
  }

  // Lotus leaves and two flowers in the pond.
  for (let i = 0; i < 9; i++) {
    const a = i * 2.2;
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.18 + (i % 3) * 0.04, 10), ctx.mats.leaf);
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.set(-4.8 + Math.cos(a) * 0.85, 0.19, 27.45 + Math.sin(a) * 0.9);
    ctx.garden.add(leaf);
  }
  for (const [x, z] of [[-5.2, 26.7], [-4.3, 28.1]]) {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), ctx.mats.blossom);
    flower.scale.y = 0.7;
    flower.position.set(x, 0.24, z);
    ctx.garden.add(flower);
  }

  // Garden planting: peony clumps, shrubs, pond reeds and edge rocks.
  for (const [x, z] of [[-6.8, 18.0], [-6.8, 21.0], [-6.8, 24.0], [-2.6, 20.0], [-1.2, 35.0], [-2.7, 37.2], [-6.5, 40.0], [-6.6, 43.0], [-6.7, 52.0]]) {
    flowerClump(ctx, x, z);
    shrub(ctx, x + 0.35, z + 0.3, 0.7);
  }
  for (let i = 0; i < 10; i++) {
    const a = i * 2.3;
    const x = -4.75 + Math.cos(a) * 1.65;
    const z = 27.45 + Math.sin(a) * 1.65;
    cylinder(0.012, 0.018, 0.9 + (i % 3) * 0.2, 5, ctx.mats.leaf, x, 0.15, z, ctx.garden);
  }
  for (const [x, z, s] of [[-6.0, 25.5, 0.45], [-3.4, 28.8, 0.32], [-5.8, 29.2, 0.28]]) {
    const r = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), ctx.mats.stone);
    r.position.set(x, 0.16, z);
    r.scale.set(s, s * 0.55, s);
    r.rotation.y = x;
    ctx.garden.add(r);
  }
  stoneLantern(ctx, -7.0, 24.0);
  stoneLantern(ctx, -6.9, 45.2);
  pergola(ctx);

  // A pot by the gate, clear of the threshold.
  const pot = new THREE.Group();
  pot.position.set(-0.9, 0, 23.6);
  const potBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 12), ctx.mats.porcelainBlue);
  pot.add(potBase);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.5), ctx.mats.leaf);
    l.position.set(Math.cos(a) * 0.1, 0.5, Math.sin(a) * 0.1);
    l.rotation.set(0.4, a, 0.2);
    pot.add(l);
  }
  ctx.garden.add(pot);
}
