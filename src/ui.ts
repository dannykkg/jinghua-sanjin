import { GATE, GATE_HOUSE, HALLS, HOTSPOTS, SCREEN_WALL, TERRACE } from './data/site';

export type Mode = 'panorama' | 'walk' | 'orbit';

export interface UICallbacks {
  onMode: (mode: Mode) => void;
  onSpot: (index: number) => void;
  onRoof: () => void;
  onQuality: () => void;
}

function el<T extends HTMLElement>(id: string): T {
  const e = document.getElementById(id);
  if (!e) throw new Error(`Missing element #${id}`);
  return e as T;
}

export class UI {
  private cb: UICallbacks;
  private mode: Mode = 'panorama';
  private spotIndex = 0;
  private spotButtons: HTMLButtonElement[] = [];
  private qualityHigh = true;
  private roofHidden = false;
  private helpOpen = false;
  private toastTimer = 0;
  private mapCanvas: HTMLCanvasElement;
  private mapCtx: CanvasRenderingContext2D;
  private joystick: HTMLElement;

  constructor(cb: UICallbacks) {
    this.cb = cb;
    this.mapCanvas = document.querySelector<HTMLCanvasElement>('#minimap canvas')!;
    this.mapCtx = this.mapCanvas.getContext('2d')!;
    this.joystick = el<HTMLElement>('joystick');

    document.querySelectorAll<HTMLButtonElement>('#modes button').forEach((b) => {
      b.addEventListener('click', () => this.cb.onMode(b.dataset.mode as Mode));
    });
    el<HTMLButtonElement>('btn-help').addEventListener('click', () => this.toggleHelp(true));
    el<HTMLButtonElement>('help-close').addEventListener('click', () => this.toggleHelp(false));
    el<HTMLElement>('help-panel').addEventListener('click', (e) => {
      if (e.target === el<HTMLElement>('help-panel')) this.toggleHelp(false);
    });
    el<HTMLButtonElement>('btn-roof').addEventListener('click', () => {
      this.roofHidden = !this.roofHidden;
      el<HTMLButtonElement>('btn-roof').classList.toggle('active', this.roofHidden);
      el<HTMLButtonElement>('btn-roof').textContent = this.roofHidden ? '复原' : '剖切';
      this.cb.onRoof();
    });
    el<HTMLButtonElement>('btn-quality').addEventListener('click', () => {
      this.qualityHigh = !this.qualityHigh;
      el<HTMLButtonElement>('btn-quality').textContent = this.qualityHigh ? '画质 · 高' : '画质 · 轻';
      this.cb.onQuality();
    });
    el<HTMLButtonElement>('info-next').addEventListener('click', () => {
      const next = (this.spotIndex + 1) % HOTSPOTS.length;
      this.cb.onSpot(next);
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        this.toggleHelp(!this.helpOpen);
      }
      if (e.key === 'Escape') this.toggleHelp(false);
      if (e.key === '1') this.cb.onMode('panorama');
      if (e.key === '2') this.cb.onMode('walk');
      if (e.key === '3') this.cb.onMode('orbit');
    });

    this.buildSpots();
    this.showSpot(0);
    this.setMode('panorama');
  }

  private buildSpots(): void {
    const nav = el<HTMLElement>('spots');
    nav.innerHTML = '';
    HOTSPOTS.forEach((h, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `${h.name}<small>${String(i + 1).padStart(2, '0')}</small>`;
      b.addEventListener('click', () => this.cb.onSpot(i));
      nav.appendChild(b);
      this.spotButtons.push(b);
    });
  }

  showSpot(index: number): void {
    this.spotIndex = index;
    const h = HOTSPOTS[index];
    el('info-kicker').textContent = h.kicker;
    el('info-title').textContent = h.title;
    el('info-text').textContent = h.text;
    const facts = el<HTMLUListElement>('info-facts');
    facts.innerHTML = '';
    for (const f of h.facts) {
      const li = document.createElement('li');
      li.textContent = f;
      facts.appendChild(li);
    }
    this.spotButtons.forEach((b, i) => b.classList.toggle('active', i === index));
    if (this.mode === 'orbit') {
      el('info-kicker').textContent = '鸟瞰 · 三进格局';
      el('info-title').textContent = '三进格局';
      el('info-text').textContent = '拖动旋转，滚轮缩放；点“剖切”隐藏屋顶与顶棚。宅门在东南，垂花门与正房压在中轴，一进窄、二进大、三进静。';
      facts.innerHTML = '';
    }
  }

  setMode(mode: Mode): void {
    this.mode = mode;
    document.querySelectorAll<HTMLButtonElement>('#modes button').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    const spots = el<HTMLElement>('spots');
    const info = el<HTMLElement>('info-card');
    const walkHud = el<HTMLElement>('walk-hud');
    const roofBtn = el<HTMLElement>('btn-roof');
    spots.classList.toggle('hidden', mode !== 'panorama');
    info.classList.toggle('hidden', mode === 'walk');
    walkHud.classList.toggle('hidden', mode !== 'walk');
    roofBtn.classList.toggle('hidden', mode !== 'orbit');
    el<HTMLElement>('info-next').style.display = mode === 'orbit' ? 'none' : '';
    this.joystick.classList.toggle('visible', mode === 'walk');
    if (mode === 'panorama') {
      this.showSpot(this.spotIndex);
      this.setHint('拖动环视 · 滚轮缩放 · 右侧选择机位');
    } else if (mode === 'walk') {
      this.setHint('点击画面进入 · WASD 行走 · Shift 加快 · M 地图 · Esc 释放');
    } else {
      this.setHint('拖动旋转 · 滚轮缩放 · 点“剖切”看格局');
      el('info-kicker').textContent = '鸟瞰 · 三进格局';
      el('info-title').textContent = '三进格局';
      el('info-text').textContent = '拖动旋转，滚轮缩放；点“剖切”隐藏屋顶与顶棚。宅门在东南，垂花门与正房压在中轴，一进窄、二进大、三进静。';
      el<HTMLUListElement>('info-facts').innerHTML = '';
    }
  }

  setHint(text: string, dark = false): void {
    const h = el<HTMLElement>('hint');
    h.textContent = text;
    h.classList.toggle('dark', dark);
  }

  setLoading(pct: number): void {
    const p = Math.max(0, Math.min(100, pct));
    const bar = document.querySelector<HTMLElement>('#loading .loading-bar span');
    const txt = document.querySelector<HTMLElement>('#loading .loading-pct');
    if (bar) bar.style.width = `${p}%`;
    if (txt) txt.textContent = `${Math.round(p)}%`;
  }

  finishLoading(): void {
    el<HTMLElement>('loading').classList.add('done');
    window.setTimeout(() => {
      el<HTMLElement>('loading').style.display = 'none';
    }, 1100);
  }

  toggleHelp(open: boolean): void {
    this.helpOpen = open;
    el<HTMLElement>('help-panel').classList.toggle('hidden', !open);
  }

  toast(message: string, ms = 1700): void {
    const t = el<HTMLElement>('toast');
    t.textContent = message;
    t.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove('show'), ms);
  }

  get isHighQuality(): boolean {
    return this.qualityHigh;
  }

  get isRoofHidden(): boolean {
    return this.roofHidden;
  }

  setRoofHidden(hidden: boolean): void {
    this.roofHidden = hidden;
    el<HTMLButtonElement>('btn-roof').classList.toggle('active', hidden);
    el<HTMLButtonElement>('btn-roof').textContent = hidden ? '复原' : '剖切';
  }

  drawMinimap(x: number, z: number, yaw: number): void {
    const c = this.mapCanvas;
    const ctx = this.mapCtx;
    const W = c.width;
    const H = c.height;
    const pad = 12;
    const sx = (W - pad * 2) / 26;
    const sz = (H - pad * 2) / 56;
    const s = Math.min(sx, sz);
    const ox = pad + (W - pad * 2 - 26 * s) / 2;
    const oz = pad + (H - pad * 2 - 56 * s) / 2;
    const mx = (xx: number) => ox + xx * s;
    const mz = (zz: number) => oz + (56 - zz) * s;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(239,233,218,.85)';
    ctx.fillRect(mx(0), mz(56), 26 * s, 56 * s);
    ctx.strokeStyle = 'rgba(52,47,39,.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx(0), mz(56), 26 * s, 56 * s);

    const rect = (x1: number, z1: number, x2: number, z2: number, fill: string, stroke: string) => {
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 0.7;
      ctx.fillRect(mx(x1), mz(z2), (x2 - x1) * s, (z2 - z1) * s);
      ctx.strokeRect(mx(x1), mz(z2), (x2 - x1) * s, (z2 - z1) * s);
    };

    for (const h of HALLS) rect(h.x1, h.z1, h.x2, h.z2, 'rgba(199,193,178,.95)', 'rgba(60,55,46,.5)');
    rect(GATE.x1, GATE.z1, GATE.x2, GATE.z2, 'rgba(166,120,92,.9)', 'rgba(60,55,46,.5)');
    rect(GATE_HOUSE.x1, GATE_HOUSE.z1, GATE_HOUSE.x2, GATE_HOUSE.z2, 'rgba(166,120,92,.9)', 'rgba(60,55,46,.5)');
    rect(SCREEN_WALL.x1, SCREEN_WALL.z1, SCREEN_WALL.x2, SCREEN_WALL.z2, 'rgba(120,116,104,.9)', 'rgba(60,55,46,.4)');
    rect(TERRACE.x1, TERRACE.z1, TERRACE.x2, TERRACE.z2, 'rgba(210,202,185,.9)', 'rgba(60,55,46,.3)');

    // paths
    ctx.fillStyle = 'rgba(224,213,190,.95)';
    ctx.fillRect(mx(11.9), mz(35.4), 2.2 * s, (35.4 - 19.2) * s);
    ctx.fillRect(mx(7.6), mz(31.4), (18.4 - 7.6) * s, 2 * s);

    // player
    const px = mx(x);
    const pz = mz(z);
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(yaw);
    ctx.fillStyle = '#9f4030';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 2.8);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(36,33,27,.8)';
    ctx.beginPath();
    ctx.arc(px, pz, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // tiny north mark
    ctx.fillStyle = 'rgba(60,55,46,.55)';
    ctx.font = '8px "PingFang SC", sans-serif';
    ctx.fillText('北', W - 16, 12);
  }
}
