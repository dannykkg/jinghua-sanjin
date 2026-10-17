import * as THREE from 'three';
import type { Materials } from '../lib/materials';
import {
  box, createDoorLeaf, createGableRoof, createLatticePanel, cylinder, plane, worldUVBox,
} from '../lib/geom';
import type { Facade, HallSpec } from '../data/site';
import type { WorldContext } from './context';
import { decorateHall } from '../interior/rooms';

export interface FacadeInfo {
  axis: 'x' | 'z';
  facadePlane: number;
  outerEdge: number;
  outward: number;
  bayBounds: number[];
  bayWidths: number[];
  doorCenter: number;
  doorWidth: number;
  rotationY: number;
}

export function getFacadeInfo(spec: HallSpec): FacadeInfo {
  const axis: 'x' | 'z' = spec.facade === 'south' || spec.facade === 'north' ? 'x' : 'z';
  const outward = spec.facade === 'south' ? -1 : spec.facade === 'north' ? 1 : spec.facade === 'east' ? 1 : -1;
  const outerEdge = spec.facade === 'south' ? spec.z1 : spec.facade === 'north' ? spec.z2 : spec.facade === 'east' ? spec.x2 : spec.x1;
  const facadePlane = outerEdge - outward * spec.porch;
  const origin = axis === 'x' ? spec.x1 : spec.z1;
  const bounds = [origin];
  for (const w of spec.bays) bounds.push(bounds[bounds.length - 1] + w);
  const doorCenter = (bounds[spec.doorBay] + bounds[spec.doorBay + 1]) / 2;
  const doorWidth = Math.min(spec.bays[spec.doorBay] - 0.8, 3.0);
  const rotationY = spec.facade === 'south' ? Math.PI : spec.facade === 'north' ? 0 : spec.facade === 'east' ? -Math.PI / 2 : Math.PI / 2;
  return { axis, facadePlane, outerEdge, outward, bayBounds: bounds, bayWidths: spec.bays, doorCenter, doorWidth, rotationY };
}

function brickPanel(
  ctx: WorldContext, group: THREE.Group, info: FacadeInfo, spec: HallSpec,
  center: number, width: number, yBottom: number, height: number, depth = 0.18,
): THREE.Mesh {
  if (width <= 0.005 || height <= 0.005) return new THREE.Mesh();
  if (info.axis === 'x') {
    return box(width, height, depth, ctx.mats.brick, center, yBottom, info.facadePlane, group);
  }
  return box(depth, height, width, ctx.mats.brick, info.facadePlane, yBottom, center, group);
}


function facadePanel(
  ctx: WorldContext, group: THREE.Group, info: FacadeInfo,
  center: number, width: number, yBottom: number, height: number,
): THREE.Mesh {
  if (width <= 0.005 || height <= 0.005) return new THREE.Mesh();
  if (info.axis === 'x') {
    return box(width, height, 0.16, ctx.mats.plaster, center, yBottom, info.facadePlane, group);
  }
  return box(0.16, height, width, ctx.mats.plaster, info.facadePlane, yBottom, center, group);
}

function colliderForPanel(
  ctx: WorldContext, info: FacadeInfo, spec: HallSpec,
  center: number, width: number, fullBay = false,
): void {
  if (info.axis === 'x') {
    ctx.addCollider(center - width / 2, info.facadePlane - 0.12, center + width / 2, info.facadePlane + 0.12);
  } else {
    ctx.addCollider(info.facadePlane - 0.12, center - width / 2, info.facadePlane + 0.12, center + width / 2);
  }
}

function addGableEnd(
  ctx: WorldContext, group: THREE.Group, info: FacadeInfo, spec: HallSpec,
  side: number, span: number, overhang: number, thicknessMat?: THREE.Material,
): void {
  const rise = spec.ridge - spec.eave;
  const shape = new THREE.Shape();
  shape.moveTo(-span / 2, 0);
  shape.lineTo(0, rise);
  shape.lineTo(span / 2, 0);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = (thicknessMat ?? ctx.mats.brick).clone();
  mat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  if (info.axis === 'x') {
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(side, spec.eave, (spec.z1 + spec.z2) / 2);
  } else {
    mesh.position.set((spec.x1 + spec.x2) / 2, spec.eave, side);
  }
  group.add(mesh);
  // 博缝 trim following the gable edge
  const len = Math.hypot(span / 2 + overhang, rise);
  const ang = Math.atan2(rise, span / 2 + overhang);
  if (info.axis === 'x') {
    for (const dir of [-1, 1]) {
      const t = box(0.16, 0.18, len, ctx.mats.woodDark, side, spec.eave + rise / 2 - 0.08, (spec.z1 + spec.z2) / 2 + dir * (span / 4 + overhang / 4), group);
      t.rotation.x = dir * ang;
    }
  } else {
    for (const dir of [-1, 1]) {
      const t = box(len, 0.18, 0.16, ctx.mats.woodDark, (spec.x1 + spec.x2) / 2 + dir * (span / 4 + overhang / 4), spec.eave + rise / 2 - 0.08, side, group);
      t.rotation.z = -dir * ang;
    }
  }
}

function addSteps(ctx: WorldContext, group: THREE.Group, info: FacadeInfo, spec: HallSpec): void {
  if (spec.id === 'mainHall') return; // steps are on the 月台 edge instead
  const count = Math.max(2, Math.round(spec.platform / 0.15));
  const rise = spec.platform / count;
  const depth = 0.29;
  const width = info.doorWidth + 1.0;
  const center = info.doorCenter;
  for (let k = 1; k <= count; k++) {
    const h = k * rise;
    const out = (count - k + 0.5) * depth;
    if (info.axis === 'x') {
      box(width, h, depth, ctx.mats.stone, center, 0, info.outerEdge + info.outward * out, group, true, true);
    } else {
      box(depth, h, width, ctx.mats.stone, info.outerEdge + info.outward * out, 0, center, group, true, true);
    }
  }
}

function addFrontEdgeBlockers(ctx: WorldContext, info: FacadeInfo, spec: HallSpec): void {
  if (spec.id === 'mainHall') return;
  const gap = info.doorWidth / 2 + 0.22;
  const half1 = info.bayBounds[0];
  const half2 = info.bayBounds[info.bayBounds.length - 1];
  const a = info.doorCenter - gap;
  const b = info.doorCenter + gap;
  if (info.axis === 'x') {
    if (a > half1) ctx.addCollider(half1, info.outerEdge - 0.08, a, info.outerEdge + 0.08);
    if (b < half2) ctx.addCollider(b, info.outerEdge - 0.08, half2, info.outerEdge + 0.08);
  } else {
    if (a > half1) ctx.addCollider(info.outerEdge - 0.08, half1, info.outerEdge + 0.08, a);
    if (b < half2) ctx.addCollider(info.outerEdge - 0.08, b, info.outerEdge + 0.08, half2);
  }
}

function addDoor(
  ctx: WorldContext, group: THREE.Group, info: FacadeInfo, spec: HallSpec,
  center: number, width: number, height: number,
): void {
  const floor = spec.platform;
  const rot = info.rotationY;
  const assembly = new THREE.Group();
  assembly.position.set(info.axis === 'x' ? center : info.facadePlane, floor, info.axis === 'x' ? info.facadePlane : center);
  assembly.rotation.y = rot;
  group.add(assembly);

  const leafW = width / 2;
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(side * width / 2, height / 2, 0);
    assembly.add(hinge);
    const leaf = createDoorLeaf(leafW - 0.02, height - 0.04, ctx.mats);
    leaf.position.x = side * -leafW / 2;
    hinge.add(leaf);
    // open inward; left/right mirrored
    hinge.rotation.y = -side * 1.23;
  }

  // door frame + threshold
  box(width + 0.18, 0.14, 0.2, ctx.mats.woodDark, 0, height, 0, assembly, true, true);
  for (const side of [-1, 1]) {
    box(0.12, height + 0.1, 0.18, ctx.mats.woodDark, side * (width / 2 + 0.06), 0, 0, assembly, true, true);
  }
  box(width + 0.2, 0.08, 0.32, ctx.mats.stone, 0, 0, 0.03, assembly, false, true);

  // A small plaque over the main hall's central door
  if (spec.id === 'mainHall') {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.45), ctx.mats.plaque);
    p.position.set(0, height + 0.42, 0.13);
    assembly.add(p);
  }
}

function addWindow(
  ctx: WorldContext, group: THREE.Group, info: FacadeInfo, spec: HallSpec,
  center: number, width: number, sill: number, top: number,
): void {
  const h = top - sill;
  const panel = createLatticePanel({ width: width - 0.06, height: h - 0.04, mats: ctx.mats, cols: Math.max(3, Math.round(width / 0.18)), rows: Math.max(4, Math.round(h / 0.16)) });
  panel.position.set(
    info.axis === 'x' ? center : info.facadePlane,
    spec.platform + sill + h / 2,
    info.axis === 'x' ? info.facadePlane : center,
  );
  panel.rotation.y = info.rotationY;
  group.add(panel);

  const frameY = spec.platform + sill;
  if (info.axis === 'x') {
    box(width + 0.18, 0.1, 0.22, ctx.mats.woodDark, center, frameY - 0.05, info.facadePlane, group);
    box(width + 0.18, 0.12, 0.22, ctx.mats.woodDark, center, spec.platform + top, info.facadePlane, group);
    for (const s of [-1, 1]) box(0.1, h + 0.1, 0.2, ctx.mats.woodDark, center + s * (width / 2 + 0.05), frameY, info.facadePlane, group);
    box(width + 0.28, 0.08, 0.42, ctx.mats.stone, center, spec.platform + sill - 0.08, info.facadePlane - 0.02, group);
  } else {
    box(0.22, 0.1, width + 0.18, ctx.mats.woodDark, info.facadePlane, frameY - 0.05, center, group);
    box(0.22, 0.12, width + 0.18, ctx.mats.woodDark, info.facadePlane, spec.platform + top, center, group);
    for (const s of [-1, 1]) box(0.2, h + 0.1, 0.1, ctx.mats.woodDark, info.facadePlane, frameY, center + s * (width / 2 + 0.05), group);
    box(0.42, 0.08, width + 0.28, ctx.mats.stone, info.facadePlane - 0.02, spec.platform + sill - 0.08, center, group);
  }
}

function addInteriorWallPlanes(ctx: WorldContext, group: THREE.Group, spec: HallSpec, info: FacadeInfo): void {
  const h = spec.eave - spec.platform - 0.1;
  const y = spec.platform + h / 2;
  if (info.axis === 'x') {
    // rear wall inner face
    const rearZ = spec.facade === 'south' ? spec.z2 - 0.415 : spec.z1 + 0.415;
    plane(spec.x2 - spec.x1 - 0.4, h, ctx.mats.plaster, (spec.x1 + spec.x2) / 2, y, rearZ, 0, spec.facade === 'south' ? Math.PI : 0, 0, group);
    // side wall inner faces
    plane(spec.z2 - spec.z1 - 0.4, h, ctx.mats.plaster, spec.x1 + 0.415, y, (spec.z1 + spec.z2) / 2, 0, Math.PI / 2, 0, group);
    plane(spec.z2 - spec.z1 - 0.4, h, ctx.mats.plaster, spec.x2 - 0.415, y, (spec.z1 + spec.z2) / 2, 0, -Math.PI / 2, 0, group);
  } else {
    const rearX = spec.facade === 'east' ? spec.x1 + 0.415 : spec.x2 - 0.415;
    plane(spec.z2 - spec.z1 - 0.4, h, ctx.mats.plaster, rearX, y, (spec.z1 + spec.z2) / 2, 0, spec.facade === 'east' ? Math.PI / 2 : -Math.PI / 2, 0, group);
    plane(spec.x2 - spec.x1 - 0.4, h, ctx.mats.plaster, (spec.x1 + spec.x2) / 2, y, spec.z1 + 0.415, 0, 0, 0, group);
    plane(spec.x2 - spec.x1 - 0.4, h, ctx.mats.plaster, (spec.x1 + spec.x2) / 2, y, spec.z2 - 0.415, 0, Math.PI, 0, group);
  }
}

function addCeiling(ctx: WorldContext, group: THREE.Group, x1: number, z1: number, x2: number, z2: number, y: number): void {
  const m = plane(x2 - x1, z2 - z1, ctx.mats.paper, (x1 + x2) / 2, y, (z1 + z2) / 2, Math.PI / 2, 0, 0, group);
  ctx.ceilings.push(m);
  // thin dark trim around the ceiling
  const trim = 0.06;
  box(x2 - x1, trim, trim, ctx.mats.woodDark, (x1 + x2) / 2, y - 0.03, z1, group, false, false);
  box(x2 - x1, trim, trim, ctx.mats.woodDark, (x1 + x2) / 2, y - 0.03, z2, group, false, false);
  box(trim, trim, z2 - z1, ctx.mats.woodDark, x1, y - 0.03, (z1 + z2) / 2, group, false, false);
  box(trim, trim, z2 - z1, ctx.mats.woodDark, x2, y - 0.03, (z1 + z2) / 2, group, false, false);
}

function addMainHallStructure(ctx: WorldContext, group: THREE.Group, spec: HallSpec): void {
  const y0 = spec.platform;
  // visible transverse frames: posts, beams and purlins above the open central bay
  const beamY = [y0 + 3.25, y0 + 4.05, y0 + 4.78];
  for (const x of [7.7, 11.0, 15.0, 18.3]) {
    cylinder(0.14, 0.16, 3.2, 10, ctx.mats.woodDark, x, y0, 44.2, group);
    cylinder(0.14, 0.16, 3.2, 10, ctx.mats.woodDark, x, y0, 39.0, group);
  }
  for (const y of beamY) {
    box(16.2, 0.22, 0.26, ctx.mats.woodDark, 13, y, 41.0, group, true, true);
    box(0.26, 0.22, 5.6, ctx.mats.woodDark, 11.0, y, 41.5, group, true, true);
    box(0.26, 0.22, 5.6, ctx.mats.woodDark, 15.0, y, 41.5, group, true, true);
  }
}

function addPartitions(ctx: WorldContext, group: THREE.Group, spec: HallSpec, info: FacadeInfo): void {
  if (spec.id !== 'mainHall') return;
  const y0 = spec.platform;
  const h = 3.05;
  const zFront = info.facadePlane;
  const zBack = spec.z2 - 0.2;
  const openingStart = 42.25;
  const openingEnd = 43.45;
  for (const x of [11.0, 15.0]) {
    // wall segments along z with a door opening near the rear
    if (openingStart > zFront) {
      const a = box(0.12, h, openingStart - zFront, ctx.mats.plaster, x, y0, zFront, group, true, true);
      a.position.z = (zFront + openingStart) / 2;
      ctx.addCollider(x - 0.08, zFront, x + 0.08, openingStart);
    }
    if (openingEnd < zBack) {
      const b = box(0.12, h, zBack - openingEnd, ctx.mats.plaster, x, y0, openingEnd, group, true, true);
      b.position.z = (openingEnd + zBack) / 2;
      ctx.addCollider(x - 0.08, openingEnd, x + 0.08, zBack);
    }
    // header above opening
    box(0.12, h - 2.45, openingEnd - openingStart, ctx.mats.plaster, x, y0 + 2.45, (openingStart + openingEnd) / 2, group, true, true);
    // wood frame around the opening
    box(0.16, 2.5, 0.08, ctx.mats.woodDark, x, y0, openingStart, group);
    box(0.16, 2.5, 0.08, ctx.mats.woodDark, x, y0, openingEnd, group);
    box(0.16, 0.12, openingEnd - openingStart, ctx.mats.woodDark, x, y0 + 2.42, (openingStart + openingEnd) / 2, group);
  }
}

export function createHall(ctx: WorldContext, spec: HallSpec): void {
  const info = getFacadeInfo(spec);
  const group = new THREE.Group();
  group.name = spec.id;
  ctx.architecture.add(group);

  const w = spec.x2 - spec.x1;
  const d = spec.z2 - spec.z1;
  const cx = (spec.x1 + spec.x2) / 2;
  const cz = (spec.z1 + spec.z2) / 2;
  const wallH = spec.eave - spec.platform;

  // platform and floor
  box(w, spec.platform, d, ctx.mats.stone, cx, 0, cz, group, false, true);
  plane(w - 0.08, d - 0.08, ctx.mats.paving, cx, spec.platform + 0.012, cz, -Math.PI / 2, 0, 0, group);
  ctx.addFloor(spec.x1, spec.z1, spec.x2, spec.z2, spec.platform);

  // platform edge trim
  box(w + 0.12, 0.1, 0.14, ctx.mats.stone, cx, spec.platform - 0.05, spec.z1, group, false, true);
  box(w + 0.12, 0.1, 0.14, ctx.mats.stone, cx, spec.platform - 0.05, spec.z2, group, false, true);
  box(0.14, 0.1, d, ctx.mats.stone, spec.x1, spec.platform - 0.05, cz, group, false, true);
  box(0.14, 0.1, d, ctx.mats.stone, spec.x2, spec.platform - 0.05, cz, group, false, true);

  // side and rear walls
  if (info.axis === 'x') {
    box(0.4, wallH, d, ctx.mats.brick, spec.x1 + 0.2, spec.platform, cz, group);
    box(0.4, wallH, d, ctx.mats.brick, spec.x2 - 0.2, spec.platform, cz, group);
    ctx.addCollider(spec.x1, spec.z1, spec.x1 + 0.4, spec.z2);
    ctx.addCollider(spec.x2 - 0.4, spec.z1, spec.x2, spec.z2);
    const rearZ = spec.facade === 'south' ? spec.z2 - 0.2 : spec.z1 + 0.2;
    box(w, wallH, 0.4, ctx.mats.brick, cx, spec.platform, rearZ, group);
    ctx.addCollider(spec.x1, rearZ - 0.2, spec.x2, rearZ + 0.2);
  } else {
    box(w, wallH, 0.4, ctx.mats.brick, cx, spec.platform, spec.z1 + 0.2, group);
    box(w, wallH, 0.4, ctx.mats.brick, cx, spec.platform, spec.z2 - 0.2, group);
    ctx.addCollider(spec.x1, spec.z1, spec.x2, spec.z1 + 0.4);
    ctx.addCollider(spec.x1, spec.z2 - 0.4, spec.x2, spec.z2);
    const rearX = spec.facade === 'east' ? spec.x1 + 0.2 : spec.x2 - 0.2;
    box(0.4, wallH, d, ctx.mats.brick, rearX, spec.platform, cz, group);
    ctx.addCollider(rearX - 0.2, spec.z1, rearX + 0.2, spec.z2);
  }

  // interior plaster surfaces
  addInteriorWallPlanes(ctx, group, spec, info);

  // front facade, bay by bay
  const doorHeight = 2.72;
  for (let i = 0; i < info.bayBounds.length - 1; i++) {
    const a = info.bayBounds[i];
    const b = info.bayBounds[i + 1];
    const bw = b - a;
    const c = (a + b) / 2;
    const isDoor = i === spec.doorBay;
    const opening = isDoor ? info.doorWidth : Math.max(1.2, bw - 0.9);
    const side = Math.max(0.05, (bw - opening) / 2);
    const top = isDoor ? doorHeight : 2.6;
    const sill = isDoor ? 0 : 1.0;

    // full-height strips beside the opening
    if (side > 0.06) {
      facadePanel(ctx, group, info, c - opening / 2 - side / 2, side, spec.platform, wallH);
      facadePanel(ctx, group, info, c + opening / 2 + side / 2, side, spec.platform, wallH);
      colliderForPanel(ctx, info, spec, c - opening / 2 - side / 2, side);
      colliderForPanel(ctx, info, spec, c + opening / 2 + side / 2, side);
    }
    // A timber transom (横披窗) above the door/window, not a brick spandrel.
    const transomH = wallH - top - 0.18;
    if (transomH > 0.16) {
      const transom = createLatticePanel({
        width: Math.max(0.6, opening - 0.12), height: transomH,
        cols: Math.max(3, Math.round(opening / 0.2)), rows: 2,
        mats: ctx.mats, paper: true, frame: true, dark: true,
      });
      transom.position.set(
        info.axis === 'x' ? c : info.facadePlane,
        spec.platform + top + transomH / 2,
        info.axis === 'x' ? info.facadePlane : c,
      );
      transom.rotation.y = info.rotationY;
      group.add(transom);
    }
    // sill wall below a window
    if (!isDoor && sill > 0.02) {
      brickPanel(ctx, group, info, spec, c, opening, spec.platform, sill);
      colliderForPanel(ctx, info, spec, c, opening);
    }

    if (isDoor) {
      addDoor(ctx, group, info, spec, c, opening, doorHeight);
    } else {
      addWindow(ctx, group, info, spec, c, opening, sill, top);
      colliderForPanel(ctx, info, spec, c, opening);
    }

    // bay post on the porch line
    const postX = info.axis === 'x' ? a : info.facadePlane;
    const postZ = info.axis === 'x' ? info.facadePlane : a;
    if (spec.porch > 0.05) {
      const px = info.axis === 'x' ? a : info.outerEdge - info.outward * 0.22;
      const pz = info.axis === 'x' ? info.outerEdge - info.outward * 0.22 : a;
      cylinder(0.16, 0.18, spec.eave - spec.platform, 10, ctx.mats.woodVertical, px, spec.platform, pz, group);
      cylinder(0.24, 0.26, 0.18, 12, ctx.mats.stone, px, spec.platform - 0.02, pz, group);
    }
  }

  // continuous lintel / 额枋 over the facade
  if (info.axis === 'x') {
    box(w + 0.12, 0.26, 0.28, ctx.mats.woodDark, cx, spec.eave - 0.32, info.facadePlane, group, true, true);
    box(w + 0.3, 0.12, 0.2, ctx.mats.roofDark, cx, spec.eave - 0.02, info.facadePlane, group, true, true);
  } else {
    box(0.28, 0.26, d + 0.12, ctx.mats.woodDark, info.facadePlane, spec.eave - 0.32, cz, group, true, true);
    box(0.2, 0.12, d + 0.3, ctx.mats.roofDark, info.facadePlane, spec.eave - 0.02, cz, group, true, true);
  }

  // porch beam and simple brackets
  if (spec.porch > 0.05) {
    if (info.axis === 'x') {
      box(w + 0.1, 0.24, 0.26, ctx.mats.woodDark, cx, spec.eave - 0.34, info.outerEdge - info.outward * 0.22, group, true, true);
      for (const a of info.bayBounds) {
        box(0.28, 0.18, 0.4, ctx.mats.woodRed, a, spec.eave - 0.48, info.outerEdge - info.outward * 0.22, group, true, true);
      }
    } else {
      box(0.26, 0.24, d + 0.1, ctx.mats.woodDark, info.outerEdge - info.outward * 0.22, spec.eave - 0.34, cz, group, true, true);
      for (const a of info.bayBounds) {
        box(0.4, 0.18, 0.28, ctx.mats.woodRed, info.outerEdge - info.outward * 0.22, spec.eave - 0.48, a, group, true, true);
      }
    }
  }

  addFrontEdgeBlockers(ctx, info, spec);
  addSteps(ctx, group, info, spec);

  // gable ends and roof
  const overhang = spec.id === 'mainHall' ? 0.72 : 0.56;
  if (info.axis === 'x') {
    addGableEnd(ctx, group, info, spec, spec.x1 + 0.2, d + overhang * 2, overhang);
    addGableEnd(ctx, group, info, spec, spec.x2 - 0.2, d + overhang * 2, overhang);
  } else {
    addGableEnd(ctx, group, info, spec, spec.z1 + 0.2, w + overhang * 2, overhang);
    addGableEnd(ctx, group, info, spec, spec.z2 - 0.2, w + overhang * 2, overhang);
  }
  createGableRoof({
    centerX: cx, centerZ: cz, width: w, depth: d,
    eave: spec.eave, ridge: spec.ridge, overhang,
    ridgeAxis: spec.roofAxis, mats: ctx.mats, parent: group, roofStore: ctx.roofs,
  });

  // ceilings / structure
  if (spec.id === 'mainHall') {
    addCeiling(ctx, group, spec.x1 + 0.2, info.facadePlane, 11.0, spec.z2 - 0.2, spec.platform + 3.05);
    addCeiling(ctx, group, 15.0, info.facadePlane, spec.x2 - 0.2, spec.z2 - 0.2, spec.platform + 3.05);
    addMainHallStructure(ctx, group, spec);
    addPartitions(ctx, group, spec, info);
  } else {
    const ceilY = spec.platform + (spec.id === 'southHall' ? 2.72 : spec.id === 'rearHall' ? 2.82 : 2.95);
    addCeiling(ctx, group, spec.x1 + 0.2, spec.z1 + 0.2, spec.x2 - 0.2, spec.z2 - 0.2, ceilY);
  }

  // interior decoration
  decorateHall(ctx, spec, info);
}
