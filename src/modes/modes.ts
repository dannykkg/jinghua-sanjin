import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { UI } from '../ui';
import type { WorldContext } from '../world/context';
import { HOTSPOTS, WALK_START } from '../data/site';

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

export function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** The plan is +Z north; the rendered world is mirrored to -Z north. */
export function hotspotToWorld(h: typeof HOTSPOTS[number]): { x: number; y: number; z: number; yaw: number; pitch: number } {
  return { x: h.x, y: h.y, z: -h.z, yaw: Math.PI - h.yaw, pitch: h.pitch };
}

export class PanoramaMode {
  active = false;
  current = 4;
  private yaw = 0;
  private pitch = 0;
  private fov = 62;
  private tween: { t: number; dur: number; fromPos: THREE.Vector3; toPos: THREE.Vector3; fromYaw: number; toYaw: number; fromPitch: number; toPitch: number } | null = null;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;

  constructor(private camera: THREE.PerspectiveCamera, private dom: HTMLCanvasElement, private ui: UI) {
    dom.addEventListener('pointerdown', this.onDown);
    dom.addEventListener('pointermove', this.onMove);
    dom.addEventListener('pointerup', this.onUp);
    dom.addEventListener('pointercancel', this.onUp);
    dom.addEventListener('wheel', this.onWheel, { passive: false });
  }

  activate(): void {
    this.active = true;
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
    this.setHotspot(this.current, true);
    this.ui.setHint('拖动环视 · 滚轮缩放 · 右侧选择机位');
  }

  deactivate(): void {
    this.active = false;
    this.dragging = false;
    this.tween = null;
    this.pointers.clear();
  }

  setHotspot(index: number, instant = false): void {
    const h = HOTSPOTS[index];
    if (!h) return;
    this.current = index;
    const w = hotspotToWorld(h);
    this.ui.showSpot(index);
    if (instant) {
      this.camera.position.set(w.x, w.y, w.z);
      this.yaw = w.yaw;
      this.pitch = w.pitch;
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      this.tween = null;
      return;
    }
    this.tween = {
      t: 0, dur: 0.95,
      fromPos: this.camera.position.clone(),
      toPos: new THREE.Vector3(w.x, w.y, w.z),
      fromYaw: this.yaw,
      toYaw: this.yaw + shortestAngle(this.yaw, w.yaw),
      fromPitch: this.pitch,
      toPitch: w.pitch,
    };
  }

  update(dt: number): void {
    if (!this.active) return;
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt;
      const k = clamp(tw.t / tw.dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      this.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
      this.yaw = tw.fromYaw + (tw.toYaw - tw.fromYaw) * e;
      this.pitch = tw.fromPitch + (tw.toPitch - tw.fromPitch) * e;
      if (k >= 1) this.tween = null;
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.active) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.tween = null;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const pts = [...this.pointers.values()];
      this.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      this.dragging = false;
      return;
    }
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.dom.setPointerCapture?.(e.pointerId);
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.active) return;
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 2) {
      const pts = [...this.pointers.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (this.pinchDist > 0) {
        this.fov = clamp(this.fov - (d - this.pinchDist) * 0.08, 45, 78);
        this.camera.fov = this.fov;
        this.camera.updateProjectionMatrix();
      }
      this.pinchDist = d;
      return;
    }
    if (!this.dragging) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.yaw -= dx * 0.003;
    this.pitch = clamp(this.pitch - dy * 0.003, -1.3, 1.3);
  };

  private onUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinchDist = 0;
    if (this.pointers.size === 0) this.dragging = false;
  };

  private onWheel = (e: WheelEvent): void => {
    if (!this.active) return;
    e.preventDefault();
    this.tween = null;
    this.fov = clamp(this.fov + e.deltaY * 0.025, 45, 78);
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
  };
}

export class WalkMode {
  active = false;
  private yaw = 0;
  private pitch = 0;
  private planX = WALK_START.x;
  private planZ = WALK_START.z;
  private eyeY = 1.62;
  private keys = new Set<string>();
  private joy = { x: 0, y: 0 };
  private joyPointer = -1;
  private touchLookPointer = -1;
  private lastTouchX = 0;
  private lastTouchY = 0;
  private bobT = 0;
  private mapTick = 0;
  private floorY = 0;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private dom: HTMLCanvasElement,
    private ctx: WorldContext,
    private ui: UI,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    dom.addEventListener('click', this.onCanvasClick);
    dom.addEventListener('pointerdown', this.onTouchDown);
    dom.addEventListener('pointermove', this.onTouchMove);
    dom.addEventListener('pointerup', this.onTouchUp);
    dom.addEventListener('pointercancel', this.onTouchUp);
    this.bindJoystick();
  }

  activate(): void {
    this.active = true;
    this.camera.fov = 62;
    this.camera.updateProjectionMatrix();
    this.planX = WALK_START.x;
    this.planZ = WALK_START.z;
    this.yaw = Math.PI - WALK_START.yaw;
    this.pitch = 0;
    this.floorY = this.floorHeightAt(this.planX, this.planZ);
    this.eyeY = this.floorY + 1.62;
    this.camera.position.set(this.planX, this.eyeY, -this.planZ);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    const touch = window.matchMedia('(pointer: coarse)').matches;
    this.ui.setHint(touch ? '拖动画面环视 · 左下摇杆行走' : '点击画面锁定鼠标 · WASD 行走 · Shift 加快 · Esc 释放');
    this.drawMap();
  }

  deactivate(): void {
    this.active = false;
    this.keys.clear();
    this.joy = { x: 0, y: 0 };
    this.joyPointer = -1;
    this.touchLookPointer = -1;
    if (document.pointerLockElement === this.dom) document.exitPointerLock();
    this.resetStick();
  }

  update(dt: number): void {
    if (!this.active) return;
    const f = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0) - this.joy.y;
    const r = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0) + this.joy.x;
    let mx = 0;
    let mz = 0;
    if (Math.abs(f) + Math.abs(r) > 0.01) {
      // world yaw 0 looks north (-Z); plan north is +Z
      const fx = -Math.sin(this.yaw);
      const fz = Math.cos(this.yaw);
      const rx = Math.cos(this.yaw);
      const rz = Math.sin(this.yaw);
      mx = fx * f + rx * r;
      mz = fz * f + rz * r;
      const len = Math.hypot(mx, mz);
      if (len > 0.001) {
        mx /= len;
        mz /= len;
        const speed = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) ? 3.5 : 2.05;
        const step = speed * dt;
        this.tryMove(mx * step, mz * step);
      }
      this.bobT += dt * 9;
    } else {
      this.bobT += dt * 2;
    }

    this.floorY = this.floorHeightAt(this.planX, this.planZ);
    const targetEye = this.floorY + 1.62;
    this.eyeY += (targetEye - this.eyeY) * Math.min(1, dt * 9);
    const moving = Math.abs(f) + Math.abs(r) > 0.01;
    const bob = moving ? Math.sin(this.bobT) * 0.012 : Math.sin(this.bobT) * 0.003;
    this.camera.position.set(this.planX, this.eyeY + bob, -this.planZ);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.mapTick += dt;
    if (this.mapTick > 0.08) {
      this.mapTick = 0;
      this.drawMap();
    }
  }

  private drawMap(): void {
    this.ui.drawMinimap(this.planX, this.planZ, this.yaw);
  }

  private tryMove(dx: number, dz: number): void {
    const nx = this.planX + dx;
    const nz = this.planZ + dz;
    if (!this.blocked(nx, this.planZ)) this.planX = nx;
    if (!this.blocked(this.planX, nz)) this.planZ = nz;
  }

  private blocked(x: number, z: number): boolean {
    const r = 0.3;
    for (const c of this.ctx.colliders) {
      if (x + r > c.x1 && x - r < c.x2 && z + r > c.z1 && z - r < c.z2) return true;
    }
    return false;
  }

  private floorHeightAt(x: number, z: number): number {
    let y = 0;
    for (const f of this.ctx.floors) {
      if (x > f.x1 && x < f.x2 && z > f.z1 && z < f.z2 && f.y > y) y = f.y;
    }
    return y;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.active) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
      this.keys.add(e.code);
      if (e.code.startsWith('Key')) e.preventDefault();
    }
    if (e.code === 'KeyM') {
      const map = document.getElementById('minimap');
      map?.classList.toggle('hidden');
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onCanvasClick = (): void => {
    if (!this.active) return;
    if (document.pointerLockElement === this.dom) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    this.dom.requestPointerLock?.();
  };

  private onLockChange = (): void => {
    if (!this.active) return;
    if (document.pointerLockElement === this.dom) {
      this.ui.setHint('鼠标已锁定 · WASD 行走 · Shift 加快 · Esc 释放');
    } else {
      this.ui.setHint('点击画面锁定鼠标 · WASD 行走 · Shift 加快 · Esc 释放');
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.active || document.pointerLockElement !== this.dom) return;
    this.yaw -= e.movementX * 0.0021;
    this.pitch = clamp(this.pitch - e.movementY * 0.0021, -1.35, 1.35);
  };

  private onTouchDown = (e: PointerEvent): void => {
    if (!this.active || e.pointerType === 'mouse') return;
    if ((e.target as HTMLElement).closest('#joystick')) return;
    this.touchLookPointer = e.pointerId;
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
    this.dom.setPointerCapture?.(e.pointerId);
  };

  private onTouchMove = (e: PointerEvent): void => {
    if (!this.active || e.pointerType === 'mouse' || e.pointerId !== this.touchLookPointer) return;
    const dx = e.clientX - this.lastTouchX;
    const dy = e.clientY - this.lastTouchY;
    this.lastTouchX = e.clientX;
    this.lastTouchY = e.clientY;
    this.yaw -= dx * 0.0045;
    this.pitch = clamp(this.pitch - dy * 0.0045, -1.35, 1.35);
  };

  private onTouchUp = (e: PointerEvent): void => {
    if (e.pointerId === this.touchLookPointer) this.touchLookPointer = -1;
  };

  private bindJoystick(): void {
    const joyEl = document.getElementById('joystick')!;
    const stick = document.getElementById('joystick-stick')!;
    const move = (e: PointerEvent): void => {
      if (e.pointerId !== this.joyPointer) return;
      const rect = joyEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = (e.clientX - cx) / (rect.width / 2);
      let dy = (e.clientY - cy) / (rect.height / 2);
      const len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this.joy.x = dx;
      this.joy.y = dy;
      stick.style.transform = `translate(${dx * 30}px, ${dy * 30}px)`;
    };
    joyEl.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      this.joyPointer = e.pointerId;
      joyEl.setPointerCapture(e.pointerId);
      move(e);
      e.preventDefault();
    });
    joyEl.addEventListener('pointermove', move);
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== this.joyPointer) return;
      this.joyPointer = -1;
      this.joy = { x: 0, y: 0 };
      this.resetStick();
    };
    joyEl.addEventListener('pointerup', end);
    joyEl.addEventListener('pointercancel', end);
  }

  private resetStick(): void {
    const stick = document.getElementById('joystick-stick');
    if (stick) stick.style.transform = 'translate(0px, 0px)';
  }
}

export class OrbitMode {
  active = false;
  readonly camera: THREE.OrthographicCamera;
  readonly controls: OrbitControls;
  private frustumHeight = 58;

  constructor(dom: HTMLCanvasElement) {
    const aspect = window.innerWidth / window.innerHeight;
    const w = this.frustumHeight * aspect;
    this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, this.frustumHeight / 2, -this.frustumHeight / 2, 0.1, 220);
    this.controls = new OrbitControls(this.camera, dom);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minZoom = 0.55;
    this.controls.maxZoom = 2.4;
    this.controls.maxPolarAngle = Math.PI / 2.02;
    this.controls.minPolarAngle = 0.16;
    this.controls.enabled = false;
  }

  activate(): void {
    this.active = true;
    this.controls.enabled = true;
    this.resize(window.innerWidth / window.innerHeight);
    this.camera.zoom = 1;
    this.camera.position.set(13, 55, 20);
    this.controls.target.set(13, 0, -27);
    this.controls.update();
    this.camera.lookAt(13, 0, -27);
    this.camera.updateProjectionMatrix();
  }

  deactivate(): void {
    this.active = false;
    this.controls.enabled = false;
  }

  resize(aspect: number): void {
    const w = this.frustumHeight * aspect;
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = this.frustumHeight / 2;
    this.camera.bottom = -this.frustumHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  update(): void {
    if (this.active) this.controls.update();
  }
}
