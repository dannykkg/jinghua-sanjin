import * as THREE from 'three';
import type { WorldContext } from './context';
import { CORRIDORS } from '../data/site';
import { box, cylinder, plane, worldUVBox } from '../lib/geom';
import { createLatticePanel } from '../lib/geom';
import { createLantern } from '../interior/furniture';

interface CorridorSpec { x1: number; z1: number; x2: number; z2: number; side: string; }

// The corridor is a raised, all-weather walk at the same level as the 垂花门.
// It is deliberately higher than the 厢房 platform; the wing door has a small threshold.
const PLATFORM = 0.45;

function makeRoof(ctx: WorldContext, parent: THREE.Group, x1: number, z1: number, x2: number, z2: number, spec: CorridorSpec, lowX: number): void {
  const w = x2 - x1;
  const d = z2 - z1;
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const vertical = d > w;
  const slope = Math.atan2(0.35, vertical ? w : d);
  const roofH = 0.12;
  const geo = worldUVBox(vertical ? w + 0.34 : w + 0.2, roofH, vertical ? d + 0.2 : d + 0.34, 1);
  const roof = new THREE.Mesh(geo, ctx.mats.roof);
  roof.castShadow = true;
  roof.receiveShadow = true;
  if (vertical) {
    const highWest = spec.side === 'west';
    roof.rotation.z = highWest ? -slope : slope;
    roof.position.set(cx, 3.01, cz);
  } else {
    roof.rotation.x = slope;
    roof.position.set(cx, 3.01, cz);
  }
  parent.add(roof);
  ctx.roofs.push(roof);

  // fascia along the low eave and a beam under it
  if (vertical) {
    box(0.1, 0.16, d + 0.2, ctx.mats.woodDark, x1 - 0.04, 2.79, cz, parent, true, true);
    box(0.1, 0.16, d + 0.2, ctx.mats.woodDark, x2 + 0.04, 2.79, cz, parent, true, true);
    box(0.24, 0.18, d + 0.05, ctx.mats.woodDark, x2, 2.77, cz, parent, true, true);
  } else {
    box(w + 0.2, 0.16, 0.1, ctx.mats.woodDark, cx, 2.79, z1 - 0.04, parent, true, true);
    box(w + 0.2, 0.16, 0.1, ctx.mats.woodDark, cx, 2.79, z2 + 0.04, parent, true, true);
    box(w + 0.05, 0.18, 0.24, ctx.mats.woodDark, cx, 2.77, z2, parent, true, true);
  }

  // eave tile ends
  const count = Math.max(6, Math.round((vertical ? d : w) / 0.3));
  const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 7, 1, false, 0, Math.PI), ctx.mats.roof, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    if (vertical) {
      const z = z1 + (i + 0.5) * (d / count);
      dummy.position.set(lowX + (spec.side === 'west' ? 0.02 : -0.02), 2.83, z);
      dummy.rotation.set(Math.PI / 2, 0, 0);
    } else {
      const x = x1 + (i + 0.5) * (w / count);
      dummy.position.set(x, 2.83, z2 + 0.02);
      dummy.rotation.set(0, 0, Math.PI / 2);
    }
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  parent.add(inst);
}

interface RailOpening { center: number; width: number; }

function railing(ctx: WorldContext, parent: THREE.Group, x1: number, z1: number, x2: number, z2: number, lowX: number, opening?: RailOpening, endInset = 1.8): void {
  const vertical = z2 - z1 > x2 - x1;
  const gap = 1.8; // a real opening at each end, aligned with the walk collision
  const a = vertical ? z1 + gap : x1 + gap;
  const b = vertical ? z2 - endInset : x2 - gap;
  if (b - a < 0.4) return;
  const railY = 0.89;
  const ranges: Array<[number, number]> = [];
  if (vertical && opening) {
    ranges.push([a, opening.center - opening.width / 2], [opening.center + opening.width / 2, b]);
  } else {
    ranges.push([a, b]);
  }
  for (const [s, e] of ranges) {
    const span = e - s;
    if (span < 0.4) continue;
    const count = Math.max(2, Math.round(span / 1.8));
    if (vertical) {
      const x = lowX;
      box(0.06, 0.06, span, ctx.mats.woodDark, x, railY, (s + e) / 2, parent, true, true);
      box(0.05, 0.05, span, ctx.mats.woodDark, x, 0.67, (s + e) / 2, parent, true, true);
      for (let i = 0; i <= count; i++) {
        const z = s + (i / count) * span;
        box(0.07, 0.75, 0.07, ctx.mats.woodDark, x, PLATFORM, z, parent, true, true);
        box(0.1, 0.04, 0.1, ctx.mats.stone, x, 1.13, z, parent, true, true);
      }
    } else {
      const z = z2 - 0.04;
      box(span, 0.06, 0.06, ctx.mats.woodDark, (s + e) / 2, railY, z, parent, true, true);
      box(span, 0.05, 0.05, ctx.mats.woodDark, (s + e) / 2, 0.67, z, parent, true, true);
      for (let i = 0; i <= count; i++) {
        const x = s + (i / count) * span;
        box(0.07, 0.75, 0.07, ctx.mats.woodDark, x, PLATFORM, z, parent, true, true);
        box(0.1, 0.04, 0.1, ctx.mats.stone, x, 1.13, z, parent, true, true);
      }
    }
  }
}

export function createCorridors(ctx: WorldContext): void {
  for (const spec of CORRIDORS) {
    const { x1, z1, x2, z2 } = spec;
    const g = new THREE.Group();
    g.name = `corridor-${spec.side}`;
    ctx.architecture.add(g);
    const w = x2 - x1;
    const d = z2 - z1;
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const vertical = d > w;

    box(w, PLATFORM, d, ctx.mats.stone, cx, 0, cz, g, false, true);
    plane(w - 0.04, d - 0.04, ctx.mats.paving, cx, PLATFORM + 0.012, cz, -Math.PI / 2, 0, 0, g);
    ctx.addFloor(x1, z1, x2, z2, PLATFORM);

    // columns along the open courtyard edge
    const colCount = Math.max(3, Math.round((vertical ? d : w) / 2.4));
    if (vertical) {
      const lowX = spec.side === 'west' ? x2 : x1;
      const x = lowX + (spec.side === 'west' ? -0.18 : 0.18);
      const doorZ = 30.4;
      for (let i = 0; i <= colCount; i++) {
        const z = z1 + (i / colCount) * d;
        if (Math.abs(z - doorZ) < 0.9) continue;
        cylinder(0.13, 0.15, 2.34, 10, ctx.mats.woodVertical, x, PLATFORM, z, g);
        cylinder(0.22, 0.24, 0.16, 12, ctx.mats.stone, x, PLATFORM - 0.02, z, g);
      }
      // frame the wing-door opening with a pair of columns
      for (const z of [doorZ - 0.85, doorZ + 0.85]) {
        cylinder(0.13, 0.15, 2.34, 10, ctx.mats.woodVertical, x, PLATFORM, z, g);
        cylinder(0.22, 0.24, 0.16, 12, ctx.mats.stone, x, PLATFORM - 0.02, z, g);
      }
      // hanging 楣子 between columns, clear of the door opening
      for (let i = 0; i < colCount; i++) {
        const a = z1 + (i / colCount) * d;
        const b = z1 + ((i + 1) / colCount) * d;
        if (Math.abs((a + b) / 2 - doorZ) < 0.9) continue;
        const lat = createLatticePanel({ width: b - a - 0.4, height: 0.38, cols: 8, rows: 2, mats: ctx.mats, paper: false, frame: false, dark: true });
        lat.position.set(x, 2.50, (a + b) / 2);
        lat.rotation.y = -Math.PI / 2;
        g.add(lat);
      }
    } else {
      const z = z2 - 0.18;
      for (let i = 0; i <= colCount; i++) {
        const x = x1 + (i / colCount) * w;
        cylinder(0.13, 0.15, 2.34, 10, ctx.mats.woodVertical, x, PLATFORM, z, g);
        cylinder(0.22, 0.24, 0.16, 12, ctx.mats.stone, x, PLATFORM - 0.02, z, g);
      }
      for (let i = 0; i < colCount; i++) {
        const a = x1 + (i / colCount) * w;
        const b = x1 + ((i + 1) / colCount) * w;
        const lat = createLatticePanel({ width: b - a - 0.4, height: 0.38, cols: 8, rows: 2, mats: ctx.mats, paper: false, frame: false, dark: true });
        lat.position.set((a + b) / 2, 2.50, z);
        g.add(lat);
      }
    }

    const lowX = vertical ? (spec.side === 'west' ? x2 : x1) : 0;
    makeRoof(ctx, g, x1, z1, x2, z2, spec, lowX);
    if (vertical) {
      railing(ctx, g, x1, z1, x2, z2, lowX, { center: 30.4, width: 1.5 }, 2.2);
    } else {
      // The south return is level with the gatehouse. It has a stone edge, no steps:
      // the stair belongs to the gatehouse landing, not to the corridor.
      box(x2 - x1 - 0.12, 0.14, 0.2, ctx.mats.stone, (x1 + x2) / 2, PLATFORM, z2, g, true, true);
    }

    // Three steps at the wing-door opening, on the courtyard side of the walk.
    if (vertical) {
      const sign = spec.side === 'west' ? 1 : -1;
      for (let k = 1; k <= 3; k++) {
        const top = (4 - k) * 0.15;
        box(0.3, top, 1.5, ctx.mats.stone, lowX + sign * (0.15 + (k - 1) * 0.3), 0, 30.4, g, true, true);
      }
      // one stone step from the 0.45 corridor up to the 0.60 月台
      box(1.5, 0.15, 0.3, ctx.mats.stone, (x1 + x2) / 2, PLATFORM, 35.05, g, true, true);
    }

    // a few lanterns at the columns, only one real light per corridor
    const lx = vertical ? lowX + (spec.side === 'west' ? -0.45 : 0.45) : (x1 + x2) / 2;
    const lz = vertical ? z1 + d * 0.28 : z2 - 0.48;
    g.add(createLantern(ctx, lx, 2.65, lz, spec.side === 'west' || spec.side === 'south-east', 0.62));

    // Only the long side railings collide; leave the wing-door opening clear.
    if (vertical) {
      const x = lowX;
      const openHalf = 0.75;
      ctx.addCollider(x - 0.05, z1 + 1.8, x + 0.05, 30.4 - openHalf);
      ctx.addCollider(x - 0.05, 30.4 + openHalf, x + 0.05, z2 - 2.2);
    }
  }
}
