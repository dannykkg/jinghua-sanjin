import * as THREE from 'three';
import type { WorldContext } from './context';
import { box, cylinder, plane } from '../lib/geom';
import { rng } from '../lib/materials';
import { createPottedPlant, createTeaSet } from '../interior/furniture';
import { PATHS, TERRACE, SITE } from '../data/site';

export function createPaving(ctx: WorldContext): void {
  // courtyard ground, tiled in 1 m squares
  box(SITE.width, 0.03, SITE.depth, ctx.mats.paving, SITE.centerX, -0.03, SITE.depth / 2, ctx.architecture, false, true);

  // A quieter, lighter path material; the paving map multiplied by a dark tint read as mud.
  const pathMat = ctx.mats.stone.clone();
  pathMat.color = new THREE.Color(0xcfc7b7);
  pathMat.roughness = 0.94;
  pathMat.envMapIntensity = 0.22;
  ctx.mats.pavingPath = pathMat;

  // main paths (low, but visible)
  for (const p of [PATHS.main, PATHS.cross, PATHS.front, PATHS.rear]) {
    const w = p.x2 - p.x1;
    const d = p.z2 - p.z1;
    box(w, 0.018, d, pathMat, (p.x1 + p.x2) / 2, 0.002, (p.z1 + p.z2) / 2, ctx.architecture, false, true);
    // darker brick edging
    box(w + 0.12, 0.024, 0.06, ctx.mats.stone, (p.x1 + p.x2) / 2, 0.0, p.z1, ctx.architecture, false, true);
    box(w + 0.12, 0.024, 0.06, ctx.mats.stone, (p.x1 + p.x2) / 2, 0.0, p.z2, ctx.architecture, false, true);
  }

  // side passages around the main hall
  for (const p of [
    { x1: 0.4, x2: 2.2, z1: 37.4, z2: 44.6 },
    { x1: 23.8, x2: 25.6, z1: 37.4, z2: 44.6 },
  ]) {
    box(p.x2 - p.x1, 0.018, p.z2 - p.z1, pathMat, (p.x1 + p.x2) / 2, 0.002, (p.z1 + p.z2) / 2, ctx.architecture, false, true);
  }

  // 月台
  const t = TERRACE;
  box(t.x2 - t.x1, t.height, t.z2 - t.z1, ctx.mats.stone, (t.x1 + t.x2) / 2, 0, (t.z1 + t.z2) / 2, ctx.architecture, false, true);
  plane(t.x2 - t.x1 - 0.06, t.z2 - t.z1 - 0.06, ctx.mats.paving, (t.x1 + t.x2) / 2, t.height + 0.014, (t.z1 + t.z2) / 2, -Math.PI / 2, 0, 0, ctx.architecture);
  ctx.addFloor(t.x1, t.z1, t.x2, t.z2, t.height);
  // terrace steps
  for (let k = 1; k <= 4; k++) {
    box(4.2, k * 0.15, 0.32, ctx.mats.stone, 13, 0, t.z1 - (4 - k + 0.5) * 0.32, ctx.architecture, true, true);
  }
  // Four side risers at each end of the extended 月台, down to the courtyard.
  // The 月台 now meets the raised corridor ends and the wing line at z=35.2.
  for (let k = 1; k <= 4; k++) {
    const top = (5 - k) * 0.15;
    box(0.3, top, 2.2, ctx.mats.stone, 6.1 - (k - 0.5) * 0.3, 0, 36.3, ctx.architecture, true, true);
    box(0.3, top, 2.2, ctx.mats.stone, 19.7 + (k - 0.5) * 0.3, 0, 36.3, ctx.architecture, true, true);
  }

  // Keep the terrace edge closed except at the central front steps and the two
  // corridor landings (x=6.1–7.6 and 18.2–19.7), which are level with the月台.
  ctx.addCollider(7.6, t.z1 - 0.1, 10.9, t.z1 + 0.1);
  ctx.addCollider(15.1, t.z1 - 0.1, 18.2, t.z1 + 0.1);
}

interface BranchTip { p: THREE.Vector3; n: THREE.Vector3; }

function buildTree(ctx: WorldContext, x: number, z: number, kind: 'crabapple' | 'pomegranate' | 'jujube'): void {
  const rand = rng(kind === 'crabapple' ? 501 : kind === 'pomegranate' ? 502 : 503);
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.set(1, 0.86, 1);
  ctx.garden.add(g);
  const tips: BranchTip[] = [];
  const trunkH = kind === 'jujube' ? 2.6 : kind === 'crabapple' ? 2.1 : 2.25;

  function branch(start: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number): void {
    const end = start.clone().addScaledVector(dir, len);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, len, 7), ctx.mats.woodDark);
    cyl.position.copy(mid);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    cyl.castShadow = true;
    cyl.receiveShadow = true;
    g.add(cyl);
    if (depth <= 0) {
      tips.push({ p: end, n: dir.clone().normalize() });
      return;
    }
    const count = depth >= 3 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.8;
      const spread = 0.38 + rand() * 0.35;
      const nd = dir.clone().normalize()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
        .add(new THREE.Vector3((rand() - 0.5) * spread, 0.22 + rand() * 0.2, (rand() - 0.5) * spread))
        .normalize();
      branch(end, nd, len * (0.62 + rand() * 0.12), rad * 0.62, depth - 1);
    }
  }

  // trunk bends a little
  const trunkDir = new THREE.Vector3((rand() - 0.5) * 0.16, 1, (rand() - 0.5) * 0.16).normalize();
  branch(new THREE.Vector3(0, 0, 0), trunkDir, trunkH, kind === 'jujube' ? 0.14 : 0.12, 5);

  // leaves: instanced cards placed around branch tips
  const leafCount = kind === 'crabapple' ? 1350 : kind === 'pomegranate' ? 1250 : 1500;
  const leafGeo = new THREE.PlaneGeometry(0.12, 0.19);
  const leaves = new THREE.InstancedMesh(leafGeo, ctx.mats.leaf, leafCount);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const d = new THREE.Object3D();
  for (let i = 0; i < leafCount; i++) {
    const t = tips[i % tips.length] ?? { p: new THREE.Vector3(0, trunkH, 0), n: new THREE.Vector3(0, 1, 0) };
    d.position.set(
      t.p.x + (rand() - 0.5) * 1.15,
      t.p.y + (rand() - 0.5) * 0.95,
      t.p.z + (rand() - 0.5) * 1.15,
    );
    d.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    const s = 0.55 + rand() * 0.75;
    d.scale.set(s, s, s);
    d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
  }
  leaves.instanceMatrix.needsUpdate = true;
  leaves.frustumCulled = false;
  g.add(leaves);

  if (kind === 'crabapple') {
    const bloomCount = 280;
    const bloomGeo = new THREE.PlaneGeometry(0.11, 0.11);
    const blooms = new THREE.InstancedMesh(bloomGeo, ctx.mats.blossom, bloomCount);
    blooms.castShadow = false;
    for (let i = 0; i < bloomCount; i++) {
      const t = tips[i % tips.length] ?? { p: new THREE.Vector3(0, trunkH, 0), n: new THREE.Vector3(0, 1, 0) };
      d.position.set(t.p.x + (rand() - 0.5) * 1.35, t.p.y + (rand() - 0.5) * 1.0, t.p.z + (rand() - 0.5) * 1.35);
      d.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      const s = 0.6 + rand() * 0.7;
      d.scale.set(s, s, s);
      d.updateMatrix();
      blooms.setMatrixAt(i, d.matrix);
    }
    blooms.instanceMatrix.needsUpdate = true;
    blooms.frustumCulled = false;
    g.add(blooms);
  }

  if (kind === 'pomegranate') {
    const fruitCount = 12;
    const fruits = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), ctx.mats.fruit, fruitCount);
    for (let i = 0; i < fruitCount; i++) {
      const t = tips[Math.floor(rand() * tips.length)] ?? { p: new THREE.Vector3(0, trunkH, 0), n: new THREE.Vector3(0, 1, 0) };
      d.position.set(t.p.x + (rand() - 0.5) * 1.2, t.p.y - 0.15 - rand() * 0.5, t.p.z + (rand() - 0.5) * 1.2);
      d.rotation.set(0, 0, 0);
      d.scale.setScalar(0.8 + rand() * 0.5);
      d.updateMatrix();
      fruits.setMatrixAt(i, d.matrix);
    }
    fruits.instanceMatrix.needsUpdate = true;
    fruits.frustumCulled = false;
    g.add(fruits);
  }

  ctx.addCollider(x - 0.5, z - 0.5, x + 0.5, z + 0.5);
}

export function createGarden(ctx: WorldContext): void {
  buildTree(ctx, 9.15, 31.7, 'crabapple');
  buildTree(ctx, 16.85, 31.7, 'pomegranate');
  buildTree(ctx, 9.1, 48.4, 'jujube');

  // water vat / lotus
  const vat = new THREE.Group();
  vat.position.set(10.0, 0, 32.8);
  ctx.garden.add(vat);
  cylinder(0.78, 0.66, 0.78, 18, ctx.mats.stone, 0, 0, 0, vat, true, true);
  cylinder(0.7, 0.7, 0.03, 24, ctx.mats.water, 0, 0.755, 0, vat, false, true);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 8, 24), ctx.mats.stone);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.79;
  vat.add(rim);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.16 + (i % 3) * 0.04, 12), ctx.mats.leaf);
    leaf.rotation.x = -Math.PI / 2;
    leaf.position.set(Math.cos(a) * 0.35, 0.80, Math.sin(a) * 0.35);
    vat.add(leaf);
  }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), ctx.mats.blossom);
    flower.scale.y = 0.7;
    flower.position.set(Math.cos(a) * 0.22, 0.86, Math.sin(a) * 0.22);
    vat.add(flower);
  }
  ctx.addCollider(9.2, 32.0, 10.8, 33.6);

  // stone table and stools
  const table = new THREE.Group();
  table.position.set(16.55, 0, 33.3);
  ctx.garden.add(table);
  cylinder(0.24, 0.34, 0.62, 12, ctx.mats.stone, 0, 0, 0, table, true, true);
  cylinder(0.62, 0.62, 0.08, 18, ctx.mats.stone, 0, 0.66, 0, table, true, true);
  const tableTea = createTeaSet(ctx.mats);
  tableTea.position.set(0, 0.74, 0);
  table.add(tableTea);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    cylinder(0.2, 0.24, 0.42, 10, ctx.mats.stone, Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95, table, true, true);
  }
  ctx.addCollider(15.6, 32.4, 17.5, 34.2);

  // The residual light/service court behind each corridor: a water jar and a drain.
  // It is deliberately readable as a minor utility court, not a formal room.
  for (const mirror of [1, -1] as const) {
    const x = mirror === 1 ? 2.6 : 22.6;
    const jar = new THREE.Group();
    jar.position.set(x, 0, 22.7);
    ctx.garden.add(jar);
    cylinder(0.34, 0.27, 0.56, 14, ctx.mats.stone, 0, 0, 0, jar, true, true);
    cylinder(0.37, 0.37, 0.055, 16, ctx.mats.stone, 0, 0.56, 0, jar, true, true);
    ctx.addCollider(x - 0.4, 22.3, x + 0.4, 23.1);

    const drainX = mirror === 1 ? 3.3 : 22.1;
    box(0.9, 0.035, 0.55, ctx.mats.stone, drainX, 0.015, 20.5, ctx.garden, false, true);
    for (let i = 0; i < 5; i++) {
      box(0.06, 0.04, 0.5, ctx.mats.roofDark, drainX - 0.34 + i * 0.17, 0.05, 20.5, ctx.garden, false, true);
    }

    const potX = mirror === 1 ? 1.55 : 24.0;
    const plant = createPottedPlant(ctx.mats, 0.7);
    plant.position.set(potX, 0, 24.3);
    ctx.garden.add(plant);
    ctx.addCollider(potX - 0.35, 23.95, potX + 0.35, 24.65);
  }

  // potted plants along the corridors / terrace
  const pots: Array<[number, number, number, number]> = [
    [7.45, 0, 23.6, 0.8], [7.45, 0, 33.0, 0.7],
    [18.55, 0, 23.6, 0.8], [18.55, 0, 33.0, 0.7],
    [9.2, 0.6, 35.8, 0.7], [16.8, 0.6, 35.8, 0.7],
  ];
  for (const [px, py, pz, s] of pots) {
    const p = createPottedPlant(ctx.mats, s);
    p.position.set(px, py, pz);
    ctx.garden.add(p);
  }
}
