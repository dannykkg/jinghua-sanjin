import * as THREE from 'three';
import type { WorldContext } from './context';
import type { Materials } from '../lib/materials';
import { box, createDoorLeaf, createGableRoof, cylinder, plane } from '../lib/geom';
import { GATE, GATE_HOUSE, SCREEN_WALL } from '../data/site';
import { createLantern } from '../interior/furniture';

function gableEnd(ctx: WorldContext, group: THREE.Group, x: number, z: number, width: number, eave: number, ridge: number, overhang: number): void {
  const rise = ridge - eave;
  const span = width + overhang * 2;
  const shape = new THREE.Shape();
  shape.moveTo(-span / 2, 0);
  shape.lineTo(0, rise);
  shape.lineTo(span / 2, 0);
  shape.closePath();
  const mat = ctx.mats.brick.clone();
  mat.side = THREE.DoubleSide;
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  m.position.set(x, eave, z);
  m.rotation.y = Math.PI / 2;
  m.receiveShadow = true;
  group.add(m);
}

export function createGate(ctx: WorldContext): void {
  const { x1, x2, z1, z2, platform, eave, ridge } = GATE;
  const g = new THREE.Group();
  g.name = 'gate';
  ctx.architecture.add(g);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const w = x2 - x1;
  const d = z2 - z1;
  const wallH = eave - platform;

  box(w, platform, d, ctx.mats.stone, cx, 0, cz, g, false, true);
  plane(w - 0.1, d - 0.1, ctx.mats.paving, cx, platform + 0.012, cz, -Math.PI / 2, 0, 0, g);
  ctx.addFloor(x1, z1, x2, z2, platform);

  // side walls of the gate passage
  box(0.34, wallH, d, ctx.mats.brick, x1 + 0.17, platform, cz, g);
  box(0.34, wallH, d, ctx.mats.brick, x2 - 0.17, platform, cz, g);
  ctx.addCollider(x1, z1, x1 + 0.34, z2);
  ctx.addCollider(x2 - 0.34, z1, x2, z2);

  // stone plinth and threshold
  box(w + 0.2, 0.14, 0.38, ctx.mats.stone, cx, platform - 0.04, z1 + 0.05, g);
  box(w - 0.5, 0.08, 0.34, ctx.mats.stone, cx, platform, z1 + 0.18, g);

  // door frame at the middle column
  const doorW = 2.5;
  const doorH = 3.0;
  const doorZ = z1 + 2.5;
  box(doorW + 0.26, 0.18, 0.3, ctx.mats.woodDark, cx, platform + doorH, doorZ, g);
  for (const s of [-1, 1]) box(0.16, doorH, 0.28, ctx.mats.woodDark, cx + s * (doorW / 2 + 0.08), platform, doorZ, g);
  // two door leaves, opened inward (north)
  const assembly = new THREE.Group();
  assembly.position.set(cx, platform, doorZ);
  assembly.rotation.y = Math.PI;
  g.add(assembly);
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.set(side * doorW / 2, doorH / 2, 0);
    hinge.rotation.y = -side * 1.32;
    assembly.add(hinge);
    const leaf = createDoorLeaf(doorW / 2 - 0.03, doorH - 0.02, ctx.mats);
    leaf.position.x = side * -doorW / 4;
    hinge.add(leaf);
  }
  // 门簪 and a plaque
  for (let i = 0; i < 4; i++) {
    const z = doorZ + 0.17;
    const p = cylinder(0.07, 0.07, 0.22, 8, ctx.mats.woodDark, cx - 0.72 + i * 0.48, platform + doorH + 0.14, z, g);
    p.rotation.x = Math.PI / 2;
  }
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.43), ctx.mats.plaque);
  plaque.position.set(cx, platform + doorH + 0.5, z1 + 0.04);
  plaque.rotation.y = Math.PI;
  g.add(plaque);

  // front lintel / 额枋
  box(w + 0.2, 0.3, 0.3, ctx.mats.woodDark, cx, eave - 0.4, z1 + 0.2, g, true, true);
  box(w + 0.35, 0.12, 0.22, ctx.mats.roofDark, cx, eave - 0.04, z1 + 0.2, g, true, true);
  for (const s of [-1, 1]) {
    cylinder(0.14, 0.16, wallH, 10, ctx.mats.woodVertical, cx + s * (w / 2 - 0.16), platform, z1 + 0.2, g);
    cylinder(0.22, 0.24, 0.16, 12, ctx.mats.stone, cx + s * (w / 2 - 0.16), platform - 0.02, z1 + 0.2, g);
  }

  // 抱鼓石
  for (const s of [-1, 1]) {
    const bx = cx + s * (doorW / 2 + 0.25);
    box(0.55, 0.26, 0.55, ctx.mats.stone, bx, 0, z1 - 0.42, g);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), ctx.mats.stone);
    drum.rotation.z = Math.PI / 2;
    drum.position.set(bx, 0.45, z1 - 0.42);
    drum.castShadow = true;
    g.add(drum);
  }

  // steps down to the hutong
  for (let k = 1; k <= 3; k++) {
    box(3.6, k * 0.15, 0.3, ctx.mats.stone, cx, 0, z1 - (3 - k + 0.5) * 0.3, g, true, true);
  }

  createGableRoof({
    centerX: cx, centerZ: cz, width: w, depth: d,
    eave, ridge, overhang: 0.65, ridgeAxis: 'x', mats: ctx.mats, parent: g, roofStore: ctx.roofs,
  });
  gableEnd(ctx, g, x1 + 0.17, cz, d, eave, ridge, 0.65);
  gableEnd(ctx, g, x2 - 0.17, cz, d, eave, ridge, 0.65);

  // passage lanterns
  g.add(createLantern(ctx, x1 + 0.55, platform + 2.45, z1 + 1.2, false, 0.7));
  g.add(createLantern(ctx, x2 - 0.55, platform + 2.45, z1 + 1.2, true, 0.7));
}

export function createGateHouse(ctx: WorldContext): void {
  const { x1, x2, z1, z2, platform, eave, ridge } = GATE_HOUSE;
  const g = new THREE.Group();
  g.name = 'gateHouse';
  ctx.architecture.add(g);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const w = x2 - x1;
  const d = z2 - z1;
  const wallH = eave - platform;

  box(w, platform, d, ctx.mats.stone, cx, 0, cz, g, false, true);
  plane(w - 0.08, d - 0.08, ctx.mats.paving, cx, platform + 0.012, cz, -Math.PI / 2, 0, 0, g);
  ctx.addFloor(x1, z1, x2, z2, platform);

  // Extend the gatehouse platform to the north as a level landing. The corridors
  // meet this landing at .45 m; steps begin outside the landing, not on the corridor.
  const landingDepth = 1.2;
  const landingWidth = 5.6;
  box(landingWidth, platform, landingDepth, ctx.mats.stone, cx, 0, z2 + landingDepth / 2, g, false, true);
  plane(landingWidth - 0.06, landingDepth - 0.06, ctx.mats.paving, cx, platform + 0.012, z2 + landingDepth / 2, -Math.PI / 2, 0, 0, g);
  ctx.addFloor(cx - landingWidth / 2, z2, cx + landingWidth / 2, z2 + landingDepth, platform);

  // side walls: a gate passage with a roof, not a room
  box(0.34, wallH, d, ctx.mats.brick, x1 + 0.17, platform, cz, g);
  box(0.34, wallH, d, ctx.mats.brick, x2 - 0.17, platform, cz, g);
  ctx.addCollider(x1, z1, x1 + 0.34, z2);
  ctx.addCollider(x2 - 0.34, z1, x2, z2);

  // 垂莲柱 at the front
  const frontZ = z1 + 0.28;
  box(w + 0.2, 0.3, 0.26, ctx.mats.woodRed, cx, eave - 0.45, frontZ, g, true, true);
  // a quiet painted band under the eave, in the manner of residential 苏式彩画
  box(w - 0.5, 0.11, 0.035, ctx.mats.greenLacquer, cx, eave - 0.42, frontZ + 0.16, g, false, false);
  for (let i = -2; i <= 2; i++) {
    box(0.2, 0.02, 0.04, ctx.mats.gold, cx + i * 0.58, eave - 0.37, frontZ + 0.18, g, false, false);
  }
  for (const s of [-1, 1]) {
    const x = cx + s * (w / 2 - 0.28);
    // suspended column: from the beam down, not touching the ground
    cylinder(0.09, 0.11, 0.9, 10, ctx.mats.woodRed, x, eave - 1.35, frontZ, g);
    const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), ctx.mats.woodRed);
    lotus.position.set(x, eave - 1.38, frontZ);
    lotus.scale.y = 0.55;
    lotus.castShadow = true;
    g.add(lotus);
    const tassel = cylinder(0.022, 0.035, 0.24, 8, ctx.mats.gold, x, eave - 1.66, frontZ, g);
    tassel.castShadow = false;
    // bracket / 雀替
    box(0.5, 0.12, 0.18, ctx.mats.woodRed, x, eave - 0.58, frontZ, g, true, true);
  }

  // screen doors: four leaves, centre two open
  const screenZ = z1 + 2.0;
  box(w - 0.4, 0.2, 0.22, ctx.mats.woodRed, cx, platform + 2.75, screenZ, g);
  for (const s of [-1, 1]) {
    const panel = new THREE.Group();
    panel.position.set(cx + s * 0.95, platform, screenZ);
    panel.rotation.y = s * 0.05;
    box(0.82, 2.7, 0.08, ctx.mats.greenLacquer, 0, 0, 0, panel);
    // dark wood frame and a quiet central panel, not a modern brass rail
    box(0.9, 0.08, 0.11, ctx.mats.woodDark, 0, 0, 0.025, panel, false, false);
    box(0.9, 0.08, 0.11, ctx.mats.woodDark, 0, 2.62, 0.025, panel, false, false);
    for (const sx of [-1, 1]) box(0.06, 2.7, 0.11, ctx.mats.woodDark, sx * 0.4, 0, 0.025, panel, false, false);
    box(0.58, 1.35, 0.045, ctx.mats.woodRed, 0, 0.68, 0.055, panel, false, false);
    for (const sx of [-1, 1]) for (const sy of [0.32, 1.62]) {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), ctx.mats.brass);
      stud.position.set(sx * 0.3, sy, 0.085);
      panel.add(stud);
    }
    g.add(panel);
    ctx.addCollider(cx + s * 0.95 - 0.43, screenZ - 0.08, cx + s * 0.95 + 0.43, screenZ + 0.08);
  }
  // open central leaves
  for (const s of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.set(cx + s * 0.48, platform + 1.35, screenZ);
    leaf.rotation.y = s * 1.2;
    box(0.46, 2.55, 0.06, ctx.mats.greenLacquer, s * 0.23, 0, 0, leaf);
    box(0.5, 0.07, 0.08, ctx.mats.woodDark, s * 0.23, -1.25, 0.03, leaf, false, false);
    box(0.5, 0.07, 0.08, ctx.mats.woodDark, s * 0.23, 1.22, 0.03, leaf, false, false);
    g.add(leaf);
  }

  // steps front and rear
  for (let k = 1; k <= 3; k++) {
    box(3.8, k * 0.15, 0.28, ctx.mats.stone, cx, 0, z1 - (3 - k + 0.5) * 0.28, g, true, true);
    box(3.8, k * 0.15, 0.28, ctx.mats.stone, cx, 0, z2 + landingDepth + (3 - k + 0.5) * 0.28, g, true, true);
  }
  // front edge blockers, leaving the central passage
  ctx.addCollider(x1, z1 - 0.1, cx - 0.85, z1 + 0.1);
  ctx.addCollider(cx + 0.85, z1 - 0.1, x2, z1 + 0.1);
  ctx.addCollider(x1, z2 - 0.1, cx - 0.85, z2 + 0.1);
  ctx.addCollider(cx + 0.85, z2 - 0.1, x2, z2 + 0.1);

  createGableRoof({
    centerX: cx, centerZ: cz, width: w, depth: d,
    eave, ridge, overhang: 0.95, ridgeAxis: 'x', mats: ctx.mats, parent: g, roofStore: ctx.roofs,
  });
  gableEnd(ctx, g, x1 + 0.17, cz, d, eave, ridge, 0.62);
  gableEnd(ctx, g, x2 - 0.17, cz, d, eave, ridge, 0.62);

  // Add a small rear卷棚 roof to read as 一殿一卷
  const rearY = eave + 0.18;
  box(w + 0.6, 0.12, 1.1, ctx.mats.roof, cx, rearY, z2 - 0.4, g, true, true);
  box(w + 0.3, 0.18, 0.18, ctx.mats.roofDark, cx, rearY + 0.1, z2 - 0.95, g, true, true);

  g.add(createLantern(ctx, cx - 0.9, platform + 2.45, z1 + 0.8, false, 0.65));
  g.add(createLantern(ctx, cx + 0.9, platform + 2.45, z1 + 0.8, true, 0.65));
}


function fuTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8f8a7e';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(60,58,50,.45)';
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 14, 228, 228);
  ctx.fillStyle = '#4f4c42';
  ctx.font = '150px "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('福', 128, 138);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.x = -1;
  t.offset.x = 1;
  return t;
}

export function createScreenWall(ctx: WorldContext): void {
  const { x1, x2, z1, z2, height } = SCREEN_WALL;
  const g = new THREE.Group();
  g.name = 'screenWall';
  ctx.architecture.add(g);
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const w = x2 - x1;
  const d = z2 - z1;

  box(w, 0.3, d, ctx.mats.stone, cx, 0, cz, g, false, true);
  box(w, height - 0.3, d - 0.04, ctx.mats.brick, cx, 0.3, cz, g, true, true);
  // plinth / frame
  box(w + 0.15, 0.14, d + 0.14, ctx.mats.stone, cx, 0.28, cz, g, false, true);
  box(w + 0.1, 0.1, d + 0.1, ctx.mats.stone, cx, height - 0.12, cz, g, false, true);
  // A modest central brick-carved panel, leaving the gray brick field visible.
  const panelZ = z1 - 0.035;
  const panelW = 1.9;
  const panelH = 1.35;
  const panelY = 0.92;
  box(panelW, panelH, 0.06, ctx.mats.stone, cx, panelY, panelZ, g, false, true);
  // frame strips
  box(panelW + 0.16, 0.08, 0.1, ctx.mats.stone, cx, panelY, panelZ - 0.02, g, false, true);
  box(panelW + 0.16, 0.08, 0.1, ctx.mats.stone, cx, panelY + panelH, panelZ - 0.02, g, false, true);
  for (const sx of [-1, 1]) box(0.08, panelH, 0.1, ctx.mats.stone, cx + sx * (panelW / 2 + 0.04), panelY, panelZ - 0.02, g, false, true);
  // centre "福" in a small stone plaque
  const fuMat = new THREE.MeshStandardMaterial({ map: fuTexture(), roughness: 0.9 });
  const fu = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), fuMat);
  fu.position.set(cx, panelY + 0.58, panelZ - 0.055);
  fu.rotation.y = Math.PI;
  g.add(fu);
  // four small corner spandrels
  for (const sx of [-1, 1]) for (const sy of [0, 1]) {
    box(0.28, 0.16, 0.07, ctx.mats.stone, cx + sx * (panelW / 2 - 0.16), panelY + sy * (panelH - 0.16), panelZ - 0.015, g, false, true);
  }
  // tiled cap
  createGableRoof({
    centerX: cx, centerZ: cz, width: w, depth: d + 0.5,
    eave: height - 0.02, ridge: height + 0.34, overhang: 0.3,
    ridgeAxis: 'x', mats: ctx.mats, parent: g, roofStore: ctx.roofs,
  });
  ctx.addCollider(x1, z1, x2, z2);
}
