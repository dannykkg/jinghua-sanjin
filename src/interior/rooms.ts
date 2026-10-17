import * as THREE from 'three';
import type { HallSpec } from '../data/site';
import type { WorldContext } from '../world/context';
import type { FacadeInfo } from '../world/halls';
import {
  createBed, createCabinet, createChair, createCouplet, createDesk, createKang,
  createLantern, createLongTable, createPainting, createPottedPlant, createRug,
  createScreen, createShelf, createSquareTable, createTeaSet, createVase,
  createWardrobe, createWashStand, placeFurniture,
} from './furniture';

function collider(ctx: WorldContext, x: number, z: number, w: number, d: number): void {
  ctx.addCollider(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
}

function addClock(ctx: WorldContext, parent: THREE.Object3D, x: number, y: number, z: number): void {
  const mats = ctx.mats;
  const body = new THREE.Group();
  body.position.set(x, y, z);
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.18), mats.woodDark);
  b.position.y = 0.25;
  body.add(b);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), mats.porcelainWhite);
  face.position.set(0, 0.32, 0.095);
  body.add(face);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.08, 0.005), mats.blackLacquer);
  hand.position.set(0, 0.35, 0.103);
  body.add(hand);
  parent.add(body);
}

function addShelfObjects(ctx: WorldContext, parent: THREE.Object3D, x: number, y: number, z: number, rotY = 0): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const mats = ctx.mats;
  for (let i = 0; i < 8; i++) {
    const w = 0.18 + (i % 3) * 0.06;
    const h = 0.22 + (i % 4) * 0.06;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), mats.fabricBlue);
    b.position.set(-0.55 + i * 0.15, 0.25 + (i % 2) * 0.45, 0.02);
    b.rotation.z = (i % 2 ? -1 : 1) * 0.04;
    g.add(b);
  }
  parent.add(g);
}

function mainHall(ctx: WorldContext, spec: HallSpec, info: FacadeInfo): void {
  const y = spec.platform;
  const mats = ctx.mats;
  const g = new THREE.Group();
  ctx.interior.add(g);

  // central bay: 条案—八仙桌—太师椅
  const long = createLongTable(mats, 2.6, 0.42, 0.96);
  placeFurniture(g, long, 13, y, 44.05);
  collider(ctx, 13, 44.05, 2.6, 0.45);

  const square = createSquareTable(mats, 1.0, 0.84);
  placeFurniture(g, square, 13, y, 42.72);
  collider(ctx, 13, 42.72, 1.05, 1.05);

  const chairL = createChair(mats);
  placeFurniture(g, chairL, 11.62, y, 42.72, Math.PI / 2);
  collider(ctx, 11.62, 42.72, 0.62, 0.62);
  const chairR = createChair(mats);
  placeFurniture(g, chairR, 14.38, y, 42.72, -Math.PI / 2);
  collider(ctx, 14.38, 42.72, 0.62, 0.62);

  const rug = createRug(mats, 3.4, 2.5);
  rug.position.set(13, y + 0.015, 42.55);
  g.add(rug);

  // long table objects
  for (const x of [11.95, 14.05]) {
    const vase = createVase(mats, 0.48, x < 13 ? mats.porcelainBlue : mats.celadon);
    vase.position.set(x, y + 0.96, 44.05);
    g.add(vase);
  }
  const centerVase = createVase(mats, 0.42, mats.porcelainWhite);
  centerVase.position.set(13.0, y + 0.96, 44.09);
  g.add(centerVase);
  addClock(ctx, g, 13.0, y + 0.96, 44.0);
  const tea = createTeaSet(mats);
  tea.position.set(13.0, y + 0.855, 42.72);
  g.add(tea);

  // wall art
  const painting = createPainting(mats, 2.1, 1.45, 0);
  painting.position.set(13, y + 1.25, 44.17);
  painting.rotation.y = Math.PI;
  g.add(painting);
  for (const [i, x] of [11.72, 14.28].entries()) {
    const c = createCouplet(mats, i, 1.75);
    c.position.set(x, y + 1.18, 44.16);
    c.rotation.y = Math.PI;
    g.add(c);
  }
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.44), mats.plaque);
  plaque.position.set(13, y + 3.25, 44.15);
  plaque.rotation.y = Math.PI;
  g.add(plaque);

  // lanterns: one with a real point light, one unlit
  const l1 = createLantern(ctx, 11.75, y + 2.25, 41.3, true, 0.95);
  g.add(l1);
  const l2 = createLantern(ctx, 14.25, y + 2.25, 41.3, false, 0.95);
  g.add(l2);

  // east study
  const east = new THREE.Group();
  g.add(east);
  const desk = createDesk(mats, 1.55, 0.7, 0.82);
  placeFurniture(east, desk, 17.45, y, 40.45);
  collider(ctx, 17.45, 40.45, 1.6, 0.75);
  const deskChair = createChair(mats, mats.fabricBlue);
  placeFurniture(east, deskChair, 17.45, y, 41.35, Math.PI);
  collider(ctx, 17.45, 41.35, 0.62, 0.62);
  const shelf = createShelf(mats, 1.75, 1.95, 0.36, 4);
  placeFurniture(east, shelf, 20.72, y, 42.2, -Math.PI / 2);
  collider(ctx, 20.72, 42.2, 0.42, 1.8);
  addShelfObjects(ctx, east, 20.62, y, 42.2, -Math.PI / 2);
  const cabinet = createCabinet(mats, 1.05, 0.92, 0.45);
  placeFurniture(east, cabinet, 16.1, y, 43.85);
  collider(ctx, 16.1, 43.85, 1.1, 0.5);
  const eastPainting = createPainting(mats, 1.3, 1.1, 1);
  eastPainting.position.set(20.85, y + 1.35, 41.0);
  eastPainting.rotation.y = -Math.PI / 2;
  east.add(eastPainting);
  const eastRug = createRug(mats, 2.4, 1.8, mats.fabricBlue);
  eastRug.position.set(18.1, y + 0.015, 42.3);
  east.add(eastRug);
  const eastPlant = createPottedPlant(mats, 0.85);
  eastPlant.position.set(19.8, y, 39.7);
  east.add(eastPlant);

  // west bedroom
  const west = new THREE.Group();
  g.add(west);
  const kang = createKang(mats, 2.55, 1.35, 0.46);
  placeFurniture(west, kang, 9.05, y, 40.25);
  collider(ctx, 9.05, 40.25, 2.6, 1.4);
  const wardrobe = createWardrobe(mats, 1.35, 2.0, 0.55);
  placeFurniture(west, wardrobe, 5.55, y, 42.65, Math.PI / 2);
  collider(ctx, 5.55, 42.65, 0.6, 1.4);
  const screen = createScreen(mats, 3, 1.6, 1.7);
  placeFurniture(west, screen, 7.15, y, 43.0, 0);
  collider(ctx, 7.15, 43.0, 1.65, 0.35);
  const wash = createWashStand(mats);
  placeFurniture(west, wash, 10.25, y, 43.45);
  collider(ctx, 10.25, 43.45, 0.9, 0.55);
  const westPainting = createPainting(mats, 1.35, 1.1, 2);
  westPainting.position.set(8.1, y + 1.35, 44.17);
  westPainting.rotation.y = Math.PI;
  west.add(westPainting);
  const westRug = createRug(mats, 2.6, 1.8, mats.fabricRed);
  westRug.position.set(8.2, y + 0.015, 42.1);
  west.add(westRug);
  const l3 = createLantern(ctx, 8.1, y + 2.25, 41.6, true, 0.8);
  west.add(l3);

  // soft interior fill for the open central bay (彻上明造)
  const fillLight = new THREE.PointLight(0xffd39b, 11, 10, 2);
  fillLight.position.set(13, y + 4.0, 41.4);
  g.add(fillLight);
}

function eastWing(ctx: WorldContext, spec: HallSpec): void {
  const y = spec.platform;
  const mats = ctx.mats;
  const g = new THREE.Group();
  ctx.interior.add(g);
  const desk = createDesk(mats, 1.5, 0.68, 0.8);
  placeFurniture(g, desk, 23.1, y, 28.2, Math.PI / 2);
  collider(ctx, 23.1, 28.2, 0.75, 1.55);
  const chair = createChair(mats, mats.fabricBlue);
  placeFurniture(g, chair, 22.2, y, 28.2, -Math.PI / 2);
  collider(ctx, 22.2, 28.2, 0.62, 0.62);
  const shelf = createShelf(mats, 1.8, 1.95, 0.36, 4);
  placeFurniture(g, shelf, 22.2, y, 34.55, Math.PI);
  collider(ctx, 22.2, 34.55, 1.85, 0.42);
  addShelfObjects(ctx, g, 22.2, y, 34.45, Math.PI);
  const tea = createSquareTable(mats, 0.78, 0.72);
  placeFurniture(g, tea, 22.3, y, 32.2);
  collider(ctx, 22.3, 32.2, 0.85, 0.85);
  for (const [i, z] of [31.5, 32.9].entries()) {
    const c = createChair(mats, mats.fabricCream);
    placeFurniture(g, c, 21.5, y, z, Math.PI / 2);
    if (i === 0) collider(ctx, 21.5, z, 0.62, 0.62);
  }
  const painting = createPainting(mats, 1.3, 1.05, 1);
  painting.position.set(24.52, y + 1.35, 30.9);
  painting.rotation.y = -Math.PI / 2;
  g.add(painting);
  const rug = createRug(mats, 2.4, 2.1, mats.fabricCream);
  rug.position.set(22.6, y + 0.015, 30.6);
  g.add(rug);
  const plant = createPottedPlant(mats, 0.85);
  plant.position.set(24.1, y, 33.8);
  g.add(plant);
  const lantern = createLantern(ctx, 23.0, y + 2.15, 30.9, true, 0.8);
  g.add(lantern);
}

function westWing(ctx: WorldContext, spec: HallSpec): void {
  const y = spec.platform;
  const mats = ctx.mats;
  const g = new THREE.Group();
  ctx.interior.add(g);
  const bed = createBed(mats, 1.55, 2.0, 0.5);
  placeFurniture(g, bed, 3.55, y, 33.35);
  collider(ctx, 3.55, 33.35, 1.6, 2.05);
  const desk = createDesk(mats, 1.35, 0.65, 0.8);
  placeFurniture(g, desk, 2.05, y, 28.0, -Math.PI / 2);
  collider(ctx, 2.05, 28.0, 0.7, 1.4);
  const chair = createChair(mats, mats.fabricBlue);
  placeFurniture(g, chair, 2.95, y, 28.0, Math.PI / 2);
  const wardrobe = createWardrobe(mats, 1.2, 1.95, 0.55);
  placeFurniture(g, wardrobe, 1.75, y, 31.3, -Math.PI / 2);
  collider(ctx, 1.75, 31.3, 0.6, 1.25);
  const screen = createScreen(mats, 3, 1.4, 1.65);
  placeFurniture(g, screen, 4.35, y, 30.9, Math.PI / 2);
  collider(ctx, 4.35, 30.9, 0.35, 1.45);
  const wash = createWashStand(mats);
  placeFurniture(g, wash, 1.85, y, 34.55);
  collider(ctx, 1.85, 34.55, 0.9, 0.55);
  const painting = createPainting(mats, 1.2, 1.0, 2);
  painting.position.set(1.42, y + 1.3, 30.2);
  painting.rotation.y = Math.PI / 2;
  g.add(painting);
  const rug = createRug(mats, 2.1, 1.7, mats.fabricRed);
  rug.position.set(3.1, y + 0.015, 30.9);
  g.add(rug);
  const lantern = createLantern(ctx, 3.4, y + 2.15, 31.0, true, 0.8);
  g.add(lantern);
}

function southHall(ctx: WorldContext, spec: HallSpec): void {
  const y = spec.platform;
  const mats = ctx.mats;
  const g = new THREE.Group();
  ctx.interior.add(g);
  // 门房 / 账房：一条账桌、两条长凳、几只箱柜
  const desk = createDesk(mats, 1.7, 0.7, 0.8);
  placeFurniture(g, desk, 7.2, y, 3.7);
  collider(ctx, 7.2, 3.7, 1.75, 0.75);
  const bench = createLongTable(mats, 1.8, 0.36, 0.46);
  placeFurniture(g, bench, 7.2, y, 2.6);
  collider(ctx, 7.2, 2.6, 1.8, 0.4);
  const cab = createCabinet(mats, 1.0, 0.9, 0.45);
  placeFurniture(g, cab, 2.7, y, 4.9, Math.PI);
  collider(ctx, 2.7, 4.9, 1.05, 0.5);
  const consoleTable = createSquareTable(mats, 0.85, 0.82);
  placeFurniture(g, consoleTable, 9.65, y, 4.15);
  collider(ctx, 9.65, 4.15, 0.9, 0.9);
  const lantern = createLantern(ctx, 9.6, y + 2.0, 3.4, true, 0.75);
  g.add(lantern);
}

function rearHall(ctx: WorldContext, spec: HallSpec): void {
  const y = spec.platform;
  const mats = ctx.mats;
  const g = new THREE.Group();
  ctx.interior.add(g);
  const shelf = createShelf(mats, 2.2, 1.9, 0.36, 4);
  placeFurniture(g, shelf, 10.2, y, 55.25, Math.PI);
  collider(ctx, 10.2, 55.25, 2.25, 0.42);
  addShelfObjects(ctx, g, 10.2, y, 55.15, Math.PI);
  const table = createSquareTable(mats, 0.85, 0.76);
  placeFurniture(g, table, 13.0, y, 53.7);
  collider(ctx, 13.0, 53.7, 0.9, 0.9);
  const cabinet = createCabinet(mats, 1.1, 0.9, 0.45);
  placeFurniture(g, cabinet, 16.4, y, 55.1, Math.PI);
  collider(ctx, 16.4, 55.1, 1.15, 0.5);
  const lantern = createLantern(ctx, 13.0, y + 2.1, 53.0, true, 0.75);
  g.add(lantern);
}

export function decorateHall(ctx: WorldContext, spec: HallSpec, _info: FacadeInfo): void {
  switch (spec.interior) {
    case 'mainHall':
      mainHall(ctx, spec, _info);
      break;
    case 'eastWing':
      eastWing(ctx, spec);
      break;
    case 'westWing':
      westWing(ctx, spec);
      break;
    case 'southHall':
      southHall(ctx, spec);
      break;
    case 'rearHall':
      rearHall(ctx, spec);
      break;
  }
}
