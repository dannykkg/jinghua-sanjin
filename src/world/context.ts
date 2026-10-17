import * as THREE from 'three';
import type { Materials } from '../lib/materials';
import type { HallSpec } from '../data/site';

export interface AABB { x1: number; z1: number; x2: number; z2: number; }
export interface FloorZone extends AABB { y: number; }

export interface DoorAnim {
  pivot: THREE.Object3D;
  closed: number;
  open: number;
  amount: number;
  opening: boolean;
}

export interface WorldContext {
  scene: THREE.Scene;
  mats: Materials;
  architecture: THREE.Group;
  interior: THREE.Group;
  garden: THREE.Group;
  roofs: THREE.Object3D[];
  ceilings: THREE.Object3D[];
  doorAnims: DoorAnim[];
  colliders: AABB[];
  floors: FloorZone[];
  addCollider: (x1: number, z1: number, x2: number, z2: number) => void;
  addFloor: (x1: number, z1: number, x2: number, z2: number, y: number) => void;
}

export function createWorldContext(scene: THREE.Scene, mats: Materials): WorldContext {
  const architecture = new THREE.Group();
  architecture.name = 'architecture';
  const interior = new THREE.Group();
  interior.name = 'interior';
  const garden = new THREE.Group();
  garden.name = 'garden';
  scene.add(architecture, interior, garden);

  const ctx: WorldContext = {
    scene, mats, architecture, interior, garden,
    roofs: [], ceilings: [], doorAnims: [], colliders: [], floors: [],
    addCollider(x1, z1, x2, z2) {
      if (x2 - x1 < 0.01 || z2 - z1 < 0.01) return;
      ctx.colliders.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2) });
    },
    addFloor(x1, z1, x2, z2, y) {
      ctx.floors.push({ x1: Math.min(x1, x2), x2: Math.max(x1, x2), z1: Math.min(z1, z2), z2: Math.max(z1, z2), y });
    },
  };
  return ctx;
}

export interface HallContext {
  spec: HallSpec;
  facadePlane: number;
  bayBounds: number[];
  bayWidths: number[];
  doorCenter: number;
  doorWidth: number;
}
