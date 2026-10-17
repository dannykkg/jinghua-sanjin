import * as THREE from 'three';
import type { Materials } from '../lib/materials';
import { createWorldContext, type WorldContext } from './context';
import { createHall } from './halls';
import { createGate, createGateHouse, createScreenWall } from './gate';
import { createCorridors } from './corridor';
import { createGarden, createPaving } from './garden';
import { HALLS, SITE } from '../data/site';
import { box } from '../lib/geom';
import { optimizeStatic } from './optimize';

function wall(ctx: WorldContext, x1: number, z1: number, x2: number, z2: number, h = SITE.wallHeight): void {
  const w = x2 - x1;
  const d = z2 - z1;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  box(w, 0.22, d, ctx.mats.stone, cx, 0, cz, ctx.architecture, false, true);
  box(w, h - 0.22, d, ctx.mats.brick, cx, 0.22, cz, ctx.architecture, true, true);
  // coping: a dark tile strip with a little overhang
  box(w + 0.1, 0.12, d + 0.1, ctx.mats.roofDark, cx, h, cz, ctx.architecture, false, true);
  box(w + 0.02, 0.07, d + 0.02, ctx.mats.paving, cx, h + 0.12, cz, ctx.architecture, false, true);
  ctx.addCollider(x1, z1, x2, z2);
}

function createWalls(ctx: WorldContext): void {
  // south wall, with the gate opening at x = 19.6 .. 22.8
  wall(ctx, 0, 0, 19.6, 0.4);
  wall(ctx, 22.8, 0, 26, 0.4);
  // east, west, north
  wall(ctx, 25.6, 0.4, 26, 55.6);
  wall(ctx, 0, 0.4, 0.4, 55.6);
  wall(ctx, 0.4, 55.6, 25.6, 56);

  // 看面墙: closes the south side of the inner courtyard, with the 垂花门 in the middle
  wall(ctx, 0.4, 18.72, 11.4, 19.02);
  wall(ctx, 14.6, 18.72, 25.6, 19.02);

  // short returns at the gate, tying the gate to the street wall
  wall(ctx, 19.6, 0.4, 19.84, 0.8, 2.6);
  wall(ctx, 22.56, 0.4, 22.8, 0.8, 2.6);
}

export interface BuiltWorld {
  ctx: WorldContext;
}

export function buildWorld(scene: THREE.Scene, mats: Materials): BuiltWorld {
  const ctx = createWorldContext(scene, mats);

  // ground and paving first so buildings sit on it
  createPaving(ctx);
  createWalls(ctx);

  for (const spec of HALLS) createHall(ctx, spec);

  createGate(ctx);
  createGateHouse(ctx);
  createScreenWall(ctx);
  createCorridors(ctx);
  createGarden(ctx);

  // Batch the hundreds of small static meshes before the scene is mirrored.
  optimizeStatic(ctx);

  // The plan is authored with +Z north for legibility. three.js needs north = -Z
  // if east is to feel like "right" when looking north, so mirror the site once here.
  const root = new THREE.Group();
  root.name = 'worldRoot';
  root.scale.z = -1;
  scene.add(root);
  for (const g of [ctx.architecture, ctx.interior, ctx.garden]) {
    scene.remove(g);
    root.add(g);
  }

  // A quiet outer apron: the user chose to focus on the courtyard, so no hutong buildings.
  // a broad, quiet ground so the site has a horizon instead of floating
  const groundMat = mats.stone.clone();
  groundMat.color = new THREE.Color(0xb0a89a);
  const groundMap = mats.stone.map?.clone();
  if (groundMap) {
    groundMap.repeat.set(64, 64);
    groundMap.wrapS = THREE.RepeatWrapping;
    groundMap.wrapT = THREE.RepeatWrapping;
    groundMap.needsUpdate = true;
    groundMat.map = groundMap;
  }
  groundMat.bumpMap = null;
  groundMat.roughness = 1;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(13, -0.08, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  return { ctx };
}
