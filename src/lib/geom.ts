import * as THREE from 'three';
import type { Materials } from './materials';

export type Vec3 = { x: number; y: number; z: number };

/** Box UVs measured in metres, so bricks/tiles keep a constant physical scale. */
export function worldUVBox(w: number, h: number, d: number, tile = 1): THREE.BoxGeometry {
  const geo = new THREE.BoxGeometry(w, h, d);
  const pos = geo.getAttribute('position');
  const nor = geo.getAttribute('normal');
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    let u = 0;
    let v = 0;
    if (nx > 0.5) {
      u = pos.getZ(i) / tile;
      v = pos.getY(i) / tile;
    } else if (ny > 0.5) {
      u = pos.getX(i) / tile;
      v = pos.getZ(i) / tile;
    } else if (nz > 0.5) {
      u = pos.getX(i) / tile;
      v = pos.getY(i) / tile;
    }
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  return geo;
}

export function box(
  w: number, h: number, d: number, mat: THREE.Material,
  x = 0, yBottom = 0, z = 0, parent?: THREE.Object3D,
  cast = true, receive = true,
): THREE.Mesh {
  const m = new THREE.Mesh(worldUVBox(w, h, d), mat);
  m.position.set(x, yBottom + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent?.add(m);
  return m;
}

export function cylinder(
  rTop: number, rBottom: number, h: number, segments: number, mat: THREE.Material,
  x = 0, yBottom = 0, z = 0, parent?: THREE.Object3D, cast = true, receive = true,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat);
  m.position.set(x, yBottom + h / 2, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent?.add(m);
  return m;
}

export function plane(
  w: number, h: number, mat: THREE.Material,
  x: number, y: number, z: number,
  rotX = 0, rotY = 0, rotZ = 0, parent?: THREE.Object3D,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.set(rotX, rotY, rotZ);
  m.receiveShadow = true;
  parent?.add(m);
  return m;
}

export function lineSegment(
  a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material, parent: THREE.Object3D,
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius * 1.05, len, 6);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

export interface RoofOptions {
  centerX: number;
  centerZ: number;
  width: number;       // footprint along x
  depth: number;       // footprint along z
  eave: number;        // absolute y
  ridge: number;       // absolute y
  overhang: number;
  ridgeAxis: 'x' | 'z';
  mats: Materials;
  parent: THREE.Object3D;
  roofStore?: THREE.Object3D[];
  eaveTiles?: boolean;
}

/** A Beijing hard-gable roof: two straight slopes, 清水脊, tiled eaves, rafters. */
export function createGableRoof(opts: RoofOptions): THREE.Group {
  const { centerX, centerZ, width, depth, eave, ridge, overhang, ridgeAxis, mats, eaveTiles = true } = opts;
  const g = new THREE.Group();
  g.name = 'roof';
  g.position.set(centerX, 0, centerZ);
  opts.parent.add(g);
  opts.roofStore?.push(g);

  const rise = ridge - eave;
  const length = (ridgeAxis === 'x' ? width : depth) + overhang * 2;
  const span = (ridgeAxis === 'x' ? depth : width) + overhang * 2;
  const half = span / 2;
  const angle = Math.atan2(rise, half);
  const slopeLen = Math.hypot(half, rise);
  const midY = (eave + ridge) / 2;

  const slopeGeo = worldUVBox(ridgeAxis === 'x' ? length : slopeLen, 0.15, ridgeAxis === 'x' ? slopeLen : length, 1);
  for (const dir of [-1, 1]) {
    const m = new THREE.Mesh(slopeGeo, mats.roof);
    m.castShadow = true;
    m.receiveShadow = true;
    if (ridgeAxis === 'x') {
      m.rotation.x = dir * angle;
      m.position.set(0, midY, (dir * half) / 2);
    } else {
      m.rotation.z = -dir * angle;
      m.position.set((dir * half) / 2, midY, 0);
    }
    g.add(m);
  }

  const ridgeMat = mats.roofDark;
  if (ridgeAxis === 'x') {
    box(length + 0.1, 0.24, 0.32, ridgeMat, 0, ridge - 0.05, 0, g, true, true);
    // 蝎子尾 at both ends, slightly turned up
    for (const dir of [-1, 1]) {
      const tail = box(0.16, 0.32, 0.16, ridgeMat, dir * (length / 2 - 0.1), ridge + 0.08, 0, g, true, true);
      tail.rotation.z = dir * -0.38;
      const tip = box(0.32, 0.12, 0.13, ridgeMat, dir * (length / 2 - 0.02), ridge + 0.32, 0, g, true, true);
      tip.rotation.z = dir * -0.14;
    }
  } else {
    box(0.32, 0.24, length + 0.1, ridgeMat, 0, ridge - 0.05, 0, g, true, true);
    for (const dir of [-1, 1]) {
      const tail = box(0.16, 0.32, 0.16, ridgeMat, 0, ridge + 0.08, dir * (length / 2 - 0.1), g, true, true);
      tail.rotation.x = dir * 0.38;
      const tip = box(0.13, 0.12, 0.32, ridgeMat, 0, ridge + 0.32, dir * (length / 2 - 0.02), g, true, true);
      tip.rotation.x = dir * 0.14;
    }
  }

  // fascia / 连檐
  const fasciaMat = mats.woodDark;
  if (ridgeAxis === 'x') {
    for (const dir of [-1, 1]) {
      box(length + 0.05, 0.2, 0.12, fasciaMat, 0, eave - 0.08, dir * half, g, true, true);
      box(length + 0.05, 0.08, 0.18, mats.roofDark, 0, eave + 0.1, dir * half, g, true, true);
    }
  } else {
    for (const dir of [-1, 1]) {
      box(0.12, 0.2, length + 0.05, fasciaMat, dir * half, eave - 0.08, 0, g, true, true);
      box(0.18, 0.08, length + 0.05, mats.roofDark, dir * half, eave + 0.1, 0, g, true, true);
    }
  }

  // exposed rafter ends under the eaves
  const rafterCount = Math.max(8, Math.round(length / 0.42));
  const rafterGeo = new THREE.BoxGeometry(0.07, 0.1, 0.52);
  const rafterInst = new THREE.InstancedMesh(rafterGeo, mats.woodDark, rafterCount * 2);
  rafterInst.castShadow = true;
  rafterInst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let ri = 0;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < rafterCount; i++) {
      const t = (i + 0.5) / rafterCount;
      const p = -length / 2 + t * length;
      if (ridgeAxis === 'x') {
        dummy.position.set(p, eave - 0.02, dir * (half - 0.34));
        dummy.rotation.set(0, 0, 0);
      } else {
        dummy.position.set(dir * (half - 0.34), eave - 0.02, p);
        dummy.rotation.set(0, Math.PI / 2, 0);
      }
      dummy.updateMatrix();
      rafterInst.setMatrixAt(ri++, dummy.matrix);
    }
  }
  rafterInst.instanceMatrix.needsUpdate = true;
  g.add(rafterInst);

  if (eaveTiles) {
    addEaveTiles(g, ridgeAxis, length, half, eave, mats);
  }

  // gable bargeboards / 博缝, following the two slopes
  if (ridgeAxis === 'x') {
    for (const sx of [-1, 1]) {
      for (const dir of [-1, 1]) {
        const trim = box(0.1, 0.16, slopeLen, mats.woodDark, sx * (length / 2 - 0.06), midY - 0.12, (dir * half) / 2, g, true, true);
        trim.rotation.x = dir * angle;
      }
    }
  } else {
    for (const sz of [-1, 1]) {
      for (const dir of [-1, 1]) {
        const trim = box(slopeLen, 0.16, 0.1, mats.woodDark, (dir * half) / 2, midY - 0.12, sz * (length / 2 - 0.06), g, true, true);
        trim.rotation.z = -dir * angle;
      }
    }
  }

  return g;
}

function addEaveTiles(g: THREE.Group, axis: 'x' | 'z', length: number, half: number, eave: number, mats: Materials): void {
  const count = Math.max(12, Math.round(length / 0.2));
  const geo = new THREE.CylinderGeometry(0.065, 0.065, 0.07, 8, 1, false, 0, Math.PI);
  const inst = new THREE.InstancedMesh(geo, mats.roof, count * 2);
  inst.castShadow = true;
  inst.receiveShadow = true;
  const d = new THREE.Object3D();
  let n = 0;
  for (const dir of [-1, 1]) {
    for (let i = 0; i < count; i++) {
      const p = -length / 2 + (i + 0.5) * (length / count);
      if (axis === 'x') {
        d.position.set(p, eave + 0.06, dir * half);
        d.rotation.set(Math.PI / 2, 0, 0);
      } else {
        d.position.set(dir * half, eave + 0.06, p);
        d.rotation.set(0, Math.PI / 2, Math.PI / 2);
      }
      d.updateMatrix();
      inst.setMatrixAt(n++, d.matrix);
    }
  }
  inst.instanceMatrix.needsUpdate = true;
  g.add(inst);
}

export interface LatticeOptions {
  width: number;
  height: number;
  cols?: number;
  rows?: number;
  bar?: number;
  mats: Materials;
  paper?: boolean;
  frame?: boolean;
  dark?: boolean;
}

/** Real geometric lattice: 步步锦-like grid, paper behind. */
export function createLatticePanel(opts: LatticeOptions): THREE.Group {
  const { width, height, mats } = opts;
  const cols = opts.cols ?? Math.max(3, Math.round(width / 0.18));
  const rows = opts.rows ?? Math.max(4, Math.round(height / 0.16));
  const bar = opts.bar ?? 0.022;
  const mat = opts.dark ? mats.woodDark : mats.woodRed;
  const g = new THREE.Group();

  if (opts.paper !== false) {
    const p = plane(width - 0.04, height - 0.04, mats.paper, 0, 0, -0.012, 0, 0, 0, g);
    p.receiveShadow = false;
  }

  if (opts.frame !== false) {
    // Note: box() takes a BOTTOM y, while the panel is centred on its origin.
    box(width, 0.045, 0.06, mat, 0, height / 2 - 0.045, 0, g);
    box(width, 0.045, 0.06, mat, 0, -height / 2, 0, g);
    box(0.05, height, 0.06, mat, -width / 2 + 0.025, -height / 2, 0, g);
    box(0.05, height, 0.06, mat, width / 2 - 0.025, -height / 2, 0, g);
    // inner frame
    box(width - 0.1, 0.018, 0.035, mat, 0, height / 2 - 0.075, 0, g);
    box(width - 0.1, 0.018, 0.035, mat, 0, -height / 2 + 0.057, 0, g);
    box(0.022, height - 0.1, 0.035, mat, -width / 2 + 0.08, -(height - 0.1) / 2, 0, g);
    box(0.022, height - 0.1, 0.035, mat, width / 2 - 0.08, -(height - 0.1) / 2, 0, g);
  }

  const instV = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, cols);
  const instH = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, rows);
  instV.castShadow = instH.castShadow = true;
  instV.receiveShadow = instH.receiveShadow = true;
  const d = new THREE.Object3D();
  const innerW = width - 0.16;
  const innerH = height - 0.16;
  for (let i = 0; i < cols; i++) {
    const x = -innerW / 2 + (i + 0.5) * (innerW / cols);
    d.position.set(x, 0, 0.018);
    d.scale.set(bar, innerH, 0.026);
    d.rotation.set(0, 0, 0);
    d.updateMatrix();
    instV.setMatrixAt(i, d.matrix);
  }
  for (let i = 0; i < rows; i++) {
    const y = -innerH / 2 + (i + 0.5) * (innerH / rows);
    d.position.set(0, y, 0.018);
    d.scale.set(innerW, bar, 0.026);
    d.rotation.set(0, 0, 0);
    d.updateMatrix();
    instH.setMatrixAt(i, d.matrix);
  }
  instV.instanceMatrix.needsUpdate = true;
  instH.instanceMatrix.needsUpdate = true;
  g.add(instV, instH);
  return g;
}

/** Door leaf with a solid lower panel and lattice upper panel. */
export function createDoorLeaf(width: number, height: number, mats: Materials): THREE.Group {
  const g = new THREE.Group();
  const frame = 0.05;
  box(width, frame, 0.07, mats.woodDark, 0, height / 2 - frame, 0, g);
  box(width, frame, 0.07, mats.woodDark, 0, -height / 2, 0, g);
  box(frame, height, 0.07, mats.woodDark, -width / 2 + frame / 2, -height / 2, 0, g);
  box(frame, height, 0.07, mats.woodDark, width / 2 - frame / 2, -height / 2, 0, g);
  const lowerH = height * 0.42;
  box(width - frame * 2, lowerH, 0.045, mats.woodRed, 0, -height / 2 + frame, 0, g);
  const latticeH = height - lowerH - frame * 2;
  const lat = createLatticePanel({
    width: width - frame * 2, height: latticeH, cols: Math.max(3, Math.round(width / 0.2)),
    rows: Math.max(3, Math.round(latticeH / 0.18)), mats, frame: false, paper: true,
  });
  lat.position.y = -height / 2 + frame + lowerH + latticeH / 2;
  g.add(lat);
  // central stile
  box(0.035, height - frame * 2, 0.05, mats.woodDark, 0, -height / 2 + frame, 0.02, g);
  return g;
}

export function addInstancedBoxes(
  parent: THREE.Object3D,
  mat: THREE.Material,
  count: number,
  transform: (i: number, d: THREE.Object3D) => void,
  size: [number, number, number] = [1, 1, 1],
): THREE.InstancedMesh {
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    d.position.set(0, 0, 0);
    d.rotation.set(0, 0, 0);
    d.scale.set(1, 1, 1);
    transform(i, d);
    d.updateMatrix();
    inst.setMatrixAt(i, d.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true;
  inst.receiveShadow = true;
  parent.add(inst);
  return inst;
}
