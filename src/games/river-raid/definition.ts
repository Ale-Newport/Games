/** Canyon Run for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  H,
  JET_Y,
  ROW,
  SECTION,
  W,
  cruisePolicy,
  isRaid,
  newRaid,
  pilotPolicy,
  riverAt,
  stepRaid,
  type Raid,
  type RaidAction,
  type Thing,
} from './sim';

function thing(ctx: CanvasRenderingContext2D, t: Thing, y: number, steps: number) {
  const x = t.x;
  switch (t.kind) {
    case 'boat':
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 3);
      ctx.lineTo(x + 9, y - 3);
      ctx.lineTo(x + 6, y + 3);
      ctx.lineTo(x - 6, y + 3);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x - 3, y - 7, 6, 4);
      break;
    case 'heli': {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(t.vx >= 0 ? x - 12 : x + 4, y - 1, 8, 2);
      ctx.strokeStyle = '#d1fae5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const a = steps / 2;
      ctx.moveTo(x - Math.cos(a) * 9, y - 5);
      ctx.lineTo(x + Math.cos(a) * 9, y - 5);
      ctx.stroke();
      break;
    }
    case 'jet':
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(x + (t.vx > 0 ? 9 : -9), y);
      ctx.lineTo(x - (t.vx > 0 ? 7 : -7), y - 5);
      ctx.lineTo(x - (t.vx > 0 ? 7 : -7), y + 5);
      ctx.fill();
      break;
    case 'depot':
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 ? '#f8fafc' : '#dc2626';
        ctx.fillRect(x - 6, y - 8 + k * 4, 12, 4);
      }
      break;
  }
}

export const DEF: ArcadeDef<Raid, RaidAction> = {
  id: 'river-raid',
  prefix: 'cr2',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newRaid(seed),
  step: (s, a) => stepRaid(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.fuel', Math.max(0, Math.round(s.fuel))],
  ],
  draw(ctx, s, { reducedMotion }) {
    const d = s.d;
    // Banks and water, row by row from the bottom of the screen up.
    const r0 = Math.floor(d / ROW) - 1;
    const r1 = Math.floor((d + H) / ROW) + 1;
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, 0, W, H);
    for (let row = r0; row <= r1; row++) {
      const r = riverAt(s.seed, row);
      const y = H - (row * ROW - d) - ROW;
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(r.x0, y, r.x1 - r.x0, ROW + 0.5);
      if (r.i1 > r.i0) {
        ctx.fillStyle = '#15803d';
        ctx.fillRect(r.i0, y, r.i1 - r.i0, ROW + 0.5);
      }
      if (!reducedMotion && row % 3 === 0) {
        ctx.fillStyle = 'rgba(191,219,254,0.25)';
        ctx.fillRect(r.x0 + ((row * 37) % Math.max(1, r.x1 - r.x0 - 10)), y + 3, 8, 1);
      }
      if (r.bridge && !s.bridgesDown.includes(Math.floor(row / SECTION))) {
        ctx.fillStyle = '#78716c';
        ctx.fillRect(r.x0 - 6, y - 2, r.x1 - r.x0 + 12, ROW + 4);
        ctx.fillStyle = '#facc15';
        for (let x = r.x0; x < r.x1; x += 10) ctx.fillRect(x, y + 2, 5, 2);
      }
    }
    // Bank texture: darker tufts.
    ctx.fillStyle = '#14532d';
    for (let k = 0; k < 30; k++) {
      const wy = Math.floor(d / 40) * 40 + k * 40;
      const x = (k * 53) % W;
      const y = H - (wy - d);
      const r = riverAt(s.seed, Math.floor(wy / ROW));
      if (x < r.x0 - 4 || x > r.x1 + 4) ctx.fillRect(x, y, 4, 3);
    }
    for (const t of s.things) thing(ctx, t, H - (t.wy - d), s.steps);
    if (s.shot) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(s.shot.x - 1, H - (s.shot.wy - d) - 4, 2, 7);
    }
    // The jet.
    const jy = H - JET_Y;
    if (s.dying > 0) {
      ctx.fillStyle = '#fb923c';
      const p = 90 - s.dying;
      for (let k = 0; k < 8; k++)
        ctx.fillRect(s.x + Math.cos(k) * p * 0.5, jy + Math.sin(k) * p * 0.5, 2, 2);
    } else if (!s.over) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(s.x, jy - 9);
      ctx.lineTo(s.x + 3, jy - 2);
      ctx.lineTo(s.x + 9, jy + 3);
      ctx.lineTo(s.x + 3, jy + 3);
      ctx.lineTo(s.x + 4, jy + 8);
      ctx.lineTo(s.x - 4, jy + 8);
      ctx.lineTo(s.x - 3, jy + 3);
      ctx.lineTo(s.x - 9, jy + 3);
      ctx.lineTo(s.x - 3, jy - 2);
      ctx.closePath();
      ctx.fill();
    }
    // The fuel gauge.
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(W / 2 - 50, H - 14, 100, 10);
    ctx.fillStyle = s.fuel < 25 && Math.floor(s.steps / 10) % 2 === 0 ? '#ef4444' : '#facc15';
    ctx.fillRect(W / 2 - 48, H - 12, (96 * Math.max(0, s.fuel)) / 100, 6);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('E', W / 2 - 58, H - 6);
    ctx.fillText('F', W / 2 + 53, H - 6);
  },
  control(s, held, pointer) {
    const f = held.has('fire') ? '-fire' : '';
    const v = held.has('up') ? 'up' : held.has('down') ? 'down' : '';
    let h =
      held.has('left') && !held.has('right')
        ? 'left'
        : held.has('right') && !held.has('left')
          ? 'right'
          : '';
    // A finger on the canvas steers towards it.
    if (pointer) h = Math.abs(pointer.x - s.x) < 4 ? '' : pointer.x > s.x ? 'right' : 'left';
    const m = [v, h].filter(Boolean).join('-');
    if (!m) return f ? 'fire' : 'idle';
    return `${m}${f}` as RaidAction;
  },
  touch: ['left', 'up', 'down', 'right', 'fire'],
  pointer: true,
  policies: { pilot: pilotPolicy, cruiser: cruisePolicy },
  sounds: (_p, next) => [
    ...next.events,
    ...(next.steps % 12 === 0 && !next.dying ? ['engine'] : []),
  ],
  soundBank: {
    engine: [{ wave: 'sawtooth', freq: 70, duration: 0.1, gain: 0.02 }],
    fire: [{ wave: 'square', freq: 1000, freqEnd: 600, duration: 0.05, gain: 0.04 }],
    hit: [{ wave: 'sawtooth', freq: 300, freqEnd: 80, duration: 0.2, gain: 0.08 }],
    'depot-hit': [{ wave: 'sawtooth', freq: 250, freqEnd: 60, duration: 0.3, gain: 0.08 }],
    bridge: [{ wave: 'sawtooth', freq: 160, freqEnd: 40, duration: 0.6, gain: 0.12 }],
    refuel: [{ wave: 'triangle', freq: 880, duration: 0.05, gain: 0.05 }],
    checkpoint: [{ wave: 'triangle', freq: 660, freqEnd: 990, duration: 0.2, gain: 0.08 }],
    crash: [{ wave: 'sawtooth', freq: 400, freqEnd: 40, duration: 0.9, gain: 0.12 }],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'river-raid' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('bridge')) unlock('bridge');
    if (s.events.includes('refuel')) unlock('refuel');
    if (s.bridgesDown.length >= 5) unlock('five');
    if (s.score >= 10000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, b: s.bridgesDown.length }],
  validate: (d: unknown): d is Raid => isRaid(d),
  strings: {
    en: {
      title: 'Canyon Run',
      'menu.subtitle':
        'Fly up the river, shoot the bridges and the patrols, and refuel over the depots before the tank runs dry.',
      'hud.score': 'Score',
      'hud.lives': 'Jets',
      'hud.fuel': 'Fuel',
      'control.up': 'Faster',
      'control.down': 'Slower',
      'end.over': 'Out of jets after {b} bridges: {n} points.',
    },
    es: {
      title: 'Carrera del cañón',
      'menu.subtitle':
        'Remonta el río, derriba los puentes y las patrullas, y repón combustible sobre los depósitos antes de que se acabe.',
      'hud.score': 'Puntos',
      'hud.lives': 'Aviones',
      'hud.fuel': 'Combustible',
      'control.up': 'Más rápido',
      'control.down': 'Más despacio',
      'end.over': 'Sin aviones tras {b} puentes: {n} puntos.',
    },
  },
};
