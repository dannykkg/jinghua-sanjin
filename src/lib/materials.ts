import * as THREE from 'three';

/** Deterministic pseudo-random generator so the courtyard looks the same every load. */
export function rng(seed = 20261017): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, rand: () => number, alpha = 0.08): void {
  for (let i = 0; i < count; i++) {
    const g = Math.floor(rand() * 255);
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`;
    const s = 0.5 + rand() * 1.8;
    ctx.fillRect(rand() * w, rand() * h, s, s);
  }
}

function canvasTexture(c: HTMLCanvasElement, srgb = true, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function brickTextures(): { map: THREE.Texture; bump: THREE.Texture } {
  const rand = rng(11);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#777870';
  ctx.fillRect(0, 0, 512, 512);
  const rows = 16;
  const bh = 512 / rows;
  const bw = 128;
  const palette = ['#747a74', '#697067', '#7e8178', '#62675f', '#7a7c72', '#70756d'];
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 ? -bw / 2 : 0;
    for (let x = offset; x < 512; x += bw) {
      const col = palette[Math.floor(rand() * palette.length)];
      ctx.fillStyle = col;
      ctx.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
      // soft weathering and a little edge darkening
      const grd = ctx.createLinearGradient(x, r * bh, x + bw, r * bh + bh);
      grd.addColorStop(0, 'rgba(255,255,255,0.035)');
      grd.addColorStop(0.55, 'rgba(0,0,0,0.015)');
      grd.addColorStop(1, 'rgba(0,0,0,0.07)');
      ctx.fillStyle = grd;
      ctx.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
    }
  }
  speckle(ctx, 512, 512, 2600, rand, 0.09);
  // faint lime staining near the bottom
  const stain = ctx.createLinearGradient(0, 380, 0, 512);
  stain.addColorStop(0, 'rgba(220,220,205,0)');
  stain.addColorStop(1, 'rgba(218,216,198,0.10)');
  ctx.fillStyle = stain;
  ctx.fillRect(0, 380, 512, 132);
  return { map: canvasTexture(c), bump: canvasTexture(c, false) };
}

function roofTextures(): { map: THREE.Texture; bump: THREE.Texture } {
  const rand = rng(22);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#3e4340';
  ctx.fillRect(0, 0, 512, 512);
  const cols = 7;
  const colW = 512 / cols;
  for (let i = 0; i < cols; i++) {
    const x = i * colW;
    const g = ctx.createLinearGradient(x, 0, x + colW, 0);
    g.addColorStop(0, '#303633');
    g.addColorStop(0.18, '#555b55');
    g.addColorStop(0.48, '#686d66');
    g.addColorStop(0.72, '#424843');
    g.addColorStop(1, '#2f3532');
    ctx.fillStyle = g;
    ctx.fillRect(x + 1, 0, colW - 2, 512);
    ctx.fillStyle = 'rgba(18,22,20,0.25)';
    ctx.fillRect(x, 0, 2, 512);
  }
  // tile courses
  const rows = 6;
  const rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = 'rgba(18,22,20,0.16)';
    ctx.fillRect(0, r * rh, 512, 3);
    ctx.fillStyle = 'rgba(200,200,185,0.05)';
    ctx.fillRect(0, r * rh + 3, 512, 1);
  }
  // weather / moss in crevices
  for (let i = 0; i < 150; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.fillStyle = `rgba(${50 + rand() * 30},${60 + rand() * 30},${48 + rand() * 20},${0.04 + rand() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 2 + rand() * 12, 1 + rand() * 4, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, 512, 512, 2500, rand, 0.08);
  return { map: canvasTexture(c), bump: canvasTexture(c, false) };
}

function stoneTextures(): { map: THREE.Texture; bump: THREE.Texture } {
  const rand = rng(33);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#918d82';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(${100 + rand() * 55},${98 + rand() * 50},${90 + rand() * 42},${0.05 + rand() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(rand() * 512, rand() * 512, 12 + rand() * 100, 5 + rand() * 40, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(55,54,49,0.15)';
  for (let i = 0; i < 18; i++) {
    ctx.lineWidth = 0.5 + rand() * 1.2;
    ctx.beginPath();
    let x = rand() * 512;
    let y = rand() * 512;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (rand() - 0.5) * 80;
      y += (rand() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  speckle(ctx, 512, 512, 2200, rand, 0.08);
  return { map: canvasTexture(c), bump: canvasTexture(c, false) };
}

function pavingTextures(): { map: THREE.Texture; bump: THREE.Texture } {
  const rand = rng(44);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#666a63';
  ctx.fillRect(0, 0, 512, 512);
  const tiles = 4;
  const s = 512 / tiles;
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const v = 96 + rand() * 8;
      ctx.fillStyle = `rgb(${v},${v + 2},${v - 4})`;
      ctx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(x * s + 6, y * s + 6, s - 12, 2);
    }
  }
  speckle(ctx, 512, 512, 3400, rand, 0.08);
  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = `rgba(42,46,40,${0.03 + rand() * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(rand() * 512, rand() * 512, 8 + rand() * 35, 4 + rand() * 18, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return { map: canvasTexture(c), bump: canvasTexture(c, false) };
}

function woodTextures(base: string, dark: string, light: string, seed: number): { map: THREE.Texture; bump: THREE.Texture } {
  const rand = rng(seed);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const y = rand() * 512;
    const amp = 2 + rand() * 8;
    const freq = 0.01 + rand() * 0.025;
    ctx.strokeStyle = i % 3 === 0 ? dark : light;
    ctx.globalAlpha = 0.08 + rand() * 0.16;
    ctx.lineWidth = 0.6 + rand() * 2.2;
    ctx.beginPath();
    for (let x = 0; x <= 512; x += 8) {
      const yy = y + Math.sin(x * freq + i) * amp + Math.sin(x * 0.11 + i * 2) * 0.8;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // knots
  for (let i = 0; i < 5; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1;
    for (let r = 2; r < 16; r += 2.5) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r, rand() * 0.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  speckle(ctx, 512, 512, 1700, rand, 0.06);
  return { map: canvasTexture(c), bump: canvasTexture(c, false) };
}

function plasterTextures(): { map: THREE.Texture; bump: THREE.Texture } {
  const rand = rng(66);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#d9d3c4';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 110; i++) {
    ctx.fillStyle = `rgba(${160 + rand() * 45},${155 + rand() * 42},${140 + rand() * 35},${0.04 + rand() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(rand() * 512, rand() * 512, 5 + rand() * 55, 3 + rand() * 28, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, 512, 512, 2200, rand, 0.05);
  return { map: canvasTexture(c), bump: canvasTexture(c, false) };
}

function paperTextures(): { map: THREE.Texture } {
  const rand = rng(77);
  const [c, ctx] = canvas(512, 512);
  ctx.fillStyle = '#dfd2b8';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1200; i++) {
    ctx.strokeStyle = `rgba(${140 + rand() * 65},${125 + rand() * 55},${95 + rand() * 45},${0.03 + rand() * 0.06})`;
    ctx.lineWidth = 0.5;
    const x = rand() * 512;
    const y = rand() * 512;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2 + rand() * 12, y + (rand() - 0.5) * 4);
    ctx.stroke();
  }
  return { map: canvasTexture(c) };
}

function fabricTextures(base: string, light: string, seed: number): { map: THREE.Texture } {
  const rand = rng(seed);
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 128; i += 4) {
    ctx.strokeStyle = light;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, 256, 256, 900, rand, 0.05);
  return { map: canvasTexture(c) };
}

function inkPainting(seed: number, title: string): THREE.Texture {
  const rand = rng(seed);
  const [c, ctx] = canvas(512, 768);
  ctx.fillStyle = '#e6dcc5';
  ctx.fillRect(0, 0, 512, 768);
  // subtle paper tone
  const g = ctx.createLinearGradient(0, 0, 512, 768);
  g.addColorStop(0, 'rgba(255,255,255,.12)');
  g.addColorStop(1, 'rgba(105,88,60,.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 768);
  // ink mountains
  for (let layer = 0; layer < 4; layer++) {
    ctx.globalAlpha = 0.12 + layer * 0.13;
    ctx.fillStyle = layer < 3 ? '#4c4d46' : '#2c2d27';
    ctx.beginPath();
    const baseY = 390 + layer * 55;
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= 512; x += 24) {
      const y = baseY - Math.abs(Math.sin(x * 0.011 + layer * 1.7)) * (50 + layer * 32) - rand() * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(512, 768);
    ctx.lineTo(0, 768);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // trees
  ctx.strokeStyle = 'rgba(35,36,31,.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(360, 590);
  ctx.bezierCurveTo(350, 520, 365, 480, 380, 430);
  ctx.stroke();
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(40,42,35,${0.25 + rand() * 0.3})`;
    ctx.lineWidth = 0.8 + rand();
    ctx.beginPath();
    const x = 350 + rand() * 100;
    const y = 420 + rand() * 130;
    ctx.moveTo(370, 500);
    ctx.quadraticCurveTo(x, y, x + (rand() - 0.5) * 55, y - 20 - rand() * 35);
    ctx.stroke();
  }
  // water / mist strokes
  for (let i = 0; i < 30; i++) {
    ctx.strokeStyle = `rgba(245,240,225,${0.05 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    ctx.moveTo(rand() * 512, 550 + rand() * 150);
    ctx.lineTo(rand() * 512, 550 + rand() * 150);
    ctx.stroke();
  }
  // calligraphy
  ctx.save();
  ctx.translate(440, 92);
  ctx.fillStyle = '#2a2923';
  ctx.font = '26px "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  const chars = title.split('');
  chars.forEach((ch, i) => ctx.fillText(ch, 0, i * 34));
  ctx.restore();
  // seal
  ctx.fillStyle = '#a33e2d';
  ctx.fillRect(414, 330, 34, 34);
  ctx.fillStyle = '#e9dfc7';
  ctx.font = '15px "Songti SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('京', 431, 353);
  return canvasTexture(c, true, false);
}

function calligraphyTexture(text: string): THREE.Texture {
  const [c, ctx] = canvas(192, 1024);
  ctx.fillStyle = '#e7ddc5';
  ctx.fillRect(0, 0, 192, 1024);
  ctx.strokeStyle = 'rgba(80,65,46,.12)';
  ctx.strokeRect(12, 12, 168, 1000);
  ctx.fillStyle = '#27251f';
  ctx.font = '78px "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  const chars = text.split('');
  const start = 120;
  chars.forEach((ch, i) => {
    const y = start + i * 96;
    if (y < 950) ctx.fillText(ch, 96, y);
  });
  return canvasTexture(c, true, false);
}

function plaqueTexture(text: string): THREE.Texture {
  const [c, ctx] = canvas(768, 224);
  ctx.fillStyle = '#25221c';
  ctx.fillRect(0, 0, 768, 224);
  ctx.strokeStyle = '#b08a45';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 736, 192);
  ctx.strokeStyle = 'rgba(176,138,69,.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, 712, 168);
  ctx.fillStyle = '#d6b56c';
  ctx.font = '96px "Songti SC", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 118);
  return canvasTexture(c, true, false);
}

function latticeAlphaTexture(): THREE.Texture {
  // Reserved for distant LOD; currently the lattice is true geometry.
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 6;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  return canvasTexture(c, false);
}

export interface Materials {
  brick: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  roofDark: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  paving: THREE.MeshStandardMaterial;
  pavingPath: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  woodRed: THREE.MeshStandardMaterial;
  woodLight: THREE.MeshStandardMaterial;
  woodVertical: THREE.MeshStandardMaterial;
  blackLacquer: THREE.MeshStandardMaterial;
  greenLacquer: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  gold: THREE.MeshStandardMaterial;
  porcelainWhite: THREE.MeshStandardMaterial;
  porcelainBlue: THREE.MeshStandardMaterial;
  celadon: THREE.MeshStandardMaterial;
  fabricRed: THREE.MeshStandardMaterial;
  fabricBlue: THREE.MeshStandardMaterial;
  fabricCream: THREE.MeshStandardMaterial;
  water: THREE.MeshStandardMaterial;
  soil: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  blossom: THREE.MeshStandardMaterial;
  fruit: THREE.MeshStandardMaterial;
  paintings: THREE.MeshStandardMaterial[];
  calligraphy: THREE.MeshStandardMaterial[];
  plaque: THREE.MeshStandardMaterial;
  lanternPaper: THREE.MeshStandardMaterial;
  latticeAlpha: THREE.Texture;
}

function standard(map?: THREE.Texture, bump?: THREE.Texture, opts: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map,
    bumpMap: bump,
    bumpScale: 0.018,
    roughness: 0.85,
    metalness: 0,
    envMapIntensity: 0.35,
    ...opts,
  });
}

export function createMaterials(): Materials {
  const brickT = brickTextures();
  const roofT = roofTextures();
  const stoneT = stoneTextures();
  const paveT = pavingTextures();
  const woodDarkT = woodTextures('#3a2a21', '#1c1410', '#6b4b38', 101);
  const woodRedT = woodTextures('#5c3426', '#2a1711', '#8a5740', 102);
  const woodLightT = woodTextures('#8a6748', '#5a3f2b', '#b18a62', 103);
  const plasterT = plasterTextures();
  const paperT = paperTextures();
  const fabricRedT = fabricTextures('#71342c', '#a76252', 201);
  const fabricBlueT = fabricTextures('#324847', '#6f8d84', 202);
  const fabricCreamT = fabricTextures('#c8b997', '#e0d3b5', 203);
  const leafT = leafTexture();
  const flowerT = flowerTexture();

  const woodVerticalMap = woodDarkT.map.clone();
  woodVerticalMap.center.set(0.5, 0.5);
  woodVerticalMap.rotation = Math.PI / 2;
  woodVerticalMap.needsUpdate = true;

  const pavingPathMap = paveT.map.clone();
  pavingPathMap.center.set(0.5, 0.5);
  pavingPathMap.rotation = 0.12;
  pavingPathMap.needsUpdate = true;

  const woodVertical = standard(woodVerticalMap, woodDarkT.bump, { roughness: 0.58, envMapIntensity: 0.3 });

  const mats: Materials = {
    brick: standard(brickT.map, brickT.bump, { roughness: 0.94, bumpScale: 0.024 }),
    roof: standard(roofT.map, roofT.bump, { roughness: 0.78, bumpScale: 0.035, envMapIntensity: 0.28 }),
    roofDark: standard(undefined, undefined, { color: 0x343a36, roughness: 0.7, metalness: 0.04 }),
    stone: standard(stoneT.map, stoneT.bump, { roughness: 0.9, bumpScale: 0.022 }),
    paving: standard(paveT.map, paveT.bump, { roughness: 0.9, bumpScale: 0.016 }),
    pavingPath: standard(pavingPathMap, paveT.bump, { roughness: 0.9, bumpScale: 0.014, color: 0xc9c2b0 }),
    plaster: standard(plasterT.map, plasterT.bump, { roughness: 0.96, bumpScale: 0.008 }),
    paper: standard(paperT.map, undefined, {
      roughness: 1,
      transparent: true,
      opacity: 0.93,
      side: THREE.DoubleSide,
      color: 0xe6dbc4,
      emissive: new THREE.Color(0xfff1d0),
      emissiveIntensity: 0.02,
    }),
    woodDark: standard(woodDarkT.map, woodDarkT.bump, { roughness: 0.56, envMapIntensity: 0.3 }),
    woodRed: standard(woodRedT.map, woodRedT.bump, { roughness: 0.52, envMapIntensity: 0.32 }),
    woodLight: standard(woodLightT.map, woodLightT.bump, { roughness: 0.6, envMapIntensity: 0.28 }),
    woodVertical,
    blackLacquer: standard(undefined, undefined, { color: 0x171512, roughness: 0.38, metalness: 0.05 }),
    greenLacquer: standard(undefined, undefined, { color: 0x2f4b41, roughness: 0.42, metalness: 0.03 }),
    brass: standard(undefined, undefined, { color: 0x9d7b3f, roughness: 0.34, metalness: 0.75, envMapIntensity: 0.6 }),
    gold: standard(undefined, undefined, { color: 0xb08a45, roughness: 0.3, metalness: 0.55, envMapIntensity: 0.5 }),
    porcelainWhite: standard(undefined, undefined, { color: 0xe8e4d6, roughness: 0.2, metalness: 0.02 }),
    porcelainBlue: standard(undefined, undefined, { color: 0x5b7d8b, roughness: 0.2, metalness: 0.02 }),
    celadon: standard(undefined, undefined, { color: 0x8fa99a, roughness: 0.22, metalness: 0.02 }),
    fabricRed: standard(fabricRedT.map, undefined, { roughness: 0.92 }),
    fabricBlue: standard(fabricBlueT.map, undefined, { roughness: 0.92 }),
    fabricCream: standard(fabricCreamT.map, undefined, { roughness: 0.95 }),
    water: standard(undefined, undefined, { color: 0x3e615d, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.77 }),
    soil: standard(undefined, undefined, { color: 0x4e4434, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ map: leafT, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 }),
    blossom: new THREE.MeshStandardMaterial({ map: flowerT, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9 }),
    fruit: new THREE.MeshStandardMaterial({ color: 0xa8412d, roughness: 0.55 }),
    paintings: [
      new THREE.MeshStandardMaterial({ map: inkPainting(301, '山静日长'), roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ map: inkPainting(302, '竹石清趣'), roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ map: inkPainting(303, '秋林远岫'), roughness: 0.88 }),
    ],
    calligraphy: [
      new THREE.MeshStandardMaterial({ map: calligraphyTexture('忠厚传家久'), roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ map: calligraphyTexture('诗书继世长'), roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ map: calligraphyTexture('静以修身'), roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ map: calligraphyTexture('俭以养德'), roughness: 0.88 }),
    ],
    plaque: new THREE.MeshStandardMaterial({ map: plaqueTexture('积善余庆'), roughness: 0.5, metalness: 0.05 }),
    lanternPaper: new THREE.MeshStandardMaterial({
      color: 0xf2d7a0, roughness: 0.9, transparent: true, opacity: 0.9,
      emissive: new THREE.Color(0xffb75e), emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
    }),
    latticeAlpha: latticeAlphaTexture(),
  };
  // The site is mirrored in Z for three.js; compensate the U axis on text/art
  // so plaques, couplets and ink paintings are not read backwards.
  const mirrorU = (t?: THREE.Texture): void => {
    if (!t) return;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    t.offset.x = 1;
    t.needsUpdate = true;
  };
  mats.paintings.forEach((m) => mirrorU(m.map ?? undefined));
  mats.calligraphy.forEach((m) => mirrorU(m.map ?? undefined));
  mirrorU(mats.plaque.map ?? undefined);
  return mats;
}

function leafTexture(): THREE.Texture {
  const rand = rng(404);
  const [c, ctx] = canvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate(64 + (rand() - 0.5) * 34, 64 + (rand() - 0.5) * 34);
    ctx.rotate(rand() * Math.PI * 2);
    ctx.fillStyle = i % 2 ? 'rgba(94,118,77,.92)' : 'rgba(113,134,84,.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 + rand() * 9, 18 + rand() * 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return canvasTexture(c, true, false);
}

function flowerTexture(): THREE.Texture {
  const rand = rng(405);
  const [c, ctx] = canvas(128, 128);
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 10; i++) {
    ctx.save();
    ctx.translate(64 + (rand() - 0.5) * 42, 64 + (rand() - 0.5) * 42);
    ctx.rotate(rand() * Math.PI * 2);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(226,164,166,.95)' : 'rgba(238,190,188,.92)';
    for (let p = 0; p < 5; p++) {
      ctx.beginPath();
      ctx.ellipse(0, -7, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.PI * 2 / 5);
    }
    ctx.fillStyle = 'rgba(196,161,82,.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  return canvasTexture(c, true, false);
}
