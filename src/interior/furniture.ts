import * as THREE from 'three';
import type { Materials } from '../lib/materials';
import { box, cylinder, plane } from '../lib/geom';
import type { WorldContext } from '../world/context';

export function createChair(mats: Materials, fabric: THREE.Material = mats.fabricCream): THREE.Group {
  const g = new THREE.Group();
  const seatH = 0.46;
  const w = 0.54;
  const d = 0.48;
  box(w, 0.07, d, mats.woodDark, 0, seatH, 0, g);
  box(w * 0.86, 0.055, d * 0.82, fabric, 0, seatH + 0.065, 0.01, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.055, seatH, 0.055, mats.woodDark, sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), g);
  }
  for (const sx of [-1, 1]) box(0.055, 0.96, 0.055, mats.woodDark, sx * (w / 2 - 0.05), 0, -d / 2 + 0.05, g);
  box(w - 0.1, 0.07, 0.06, mats.woodDark, 0, 0.9, -d / 2 + 0.05, g);
  box(w - 0.16, 0.26, 0.04, mats.woodRed, 0, 0.62, -d / 2 + 0.04, g);
  for (const sx of [-1, 1]) {
    box(0.045, 0.045, d - 0.12, mats.woodDark, sx * (w / 2 - 0.05), 0.66, 0, g);
    box(0.045, 0.2, 0.045, mats.woodDark, sx * (w / 2 - 0.05), 0.46, d / 2 - 0.1, g);
  }
  box(w - 0.12, 0.05, 0.04, mats.woodDark, 0, 0.18, d / 2 - 0.05, g);
  return g;
}

export function createLongTable(mats: Materials, width = 2.7, depth = 0.42, height = 0.96): THREE.Group {
  const g = new THREE.Group();
  box(width, 0.075, depth, mats.woodDark, 0, height - 0.075, 0, g);
  box(width - 0.12, 0.05, depth - 0.06, mats.woodRed, 0, height - 0.13, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.07, height - 0.1, 0.07, mats.woodDark, sx * (width / 2 - 0.1), 0, sz * (depth / 2 - 0.07), g);
  }
  box(width - 0.24, 0.11, 0.04, mats.woodRed, 0, height - 0.3, 0, g);
  for (const sx of [-1, 1]) {
    const end = box(0.08, 0.13, depth + 0.06, mats.woodDark, sx * (width / 2 - 0.02), height - 0.05, 0, g);
    end.rotation.z = sx * 0.18;
  }
  return g;
}

export function createSquareTable(mats: Materials, size = 0.96, height = 0.84): THREE.Group {
  const g = new THREE.Group();
  box(size, 0.075, size, mats.woodDark, 0, height - 0.075, 0, g);
  box(size - 0.1, 0.045, size - 0.1, mats.woodRed, 0, height - 0.13, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.075, height - 0.1, 0.075, mats.woodDark, sx * (size / 2 - 0.08), 0, sz * (size / 2 - 0.08), g);
  }
  for (const sz of [-1, 1]) box(size - 0.2, 0.12, 0.04, mats.woodRed, 0, height - 0.25, sz * (size / 2 - 0.04), g);
  for (const sx of [-1, 1]) box(0.04, 0.12, size - 0.2, mats.woodRed, sx * (size / 2 - 0.04), height - 0.25, 0, g);
  return g;
}

export function createDesk(mats: Materials, width = 1.55, depth = 0.7, height = 0.82): THREE.Group {
  const g = new THREE.Group();
  box(width, 0.07, depth, mats.woodDark, 0, height - 0.07, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.075, height - 0.07, 0.075, mats.woodDark, sx * (width / 2 - 0.08), 0, sz * (depth / 2 - 0.07), g);
  }
  for (let i = -1; i <= 1; i++) {
    box(width - 0.28, 0.16, 0.035, mats.woodRed, 0, height - 0.25, depth / 2 - 0.035, g);
    box(0.2, 0.03, 0.02, mats.brass, i * 0.38, height - 0.19, depth / 2 + 0.01, g);
  }
  box(0.24, 0.035, 0.18, mats.blackLacquer, 0.28, height + 0.01, 0.02, g);
  cylinder(0.06, 0.065, 0.16, 10, mats.celadon, -0.32, height + 0.01, -0.05, g);
  for (let i = 0; i < 3; i++) {
    const brush = cylinder(0.012, 0.016, 0.25, 6, mats.woodLight, -0.32 + (i - 1) * 0.045, height + 0.15, -0.05, g);
    brush.rotation.z = (i - 1) * 0.12;
  }
  box(0.58, 0.028, 0.14, mats.paper, -0.2, height + 0.005, 0.22, g);
  return g;
}

export function createShelf(mats: Materials, width = 1.5, height = 2.0, depth = 0.38, shelves = 4): THREE.Group {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) box(0.06, height, depth, mats.woodDark, sx * (width / 2 - 0.03), 0, 0, g);
  box(width, 0.07, depth, mats.woodDark, 0, height - 0.07, 0, g);
  box(width, 0.06, depth, mats.woodDark, 0, 0, 0, g);
  for (let i = 1; i < shelves; i++) {
    box(width - 0.1, 0.045, depth - 0.02, mats.woodDark, 0, (height / shelves) * i, 0, g);
  }
  box(width, height, 0.035, mats.woodDark, 0, 0, -depth / 2, g);
  return g;
}

export function createCabinet(mats: Materials, width = 1.0, height = 0.95, depth = 0.48): THREE.Group {
  const g = new THREE.Group();
  box(width, height, depth, mats.woodDark, 0, 0, 0, g);
  for (const sx of [-1, 1]) {
    box(width / 2 - 0.03, height - 0.1, 0.04, mats.woodRed, sx * width / 4, 0.05, depth / 2 + 0.015, g);
    box(0.06, 0.06, 0.02, mats.brass, sx * 0.09, height * 0.52, depth / 2 + 0.045, g);
  }
  box(width + 0.06, 0.06, depth + 0.06, mats.woodDark, 0, height, 0, g);
  return g;
}

export function createWardrobe(mats: Materials, width = 1.3, height = 2.1, depth = 0.6): THREE.Group {
  const g = new THREE.Group();
  box(width, height, depth, mats.woodDark, 0, 0, 0, g);
  for (const sx of [-1, 1]) {
    box(width / 2 - 0.04, height - 0.2, 0.05, mats.woodRed, sx * width / 4, 0.1, depth / 2 + 0.02, g);
    box(0.08, 0.05, 0.02, mats.brass, sx * 0.12, height * 0.55, depth / 2 + 0.05, g);
  }
  box(width + 0.1, 0.08, depth + 0.1, mats.woodDark, 0, height, 0, g);
  return g;
}

export function createKang(mats: Materials, width = 2.4, depth = 1.35, height = 0.46): THREE.Group {
  const g = new THREE.Group();
  box(width, height, depth, mats.brick, 0, 0, 0, g);
  box(width - 0.04, 0.06, depth - 0.04, mats.paving, 0, height, 0, g);
  box(width - 0.18, 0.035, depth - 0.16, mats.fabricCream, 0, height + 0.06, 0.01, g);
  box(width * 0.55, 0.16, depth * 0.62, mats.fabricRed, -width * 0.1, height + 0.1, -0.04, g);
  box(0.38, 0.1, 0.24, mats.fabricBlue, width * 0.24, height + 0.13, -0.18, g);
  const t = createSquareTable(mats, 0.56, 0.3);
  t.position.set(0.22, height + 0.08, 0.12);
  g.add(t);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.06, 1.7, 0.06, mats.woodDark, sx * (width / 2 - 0.08), height, sz * (depth / 2 - 0.08), g);
  }
  for (const sx of [-1, 1]) box(0.06, 0.08, depth - 0.1, mats.woodDark, sx * (width / 2 - 0.08), height + 1.65, 0, g);
  box(width - 0.1, 0.08, 0.06, mats.woodDark, 0, height + 1.65, -depth / 2 + 0.08, g);
  return g;
}

export function createBed(mats: Materials, width = 1.5, depth = 2.0, height = 0.55): THREE.Group {
  const g = new THREE.Group();
  box(width, height, depth, mats.woodDark, 0, 0, 0, g);
  box(width - 0.12, 0.16, depth - 0.12, mats.fabricCream, 0, height, 0, g);
  box(width - 0.24, 0.08, depth * 0.5, mats.fabricRed, 0, height + 0.18, depth * 0.18, g);
  box(width * 0.5, 0.11, 0.3, mats.fabricBlue, 0, height + 0.2, -depth * 0.24, g);
  for (const sx of [-1, 1]) box(0.08, 1.0, 0.08, mats.woodDark, sx * (width / 2 - 0.08), 0, -depth / 2 + 0.08, g);
  box(width - 0.08, 0.08, 0.08, mats.woodDark, 0, 0.92, -depth / 2 + 0.08, g);
  return g;
}

export function createWashStand(mats: Materials): THREE.Group {
  const g = new THREE.Group();
  box(0.62, 0.78, 0.45, mats.woodDark, 0, 0, 0, g);
  cylinder(0.23, 0.2, 0.12, 16, mats.porcelainWhite, 0, 0.78, 0, g);
  cylinder(0.2, 0.2, 0.02, 16, mats.water, 0, 0.86, 0, g);
  for (const sx of [-1, 1]) box(0.04, 0.55, 0.04, mats.woodDark, sx * 0.38, 0, 0, g);
  box(0.85, 0.05, 0.05, mats.woodDark, 0, 1.05, -0.05, g);
  return g;
}

export function createScreen(mats: Materials, panels = 3, width = 1.6, height = 1.75): THREE.Group {
  const g = new THREE.Group();
  const pw = width / panels;
  for (let i = 0; i < panels; i++) {
    const p = new THREE.Group();
    p.position.x = -width / 2 + pw * (i + 0.5);
    p.position.z = i === 0 ? 0.08 : i === panels - 1 ? -0.08 : 0;
    p.rotation.y = (i - (panels - 1) / 2) * 0.12;
    box(pw - 0.02, height, 0.04, mats.woodDark, 0, 0, 0, p);
    const face = plane(pw - 0.12, height - 0.12, mats.paper, 0, height / 2, 0.025, 0, 0, 0, p);
    face.receiveShadow = false;
    for (let j = 0; j < 4; j++) box(pw - 0.14, 0.03, 0.02, mats.woodRed, 0, 0.2 + j * (height - 0.3) / 3, 0.045, p);
    g.add(p);
  }
  return g;
}

export function createPainting(mats: Materials, w = 2.2, h = 1.5, matIndex = 0): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats.paintings[matIndex % mats.paintings.length]);
  m.position.y = h / 2;
  g.add(m);
  const top = cylinder(0.035, 0.035, w + 0.16, 8, mats.woodDark, 0, h, 0, g);
  top.rotation.z = Math.PI / 2;
  const bottom = cylinder(0.035, 0.035, w + 0.16, 8, mats.woodDark, 0, 0, 0, g);
  bottom.rotation.z = Math.PI / 2;
  return g;
}

export function createCouplet(mats: Materials, textIndex = 0, h = 1.8): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.38, h), mats.calligraphy[textIndex % mats.calligraphy.length]);
  m.position.y = h / 2;
  g.add(m);
  box(0.46, h + 0.12, 0.035, mats.woodDark, 0, -0.06, -0.02, g);
  return g;
}

export function createLantern(ctx: WorldContext, x: number, yBottom: number, z: number, withLight = true, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, yBottom, z);
  const mats = ctx.mats;
  const s = scale;
  cylinder(0.012, 0.012, 0.5 * s, 5, mats.woodDark, 0, 1.2 * s, 0, g);
  cylinder(0.19 * s, 0.22 * s, 0.06 * s, 8, mats.woodDark, 0, 0.88 * s, 0, g);
  cylinder(0.22 * s, 0.19 * s, 0.06 * s, 8, mats.woodDark, 0, 0.37 * s, 0, g);
  cylinder(0.22 * s, 0.19 * s, 0.5 * s, 8, mats.lanternPaper, 0, 0.4 * s, 0, g);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bar = box(0.012 * s, 0.5 * s, 0.012 * s, mats.woodDark, Math.cos(a) * 0.215 * s, 0.4 * s, Math.sin(a) * 0.215 * s, g);
    bar.rotation.y = -a;
  }
  cylinder(0.02 * s, 0.005 * s, 0.25 * s, 5, mats.fabricRed, 0, 0.12 * s, 0, g);
  if (withLight) {
    const light = new THREE.PointLight(0xffb765, 9, 7, 2);
    light.position.set(0, 0.62 * s, 0);
    g.add(light);
  }
  return g;
}

export function createVase(mats: Materials, h = 0.46, material: THREE.Material = mats.porcelainBlue): THREE.Mesh {
  const points: THREE.Vector2[] = [];
  const profile: [number, number][] = [
    [0.02, 0], [0.14, 0.01], [0.16, 0.07], [0.12, 0.17], [0.13, 0.27], [0.1, 0.34], [0.06, 0.4], [0.07, 0.46],
  ];
  for (const [r, y] of profile) points.push(new THREE.Vector2(r, y * (h / 0.46)));
  const geo = new THREE.LatheGeometry(points, 18);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createTeaSet(mats: Materials): THREE.Group {
  const g = new THREE.Group();
  box(0.46, 0.025, 0.3, mats.woodDark, 0, 0, 0, g);
  const pot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), mats.porcelainWhite);
  pot.scale.y = 0.8;
  pot.position.set(0, 0.1, 0);
  g.add(pot);
  const spout = cylinder(0.02, 0.02, 0.09, 6, mats.porcelainWhite, 0.1, 0.08, 0, g);
  spout.rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) cylinder(0.035, 0.03, 0.055, 8, mats.porcelainWhite, -0.14 + i * 0.12, 0.03, 0.09, g);
  return g;
}

export function createPottedPlant(mats: Materials, scale = 1): THREE.Group {
  const g = new THREE.Group();
  cylinder(0.16 * scale, 0.2 * scale, 0.26 * scale, 10, mats.porcelainBlue, 0, 0, 0, g);
  cylinder(0.02 * scale, 0.025 * scale, 0.55 * scale, 5, mats.woodDark, 0, 0.25 * scale, 0, g);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.13 * scale, 0.36 * scale), mats.leaf);
    leaf.position.set(Math.cos(a) * 0.12 * scale, 0.62 * scale, Math.sin(a) * 0.12 * scale);
    leaf.rotation.set(0.4, a, 0.3);
    g.add(leaf);
  }
  return g;
}

export function createRug(mats: Materials, w: number, d: number, mat: THREE.Material = mats.fabricCream): THREE.Mesh {
  const m = plane(w, d, mat, 0, 0.02, 0, -Math.PI / 2, 0, 0);
  m.receiveShadow = true;
  return m;
}

export function placeFurniture(
  parent: THREE.Object3D, obj: THREE.Object3D, x: number, y: number, z: number, rotY = 0,
): THREE.Object3D {
  obj.position.set(x, y, z);
  obj.rotation.y = rotY;
  parent.add(obj);
  return obj;
}
