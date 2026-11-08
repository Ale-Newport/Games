/** Rooftop Dash for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  LOW,
  RUN_X,
  TALL,
  W,
  hopperPolicy,
  isRun,
  metres,
  newRun,
  runnerPolicy,
  scoreOf,
  stepRun,
  type Run,
  type RunAction,
  type Thing,
} from './sim';

/** Far skyline blocks: [x, width, height] repeating every 480 px. */
const SKYLINE = Array.from(
  { length: 12 },
  (_, i) => [i * 40, 28 + ((i * 17) % 14), 50 + ((i * 37) % 70)] as const,
);

function thing(ctx: CanvasRenderingContext2D, t: Thing, x: number, steps: number) {
  switch (t.kind) {
    case 'chimney':
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(x, t.y, t.w, t.h);
      ctx.fillStyle = '#7c2d12';
      for (let y = t.y + 3; y < t.y + t.h; y += 5) ctx.fillRect(x + ((y / 5) % 2 ? 0 : 4), y, 5, 1);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x - 2, t.y - 3, t.w + 4, 4);
      break;
    case 'drone': {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 3, t.y + 5, t.w - 6, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 5, t.y + 11, t.w - 10, 3);
      ctx.fillStyle = '#94a3b8';
      const spin = Math.abs(Math.sin(steps / 2)) * 5 + 2;
      ctx.fillRect(x + 3 - spin / 2, t.y + 1, spin, 2);
      ctx.fillRect(x + t.w - 3 - spin / 2, t.y + 1, spin, 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x + t.w / 2 - 1, t.y + 6, 2, 2);
      break;
    }
    case 'coin':
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x, t.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 1, t.y - 3, 2, 6);
      break;
  }
}

function runner(ctx: CanvasRenderingContext2D, s: Run, reducedMotion: boolean) {
  const b = s.body;
  const sliding = b.ducking && b.air === 0;
  const h = sliding ? LOW : TALL;
  const x = RUN_X;
  const y = b.y;
  const phase = reducedMotion || b.air > 0 ? 0 : Math.sin(s.x / 9);
  ctx.save();
  if (s.dying > 0 && s.cause !== 'fall') {
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.translate(-x, -y);
  }
  // Legs.
  ctx.fillStyle = '#1e3a8a';
  if (sliding) ctx.fillRect(x - 4, y - 4, 14, 4);
  else {
    ctx.fillRect(x - 3 + phase * 3, y - 9, 3, 9);
    ctx.fillRect(x + 1 - phase * 3, y - 9, 3, 9);
  }
  // Body, the parcel bag and the head with its cap.
  ctx.fillStyle = '#f97316';
  ctx.fillRect(x - 4, y - h + 7, 9, sliding ? 4 : 9);
  ctx.fillStyle = '#a16207';
  ctx.fillRect(x - 8, y - h + 9, 5, 6);
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(x + (sliding ? 6 : 1), y - h + 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(x + (sliding ? 3 : -2), y - h - 1, 8, 3);
  ctx.restore();
}

export const DEF: ArcadeDef<Run, RunAction> = {
  id: 'endless-runner',
  prefix: 'rd',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newRun(seed),
  step: (s, a) => stepRun(s, a),
  over: (s) => s.over,
  score: (s) => scoreOf(s),
  hud: (s) => [
    ['hud.dist', `${metres(s.x)} m`],
    ['hud.coins', s.coins],
    ['hud.score', scoreOf(s)],
  ],
  draw(ctx, s, { reducedMotion }) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(1, '#7c3aed');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(300, 36, 14, 0, Math.PI * 2);
    ctx.fill();
    // The far skyline drifts at a fifth of the pace.
    const far = reducedMotion ? 0 : (s.x / 5) % 480;
    ctx.fillStyle = '#312e81';
    for (const [bx, bw, bh] of SKYLINE)
      for (const off of [0, 480]) {
        const x = bx + off - far;
        if (x > -bw && x < W) ctx.fillRect(x, H - bh, bw, bh);
      }
    // Roofs and the buildings under them.
    const sx = (wx: number) => wx - s.x + RUN_X;
    for (const r of s.roofs) {
      const x0 = sx(r.x0);
      const x1 = sx(r.x1);
      if (x1 < 0 || x0 > W) continue;
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(x0, r.y, x1 - x0, H - r.y);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(x0 - 2, r.y, x1 - x0 + 4, 4);
      ctx.fillStyle = '#fde68a';
      for (let wx = r.x0 + 10; wx < r.x1 - 10; wx += 18)
        for (let wy = r.y + 12; wy < H; wy += 16)
          if ((Math.floor(wx / 18) * 7 + Math.floor(wy / 16) * 3) % 5 < 2)
            ctx.fillRect(sx(wx), wy, 6, 8);
    }
    for (const t of s.things) {
      const x = sx(t.x);
      if (x > -20 && x < W + 20) thing(ctx, t, x, s.steps);
    }
    if (!s.over) runner(ctx, s, reducedMotion);
  },
  control(_s, held, pointer) {
    // A finger high on the screen jumps (for as long as it stays down); low on the screen slides.
    if (pointer) return pointer.y < H * 0.65 ? 'jump' : 'duck';
    if (held.has('up') || held.has('fire')) return 'jump';
    return held.has('down') ? 'duck' : 'idle';
  },
  touch: ['down', 'up'],
  pointer: true,
  policies: { runner: runnerPolicy, hopper: hopperPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    jump: [{ wave: 'square', freq: 330, freqEnd: 660, duration: 0.1, gain: 0.05 }],
    land: [{ wave: 'triangle', freq: 120, duration: 0.05, gain: 0.04 }],
    coin: [{ wave: 'triangle', freq: 988, freqEnd: 1319, duration: 0.08, gain: 0.06 }],
    milestone: [
      { wave: 'triangle', freq: 659, duration: 0.1, gain: 0.1 },
      { wave: 'triangle', freq: 880, duration: 0.2, delay: 0.1, gain: 0.1 },
    ],
    crash: [{ wave: 'sawtooth', freq: 220, freqEnd: 50, duration: 0.5, gain: 0.12 }],
    fall: [{ wave: 'sine', freq: 600, freqEnd: 80, duration: 0.9, gain: 0.1 }],
  },
  result: (s) => ({ outcome: 'complete', score: scoreOf(s), mode: 'endless-runner' }),
  achievements: (s, _o, unlock) => {
    if (metres(s.x) >= 500) unlock('m500');
    if (metres(s.x) >= 2000) unlock('m2000');
    if (s.coins >= 50) unlock('coins');
    if (scoreOf(s) >= 5000) unlock('score');
  },
  ending: (s) => [
    s.cause === 'fall' ? 'end.fall' : 'end.crash',
    { m: metres(s.x), c: s.coins, n: scoreOf(s) },
  ],
  validate: (d: unknown): d is Run => isRun(d),
  strings: {
    en: {
      title: 'Rooftop Dash',
      'menu.subtitle':
        'Run across the rooftops: jump the gaps and the chimneys, slide under the drones, and grab the coins.',
      'hud.dist': 'Distance',
      'hud.coins': 'Coins',
      'hud.score': 'Score',
      'control.up': 'Jump',
      'control.down': 'Slide',
      'end.fall': 'Fell between the buildings after {m} m with {c} coins: {n} points.',
      'end.crash': 'Crashed after {m} m with {c} coins: {n} points.',
    },
    es: {
      title: 'Carrera por los tejados',
      'menu.subtitle':
        'Corre por los tejados: salta los huecos y las chimeneas, deslízate bajo los drones y coge las monedas.',
      'hud.dist': 'Distancia',
      'hud.coins': 'Monedas',
      'hud.score': 'Puntos',
      'control.up': 'Saltar',
      'control.down': 'Deslizar',
      'end.fall': 'Has caído entre los edificios tras {m} m con {c} monedas: {n} puntos.',
      'end.crash': 'Te has estrellado tras {m} m con {c} monedas: {n} puntos.',
    },
  },
};
