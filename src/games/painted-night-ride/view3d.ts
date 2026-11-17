/**
 * The painted night (three.js): a sky dome of swirling brush strokes with a crescent moon and
 * haloed stars (delivered orbs become new ones), brush-textured hills in night blues and greens,
 * a village of lit cottages around a church steeple, flame-shaped cypresses, fireflies, glowing
 * orbs, and a rider on a bicycle (or walking beside it).
 */
import * as THREE from 'three';
import { heightAt, STEEPLE, WORLD_R, type Ride } from './sim';

function strokes(
  w: number,
  h: number,
  base: string,
  colours: string[],
  count: number,
  len: number,
  seed: number,
  swirl = false,
): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  let s = seed;
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    let a = swirl ? Math.sin(x / 90) * 1.6 + Math.cos(y / 70) * 1.2 : (r() - 0.5) * 0.8;
    ctx.strokeStyle = colours[Math.floor(r() * colours.length)]!;
    ctx.lineWidth = 2 + r() * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    let px = x;
    let py = y;
    for (let k = 0; k < 4; k++) {
      a += swirl ? 0.25 : (r() - 0.5) * 0.3;
      px += Math.cos(a) * (len / 4);
      py += Math.sin(a) * (len / 4);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  return c;
}

function skyTexture(): THREE.CanvasTexture {
  const c = strokes(
    2048,
    1024,
    '#0b1f4d',
    ['#16348a', '#1f4fb5', '#2a5fd0', '#0f2a6b', '#5d88d6', '#8fb3e8'],
    9000,
    46,
    11,
    true,
  );
  const ctx = c.getContext('2d')!;
  // Great swirls.
  for (const [cx, cy, rad] of [
    [700, 330, 160],
    [1050, 380, 120],
    [1500, 300, 140],
  ] as const) {
    for (let k = 0; k < 220; k++) {
      const a = k * 0.19;
      const rr = rad * (1 - k / 260);
      ctx.strokeStyle = k % 3 ? '#cfe0ff' : '#f7e27a';
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, a, a + 0.5);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // Stars with halos, and the crescent moon.
  const halo = (x: number, y: number, r: number, inner: string) => {
    for (let k = 6; k > 0; k--) {
      ctx.fillStyle = k % 2 ? 'rgba(247, 226, 122, 0.22)' : 'rgba(255, 255, 220, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, r * (1 + k * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  for (const [x, y] of [
    [180, 260],
    [420, 180],
    [880, 150],
    [1280, 220],
    [1700, 170],
    [1900, 330],
    [300, 420],
    [1180, 120],
  ] as const)
    halo(x, y, 11, '#fff6c8');
  halo(1820, 140, 46, '#f7d35a');
  ctx.fillStyle = '#16348a';
  ctx.beginPath();
  ctx.arc(1840, 128, 42, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function groundTexture(): THREE.CanvasTexture {
  const c = strokes(
    512,
    512,
    '#1d3b2e',
    ['#2c5a3e', '#3f6d3a', '#25496b', '#4d7a3a', '#6d8c3a', '#1e3f5c'],
    2600,
    22,
    5,
  );
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function glowSprite(colour: string, size: number): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  s.scale.set(size, size, 1);
  return s;
}

const mat = (c: THREE.ColorRepresentation, emissive?: THREE.ColorRepresentation) =>
  new THREE.MeshLambertMaterial({ color: c, emissive: emissive ?? 0x000000 });

function cottage(seed: number): THREE.Group {
  const g = new THREE.Group();
  const w = 3 + (seed % 3) * 0.6;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, 2.6, 3),
    mat(['#c9b27a', '#b9c4d0', '#d8c79a'][seed % 3]!),
  );
  body.position.y = 1.3;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(w * 0.85, 1.8, 4),
    mat(['#3a5a8a', '#6a3a2a', '#2f4f6f'][seed % 3]!),
  );
  roof.position.y = 3.5;
  roof.rotation.y = Math.PI / 4;
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.8),
    new THREE.MeshBasicMaterial({ color: '#ffd45e' }),
  );
  win.position.set(0, 1.5, 1.51);
  const win2 = win.clone();
  win2.position.set(0, 1.5, -1.51);
  win2.rotation.y = Math.PI;
  g.add(body, roof, win, win2);
  return g;
}

function church(): THREE.Group {
  const g = new THREE.Group();
  const nave = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 8), mat('#a9b4c4'));
  nave.position.set(0, 2, 2.5);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 3, 2.2, 4, 1), mat('#2f4f7a'));
  roof.position.set(0, 5.1, 2.5);
  roof.scale.set(1, 1, 2.6);
  roof.rotation.y = Math.PI / 4;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(2.6, 9, 2.6), mat('#b8c2d0'));
  tower.position.set(0, 4.5, -1.5);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.9, 9, 4), mat('#2b4a78'));
  spire.position.set(0, 13.5, -1.5);
  spire.rotation.y = Math.PI / 4;
  const win = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 1.4),
    new THREE.MeshBasicMaterial({ color: '#ffd45e' }),
  );
  win.position.set(0, 6, -0.19);
  g.add(nave, roof, tower, spire, win);
  return g;
}

function cypress(): THREE.Mesh {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 1.6 * (1 - t * 0.6) + 0.05, t * 16));
  }
  const m = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 10),
    new THREE.MeshLambertMaterial({
      color: '#13301f',
      map: new THREE.CanvasTexture(
        strokes(128, 256, '#13301f', ['#1d4a2a', '#0c2216', '#2a5a2e'], 600, 26, 9, true),
      ),
    }),
  );
  return m;
}

function bicycle(): {
  bike: THREE.Group;
  rider: THREE.Group;
  wheels: THREE.Mesh[];
  legs: THREE.Mesh[];
} {
  const bike = new THREE.Group();
  const frame = mat('#c0392b');
  const wheelGeo = new THREE.TorusGeometry(0.45, 0.05, 6, 18);
  const wheels = [new THREE.Mesh(wheelGeo, mat('#111')), new THREE.Mesh(wheelGeo, mat('#111'))];
  wheels[0]!.position.set(0, 0.45, -0.7);
  wheels[1]!.position.set(0, 0.45, 0.7);
  for (const w of wheels) w.rotation.y = Math.PI / 2;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.4), frame);
  bar.position.set(0, 0.85, 0);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), frame);
  post.position.set(0, 0.7, 0.35);
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), frame);
  fork.position.set(0, 0.75, -0.65);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), mat('#222'));
  handle.position.set(0, 1.12, -0.62);
  const lamp = glowSprite('rgba(255,240,180,0.9)', 1.2);
  lamp.position.set(0, 1.0, -0.85);
  bike.add(...wheels, bar, post, fork, handle, lamp);
  const rider = new THREE.Group();
  const coat = mat('#2e5aa8');
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), coat);
  body.position.set(0, 1.55, 0.15);
  body.rotation.x = -0.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat('#f0c8a0'));
  head.position.set(0, 2.05, -0.05);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12), mat('#e2b13c'));
  hat.position.set(0, 2.22, -0.05);
  const legGeo = new THREE.BoxGeometry(0.14, 0.7, 0.14);
  legGeo.translate(0, -0.35, 0);
  const legs = [new THREE.Mesh(legGeo, mat('#3b3b3b')), new THREE.Mesh(legGeo, mat('#3b3b3b'))];
  legs[0]!.position.set(-0.13, 1.25, 0.25);
  legs[1]!.position.set(0.13, 1.25, 0.25);
  rider.add(body, head, hat, ...legs);
  return { bike, rider, wheels, legs };
}

export class NightView {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 900);
  private orbs: THREE.Group[] = [];
  private skyStars: THREE.Sprite[] = [];
  private rig: ReturnType<typeof bicycle>;
  private player = new THREE.Group();
  private beacon: THREE.Mesh;
  private flies: THREE.Points;
  private camPos = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement, r: Ride) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.scene.fog = new THREE.FogExp2('#0d1c3d', 0.009);
    this.scene.add(new THREE.HemisphereLight('#6b8ed6', '#0b1a14', 0.9));
    const moon = new THREE.DirectionalLight('#ffeeb0', 0.9);
    moon.position.set(60, 90, -40);
    this.scene.add(moon);
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 32, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false }),
    );
    this.scene.add(sky);
    // Ground.
    const size = WORLD_R * 2 + 60;
    const geo = new THREE.PlaneGeometry(size, size, 140, 140);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position!;
    const colours: number[] = [];
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(r.world, x, z);
      pos.setY(i, h);
      c.setHSL(
        0.36 - Math.min(0.2, Math.max(-0.1, h * 0.012)),
        0.45,
        0.32 + Math.max(-0.1, Math.min(0.12, h * 0.01)),
      );
      colours.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
    geo.computeVertexNormals();
    this.scene.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshLambertMaterial({ map: groundTexture(), vertexColors: true }),
      ),
    );
    // Village.
    const ch = church();
    ch.position.set(STEEPLE[0], heightAt(r.world, STEEPLE[0], STEEPLE[1]), STEEPLE[1] + 1.5);
    this.scene.add(ch);
    r.world.obstacles.slice(1).forEach(([x, z, rad], i) => {
      if (rad < 2) {
        const cy = cypress();
        cy.position.set(x, heightAt(r.world, x, z), z);
        this.scene.add(cy);
        return;
      }
      const h = cottage(i);
      h.position.set(x, heightAt(r.world, x, z), z);
      h.rotation.y = Math.atan2(x, z);
      this.scene.add(h);
    });
    // The delivery beacon round the steeple.
    this.beacon = new THREE.Mesh(
      new THREE.RingGeometry(6.4, 7, 48),
      new THREE.MeshBasicMaterial({
        color: '#ffe27a',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
    );
    this.beacon.rotation.x = -Math.PI / 2;
    this.beacon.position.set(
      STEEPLE[0],
      heightAt(r.world, STEEPLE[0], STEEPLE[1]) + 0.1,
      STEEPLE[1],
    );
    this.scene.add(this.beacon);
    // Orbs.
    for (const o of r.orbs) {
      const g = new THREE.Group();
      g.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 14, 10),
          new THREE.MeshBasicMaterial({ color: '#fff3a6' }),
        ),
      );
      g.add(glowSprite('rgba(255, 228, 120, 0.85)', 3.6));
      g.position.set(o.x, o.y, o.z);
      this.orbs.push(g);
      this.scene.add(g);
    }
    // Fireflies.
    const fp: number[] = [];
    for (let i = 0; i < 400; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const d = 10 + ((i * 37) % 100);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      fp.push(x, heightAt(r.world, x, z) + 0.6 + ((i * 13) % 20) / 10, z);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    this.flies = new THREE.Points(
      fg,
      new THREE.PointsMaterial({ color: '#ffe680', size: 0.25, transparent: true, opacity: 0.8 }),
    );
    this.scene.add(this.flies);
    // Rider.
    this.rig = bicycle();
    this.player.add(this.rig.bike, this.rig.rider);
    this.scene.add(this.player);
    this.camPos.set(r.x + Math.sin(r.yaw) * 7.5, r.y + 3.6, r.z + Math.cos(r.yaw) * 7.5);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(r: Ride, opts: { reducedMotion: boolean; dt: number; time: number }) {
    // Orbs bob, taken ones vanish; delivered ones become sky stars.
    r.orbs.forEach((o, i) => {
      const g = this.orbs[i]!;
      g.visible = !o.taken;
      if (!opts.reducedMotion) g.position.y = o.y + Math.sin(opts.time * 2 + i) * 0.2;
    });
    while (this.skyStars.length < r.delivered) {
      const k = this.skyStars.length;
      const s = glowSprite('rgba(255, 240, 170, 1)', 22);
      const a = k * 2.4;
      s.position.set(Math.cos(a) * 300, 140 + (k % 5) * 30, Math.sin(a) * 300);
      (s.material as THREE.SpriteMaterial).fog = false;
      this.skyStars.push(s);
      this.scene.add(s);
    }
    (this.beacon.material as THREE.MeshBasicMaterial).opacity =
      r.carried > 0 ? 0.45 + (opts.reducedMotion ? 0.2 : Math.sin(opts.time * 4) * 0.25) : 0.12;
    if (!opts.reducedMotion)
      (this.flies.material as THREE.PointsMaterial).opacity = 0.55 + Math.sin(opts.time * 3) * 0.3;
    // The rider.
    this.player.position.set(r.x, r.y, r.z);
    this.player.rotation.set(0, r.yaw + r.spin, 0);
    const lean = r.walking
      ? 0
      : Math.max(-0.35, Math.min(0.35, -r.speed * 0.02 * (r.spin ? 0 : 1)));
    this.player.rotation.z = r.dazed ? Math.sin(opts.time * 20) * 0.2 : lean * 0;
    this.rig.bike.visible = true;
    this.rig.bike.position.x = r.walking ? 0.7 : 0;
    this.rig.rider.position.set(r.walking ? -0.3 : 0, r.walking ? -0.45 : 0, 0);
    for (const w of this.rig.wheels) w.rotation.x = -r.travelled / 0.45;
    const phase = r.travelled * (r.walking ? 1.6 : 1.2);
    this.rig.legs[0]!.rotation.x = Math.sin(phase) * (r.walking ? 0.6 : 0.9);
    this.rig.legs[1]!.rotation.x = -Math.sin(phase) * (r.walking ? 0.6 : 0.9);
    // Chase camera.
    const back = new THREE.Vector3(Math.sin(r.yaw) * 7.5, 3.6, Math.cos(r.yaw) * 7.5);
    const want = new THREE.Vector3(r.x, r.y, r.z).add(back);
    want.y = Math.max(want.y, heightAt(r.world, want.x, want.z) + 1.5);
    this.camPos.lerp(want, Math.min(1, opts.dt * 4));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(r.x, r.y + 1.6, r.z);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const material = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((x) => x.dispose());
      else material?.dispose();
    });
    this.renderer.dispose();
  }
}
