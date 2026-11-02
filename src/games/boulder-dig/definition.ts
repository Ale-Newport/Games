/** Gem Digger for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  COLS,
  ROWS,
  grabberPolicy,
  isDig,
  minerPolicy,
  newDig,
  stepDig,
  type Dig,
  type DigAction,
  type Tile,
} from './sim';

const T = 16;
const VIEW_C = 20;
const VIEW_R = 14;
const W = VIEW_C * T;
const H = VIEW_R * T;

/** The top-left cell in view: following the digger, kept inside the cave. */
function camera(s: Dig): [number, number] {
  const c = s.digger % COLS;
  const r = Math.floor(s.digger / COLS);
  return [
    Math.max(0, Math.min(COLS - VIEW_C, c - VIEW_C / 2)),
    Math.max(0, Math.min(ROWS - VIEW_R, r - VIEW_R / 2)),
  ];
}

function tile(
  ctx: CanvasRenderingContext2D,
  t: Tile,
  x: number,
  y: number,
  s: Dig,
  i: number,
  reducedMotion: boolean,
) {
  const f = reducedMotion ? 0 : s.steps;
  switch (t) {
    case '#':
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 2, y + 2, 2, 2);
      ctx.fillRect(x + 12, y + 12, 2, 2);
      break;
    case 'w':
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x, y + 7, T, 1);
      ctx.fillRect(x + 7, y, 1, 7);
      ctx.fillRect(x + 3, y + 8, 1, 8);
      ctx.fillRect(x + 12, y + 8, 1, 8);
      break;
    case '.':
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + ((i * 5) % 11) + 2, y + ((i * 7) % 9) + 3, 2, 2);
      ctx.fillRect(x + ((i * 3) % 9) + 4, y + ((i * 11) % 7) + 6, 2, 2);
      break;
    case 'o':
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(x + 8, y + 8.5, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6b7280';
      ctx.beginPath();
      ctx.arc(x + 9.5, y + 10, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(x + 4, y + 4, 3, 2);
      break;
    case '*': {
      const glint = Math.floor((f + i * 13) / 10) % 6 === 0;
      ctx.fillStyle = glint ? '#e0f2fe' : '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 1);
      ctx.lineTo(x + 14, y + 8);
      ctx.lineTo(x + 8, y + 15);
      ctx.lineTo(x + 2, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0e7490';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.lineTo(x + 14, y + 8);
      ctx.lineTo(x + 8, y + 15);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'x': {
      ctx.save();
      ctx.translate(x + 8, y + 8);
      ctx.rotate(f / 6);
      ctx.fillStyle = '#f59e0b';
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(2.5, 0);
        ctx.lineTo(-2.5, 0);
        ctx.fill();
      }
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-1.5, -1.5, 3, 3);
      ctx.restore();
      break;
    }
    case 'm': {
      const open = Math.floor(f / 6) % 2 === 0;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.ellipse(x + 4, y + 8, open ? 4 : 2, 6, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 12, y + 8, open ? 4 : 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x + 7, y + 3, 2, 10);
      break;
    }
    case 'E':
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, y, T, T);
      ctx.fillStyle = s.open ? (Math.floor(f / 8) % 2 ? '#22c55e' : '#86efac') : '#1e293b';
      ctx.fillRect(x + 3, y + 2, 10, 14);
      break;
    case '@':
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(x + 4, y + 7, 8, 6);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(x + 4, y + 13, 3, 3);
      ctx.fillRect(x + 9, y + 13, 3, 3);
      ctx.fillStyle = '#f5d0a9';
      ctx.fillRect(x + 5, y + 3, 6, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 4, y + 1, 8, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 7, y + 1, 2, 2);
      break;
    case '%':
      ctx.fillStyle = Math.floor(f / 3) % 2 ? '#fb923c' : '#fef3c7';
      ctx.beginPath();
      ctx.arc(x + 8, y + 8, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

export const DEF: ArcadeDef<Dig, DigAction> = {
  id: 'boulder-dig',
  prefix: 'bd',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newDig(seed),
  step: (s, a) => stepDig(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.gems', `${s.gems}/${s.need}`],
    ['hud.time', Math.ceil(s.time / 60)],
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.cave', s.cave],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const [c0, r0] = camera(s);
    for (let r = 0; r < VIEW_R; r++)
      for (let c = 0; c < VIEW_C; c++) {
        const i = (r0 + r) * COLS + c0 + c;
        const t = s.grid[i]!;
        if (t === ' ') continue;
        tile(ctx, t, c * T, r * T, s, i, reducedMotion);
      }
    if (s.dying > 0) {
      ctx.fillStyle = `rgba(239,68,68,${(s.dying / 90) * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      // Head for the finger: the stronger of across and down.
      const [c0, r0] = camera(s);
      const dx = pointer.x - ((s.digger % COLS) - c0 + 0.5) * T;
      const dy = pointer.y - (Math.floor(s.digger / COLS) - r0 + 0.5) * T;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return 'idle';
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
    for (const d of ['up', 'down', 'left', 'right'] as const) if (held.has(d)) return d;
    return 'idle';
  },
  touch: ['left', 'up', 'down', 'right'],
  pointer: true,
  policies: { miner: minerPolicy, grabber: grabberPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    step: [{ wave: 'triangle', freq: 120, duration: 0.03, gain: 0.02 }],
    gem: [
      { wave: 'triangle', freq: 1319, duration: 0.05, gain: 0.07 },
      { wave: 'triangle', freq: 1760, duration: 0.08, delay: 0.05, gain: 0.07 },
    ],
    thud: [{ wave: 'sawtooth', freq: 90, freqEnd: 50, duration: 0.12, gain: 0.07 }],
    chink: [{ wave: 'square', freq: 1600, duration: 0.04, gain: 0.04 }],
    push: [{ wave: 'sawtooth', freq: 70, duration: 0.1, gain: 0.05 }],
    open: [{ wave: 'triangle', freq: 523, freqEnd: 1047, duration: 0.4, gain: 0.1 }],
    exit: [
      { wave: 'triangle', freq: 523, duration: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.1, delay: 0.1, gain: 0.14 },
      { wave: 'triangle', freq: 1047, duration: 0.3, delay: 0.2, gain: 0.16 },
    ],
    spark: [{ wave: 'sawtooth', freq: 300, freqEnd: 60, duration: 0.5, gain: 0.1 }],
    moth: [{ wave: 'sawtooth', freq: 300, freqEnd: 60, duration: 0.5, gain: 0.1 }],
    die: [{ wave: 'sawtooth', freq: 400, freqEnd: 40, duration: 0.9, gain: 0.12 }],
    time: [{ wave: 'triangle', freq: 330, freqEnd: 110, duration: 0.6, gain: 0.1 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'boulder-dig' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('exit')) unlock('exit');
    if (s.events.includes('moth')) unlock('moth');
    if (s.cave >= 4) unlock('deep');
    if (s.score >= 2000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, c: s.cave }],
  validate: (d: unknown): d is Dig => isDig(d),
  strings: {
    en: {
      title: 'Gem Digger',
      'menu.subtitle':
        'Tunnel through the cave, collect enough gems to open the exit, and mind the boulders overhead.',
      'hud.gems': 'Gems',
      'hud.time': 'Time',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.cave': 'Cave',
      'end.over': 'Out of lives in cave {c}: {n} points.',
    },
    es: {
      title: 'Excavagemas',
      'menu.subtitle':
        'Excava la cueva, recoge gemas suficientes para abrir la salida y vigila las rocas que tienes encima.',
      'hud.gems': 'Gemas',
      'hud.time': 'Tiempo',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.cave': 'Cueva',
      'end.over': 'Sin vidas en la cueva {c}: {n} puntos.',
    },
  },
};
