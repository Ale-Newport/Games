/** Cube Hopper for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  HOP,
  ROWS,
  cubeIndex,
  eagerPolicy,
  goal,
  isCubes,
  newCubes,
  plannerPolicy,
  stepCubes,
  type Cell,
  type CubeAction,
  type Cubes,
  type Mover,
} from './sim';

const W = 256;
const H = 240;
const TOP_Y = 34;
/** Screen position of a cell's top centre (off-pyramid cells too). */
const at = ([r, c]: Cell): [number, number] => [W / 2 + (c - r / 2) * 32, TOP_Y + r * 24];
const COLOURS: Record<number, string[]> = {
  1: ['#3b82f6', '#facc15'],
  2: ['#3b82f6', '#a855f7', '#facc15'],
  3: ['#3b82f6', '#facc15'],
};

/** Where a mover is drawn, part-way through a hop (with a little arc). */
function pos(m: Mover, hopLen: number): [number, number] {
  const [x0, y0] = at(m.at);
  if (!m.to) return [x0, y0];
  const [x1, y1] = at(m.to);
  const p = 1 - m.left / hopLen;
  return [x0 + (x1 - x0) * p, y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * 12];
}

function cube(ctx: CanvasRenderingContext2D, x: number, y: number, top: string) {
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x - 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x, y + 24);
  ctx.lineTo(x - 16, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(x + 16, y);
  ctx.lineTo(x, y + 8);
  ctx.lineTo(x, y + 24);
  ctx.lineTo(x + 16, y + 16);
  ctx.closePath();
  ctx.fill();
}

function hopper(ctx: CanvasRenderingContext2D, x: number, y: number, facing: string) {
  const right = facing.endsWith('right');
  const up = facing.startsWith('up');
  ctx.fillStyle = '#14b8a6';
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f766e';
  ctx.fillRect(x - 6, y - 2, 4, 3);
  ctx.fillRect(x + 2, y - 2, 4, 3);
  if (!up) {
    // Big eyes looking the way it faces.
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(x - 3 + (right ? 2 : -2), y - 11, 3, 0, Math.PI * 2);
    ctx.arc(x + 3 + (right ? 2 : -2), y - 11, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.fillRect(x - 3 + (right ? 3 : -3), y - 11, 1.5, 1.5);
    ctx.fillRect(x + 3 + (right ? 3 : -3), y - 11, 1.5, 1.5);
  }
}

export const DEF: ArcadeDef<Cubes, CubeAction> = {
  id: 'tile-hopper',
  prefix: 'th',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newCubes(seed),
  step: (s, a) => stepCubes(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.score', s.score],
    ['hud.lives', s.lives],
    ['hud.round', `${s.level}-${s.round}`],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, W, H);
    const colours = COLOURS[s.level]!;
    const flash = s.cleared > 0 && !reducedMotion && Math.floor(s.cleared / 8) % 2 === 0;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= r; c++) {
        const [x, y] = at([r, c]);
        const state = s.tops[cubeIndex([r, c])]!;
        cube(ctx, x, y, flash ? '#f8fafc' : colours[state]!);
      }
    // The target colour, top left.
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px sans-serif';
    ctx.fillText('→', 8, 16);
    ctx.fillStyle = colours[goal(s.level)]!;
    ctx.fillRect(18, 9, 10, 8);
    // Discs: spinning rings beside the rows.
    for (const d of s.discs) {
      const [x, y] = at([d.row - 1, d.side < 0 ? -1 : d.row]);
      const spin = reducedMotion ? 1 : Math.abs(Math.cos(s.steps / 8));
      ctx.strokeStyle = ['#f472b6', '#facc15', '#22d3ee'][Math.floor(s.steps / 6) % 3]!;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 9 * spin + 1, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Balls and the spring.
    for (const b of s.balls) {
      const [x, y] = pos(b, 12);
      ctx.fillStyle = b.kind === 'red' ? '#ef4444' : b.kind === 'purple' ? '#a855f7' : '#22c55e';
      ctx.beginPath();
      ctx.arc(x, y - 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x - 2.5, y - 9.5, 2, 2);
    }
    if (s.spring) {
      const [x, y] = pos(s.spring, 14);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        ctx.moveTo(x - 5, y - 2 - k * 3);
        ctx.lineTo(x + 5, y - 3.5 - k * 3);
      }
      ctx.stroke();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(x, y - 19, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 3, y - 21, 2, 2);
      ctx.fillRect(x + 1, y - 21, 2, 2);
    }
    // The hopper: riding a disc up to the top, falling, or hopping.
    let [hx, hy] = pos(s.hero, HOP);
    if (s.riding > 0) {
      const p = 1 - s.riding / 90;
      const [tx, ty] = at([0, 0]);
      hx += (tx - hx) * p;
      hy += (ty - 20 - hy) * p;
    }
    if (s.dying > 0 && s.cause === 'fall') hy += (90 - s.dying) * 2;
    if (s.dying > 0) ctx.globalAlpha = Math.max(0.25, s.dying / 90);
    hopper(ctx, hx, hy, s.facing);
    ctx.globalAlpha = 1;
    if (s.frozen > 0) {
      ctx.fillStyle = 'rgba(147,197,253,0.12)';
      ctx.fillRect(0, 0, W, H);
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      // Tap on the side of the hopper to hop that way.
      const [x, y] = at(s.hero.at);
      const right = pointer.x >= x;
      const up = pointer.y < y - 6;
      return `${up ? 'up' : 'down'}-${right ? 'right' : 'left'}` as CubeAction;
    }
    const up = held.has('up');
    const down = held.has('down');
    const left = held.has('left');
    const right = held.has('right');
    if (up && left) return 'up-left';
    if (up && right) return 'up-right';
    if (down && left) return 'down-left';
    if (down && right) return 'down-right';
    if (up) return 'up-right';
    if (right) return 'down-right';
    if (down) return 'down-left';
    if (left) return 'up-left';
    return 'idle';
  },
  touch: ['left', 'up', 'down', 'right'],
  pointer: true,
  policies: { planner: plannerPolicy, eager: eagerPolicy },
  sounds: (_p, next) => next.events,
  soundBank: {
    hop: [{ wave: 'square', freq: 520, freqEnd: 780, duration: 0.06, gain: 0.04 }],
    change: [{ wave: 'triangle', freq: 660, duration: 0.05, gain: 0.05 }],
    finish: [{ wave: 'triangle', freq: 880, duration: 0.06, gain: 0.06 }],
    disc: [{ wave: 'triangle', freq: 300, freqEnd: 1200, duration: 1.2, gain: 0.08 }],
    lured: [{ wave: 'sawtooth', freq: 700, freqEnd: 80, duration: 0.8, gain: 0.08 }],
    hatch: [{ wave: 'square', freq: 200, freqEnd: 400, duration: 0.2, gain: 0.06 }],
    freeze: [{ wave: 'sine', freq: 1500, freqEnd: 800, duration: 0.4, gain: 0.08 }],
    caught: [{ wave: 'sawtooth', freq: 400, freqEnd: 70, duration: 0.7, gain: 0.1 }],
    fall: [{ wave: 'sine', freq: 800, freqEnd: 60, duration: 1, gain: 0.08 }],
    cleared: [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 659, duration: 0.12, delay: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.24, gain: 0.16 },
    ],
    extra: [{ wave: 'triangle', freq: 1047, duration: 0.3, gain: 0.14 }],
  },
  result: (s) => ({ outcome: 'complete', score: s.score, mode: 'tile-hopper' }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('cleared')) unlock('round');
    if (s.events.includes('lured')) unlock('lure');
    if (s.level >= 2) unlock('level2');
    if (s.score >= 15000) unlock('score');
  },
  ending: (s) => ['end.over', { n: s.score, l: s.level, r: s.round }],
  validate: (d: unknown): d is Cubes => isCubes(d),
  strings: {
    en: {
      title: 'Cube Hopper',
      'menu.subtitle':
        'Hop diagonally across the pyramid to change every cube to the target colour. Dodge the balls, and lure the spring off the edge.',
      'hud.score': 'Score',
      'hud.lives': 'Lives',
      'hud.round': 'Round',
      'control.up': 'Up-right',
      'control.right': 'Down-right',
      'control.down': 'Down-left',
      'control.left': 'Up-left',
      'end.over': 'Game over on round {l}-{r}: {n} points.',
    },
    es: {
      title: 'Saltacubos',
      'menu.subtitle':
        'Salta en diagonal por la pirámide para dejar todos los cubos del color objetivo. Esquiva las bolas y engaña al muelle para que caiga.',
      'hud.score': 'Puntos',
      'hud.lives': 'Vidas',
      'hud.round': 'Ronda',
      'control.up': 'Arriba a la derecha',
      'control.right': 'Abajo a la derecha',
      'control.down': 'Abajo a la izquierda',
      'control.left': 'Arriba a la izquierda',
      'end.over': 'Fin de la partida en la ronda {l}-{r}: {n} puntos.',
    },
  },
};
