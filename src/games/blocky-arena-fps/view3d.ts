/**
 * The 3D view (three.js): instanced half-unit blocks with a pixel texture, blocky characters with
 * walking legs and name tags, a first-person weapon with recoil, reload dip and muzzle flash, and
 * fading tracers. It only reads the match state.
 */
import * as THREE from 'three';
import { CELL, MAPS, SIZE, type ArenaMap } from './maps';
import { bodyHeight, eyeHeight, weaponOf, type Match } from './sim';
import type { WeaponId } from './weapons';

function pixelTexture(seed: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const ctx = c.getContext('2d')!;
  let s = seed;
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const v = 200 + Math.floor(r() * 55) - (x === 0 || y === 0 ? 40 : 0);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 1, 1);
    }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function tag(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.strokeText(text, 128, 44);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 128, 44);
  const tex = new THREE.CanvasTexture(c);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }),
  );
  sprite.scale.set(1.6, 0.4, 1);
  return sprite;
}

interface Avatar {
  root: THREE.Group;
  body: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  name: THREE.Sprite;
  phase: number;
}

function box(w: number, h: number, d: number, color: THREE.ColorRepresentation): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
}

function avatar(hue: number, name: string): Avatar {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const main = new THREE.Color().setHSL(hue / 360, 0.65, 0.5);
  const dark = new THREE.Color().setHSL(hue / 360, 0.5, 0.3);
  const legL = box(0.26, 0.8, 0.28, dark);
  const legR = box(0.26, 0.8, 0.28, dark);
  legL.geometry.translate(0, -0.4, 0);
  legR.geometry.translate(0, -0.4, 0);
  legL.position.set(-0.15, 0.8, 0);
  legR.position.set(0.15, 0.8, 0);
  const torso = box(0.62, 0.62, 0.34, main);
  torso.position.y = 1.11;
  const head = box(0.42, 0.42, 0.42, '#f1c9a5');
  head.position.y = 1.6;
  const visor = box(0.36, 0.12, 0.05, '#222831');
  visor.position.set(0, 1.63, -0.22);
  const armL = box(0.18, 0.55, 0.18, main);
  armL.position.set(-0.4, 1.12, -0.12);
  armL.rotation.x = -1.1;
  const armR = armL.clone();
  armR.position.x = 0.4;
  const gun = box(0.1, 0.12, 0.7, '#2b2f36');
  gun.position.set(0.15, 1.15, -0.5);
  body.add(torso, head, visor, armL, armR, gun);
  root.add(legL, legR, body);
  const nameTag = tag(name);
  nameTag.position.y = 2.25;
  root.add(nameTag);
  return { root, body, legL, legR, name: nameTag, phase: 0 };
}

function viewModel(id: WeaponId): THREE.Group {
  const g = new THREE.Group();
  const metal = '#30353d';
  if (id === 'pistol') {
    const slide = box(0.07, 0.08, 0.28, metal);
    const grip = box(0.06, 0.16, 0.08, '#1d2026');
    grip.position.set(0, -0.1, 0.08);
    grip.rotation.x = 0.25;
    g.add(slide, grip);
  } else {
    const len = id === 'sniper' ? 0.95 : 0.62;
    const body = box(0.08, 0.11, len, metal);
    const barrel = box(0.035, 0.035, 0.3, '#15181d');
    barrel.position.z = -len / 2 - 0.15;
    const stock = box(0.07, 0.12, 0.2, id === 'sniper' ? '#6b4a2b' : '#1d2026');
    stock.position.set(0, -0.02, len / 2 + 0.08);
    const mag = box(0.06, 0.16, 0.08, '#1d2026');
    mag.position.set(0, -0.12, -0.05);
    g.add(body, barrel, stock, mag);
    if (id === 'sniper') {
      const scope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.32, 10),
        new THREE.MeshLambertMaterial({ color: '#111' }),
      );
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.09, -0.05);
      g.add(scope);
    }
  }
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    new THREE.MeshBasicMaterial({ color: '#ffd77a' }),
  );
  flash.name = 'flash';
  flash.position.z = id === 'pistol' ? -0.2 : id === 'sniper' ? -0.8 : -0.5;
  flash.visible = false;
  g.add(flash);
  return g;
}

export class ArenaView {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.05, 200);
  private avatars = new Map<number, Avatar>();
  private guns: Record<WeaponId, THREE.Group>;
  private tracers: THREE.LineSegments;
  private recoil = 0;
  private lastShot = -1;
  private flashT = 0;
  private fov = 75;
  private map: ArenaMap;

  constructor(canvas: HTMLCanvasElement, m: Match) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.map = MAPS[m.map]!;
    const pal = this.map.palette;
    this.scene.background = new THREE.Color(pal.sky);
    this.scene.fog = new THREE.Fog(pal.fog, 35, 110);
    this.scene.add(new THREE.HemisphereLight('#ffffff', pal.floor, 1.1));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.4);
    sun.position.set(30, 60, 20);
    this.scene.add(sun);
    this.buildMap();
    for (const f of m.fighters) {
      const a = avatar(f.hue, f.name);
      this.avatars.set(f.id, a);
      this.scene.add(a.root);
    }
    this.scene.add(this.camera);
    this.guns = {
      rifle: viewModel('rifle'),
      sniper: viewModel('sniper'),
      pistol: viewModel('pistol'),
    };
    for (const g of Object.values(this.guns)) {
      g.visible = false;
      this.camera.add(g);
    }
    this.tracers = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: '#ffe08a', transparent: true, opacity: 0.85 }),
    );
    this.tracers.frustumCulled = false;
    this.scene.add(this.tracers);
  }

  private buildMap() {
    const pal = this.map.palette;
    const floorTex = pixelTexture(7);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(SIZE, SIZE);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(SIZE * CELL, SIZE * CELL),
      new THREE.MeshLambertMaterial({ color: pal.floor, map: floorTex }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((SIZE * CELL) / 2, 0, (SIZE * CELL) / 2);
    this.scene.add(floor);
    let count = 0;
    for (const l of this.map.levels) count += l;
    const geo = new THREE.BoxGeometry(CELL, 0.5, CELL);
    const mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshLambertMaterial({ map: pixelTexture(3) }),
      count,
    );
    const m4 = new THREE.Matrix4();
    const colour = new THREE.Color();
    let i = 0;
    for (let z = 0; z < SIZE; z++)
      for (let x = 0; x < SIZE; x++) {
        const level = this.map.levels[z * SIZE + x]!;
        const band = level >= 8 ? pal.wall : level >= 6 ? pal.high : level >= 3 ? pal.mid : pal.low;
        for (let k = 0; k < level; k++) {
          m4.makeTranslation((x + 0.5) * CELL, k * 0.5 + 0.25, (z + 0.5) * CELL);
          mesh.setMatrixAt(i, m4);
          colour
            .set(band)
            .offsetHSL(
              0,
              0,
              (((x * 7 + z * 13 + k * 3) % 5) - 2) * 0.02 - (k === level - 1 ? 0 : 0.04),
            );
          mesh.setColorAt(i, colour);
          i++;
        }
      }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.scene.add(mesh);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(m: Match, opts: { reducedMotion: boolean; dt: number }) {
    const you = m.fighters[0]!;
    // Avatars.
    for (const f of m.fighters) {
      const a = this.avatars.get(f.id)!;
      a.root.visible = f.alive && f.id !== 0;
      if (!a.root.visible) continue;
      a.root.position.set(f.x, f.y, f.z);
      a.root.rotation.y = f.yaw;
      a.body.scale.y = f.crouch ? 0.72 : 1;
      a.body.position.y = f.crouch ? -0.1 : 0;
      const speed = Math.hypot(f.vx, f.vz);
      a.phase += speed * opts.dt * 2.2;
      const swing =
        f.ground && !opts.reducedMotion ? Math.sin(a.phase) * Math.min(1, speed / 6) * 0.7 : 0;
      a.legL.rotation.x = swing;
      a.legR.rotation.x = -swing;
      a.name.position.y = bodyHeight(f) + 0.45;
    }
    // Camera: your eyes, or a raised view of where you fell.
    const eye = you.alive ? eyeHeight(you) : 2.6;
    this.camera.position.set(you.x, you.y + eye, you.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = you.yaw;
    this.camera.rotation.x = you.alive ? you.pitch : -0.5;
    const w = weaponOf(you);
    const targetFov = you.aiming ? 75 / w.zoom : 75;
    this.fov += (targetFov - this.fov) * Math.min(1, opts.dt * 14);
    if (Math.abs(this.camera.fov - this.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    // Weapon in hand.
    const mine = m.shots.filter((s) => s.by === 0);
    const last = mine[mine.length - 1];
    if (last && last.t !== this.lastShot) {
      this.lastShot = last.t;
      this.recoil = 1;
      this.flashT = 0.05;
    }
    this.recoil = Math.max(0, this.recoil - opts.dt * 9);
    this.flashT = Math.max(0, this.flashT - opts.dt);
    for (const [id, g] of Object.entries(this.guns)) {
      g.visible = you.alive && id === w.id && !(you.aiming && w.id === 'sniper');
      if (!g.visible) continue;
      const reloading = you.reload > 0 ? Math.sin((1 - you.reload / w.reload) * Math.PI) : 0;
      const aimed = you.aiming ? 1 : 0;
      g.position.set(
        0.24 * (1 - aimed),
        -0.2 + aimed * 0.07 - reloading * 0.25,
        -0.42 + this.recoil * 0.06,
      );
      g.rotation.set(this.recoil * 0.12 - reloading * 0.9, 0, 0);
      g.getObjectByName('flash')!.visible = this.flashT > 0 && !opts.reducedMotion;
    }
    // Tracers of the last few steps (yours start at the gun).
    const pts: number[] = [];
    for (const s of m.shots) {
      if (m.t - s.t > 4) continue;
      if (s.by === 0) {
        const muzzle = new THREE.Vector3(0.2, -0.15, -0.9)
          .applyQuaternion(this.camera.quaternion)
          .add(this.camera.position);
        pts.push(muzzle.x, muzzle.y, muzzle.z, ...s.to);
      } else pts.push(...s.from, ...s.to);
    }
    this.tracers.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.tracers.geometry = g;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    this.renderer.dispose();
  }
}
