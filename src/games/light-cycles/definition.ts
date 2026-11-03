/** Neon Trails for the shared arcade shell: drawing, controls, sounds, results and strings. */
import type { ArcadeDef } from '../shared/arcade/types';
import {
  ACTIONS,
  COLS,
  ROWS,
  cruiserFor,
  isTrails,
  newTrails,
  stepWithRivals,
  strategistFor,
  type TrailAction,
  type Trails,
} from './sim';

const CELL = 6;
const W = COLS * CELL;
const H = ROWS * CELL;
const COLOURS = ['#22d3ee', '#f472b6', '#fb923c', '#a3e635'];

export const DEF: ArcadeDef<Trails, TrailAction> = {
  id: 'light-cycles',
  prefix: 'lc',
  hz: 60,
  width: W,
  height: H,
  actions: ACTIONS,
  idle: 'idle',
  options: [{ id: 'rivals', label: 'menu.rivals', values: ['1', '3'], initial: '1' }],
  init: (seed, o) => newTrails(seed, Number(o.rivals ?? '1') === 3 ? 3 : 1),
  step: (s, a) => stepWithRivals(s, a),
  over: (s) => s.over,
  score: (s) => s.score,
  hud: (s) => [
    ['hud.round', s.round],
    ['hud.wins', `${s.racers[0]!.wins}–${Math.max(...s.racers.slice(1).map((r) => r.wins))}`],
    ['hud.score', s.score],
  ],
  draw(ctx, s, { reducedMotion }) {
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(56,189,248,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= COLS; c += 4) {
      ctx.moveTo(c * CELL + 0.5, 0);
      ctx.lineTo(c * CELL + 0.5, H);
    }
    for (let r = 0; r <= ROWS; r += 4) {
      ctx.moveTo(0, r * CELL + 0.5);
      ctx.lineTo(W, r * CELL + 0.5);
    }
    ctx.stroke();
    // Trails: dimmer for racers already out.
    s.grid.forEach((o, i) => {
      if (!o) return;
      const racer = s.racers[o - 1]!;
      ctx.globalAlpha = racer.alive || s.pause ? 1 : 0.35;
      ctx.fillStyle = COLOURS[o - 1]!;
      ctx.fillRect((i % COLS) * CELL, Math.floor(i / COLS) * CELL, CELL, CELL);
    });
    ctx.globalAlpha = 1;
    // Bright heads, with a glow.
    s.racers.forEach((r, i) => {
      if (!r.alive) return;
      const x = (r.at % COLS) * CELL;
      const y = Math.floor(r.at / COLS) * CELL;
      if (!reducedMotion) {
        ctx.fillStyle = COLOURS[i]!;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(x - 2, y - 2, CELL + 4, CELL + 4);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
    });
    if (s.pause > 0) {
      ctx.fillStyle = 'rgba(2,6,23,0.6)';
      ctx.fillRect(0, H / 2 - 14, W, 28);
      ctx.fillStyle =
        s.roundWinner !== null && s.roundWinner >= 0 ? COLOURS[s.roundWinner]! : '#e2e8f0';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.roundWinner !== null && s.roundWinner >= 0 ? '★' : '—', W / 2, H / 2 + 5);
      ctx.textAlign = 'start';
    }
  },
  control(s, held, pointer) {
    if (pointer) {
      const me = s.racers[0]!;
      const dx = pointer.x - ((me.at % COLS) + 0.5) * CELL;
      const dy = pointer.y - (Math.floor(me.at / COLS) + 0.5) * CELL;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return 'idle';
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
    for (const d of ['up', 'down', 'left', 'right'] as const) if (held.has(d)) return d;
    return 'idle';
  },
  touch: ['left', 'up', 'down', 'right'],
  pointer: true,
  policies: { strategist: (s) => strategistFor(s, 0), cruiser: (s) => cruiserFor(s, 0) },
  sounds: (_p, next) => [
    ...next.events,
    ...(next.tick === 4 && next.racers[0]!.alive && !next.pause && next.steps % 16 === 0
      ? ['hum']
      : []),
  ],
  soundBank: {
    hum: [{ wave: 'sawtooth', freq: 110, duration: 0.08, gain: 0.02 }],
    crash: [{ wave: 'sawtooth', freq: 600, freqEnd: 60, duration: 0.6, gain: 0.1 }],
    'rival-out': [{ wave: 'square', freq: 800, freqEnd: 200, duration: 0.25, gain: 0.07 }],
    'round-won': [
      { wave: 'triangle', freq: 523, duration: 0.12, gain: 0.14 },
      { wave: 'triangle', freq: 784, duration: 0.3, delay: 0.12, gain: 0.16 },
    ],
    'round-lost': [{ wave: 'triangle', freq: 392, freqEnd: 262, duration: 0.5, gain: 0.1 }],
    'round-draw': [{ wave: 'triangle', freq: 440, duration: 0.3, gain: 0.08 }],
  },
  result: (s, o) => ({
    outcome: s.racers[0]!.wins >= 3 ? 'win' : 'loss',
    score: s.score,
    mode: `vs-ai:${o.rivals ?? '1'}`,
  }),
  achievements: (s, _o, unlock) => {
    if (s.events.includes('round-won')) unlock('round');
    if (s.over && s.racers[0]!.wins >= 3) unlock('match');
    if (s.over && s.racers[0]!.wins >= 3 && s.rivals === 3) unlock('crowd');
    if (s.over && s.racers[0]!.wins >= 3 && s.racers.slice(1).every((r) => r.wins === 0))
      unlock('perfect');
  },
  ending: (s) =>
    s.racers[0]!.wins >= 3
      ? ['end.won', { n: s.score }]
      : ['end.lost', { n: s.score, w: s.racers[0]!.wins }],
  validate: (d: unknown): d is Trails => isTrails(d),
  strings: {
    en: {
      title: 'Neon Trails',
      'menu.subtitle':
        'Leave a wall of light behind you and box your rivals in. First to three rounds.',
      'menu.rivals': 'Rivals',
      'rivals.1': 'One',
      'rivals.3': 'Three',
      'rivals.1.hint': 'A one-on-one duel.',
      'rivals.3.hint': 'Four racers on the grid at once.',
      'hud.round': 'Round',
      'hud.wins': 'Rounds',
      'hud.score': 'Score',
      'end.won': 'Match won — {n} points!',
      'end.lost': 'Match lost with {w} round wins: {n} points.',
    },
    es: {
      title: 'Estelas de neón',
      'menu.subtitle':
        'Deja un muro de luz tras de ti y encierra a tus rivales. Gana quien se lleve tres rondas.',
      'menu.rivals': 'Rivales',
      'rivals.1': 'Uno',
      'rivals.3': 'Tres',
      'rivals.1.hint': 'Un duelo cara a cara.',
      'rivals.3.hint': 'Cuatro corredores a la vez en la cuadrícula.',
      'hud.round': 'Ronda',
      'hud.wins': 'Rondas',
      'hud.score': 'Puntos',
      'end.won': '¡Partida ganada: {n} puntos!',
      'end.lost': 'Partida perdida con {w} rondas ganadas: {n} puntos.',
    },
  },
};
