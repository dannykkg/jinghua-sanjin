import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { WorldContext } from './context';

interface Bucket {
  material: THREE.Material;
  cast: boolean;
  receive: boolean;
  geos: THREE.BufferGeometry[];
}

function preserveSet(ctx: WorldContext): Set<THREE.Object3D> {
  const set = new Set<THREE.Object3D>();
  const add = (o: THREE.Object3D): void => {
    o.traverse((c) => set.add(c));
  };
  for (const r of ctx.roofs) add(r);
  for (const c of ctx.ceilings) add(c);
  return set;
}

/**
 * Merge the hundreds of small static boxes into a handful of material batches.
 * Roofs and ceilings are preserved as separate objects so the cutaway toggle still works.
 */
export function optimizeStatic(ctx: WorldContext): void {
  const preserve = preserveSet(ctx);
  const groups = [ctx.architecture, ctx.interior, ctx.garden];

  for (const root of groups) {
    root.updateMatrixWorld(true);
    const buckets = new Map<string, Bucket>();
    const victims: THREE.Mesh[] = [];

    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (o instanceof THREE.InstancedMesh || o instanceof THREE.SkinnedMesh) return;
      if (Array.isArray(o.material)) return;
      if (preserve.has(o)) return;
      if (o.material.transparent) return;
      if (o.userData.noMerge) return;
      // Skip anything nested under a preserved group even if not explicitly in the set.
      let p: THREE.Object3D | null = o.parent;
      while (p && p !== root) {
        if (preserve.has(p)) return;
        p = p.parent;
      }
      const mat = o.material as THREE.Material;
      const key = `${mat.uuid}:${o.castShadow ? 1 : 0}:${o.receiveShadow ? 1 : 0}`;
      let b = buckets.get(key);
      if (!b) {
        b = { material: mat, cast: o.castShadow, receive: o.receiveShadow, geos: [] };
        buckets.set(key, b);
      }
      let g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      if (g.index) g = g.toNonIndexed();
      g.clearGroups();
      b.geos.push(g);
      victims.push(o);
    });

    for (const m of victims) m.removeFromParent();

    for (const b of buckets.values()) {
      if (b.geos.length === 0) continue;
      const merged = mergeGeometries(b.geos, false);
      if (!merged) {
        // If merging fails for an odd attribute set, keep individual meshes rather than losing them.
        for (const g of b.geos) {
          const mesh = new THREE.Mesh(g, b.material);
          mesh.castShadow = b.cast;
          mesh.receiveShadow = b.receive;
          root.add(mesh);
        }
        continue;
      }
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, b.material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.userData.merged = true;
      root.add(mesh);
    }
  }

  // Remove empty transform-only groups except the preserved roof hierarchy and lights.
  for (const root of groups) {
    const empties: THREE.Object3D[] = [];
    root.traverse((o) => {
      if (o === root) return;
      if (o instanceof THREE.Mesh || o instanceof THREE.Light || o instanceof THREE.Camera) return;
      if (preserve.has(o)) return;
      if (o.children.length === 0 && o.type === 'Group') empties.push(o);
    });
    for (const e of empties) e.removeFromParent();
  }
}
