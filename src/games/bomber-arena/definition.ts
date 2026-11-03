/** Blast Arena for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  COLS,
  ROWS,
  isArena,
  newArena,
  rookieFor,
  stepWithComputers,
  tacticianFor,
  type Arena,
  type BlastAction,
  type Blaster,
} from './sim';

const T = 16;
const W = COLS * T;
const H = ROWS * T;
const COLOURS = ['#f8fafc', '#ef4444', '#3b82f6', '#facc15'];

function where(b: Blaster): [number, number] {
  const x0 = (b.at % COLS) * T;
  const y0 = Math.floor(b.at / COLS) * T;
  if (b.to === null) return [x0, y0];
  const p = 1 - b.left / b.pace;
  return [x0 + ((b.to % COLS) * T - x0) * p, y0 + (Math.floor(b.to / COLS) * T - y0) * p];
}

function blaster(ctx: CanvasRenderingContext2D, b: Blaster, colour: string, x: number, y: number) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x + 8, y + 9, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  const look = { up: [0, -2], down: [0, 1], left: [-2, 0], right: [2, 0] }[b.facing];
  ctx.fillRect(x + 5 + look[0]!, y + 7 + look[1]!, 2, 2);
  ctx.fillRect(x + 9 + look[0]!, y + 7 + look[1]!, 2, 2);
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 3);
  ctx.lineTo(x + 8, y + 0.5);
  ctx.stroke();
  ctx.fillStyle = '#f97316';
  ctx.fillRect(x + 7, y, 2, 2);
}

export const DEF: ArcadeDef<Arena, BlastAction> = {
  id: 'bomber-arena',
  prefix: 'ba',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [],
  init: (seed) => newArena(seed),
  step: (s, a) => stepWithComputers(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.round', s.round],
    ['hud.wins', `${s.blasters[0]!.wins}–${Math.max(...s.blasters.slice(1).map((b) => b.wins))}`],
    ['hud.time', Math.ceil(s.time / 60)],
    ['hud.score', s.score],
  ],
  draw(ctx, s, { reducedMotion }) {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const x = c * T;
        const y = r * T;
        const cell = s.grid[i];
        if (cell === '#') {
          ctx.fillStyle = '#57534e';
          ctx.fillRect(x, y, T, T);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(x + 1, y + 1, T - 3, 3);
          ctx.fillRect(x + 1, y + 1, 3, T - 3);
          continue;
        }
        ctx.fillStyle = (r + c) % 2 ? '#166534' : '#15803d';
        ctx.fillRect(x, y, T, T);
        if (cell === '+') {
          ctx.fillStyle = '#a16207';
          ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
          ctx.strokeStyle = '#713f12';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2.5, y + 2.5, T - 5, T - 5);
          ctx.beginPath();
          ctx.moveTo(x + 3, y + 3);
          ctx.lineTo(x + T - 3, y + T - 3);
          ctx.stroke();
          continue;
        }
        const p = s.powers[i];
        if (p) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
          if (p === 'bomb') {
            ctx.fillStyle = '#e5e7eb';
            ctx.beginPath();
            ctx.arc(x + 8, y + 9, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (p === 'flame') {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(x + 8, y + 3);
            ctx.lineTo(x + 12, y + 12);
            ctx.lineTo(x + 4, y + 12);
            ctx.fill();
          } else {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 4);
            ctx.lineTo(x + 12, y + 8);
            ctx.lineTo(x + 4, y + 12);
            ctx.fill();
          }
        }
      }
    // Bombs, swelling as the fuse burns down.
    for (const b of s.bombs) {
      const x = (b.at % COLS) * T;
      const y = Math.floor(b.at / COLS) * T;
      const pulse = reducedMotion ? 0 : Math.sin(s.steps / (b.fuse < 50 ? 3 : 8)) * 0.8;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + 8, y + 9, 5.5 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = s.steps % 6 < 3 ? '#fde047' : '#f97316';
      ctx.fillRect(x + 10, y + 2, 2, 2);
    }
    for (const [k, left] of Object.entries(s.fire)) {
      const i = Number(k);
      const x = (i % COLS) * T;
      const y = Math.floor(i / COLS) * T;
      ctx.fillStyle = left > 20 ? '#fef08a' : left > 10 ? '#fb923c' : '#ef4444';
      ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
    }
    s.blasters.forEach((b, i) => {
      if (!b.alive) return;
      const [x, y] = where(b);
      blaster(ctx, b, COLOURS[i]!, x, y);
    });
    if (s.pause > 0) {
      ctx.fillStyle = 'rgba(2,6,23,0.55)';
      ctx.fillRect(0, H / 2 - 14, W, 28);
      ctx.fillStyle =
        s.roundWinner === null || s.roundWinner < 0 ? '#e2e8f0' : COLOURS[s.roundWinner]!;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.roundWinner === null || s.roundWinner < 0 ? '—' : '★', W / 2, H / 2 + 5);
      ctx.textAlign = 'start';
    }
  },
  control(s, held, pointer) {
    if (held.has('fire')) return 'bomb';
    if (pointer) {
      const me = s.blasters[0]!;
      const dx = pointer.x - ((me.at % COLS) + 0.5) * T;
      const dy = pointer.y - (Math.floor(me.at / COLS) + 0.5) * T;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return 'idle';
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
    for (const d of ['up', 'down', 'left', 'right'] as const) if (held.has(d)) return d;
    return 'idle';
  },
  touch: ['left', 'up', 'down', 'right', 'fire'],
  pointer: true,
  policies: { tactician: (s) => tacticianFor(s, 0), rookie: (s) => rookieFor(s, 0) },
  sounds: (_p, next) => next.events,
  soundBank: {
    drop: [{ wave: 'square', freq: 220, duration: 0.06, gain: 0.05 }],
    boom: [{ wave: 'sawtooth', freq: 140, freqEnd: 40, duration: 0.4, gain: 0.1 }],
    power: [{ wave: 'triangle', freq: 660, freqEnd: 1320, duration: 0.2, gain: 0.1 }],
    out: [{ wave: 'square', freq: 500, freqEnd: 200, duration: 0.3, gain: 0.07 }],
    'you-out': [{ wave: 'sawtooth', freq: 400, freqEnd: 60, duration: 0.8, gain: 0.12 }],
    close: [{ wave: 'square', freq: 90, duration: 0.05, gain: 0.04 }],
    'round-won': [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.12, gain: 0.16 },
    ],
    'round-lost': [{ wave: 'triangle', freq: 392, freqEnd: 262, duration: 0.5, gain: 0.1 }],
    'round-draw': [{ wave: 'triangle', freq: 440, duration: 0.3, gain: 0.08 }],
  },
  result: (s) => ({
    outcome: s.blasters[0]!.wins >= 2 ? 'win' : 'loss',
    score: s.score,
    mode: 'vs-ai',
  }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('round-won')) unlock('round');
    if (s.kills > 0) unlock('kill');
    if (s.over && s.blasters[0]!.wins >= 2) unlock('match');
    if (s.over && s.blasters[0]!.wins >= 2 && s.round === 2) unlock('sweep');
  },
  ending: (s) =>
    s.blasters[0]!.wins >= 2
      ? ['end.won', { n: s.score }]
      : ['end.lost', { n: s.score, w: s.blasters[0]!.wins }],
  validate: (d: unknown): d is Arena => isArena(d),
  strings: {
    en: {
      title: 'Blast Arena',
      'menu.subtitle':
        'Drop bombs, blast crates for power-ups and be the last blaster standing. First to two rounds wins.',
      'hud.round': 'Round',
      'hud.wins': 'Rounds',
      'hud.time': 'Time',
      'hud.score': 'Score',
      'control.fire': 'Bomb',
      'end.won': 'Match won — {n} points!',
      'end.lost': 'Match lost with {w} round wins: {n} points.',
    },
    es: {
      title: 'Arena explosiva',
      'menu.subtitle':
        'Pon bombas, vuela cajas en busca de mejoras y sé el último en pie. Gana quien se lleve dos rondas.',
      'hud.round': 'Ronda',
      'hud.wins': 'Rondas',
      'hud.time': 'Tiempo',
      'hud.score': 'Puntos',
      'control.fire': 'Bomba',
      'end.won': '¡Partida ganada: {n} puntos!',
      'end.lost': 'Partida perdida con {w} rondas ganadas: {n} puntos.',
    },
  },
};
